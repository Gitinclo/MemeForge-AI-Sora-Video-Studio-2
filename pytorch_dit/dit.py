"""
dit.py — Factorized Spatial-Temporal Diffusion Transformer (DiT) with RMSNorm,
adaLN Timestep Conditioning, Cross-Attention, and SwiGLU MLP.

Rule enforcement:
  - Never runs full 3D attention over all N = T_p * H_p * W_p tokens at once.
  - Alternates Spatial Attention (within frame) and Temporal Attention (across frames).
  - Tensor shapes documented in [B, T, H, W, C] convention.
"""
from __future__ import annotations
import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from attention import fused_sdpa_attention


class RMSNorm(nn.Module):
    """
    Root Mean Square Layer Normalization (fusable via torch.compile / Triton).
    Input/Output shape: [B, T, H, W, C] or flattened [B, N, C].
    """
    def __init__(self, dim: int, eps: float = 1e-6) -> None:
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        norm_x = x.float() * torch.rsqrt(x.float().pow(2).mean(-1, keepdim=True) + self.eps)
        return (norm_x.to(x.dtype)) * self.weight


class SwiGLUMLP(nn.Module):
    """
    SwiGLU Feed-Forward Network: W_down(SiLU(W_gate(x)) * W_up(x)).
    Input/Output shape: [B, T, H, W, C] or flattened [B, N, C].
    """
    def __init__(self, dim: int, hidden_dim: int | None = None) -> None:
        super().__init__()
        h_dim = hidden_dim or int(dim * 8 / 3)
        h_dim = ((h_dim + 63) // 64) * 64
        self.w_gate = nn.Linear(dim, h_dim, bias=False)
        self.w_up = nn.Linear(dim, h_dim, bias=False)
        self.w_down = nn.Linear(h_dim, dim, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.w_down(F.silu(self.w_gate(x)) * self.w_up(x))


class TimestepEmbedder(nn.Module):
    """
    Sinusoidal + MLP timestep conditioning kept in BF16 per optimization spec.
    """
    def __init__(self, hidden_dim: int, freq_dim: int = 256) -> None:
        super().__init__()
        self.freq_dim = freq_dim
        self.mlp = nn.Sequential(
            nn.Linear(freq_dim, hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, hidden_dim),
        )

    def forward(self, timesteps: torch.Tensor) -> torch.Tensor:
        half = self.freq_dim // 2
        freqs = torch.exp(
            -math.log(10000.0) * torch.arange(half, device=timesteps.device, dtype=torch.float32) / half
        )
        args = timesteps.float().unsqueeze(-1) * freqs.unsqueeze(0)
        emb = torch.cat([torch.cos(args), torch.sin(args)], dim=-1).to(self.mlp[0].weight.dtype)
        return self.mlp(emb)


def modulate_adaln(x: torch.Tensor, shift: torch.Tensor, scale: torch.Tensor) -> torch.Tensor:
    return x * (1.0 + scale.unsqueeze(1)) + shift.unsqueeze(1)


class MultiHeadAttentionBlock(nn.Module):
    """
    Multi-Head Self or Cross Attention using F.scaled_dot_product_attention.
    """
    def __init__(self, dim: int, num_heads: int, context_dim: int | None = None) -> None:
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = dim // num_heads
        kv_in_dim = context_dim or dim
        self.q_proj = nn.Linear(dim, dim, bias=False)
        self.k_proj = nn.Linear(kv_in_dim, dim, bias=False)
        self.v_proj = nn.Linear(kv_in_dim, dim, bias=False)
        self.out_proj = nn.Linear(dim, dim, bias=False)

    def forward(self, x: torch.Tensor, context: torch.Tensor | None = None) -> torch.Tensor:
        kv_src = x if context is None else context
        B_eff, S_q, D = x.shape
        S_kv = kv_src.shape[1]

        q = self.q_proj(x).view(B_eff, S_q, self.num_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(kv_src).view(B_eff, S_kv, self.num_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(kv_src).view(B_eff, S_kv, self.num_heads, self.head_dim).transpose(1, 2)

        attn_out = fused_sdpa_attention(q, k, v)
        attn_out = attn_out.transpose(1, 2).contiguous().view(B_eff, S_q, D)
        return self.out_proj(attn_out)


class DiTBlock(nn.Module):
    """
    Single DiT Block executing:
      RMSNorm -> Self-Attention (Spatial OR Temporal) -> Cross-Attention to Text -> SwiGLU MLP
      with adaLN timestep modulation and residual connections.

    Logical tensor shape: [B, T, H, W, C] flattened to [B, T*H*W, C].
    """
    def __init__(
        self,
        dim: int,
        num_heads: int,
        text_dim: int,
        attention_mode: str = "spatial",
    ) -> None:
        super().__init__()
        assert attention_mode in ("spatial", "temporal")
        self.attention_mode = attention_mode

        self.norm1 = RMSNorm(dim)
        self.self_attn = MultiHeadAttentionBlock(dim, num_heads)
        self.norm_cross = RMSNorm(dim)
        self.cross_attn = MultiHeadAttentionBlock(dim, num_heads, context_dim=text_dim)
        self.norm2 = RMSNorm(dim)
        self.mlp = SwiGLUMLP(dim)

        self.adaLN_modulation = nn.Sequential(
            nn.SiLU(),
            nn.Linear(dim, 6 * dim, bias=True),
        )

    def forward(
        self,
        x: torch.Tensor,
        t_emb: torch.Tensor,
        text_emb: torch.Tensor,
        grid_thw: tuple[int, int, int],
    ) -> torch.Tensor:
        """
        Args:
            x: Patch token sequence [B, N, C] representing logical [B, T, H, W, C].
            t_emb: Timestep embedding [B, C].
            text_emb: Text token embeddings [B, L, D_text].
            grid_thw: (T_p, H_p, W_p) patch grid dimensions.
        Returns:
            x: Updated token sequence [B, N, C].
        """
        B, N, C = x.shape
        t_p, h_p, w_p = grid_thw
        shift_msa, scale_msa, gate_msa, shift_mlp, scale_mlp, gate_mlp = (
            self.adaLN_modulation(t_emb).chunk(6, dim=-1)
        )

        h = modulate_adaln(self.norm1(x), shift_msa, scale_msa)
        if self.attention_mode == "spatial":
            h_spatial = h.view(B * t_p, h_p * w_p, C)
            h_attn = self.self_attn(h_spatial).view(B, N, C)
        else:
            h_5d = h.view(B, t_p, h_p * w_p, C).permute(0, 2, 1, 3).contiguous()
            h_temp = h_5d.view(B * h_p * w_p, t_p, C)
            h_attn = self.self_attn(h_temp).view(B, h_p * w_p, t_p, C).permute(0, 2, 1, 3).reshape(B, N, C)

        x = x + gate_msa.unsqueeze(1) * h_attn
        x = x + self.cross_attn(self.norm_cross(x), context=text_emb)

        h_mlp = modulate_adaln(self.norm2(x), shift_mlp, scale_mlp)
        x = x + gate_mlp.unsqueeze(1) * self.mlp(h_mlp)
        return x
