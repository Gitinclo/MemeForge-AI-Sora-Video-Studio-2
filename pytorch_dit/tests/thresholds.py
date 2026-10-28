"""
tests/thresholds.py — Acceptance Tests & Quantization Quality Thresholds.

Verifies all 4 core Acceptance Tests from the Build Spec:
  1. VAE shape: decode(encode(x)).shape == x.shape ([B, T, H, W, C])
  2. VAE causality: changing frames > t does not change latents <= t
  3. Attention: fused SDPA output matches naive reference (atol 1e-3 in BF16)
  4. Quantized model: output stays within PSNR >= 32.0 dB of BF16 baseline
"""
from __future__ import annotations
import math
import torch
from vae import Causal3DVAE
from attention import fused_sdpa_attention, naive_attention_reference
from pipeline import TextToVideoDiTPipeline

MIN_QUANTIZED_PSNR_DB: float = 32.0
MAX_QUANTIZED_LPIPS: float = 0.05
ATTENTION_BF16_ATOL: float = 1e-3


def compute_psnr_db(ref: torch.Tensor, target: torch.Tensor) -> float:
    """
    Compute Peak Signal-to-Noise Ratio (dB) between two [B, T, H, W, C] tensors in [-1, 1].
    """
    mse = torch.mean((ref.float() - target.float()) ** 2).item()
    if mse <= 1e-12:
        return 99.0
    return 10.0 * math.log10((2.0 ** 2) / mse)


def test_vae_shape_and_causality() -> None:
    """
    Acceptance Tests 1 & 2:
      - decode(encode(x)).shape == x.shape for x of shape [B, T, H, W, C] = [1, 16, 64, 64, 3]
      - modifying frames after t does not alter encoded latents at or before t // 8
    """
    torch.manual_seed(0)
    vae = Causal3DVAE(in_channels=3, latent_channels=16, hidden_channels=16).eval()
    x1 = torch.randn(1, 16, 64, 64, 3)
    z1 = vae.encode(x1)
    x_hat = vae.decode(z1, chunk_frames=1)
    assert x_hat.shape == x1.shape, f"Expected {x1.shape}, got {x_hat.shape}"

    x2 = x1.clone()
    x2[:, 8:, :, :, :] = torch.randn_like(x2[:, 8:, :, :, :])
    z2 = vae.encode(x2)
    max_diff = (z1[:, :1] - z2[:, :1]).abs().max().item()
    assert max_diff == 0.0, f"Causal violation: latent frame 0 changed by {max_diff}"


def test_attention_matches_naive() -> None:
    """
    Acceptance Test 3:
      Fused SDPA output matches naive reference within atol=1e-3 in BF16.
    """
    torch.manual_seed(42)
    q = torch.randn(2, 6, 64, 64, dtype=torch.bfloat16)
    k = torch.randn(2, 6, 64, 64, dtype=torch.bfloat16)
    v = torch.randn(2, 6, 64, 64, dtype=torch.bfloat16)

    out_fused = fused_sdpa_attention(q, k, v)
    out_naive = naive_attention_reference(q, k, v)
    torch.testing.assert_close(out_fused, out_naive, atol=ATTENTION_BF16_ATOL, rtol=1e-2)


def test_quantized_quality_thresholds() -> None:
    """
    Acceptance Test 4:
      Quantized FP8 (E4M3) model stays above MIN_QUANTIZED_PSNR_DB (32.0 dB) vs BF16 baseline.
    """
    torch.manual_seed(7)
    pipe = TextToVideoDiTPipeline(hidden_dim=192, num_layers=2, num_heads=4).eval()
    vid_bf16 = pipe.generate("A neon train in the rain", frames=8, height=64, width=64, steps=4, seed=99)

    pipe.quantize_dit_blocks(mode="fp8_e4m3")
    vid_fp8 = pipe.generate("A neon train in the rain", frames=8, height=64, width=64, steps=4, seed=99)

    psnr = compute_psnr_db(vid_bf16, vid_fp8)
    assert psnr >= MIN_QUANTIZED_PSNR_DB, f"PSNR {psnr:.2f} dB below threshold {MIN_QUANTIZED_PSNR_DB} dB"
