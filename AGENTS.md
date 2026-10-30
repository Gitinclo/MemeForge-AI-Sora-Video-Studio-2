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

## Repository Integration in MemeForge AI Studio (`v1.8.0` / `v2.2.0`)
- **On-Disk Python 3.11+ / PyTorch 2.x Package**: `pytorch_dit/` (`vae.py`, `patchify.py`, `dit.py`, `attention.py`, `text.py`, `sampler.py`, `pipeline.py`, `tests/thresholds.py`, `bench.py`)
- **3D Text-to-Animation & Character Voiceover Studio**: `src/utils/textToAnimationEngine.ts` & `src/components/TextToAnimationModal.tsx` (10-shot *"Nocturne in the Rainy Bookstore"* anime pipeline, AI Voice Library & `.mp3`/`.wav` Custom Voice Upload)
- **Undo / Redo Version History & Audio Soundboard Engine**: `src/utils/versionHistoryEngine.ts`, `src/utils/memeAudioEngine.ts`, `src/components/MemeToolbar.tsx`, and `src/components/MemeCanvas.tsx`
- **AI Video Pilot Package (Veo 3.1 · 23-Shot 3-Minute Episode)**: `config/pricing.yaml`, `style/style_guide.md`, `shots/shot_list.json`, `video_pilot/` (`budget.py`, `providers/veo.py`, `pipeline.py`), `src/utils/aiVideoPilotEngine.ts`, and `src/components/AiVideoPilotModal.tsx`
- **Interactive Spec & Simulator Engine**: `src/utils/pytorchDitBuildSpecEngine.ts` + `src/utils/sora2UltraEngine.ts` (`32K` 32000×32000 · `1000 FPS` · `100-Hour` hierarchical ring-attention & episodic memory planner)
- **Unit Test Suite (23 Suites)**: `src/utils/versionHistoryEngine.test.ts`, `src/utils/textToAnimationEngine.test.ts`, `src/utils/aiVideoPilotEngine.test.ts`, `src/utils/pytorchDitBuildSpecEngine.test.ts`, `src/utils/sora2UltraEngine.test.ts`, `src/utils/enterpriseCollabEngine.test.ts`
- **Interactive UI Workbench**: `src/components/PyTorchDitBuildSpecModal.tsx`, `src/components/TextToAnimationGeneratorModal.tsx` & `src/components/AiVideoPilotModal.tsx` (accessible from the **LEO Video Studio** header)

---

## Agent-Ready Context Map & Strict Engineering Boundaries (`v2.2.0`)

To prevent context-window pollution and training-cutoff hallucinations when modifying **MemeForge-AI-Sora-Video-Studio**, coding agents must follow these four structural boundaries:

1. **Strict Interface Contracts (`src/types/studioEngineContracts.ts`)**:
   - Read `src/types/studioEngineContracts.ts` first (~95 lines) to inspect typed contracts for `AiVideoGenerationPayload`, `AnimationCharacterVoiceBinding`, `AnimationShotContract`, `TimelineFrameBufferContract`, `SoundboardCueTriggerContract`, and `VersionHistoryStateContract<T>`.
2. **Pinned Live API Schemas (`docs/api-schemas.md`)**:
   - Reference `docs/api-schemas.md` for exact JSON request/response schemas across `/api/leo/generate-video`, `/api/leo/poll-video`, `/api/text-to-animation/generate-voice`, and `/api/video-pilot/compile-chapter`.
   - Use only `@google/genai` (`new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`) inside `server.ts`. Never import `@google/genai` in client code.
3. **Cloud Run & Node.js 22 Native ESM TypeScript Rules (`server.ts`)**:
   - Production runs `node server.ts` directly. Every relative import reachable from `server.ts` MUST end with `.ts` (e.g., `./src/utils/aiVideoPilotEngine.ts`) and every TypeScript-only symbol MUST use `import type { ... }`.
4. **Decoupled Engine & UI Sub-Modules**:
   - **Canvas2D + Web Audio Frequency Analyzer**: `src/components/MemeCanvas.tsx` & `src/utils/memeAudioEngine.ts` (real-time `AnalyserNode` spectrum bar + wave overlay during active audio playback).
   - **Undo/Redo & Frame-Timestamped Soundboard**: `src/utils/versionHistoryEngine.ts`, `src/components/MemeToolbar.tsx`, and `src/components/MemeSoundboardPanel.tsx`.
   - **10-Shot 3D Text-to-Animation & Voiceover Studio**: `src/utils/textToAnimationEngine.ts` & `src/components/TextToAnimationGeneratorModal.tsx` (*"Nocturne in the Rainy Bookstore"* character sheets, AI Voice Library dropdown, `.mp3`/`.wav` drag-and-drop upload, and Gemini 2.5 Flash TTS).
   - **23-Shot Veo 3.1 Video Pilot & PyTorch DiT**: `src/utils/aiVideoPilotEngine.ts`, `video_pilot/`, `src/utils/pytorchDitBuildSpecEngine.ts`, and `pytorch_dit/`.

