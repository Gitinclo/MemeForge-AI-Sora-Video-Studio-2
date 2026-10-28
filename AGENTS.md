# Build Spec: Text-to-Video Diffusion Transformer (Optimized Inference)

## Goal
Build a text-to-video generator in PyTorch. It takes a text prompt and outputs a short video clip. The model works in compressed latent space, not raw pixels, and is optimized for speed and low GPU memory.

## Scope
- This is a software project only. Do not design chips, hardware, or memory interfaces.
- Use Python 3.11+, PyTorch 2.x, and Triton for custom kernels.
- Start on one GPU. Multi-GPU support comes last.

## Modules

### 1. Causal 3D VAE (`vae.py`)
- Encoder: video `[B, C, T, H, W]` → latent `[B, c, T/8, H/8, W/8]` (8x temporal, 8x spatial; 16x spatial is optional).
- Decoder: latent → video, same shape as the input.
- Causal: frame t may only use frames ≤ t. Pad time on the left only in 3D convolutions.
- Decode in time chunks to cap memory.

### 2. Patch Tokenizer (`patchify.py`)
- Split latents into 3D patches (e.g., 1×2×2) and flatten them into a token sequence.
- Add positional embeddings for time, height, and width.

### 3. Diffusion Transformer (`dit.py`)
- Each block: RMSNorm → self-attention → cross-attention to text → SwiGLU MLP, with residual connections.
- Timestep conditioning via adaptive LayerNorm (adaLN).
- Alternate two attention types:
  - Spatial attention: tokens within the same frame.
  - Temporal attention: tokens at the same position across frames.
- Never run full attention over all tokens at once.

### 4. Attention (`attention.py`)
- Use `torch.nn.functional.scaled_dot_product_attention` or FlashAttention.
- Never materialize the full N×N attention matrix.
- Keep a naive reference implementation for testing.

### 5. Text Conditioning (`text.py`)
- Use a pretrained text encoder (choose T5 or CLIP and state the choice).
  - **Selected Encoder**: `google/t5-v1_1-xxl` (T5-XXL, 4096-dim text embeddings, max 256 tokens) for high-fidelity compositional prompt adherence, with a lightweight deterministic stub / `openai/clip-vit-large-patch14` (768-dim) option for Step 1 tiny-config smoke tests.
- Output embeddings feed the cross-attention in each DiT block.

### 6. Sampler (`sampler.py`)
- Denoising loop with a configurable step count.
- Classifier-free guidance with a configurable scale.

### 7. Pipeline (`pipeline.py`)
- `generate(prompt, frames, height, width, steps, seed) → video tensor or mp4`.

## Optimization (after the baseline works)
- Quantize DiT linear layers to FP8 (E4M3) if the GPU supports it. Otherwise use INT8 or BF16.
- Use per-channel scaling factors for quantized weights and activations.
- Keep these in BF16: input embedding, timestep embedding, final output projection, and VAE decode.
- Fuse RMSNorm, SwiGLU, and residual adds with `torch.compile` or Triton kernels.
- Optional: 2:4 structured sparsity, only after the dense model is correct.

## Build Order
1. Tiny config (e.g., 8 frames at 64×64). Get an end-to-end run with the correct output shape.
2. VAE encode/decode round trip.
3. DiT with spatial and temporal attention.
4. Text conditioning and sampler.
5. Quantization and fused kernels.
6. Benchmark.
7. Multi-GPU: sequence parallelism (split tokens across time or space), then tensor parallelism for large layers.

## Acceptance Tests
- VAE shape: `decode(encode(x))` matches `x.shape`.
- VAE causality: changing frames after t does not change latents at or before t.
- Attention: fused output matches the naive reference (atol 1e-3 in BF16).
- Quantized model: output quality stays within a set threshold of the BF16 baseline. Define the metric (e.g., LPIPS or PSNR) in `tests/thresholds.py`.
- `bench.py` reports latency, tokens/sec, and peak GPU memory.

## Rules
- Document every tensor shape in docstrings using the format `[B, T, H, W, C]`.
- Ask before adding a new dependency.
- Do not change dtype or causality rules without asking.
- Commit after each build step once its tests pass.

## Out of Scope
- Custom silicon or ASIC design.
- Training a Sora-scale model from scratch.
- Hardware-specific memory tuning (e.g., HBM bandwidth).

---

## Repository Integration in MemeForge AI Studio (`v1.8.0`)
- **Interactive Spec & Simulator Engine**: `src/utils/pytorchDitBuildSpecEngine.ts`
- **Unit Test Suite**: `src/utils/pytorchDitBuildSpecEngine.test.ts`
- **Interactive UI Workbench**: `src/components/PyTorchDitBuildSpecModal.tsx` (accessible from the **LEO Video Studio** header via the **PyTorch DiT Build Spec** button)
