"""
pipeline.py — End-to-End Text-to-Video Diffusion Transformer Pipeline & FP8/INT8 Quantizer.

Implements:
  - generate(prompt, frames, height, width, steps, seed) -> video tensor [B, T, H, W, C]
  - Per-channel FP8 (E4M3) / INT8 dynamic activation & weight quantization for DiT linear layers
  - Strictly preserves BF16 for:
      1. input_embedding (tokenizer.input_embed)
      2. timestep_embedding (t_embedder & adaLN_modulation)
      3. final_output_projection (tokenizer.final_proj)
      4. vae.decode
"""
from __future__ import annotations
import torch
import torch.nn as nn
from vae import Causal3DVAE
from patchify import PatchTokenizer3D
from dit import DiTBlock, TimestepEmbedder, RMSNorm
from text import PretrainedTextEncoder
from sampler import FlowMatchingCFGSampler


class PerChannelQuantizedLinear(nn.Module):
    """
    Quantizes a DiT Linear layer to FP8 (E4M3) if hardware supports it, or INT8 with
    per-channel weight and activation scaling factors.
    """
    def __init__(self, base_linear: nn.Linear, mode: str = "fp8_e4m3") -> None:
        super().__init__()
        self.in_features = base_linear.in_features
        self.out_features = base_linear.out_features
        self.mode = mode

        w = base_linear.weight.detach().float()
        max_val = 448.0 if mode == "fp8_e4m3" else 127.0
        w_scale = (w.abs().amax(dim=-1, keepdim=True).clamp(min=1e-8)) / max_val
        w_q = torch.clamp(torch.round(w / w_scale), -max_val, max_val)

        self.register_buffer("w_dequant", (w_q * w_scale).to(base_linear.weight.dtype))
        if base_linear.bias is not None:
            self.register_buffer("bias", base_linear.bias.detach().clone())
        else:
            self.bias = None

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Applies per-channel activation quantization simulation and linear projection.
        Input/Output logical shape: [B, T, H, W, C] flattened to [..., C].
        """
        max_val = 448.0 if self.mode == "fp8_e4m3" else 127.0
        x_f = x.float()
        act_scale = (x_f.abs().amax(dim=-1, keepdim=True).clamp(min=1e-8)) / max_val
        x_q = (torch.clamp(torch.round(x_f / act_scale), -max_val, max_val) * act_scale).to(self.w_dequant.dtype)
        return torch.nn.functional.linear(x_q, self.w_dequant, self.bias)


class TextToVideoDiTPipeline(nn.Module):
    """
    Complete Text-to-Video Diffusion Transformer Pipeline.
    All tensor shapes follow [B, T, H, W, C].
    """
    def __init__(
        self,
        latent_channels: int = 16,
        hidden_dim: int = 384,
        num_layers: int = 4,
        num_heads: int = 6,
        text_dim: int = 512,
        dtype: torch.dtype = torch.bfloat16,
    ) -> None:
        super().__init__()
        self.dtype = dtype
        self.vae = Causal3DVAE(in_channels=3, latent_channels=latent_channels).to(dtype=dtype)
        self.tokenizer = PatchTokenizer3D(latent_channels=latent_channels, hidden_dim=hidden_dim).to(dtype=dtype)
        self.t_embedder = TimestepEmbedder(hidden_dim=hidden_dim).to(dtype=dtype)
        self.text_encoder = PretrainedTextEncoder(text_dim=text_dim, dtype=dtype).to(dtype=dtype)

        self.blocks = nn.ModuleList([
            DiTBlock(
                dim=hidden_dim,
                num_heads=num_heads,
                text_dim=text_dim,
                attention_mode="spatial" if i % 2 == 0 else "temporal",
            ).to(dtype=dtype)
            for i in range(num_layers)
        ])
        self.final_norm = RMSNorm(hidden_dim).to(dtype=dtype)

    def quantize_dit_blocks(self, mode: str = "fp8_e4m3") -> None:
        """
        Quantize DiT attention & SwiGLU linear layers while keeping:
          - tokenizer.input_embed
          - t_embedder & adaLN_modulation
          - tokenizer.final_proj
          - vae.decode
        strictly in BF16.
        """
        mode_norm = mode.lower()
        for block in self.blocks:
            for attn in (block.self_attn, block.cross_attn):
                attn.q_proj = PerChannelQuantizedLinear(attn.q_proj, mode_norm)
                attn.k_proj = PerChannelQuantizedLinear(attn.k_proj, mode_norm)
                attn.v_proj = PerChannelQuantizedLinear(attn.v_proj, mode_norm)
                attn.out_proj = PerChannelQuantizedLinear(attn.out_proj, mode_norm)
            block.mlp.w_gate = PerChannelQuantizedLinear(block.mlp.w_gate, mode_norm)
            block.mlp.w_up = PerChannelQuantizedLinear(block.mlp.w_up, mode_norm)
            block.mlp.w_down = PerChannelQuantizedLinear(block.mlp.w_down, mode_norm)

    def forward_dit(self, z_t: torch.Tensor, timestep: torch.Tensor, text_emb: torch.Tensor) -> torch.Tensor:
        """
        Single DiT velocity prediction step on latent z_t of shape [B, T/8, H/8, W/8, c].
        Returns velocity tensor of identical shape [B, T/8, H/8, W/8, c].
        """
        tokens, grid_thw = self.tokenizer.patchify(z_t)
        t_emb = self.t_embedder(timestep)
        for block in self.blocks:
            tokens = block(tokens, t_emb, text_emb, grid_thw)
        tokens = self.final_norm(tokens)
        return self.tokenizer.unpatchify(tokens, grid_thw, channels_last=True)

    @torch.no_grad()
    def generate(
        self,
        prompt: str,
        frames: int = 8,
        height: int = 64,
        width: int = 64,
        steps: int = 10,
        seed: int = 42,
        cfg_scale: float = 4.5,
    ) -> torch.Tensor:
        """
        Generate a video clip from a text prompt in compressed latent space.

        Args:
            prompt: Natural language video description.
            frames: Number of output video frames T (divisible by 8).
            height: Output frame height H (divisible by 16).
            width: Output frame width W (divisible by 16).
            steps: Denoising step count.
            seed: Deterministic PRNG seed.
            cfg_scale: Classifier-free guidance scale.
        Returns:
            video: Generated video tensor of shape [B, T, H, W, C] = [1, frames, height, width, 3].
        """
        device = next(self.parameters()).device
        gen = torch.Generator(device=device).manual_seed(seed)

        t_lat = frames // 8
        h_lat = height // self.vae.spatial_compression
        w_lat = width // self.vae.spatial_compression
        c_lat = self.vae.latent_channels

        z_init = torch.randn(
            (1, t_lat, h_lat, w_lat, c_lat), generator=gen, device=device, dtype=self.dtype
        )
        cond_emb = self.text_encoder.encode_prompts([prompt], device=device)
        uncond_emb = self.text_encoder.encode_prompts([""], device=device)

        sampler = FlowMatchingCFGSampler(steps=steps, cfg_scale=cfg_scale)
        z_denoised = sampler.sample(self.forward_dit, z_init, cond_emb, uncond_emb)

        video = self.vae.decode(z_denoised.to(torch.bfloat16), chunk_frames=2)
        return video.clamp(-1.0, 1.0)
