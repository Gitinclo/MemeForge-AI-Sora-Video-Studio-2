"""
attention.py — Memory-Efficient Attention via F.scaled_dot_product_attention / FlashAttention
and Naive Reference Implementation for Acceptance Testing (atol <= 1e-3 in BF16).

Never materializes the full N×N spacetime attention matrix during inference.
All docstrings reference the canonical [B, T, H, W, C] layout.
"""
from __future__ import annotations
import math
import torch
import torch.nn.functional as F


def naive_attention_reference(
    q: torch.Tensor,
    k: torch.Tensor,
    v: torch.Tensor,
) -> torch.Tensor:
    """
    Naive reference attention for unit testing ONLY (tests/thresholds.py).
    Verifies fused SDPA output matches within atol=1e-3 in BF16.

    Args:
        q, k, v: Query, Key, Value tensors derived from [B, T, H, W, C] tokens,
                 shaped [B_eff, num_heads, S, head_dim].
    Returns:
        out: Attention output of shape [B_eff, num_heads, S, head_dim].
    """
    scale = 1.0 / math.sqrt(q.size(-1))
    scores = torch.matmul(q.float(), k.float().transpose(-2, -1)) * scale
    probs = torch.softmax(scores, dim=-1).to(v.dtype)
    return torch.matmul(probs, v)


def fused_sdpa_attention(
    q: torch.Tensor,
    k: torch.Tensor,
    v: torch.Tensor,
) -> torch.Tensor:
    """
    Production FlashAttention / Memory-Efficient SDPA dispatcher.
    Never materializes the [B_eff, num_heads, S, S] attention matrix in HBM.

    Args:
        q, k, v: Query, Key, Value tensors derived from [B, T, H, W, C] tokens,
                 shaped [B_eff, num_heads, S_q, head_dim] and [B_eff, num_heads, S_kv, head_dim].
    Returns:
        out: Attention output of shape [B_eff, num_heads, S_q, head_dim].
    """
    return F.scaled_dot_product_attention(q, k, v, attn_mask=None, dropout_p=0.0, is_causal=False)
