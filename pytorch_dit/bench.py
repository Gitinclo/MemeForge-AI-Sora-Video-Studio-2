"""
bench.py — Latency, Throughput (tokens/sec), and Peak GPU Memory Benchmark.

Usage:
  python bench.py --frames 8 --height 64 --width 64 --steps 10 --quant fp8_e4m3
"""
from __future__ import annotations
import argparse
import time
import torch
from pipeline import TextToVideoDiTPipeline


def run_benchmark(
    frames: int = 8,
    height: int = 64,
    width: int = 64,
    steps: int = 10,
    quant: str = "bf16",
) -> dict[str, float]:
    """
    Benchmarks end-to-end generation producing a video tensor of shape [B, T, H, W, C]
    and reports latency (ms), throughput (tokens/sec), and peak GPU memory (MB).
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    pipe = TextToVideoDiTPipeline(hidden_dim=384, num_layers=4, num_heads=6).to(device).eval()

    if quant.lower() in ("fp8", "fp8_e4m3", "int8"):
        pipe.quantize_dit_blocks(mode=quant.lower())

    _ = pipe.generate("Warmup clip", frames=frames, height=height, width=width, steps=2, seed=0)
    if device.type == "cuda":
        torch.cuda.synchronize()
        torch.cuda.reset_peak_memory_stats(device)

    t0 = time.perf_counter()
    video = pipe.generate("Benchmarking DiT inference", frames=frames, height=height, width=width, steps=steps, seed=42)
    if device.type == "cuda":
        torch.cuda.synchronize()
    elapsed_sec = time.perf_counter() - t0

    assert video.shape == (1, frames, height, width, 3), f"Unexpected shape {video.shape}"
    t_p = frames // 8
    h_p = (height // 8) // 2
    w_p = (width // 8) // 2
    total_tokens = t_p * h_p * w_p * steps * 2

    tokens_per_sec = total_tokens / max(1e-6, elapsed_sec)
    peak_mem_mb = (
        torch.cuda.max_memory_allocated(device) / (1024 * 1024)
        if device.type == "cuda"
        else sum(p.numel() * p.element_size() for p in pipe.parameters()) / (1024 * 1024)
    )

    metrics = {
        "latency_ms": round(elapsed_sec * 1000.0, 2),
        "tokens_per_sec": round(tokens_per_sec, 1),
        "peak_gpu_memory_mb": round(peak_mem_mb, 2),
    }
    print(
        f"[bench.py] Shape={list(video.shape)} | Quant={quant} | "
        f"Latency={metrics['latency_ms']} ms | "
        f"Throughput={metrics['tokens_per_sec']} tokens/sec | "
        f"Peak GPU Memory={metrics['peak_gpu_memory_mb']} MB"
    )
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--frames", type=int, default=8)
    parser.add_argument("--height", type=int, default=64)
    parser.add_argument("--width", type=int, default=64)
    parser.add_argument("--steps", type=int, default=10)
    parser.add_argument("--quant", type=str, default="fp8_e4m3")
    args = parser.parse_args()
    run_benchmark(args.frames, args.height, args.width, args.steps, args.quant)
