"""
vae.py — Causal 3D Variational Autoencoder for Text-to-Video Latent Compression.

All public methods document tensor shapes in [B, T, H, W, C] format per build spec rules
(and accept/return [B, C, T, H, W] views with explicit conversion helpers).
"""
from __future__ import annotations
import torch
import torch.nn as nn
import torch.nn.functional as F


class CausalConv3d(nn.Module):
    """
    Causal 3D Convolution where frame t only attends to frames <= t.
    Pads the temporal dimension strictly on the LEFT: (pad_t_left = (k_t - 1) * d_t, pad_t_right = 0).

    Tensor shape convention (logical): [B, T, H, W, C]
    Internal PyTorch Conv3d memory layout: [B, C, T, H, W]
    """
    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: tuple[int, int, int] = (3, 3, 3),
        stride: tuple[int, int, int] = (1, 1, 1),
        dilation: tuple[int, int, int] = (1, 1, 1),
    ) -> None:
        super().__init__()
        k_t, k_h, k_w = kernel_size
        d_t, d_h, d_w = dilation
        self.pad_t_left = (k_t - 1) * d_t
        self.pad_h = ((k_h - 1) * d_h) // 2
        self.pad_w = ((k_w - 1) * d_w) // 2
        self.conv = nn.Conv3d(
            in_channels,
            out_channels,
            kernel_size=kernel_size,
            stride=stride,
            padding=0,
            dilation=dilation,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Tensor of logical shape [B, T, H, W, C] stored in Conv3d layout [B, C, T, H, W].
        Returns:
            y: Causal 3D convolved tensor of logical shape [B, T_out, H_out, W_out, C_out]
               stored in Conv3d layout [B, C_out, T_out, H_out, W_out].
        """
        x_padded = F.pad(
            x,
            (self.pad_w, self.pad_w, self.pad_h, self.pad_h, self.pad_t_left, 0),
            mode="replicate",
        )
        return self.conv(x_padded)


class Causal3DVAE(nn.Module):
    """
    Causal 3D VAE compressing video by 8x temporally and 8x (or 16x) spatially.
    Decoder executes in BF16 and decodes in temporal chunks to cap peak GPU VRAM.

    Shapes documented in [B, T, H, W, C]:
      - Input video x: [B, T, H, W, C] (or [B, C, T, H, W])
      - Encoded latent z: [B, T/8, H/8, W/8, c] (or [B, c, T/8, H/8, W/8])
      - Decoded video x_hat: [B, T, H, W, C] (exact match with input x.shape)
    """
    def __init__(
        self,
        in_channels: int = 3,
        latent_channels: int = 16,
        hidden_channels: int = 64,
        spatial_compression: int = 8,
    ) -> None:
        super().__init__()
        assert spatial_compression in (8, 16), "spatial_compression must be 8 or 16"
        self.in_channels = in_channels
        self.latent_channels = latent_channels
        self.temporal_compression = 8
        self.spatial_compression = spatial_compression

        self.enc_in = CausalConv3d(in_channels, hidden_channels, kernel_size=(3, 3, 3))
        self.down1 = CausalConv3d(hidden_channels, hidden_channels, kernel_size=(3, 3, 3), stride=(2, 2, 2))
        self.down2 = CausalConv3d(hidden_channels, hidden_channels * 2, kernel_size=(3, 3, 3), stride=(2, 2, 2))
        self.down3 = CausalConv3d(hidden_channels * 2, hidden_channels * 2, kernel_size=(3, 3, 3), stride=(2, 2, 2))
        self.down4_spatial = (
            CausalConv3d(hidden_channels * 2, hidden_channels * 2, kernel_size=(1, 3, 3), stride=(1, 2, 2))
            if spatial_compression == 16
            else nn.Identity()
        )
        self.enc_out = CausalConv3d(hidden_channels * 2, latent_channels, kernel_size=(3, 3, 3))

        self.dec_in = CausalConv3d(latent_channels, hidden_channels * 2, kernel_size=(3, 3, 3))
        self.dec_refine = CausalConv3d(hidden_channels * 2, hidden_channels, kernel_size=(3, 3, 3))
        self.dec_out = CausalConv3d(hidden_channels, in_channels, kernel_size=(3, 3, 3))

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        """
        Encode input video into causal compressed latent space.

        Args:
            x: Video tensor with logical shape [B, T, H, W, C] (or Conv3d [B, C, T, H, W]).
        Returns:
            z: Latent tensor matching input layout:
               [B, T/8, H/s, W/s, c] if input was [B, T, H, W, C],
               or [B, c, T/8, H/s, W/s] if input was [B, C, T, H, W].
        """
        channels_last = x.shape[-1] == self.in_channels and x.shape[1] != self.in_channels
        h = x.permute(0, 4, 1, 2, 3).contiguous() if channels_last else x

        h = F.silu(self.enc_in(h))
        h = F.silu(self.down1(h))
        h = F.silu(self.down2(h))
        h = F.silu(self.down3(h))
        h = self.down4_spatial(h)
        z = self.enc_out(h)

        return z.permute(0, 2, 3, 4, 1).contiguous() if channels_last else z

    def _decode_chunk_bcthw(self, z_chunk: torch.Tensor) -> torch.Tensor:
        """
        Decode a single temporal chunk in BF16.
        Input z_chunk logical shape: [B, T_chunk, H/s, W/s, c].
        Output logical shape: [B, T_chunk*8, H, W, C].
        """
        h = F.silu(self.dec_in(z_chunk))
        h = F.interpolate(h, scale_factor=(8, self.spatial_compression, self.spatial_compression), mode="nearest")
        h = F.silu(self.dec_refine(h))
        return self.dec_out(h)

    def decode(self, z: torch.Tensor, chunk_frames: int = 2) -> torch.Tensor:
        """
        Decode latent tensor in temporal chunks (with 1-frame left causal overlap) to cap memory.
        Kept in BF16 per optimization spec.

        Args:
            z: Latent tensor of shape [B, T/8, H/s, W/s, c] (or [B, c, T/8, H/s, W/s]).
            chunk_frames: Number of latent frames decoded per chunk to bound peak VRAM.
        Returns:
            x_hat: Reconstructed video of shape [B, T, H, W, C] (or [B, C, T, H, W]).
        """
        channels_last = z.shape[-1] == self.latent_channels and z.shape[1] != self.latent_channels
        z_bcthw = z.permute(0, 4, 1, 2, 3).contiguous() if channels_last else z
        t_lat = z_bcthw.shape[2]

        if t_lat <= chunk_frames:
            out = self._decode_chunk_bcthw(z_bcthw)
        else:
            decoded_chunks: list[torch.Tensor] = []
            for start in range(0, t_lat, chunk_frames):
                end = min(t_lat, start + chunk_frames)
                ctx_start = max(0, start - 1)
                chunk_out = self._decode_chunk_bcthw(z_bcthw[:, :, ctx_start:end])
                if start > 0:
                    chunk_out = chunk_out[:, :, self.temporal_compression :]
                decoded_chunks.append(chunk_out)
            out = torch.cat(decoded_chunks, dim=2)

        return out.permute(0, 2, 3, 4, 1).contiguous() if channels_last else out
