# Technical Architecture Deep-Dive (`ARCHITECTURE.md`)

> **Version**: `v2.3.0` (`2060-01-01` Full-Stack Future-Proofing Edition)  
> **Primary Administration / GM / Admin / Moderator Authority**: `creatergame31@gmail.com`

This document provides a comprehensive technical deep-dive into how **MemeForge AI, LEO Video & Cinema VFX Studio** is architected across its TypeScript/React web workstation, Node.js 22 Express API gateway, and on-disk Python 3.11+ / PyTorch 2.x video generation packages.

---

## 1. High-Level System Topology

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       MemeForge AI & LEO Video Studio (v2.3.0)                         │
│         Top Header: Unified 4-Module Switcher (Alt+1..4) + 2060/01/01 Workbench        │
└───────────────────────────────┬────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┬────────────────────────┐
        ▼                       ▼                       ▼                        ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐        ┌───────────────┐
│  M1 MemeForge │       │ M2 LEO Video  │       │ M3 Cinema 32K │        │ M4 Enterprise │
│  Canvas2D +   │       │ Veo 3.1 Pilot │       │ 1000 FPS NLE  │        │ CRDT, E2EE &  │
│  Web Audio    │       │ 10-Shot Anime │       │ 192kHz Audio  │        │ Admin/GM/Mod  │
│  Undo / Redo  │       │ Sora 2 Ultra  │       │ ACES 2.0 HDR  │        │ Command Desk  │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘        └───────┬───────┘
        │                       │                       │                        │
        └───────────────────────┴───────────┬───────────┴────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│            Strict Interface Contracts (src/types/studioEngineContracts.ts)             │
│  AiVideoGenerationPayload · AnimationShotContract · SoundboardCueTriggerContract ·     │
│  VersionHistoryStateContract · FutureProof2060PillarContract · PostQuantumManifest     │
└───────────────────────────────┬────────────────────────────────────────┬───────────────┘
                                │                                        │
                                ▼                                        ▼
┌───────────────────────────────────────────────┐      ┌─────────────────────────────────┐
│   Pure TypeScript Engines (src/utils/*.ts)    │      │  Express API Gateway (server.ts)│
│  1:1 Paired with Unit Tests (*.test.ts)       │◄────►│  Node.js >= 22.12.0 Native ESM  │
│  • futureProof2060Engine.ts (128-Bit + PQC)   │      │  • /api/leo/* (Veo 3.1 Proxy)   │
│  • versionHistoryEngine.ts (Undo/Redo)        │      │  • /api/text-to-animation/*     │
│  • memeAudioEngine.ts (Soundboard + FFT)      │      │  • /api/video-pilot/*           │
│  • textToAnimationEngine.ts (10-Shot Anime)   │      │  • /api/future-proof-2060/*     │
│  • aiVideoPilotEngine.ts (23-Shot Veo 3.1)    │      │  • @google/genai (Server-Only)  │
│  • pytorchDitBuildSpecEngine.ts & sora2Ultra  │      └─────────────────────────────────┘
│  • cinemaEngine.ts & enterpriseCollabEngine   │
└───────────────────────────────┬───────────────┘
                                │ Shared Canonical SSoT (config/pricing.yaml, shots/shot_list.json)
                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│         Standalone Python 3.11+ / PyTorch 2.x CLI Packages (Offline / GPU Host)        │
│  • pytorch_dit/ (vae.py, patchify.py, dit.py, attention.py, text.py, sampler.py,       │
│                  pipeline.py, bench.py, tests/thresholds.py)                           │
│  • video_pilot/ (budget.py, providers/veo.py, pipeline.py)                             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Design Patterns

### A. Decoupled Pure Engines vs. React UI Components
To prevent monolithic UI files and enable deterministic unit testing:
- **UI Layer (`src/components/*.tsx`)**: Handles presentation, user interaction, Canvas2D drawing, and modal state.
- **Engine Layer (`src/utils/*Engine.ts`)**: Pure, side-effect-free TypeScript functions that compute timeline frame math, Undo/Redo state transitions, Veo 3.1 budget reservations, PyTorch DiT tensor shape verifications, and 2060/01/01 Post-Quantum manifests.
- **1:1 Test Pairing (`src/utils/*.test.ts`)**: Every engine is paired with a dedicated Node.js `node:test` suite executed via glob discovery:
  ```bash
  npm test # tsx --test "src/**/*.test.ts" "tests/**/*.test.ts"
  ```

### B. Strict Interface Contracts (`src/types/studioEngineContracts.ts`)
All cross-module payloads are anchored in `src/types/studioEngineContracts.ts` (~185 lines), isolating:
1. **`AiVideoGenerationPayload` & `AiVideoJobStatusResponse`**: Unified contract for Veo 3.1 (`veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview`, `veo-3.1-lite-generate-preview`), Sora 2 Ultra (`32K`), and PyTorch DiT (`T5-XXL FP8`).
2. **`AnimationCharacterVoiceBinding` & `AnimationShotContract`**: 10-shot *"Nocturne in the Rainy Bookstore"* character voiceover mapping (`Lin_Jie` & `Ji_Zhixiu`), AI Voice Library presets, and `.mp3`/`.wav` custom voice uploads.
3. **`SoundboardCueTriggerContract` & `TimelineFrameBufferContract`**: Frame-timestamped SFX triggers and Web Audio `AnalyserNode` frequency bin synchronization.
4. **`VersionHistoryStateContract<T>`**: Non-destructive Undo/Redo snapshot stack (`past`, `present`, `future`).
5. **`FutureProof2060PillarContract`, `Epoch2060TemporalComplianceReport`, `PostQuantumHandshakeManifest` & `PhotonicQuantumClusterMetrics`**: Contracts for the `2060/01/01` full-stack future-proofing suite.

### C. Node.js 22 Native ESM Server Gateway (`server.ts`)
- Runs on **Node.js `>=22.12.0`** via `tsx server.ts` on port `3000`.
- All relative imports inside `server.ts` use explicit `.ts` extensions (`./src/utils/futureProof2060Engine.ts`) and TypeScript-only symbols use `import type { ... }` for full Node 22 native strip-types compatibility.
- Uses `@google/genai` (`new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`) strictly on the server with lazy initialization (`getGenAiClient()`) and deterministic local synthesizers (formant WAV audio, SVG keyframes, and offline metadata) so the studio never crashes when running offline or without API keys.

### D. Cross-Language Routing Matrix (TypeScript vs. Python)
- **Web Runtime (`server.ts` + Vite SPA)**: 100% Node.js 22 + TypeScript. `server.ts` does **not** spawn Python child processes in Cloud Run.
- **Python GPU Packages (`pytorch_dit/` & `video_pilot/`)**: Standalone Python 3.11+ / PyTorch 2.x packages configured via `pyproject.toml` for CUDA/Triton kernel execution, Causal 3D VAE training/inference, and CLI batch rendering.
- **Shared Single Source of Truth (SSoT)**: Both runtimes share `config/pricing.yaml`, `shots/shot_list.json`, and `style/style_guide.md`.

---

## 3. 2060/01/01 Full-Stack Future-Proofing Foundations (`src/utils/futureProof2060Engine.ts`)

1. **128-Bit Y2038 & Y2060 Sub-Planck Timebase**:
   - Canonical target epoch: `2060-01-01T00:00:00.000Z` (`2,840,140,800n` Unix seconds, `+692,657,153n` seconds beyond the 2038-01-19 32-bit signed integer overflow).
   - Native `BigInt` sub-frame resolution of `120,000,000,000n` ticks/second (`8.33` picoseconds/tick), dividing `24`, `25`, `30`, `48`, `50`, `60`, `120`, `240`, `1000`, `4000`, `8000`, and `16000 FPS` with zero remainder and zero IEEE-754 floating-point drift across `100-hour` to `1,000-hour` timelines.
2. **NIST FIPS 203 / 204 / 205 Post-Quantum Cryptography (PQC)**:
   - Hybrid **`ML-KEM-1024` (CRYSTALS-Kyber) + `X25519`** key encapsulation with **`AES-256-GCM-SIV`** authenticated encryption.
   - **`ML-DSA-87` (CRYSTALS-Dilithium5) + `SLH-DSA-SHA2-256s` (SPHINCS+)** detached C2PA v3.0 provenance manifests bound to `creatergame31@gmail.com`.
3. **Photonic-Quantum DiT Compute Fabric (`32K` · `64K` · `128K`)**:
   - Models co-packaged silicon photonics (`1.6`–`6.4 Pbps` optical WDM) running `O(N)` Spatio-Temporal Ring-Attention with micro-scaled FP4/FP8 linear layers and BF16 anchor preservation (`input_embedding`, `timestep_embedding`, `final_output_projection`, and `vae.decode`).
