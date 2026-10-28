"""
patchify.py — 3D Latent Patch Tokenizer and Factorized (T, H, W) Positional Embeddings.

Kept in BF16 per the optimization rules (input_embedding & final_output_projection).
All docstrings specify shapes in [B, T, H, W, C] format.
"""
from __future__ import annotations
import math
import torch
import torch.nn as nn


def build_1d_sincos_pos_embed(length: int, dim: int, device: torch.device, dtype: torch.dtype) -> torch.Tensor:
    """
    Build 1D sinusoidal positional embedding of shape [1, length, dim] for [B, T, H, W, C] tokens.
    """
    pos = torch.arange(length, device=device, dtype=torch.float32).unsqueeze(1)
    div_term = torch.exp(
        torch.arange(0, dim, 2, device=device, dtype=torch.float32) * (-math.log(10000.0) / max(1, dim))
    )
    pe = torch.zeros(length, dim, device=device, dtype=torch.float32)
    pe[:, 0::2] = torch.sin(pos * div_term)
    pe[:, 1::2] = torch.cos(pos * div_term[: pe[:, 1::2].shape[1]])
    return pe.to(dtype=dtype).unsqueeze(0)


class PatchTokenizer3D(nn.Module):
    """
    Splits latent tensor [B, T, H, W, C] into 3D patches of size (p_t, p_h, p_w) = (1, 2, 2),
    projects to hidden_dim D in BF16, and adds factorized positional embeddings for (T, H, W).
    """
    def __init__(
        self,
        latent_channels: int = 16,
        hidden_dim: int = 1152,
        patch_size: tuple[int, int, int] = (1, 2, 2),
    ) -> None:
        super().__init__()
        self.latent_channels = latent_channels
        self.hidden_dim = hidden_dim
        self.patch_size = patch_size
        p_t, p_h, p_w = patch_size
        patch_volume = p_t * p_h * p_w * latent_channels

        self.input_embed = nn.Linear(patch_volume, hidden_dim, bias=True)
        self.final_proj = nn.Linear(hidden_dim, patch_volume, bias=True)

    def _factorized_3d_pos_embed(
        self, t_p: int, h_p: int, w_p: int, device: torch.device, dtype: torch.dtype
    ) -> torch.Tensor:
        """
        Constructs factorized 3D positional embeddings for time, height, and width.
        Output shape: [1, t_p * h_p * w_p, D].
        """
        d_t = self.hidden_dim // 3
        d_h = self.hidden_dim // 3
        d_w = self.hidden_dim - d_t - d_h

        pe_t = build_1d_sincos_pos_embed(t_p, d_t, device, dtype)[:, :, None, None, :].expand(1, t_p, h_p, w_p, d_t)
        pe_h = build_1d_sincos_pos_embed(h_p, d_h, device, dtype)[:, None, :, None, :].expand(1, t_p, h_p, w_p, d_h)
        pe_w = build_1d_sincos_pos_embed(w_p, d_w, device, dtype)[:, None, None, :, :].expand(1, t_p, h_p, w_p, d_w)

        pe_3d = torch.cat([pe_t, pe_h, pe_w], dim=-1)
        return pe_3d.reshape(1, t_p * h_p * w_p, self.hidden_dim)

    def patchify(self, z: torch.Tensor) -> tuple[torch.Tensor, tuple[int, int, int]]:
        """
        Args:
            z: Latent tensor of shape [B, T, H, W, C] (or [B, C, T, H, W]).
        Returns:
            tokens: Flattened sequence [B, N, D] where N = (T/p_t)*(H/p_h)*(W/p_w).
            grid_thw: Tuple (T_p, H_p, W_p) of patch counts.
        """
        channels_last = z.shape[-1] == self.latent_channels and z.shape[1] != self.latent_channels
        z_bthwc = z if channels_last else z.permute(0, 2, 3, 4, 1).contiguous()

        B, T, H, W, C = z_bthwc.shape
        p_t, p_h, p_w = self.patch_size
        t_p, h_p, w_p = T // p_t, H // p_h, W // p_w

        patches = z_bthwc.reshape(B, t_p, p_t, h_p, p_h, w_p, p_w, C)
        patches = patches.permute(0, 1, 3, 5, 2, 4, 6, 7).reshape(B, t_p * h_p * w_p, p_t * p_h * p_w * C)

        tokens = self.input_embed(patches.to(self.input_embed.weight.dtype))
        tokens = tokens + self._factorized_3d_pos_embed(t_p, h_p, w_p, tokens.device, tokens.dtype)
        return tokens, (t_p, h_p, w_p)

    def unpatchify(
        self, tokens: torch.Tensor, grid_thw: tuple[int, int, int], channels_last: bool = True
    ) -> torch.Tensor:
        """
        Args:
            tokens: Sequence tensor [B, N, D].
            grid_thw: Patch grid dimensions (T_p, H_p, W_p).
            channels_last: Whether to return [B, T, H, W, C] (True) or [B, C, T, H, W] (False).
        Returns:
            z: Reconstructed latent tensor of shape [B, T, H, W, C] (or [B, C, T, H, W]).
        """
        B = tokens.shape[0]
        t_p, h_p, w_p = grid_thw
        p_t, p_h, p_w = self.patch_size
        C = self.latent_channels

        proj = self.final_proj(tokens.to(self.final_proj.weight.dtype))
        patches = proj.reshape(B, t_p, h_p, w_p, p_t, p_h, p_w, C)
        z_bthwc = patches.permute(0, 1, 4, 2, 5, 3, 6, 7).reshape(B, t_p * p_t, h_p * p_h, w_p * p_w, C)
        return z_bthwc if channels_last else z_bthwc.permute(0, 4, 1, 2, 3).contiguous()
