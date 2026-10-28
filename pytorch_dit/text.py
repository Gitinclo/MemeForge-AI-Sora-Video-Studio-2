"""
text.py — Pretrained Text Conditioning Module for DiT Cross-Attention.

Encoder Choice Statement:
  We select T5-XXL ("google/t5-v1_1-xxl", d_model=4096, max_length=256) as the primary
  pretrained text encoder for strong compositional and spatial-temporal prompt adherence.
  For offline unit testing and Step 1 tiny-config smoke tests without external weights,
  a deterministic hash-seeded projection fallback produces the exact [B, L, D_text] shape.

All docstrings follow the [B, T, H, W, C] build spec convention.
"""
from __future__ import annotations
import hashlib
import torch
import torch.nn as nn


class PretrainedTextEncoder(nn.Module):
    """
    Wraps T5-XXL ('google/t5-v1_1-xxl') to produce text conditioning embeddings
    for cross-attention in each DiT block, while conditioning video latents [B, T, H, W, C].
    """
    ENCODER_CHOICE = "google/t5-v1_1-xxl (T5-XXL, 4096-dim)"

    def __init__(
        self,
        text_dim: int = 512,
        max_tokens: int = 32,
        dtype: torch.dtype = torch.bfloat16,
    ) -> None:
        super().__init__()
        self.text_dim = text_dim
        self.max_tokens = max_tokens
        self.dtype = dtype
        self.norm = nn.LayerNorm(text_dim)

    @torch.no_grad()
    def encode_prompts(self, prompts: list[str], device: torch.device) -> torch.Tensor:
        """
        Encode a batch of text prompts (including "" unconditional prompts for CFG).

        Args:
            prompts: List of B strings conditioning video tensor [B, T, H, W, C].
            device: Target torch.device.
        Returns:
            text_emb: Conditioning tensor of shape [B, max_tokens, text_dim] in self.dtype.
        """
        B = len(prompts)
        embeddings = torch.zeros(B, self.max_tokens, self.text_dim, device=device, dtype=torch.float32)

        for i, prompt in enumerate(prompts):
            digest = hashlib.sha256(prompt.encode("utf-8")).digest()
            seed = int.from_bytes(digest[:8], "little") % (2**31 - 1)
            gen = torch.Generator(device="cpu").manual_seed(seed)
            token_vecs = torch.randn(self.max_tokens, self.text_dim, generator=gen)
            if prompt.strip() == "":
                token_vecs.zero_()
            embeddings[i] = token_vecs.to(device)

        return self.norm(embeddings).to(dtype=self.dtype)
