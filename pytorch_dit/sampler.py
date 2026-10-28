"""
sampler.py — Denoising Loop with Configurable Step Count and Classifier-Free Guidance (CFG).

Operates on compressed video latents of shape [B, T, H, W, C].
"""
from __future__ import annotations
from typing import Callable
import torch


class FlowMatchingCFGSampler:
    """
    Rectified-Flow / Euler denoising sampler with Classifier-Free Guidance.
    """
    def __init__(self, steps: int = 20, cfg_scale: float = 7.0) -> None:
        assert steps >= 1, "steps must be >= 1"
        self.steps = steps
        self.cfg_scale = cfg_scale

    @torch.no_grad()
    def sample(
        self,
        denoise_fn: Callable[[torch.Tensor, torch.Tensor, torch.Tensor], torch.Tensor],
        z_init: torch.Tensor,
        cond_text_emb: torch.Tensor,
        uncond_text_emb: torch.Tensor,
    ) -> torch.Tensor:
        """
        Run the denoising loop from t=1.0 (pure noise) to t=0.0 (clean latent).

        Args:
            denoise_fn: Callable(z_t, timestep, text_emb) -> velocity of shape [B, T, H, W, C].
            z_init: Initial Gaussian noise latent of shape [B, T, H, W, C].
            cond_text_emb: Conditional text embeddings [B, L, D_text].
            uncond_text_emb: Unconditional ("") text embeddings [B, L, D_text].
        Returns:
            z_0: Denoised latent tensor of shape [B, T, H, W, C].
        """
        z = z_init.clone()
        B = z.shape[0]
        timesteps = torch.linspace(1.0, 0.0, self.steps + 1, device=z.device, dtype=torch.float32)

        for i in range(self.steps):
            t_curr = timesteps[i]
            t_next = timesteps[i + 1]
            dt = t_next - t_curr
            t_batch = torch.full((B,), t_curr * 1000.0, device=z.device, dtype=torch.float32)

            if self.cfg_scale > 1.0:
                z_cat = torch.cat([z, z], dim=0)
                t_cat = torch.cat([t_batch, t_batch], dim=0)
                txt_cat = torch.cat([uncond_text_emb, cond_text_emb], dim=0)
                v_uncond, v_cond = denoise_fn(z_cat, t_cat, txt_cat).chunk(2, dim=0)
                v_guided = v_uncond + self.cfg_scale * (v_cond - v_uncond)
            else:
                v_guided = denoise_fn(z, t_batch, cond_text_emb)

            z = z + dt * v_guided

        return z
