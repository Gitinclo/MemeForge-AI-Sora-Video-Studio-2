# Changelog

All notable changes to **MemeForge AI, LEO Video & Cinema VFX Studio** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.3.0] - 2026-11-05

### Added & Upgraded
- **2060/01/01 Architecture & Full-Stack Future-Proofing Suite (`src/utils/futureProof2060Engine.ts`, `src/utils/futureProof2060Engine.test.ts`, `src/components/FutureProof2060Modal.tsx`, `server.ts`)**:
  - **128-Bit Y2038 & Y2060 Sub-Planck Timebase Engine (`2060-01-01T00:00:00.000Z`)**: Implemented `verifyEpoch2060TemporalCompliance()` using native `BigInt` 128-bit arithmetic (`EPOCH_2060_UNIX_SECONDS_BIGINT = 2840140800n`, `+692,657,153n` seconds past the 2038-01-19 32-bit overflow barrier) at `120,000,000,000n` ticks/sec (`8.33 ps` resolution) supporting up to `16,000 FPS` and `1,000-hour` timelines with zero floating-point drift.
  - **NIST FIPS 203 / 204 / 205 Post-Quantum Cryptography (PQC) & C2PA v3.0 Vault**: Implemented `generatePostQuantumHandshakeManifest()` with hybrid `ML-KEM-1024` (Kyber) + `X25519` key encapsulation, `ML-DSA-87` (Dilithium5) + `SLH-DSA-SHA2-256s` signatures, and `AES-256-GCM-SIV` payload protection.
  - **Exascale Photonic-Quantum DiT Compute Fabric Simulator (`32K` · `64K` · `128K`)**: Implemented `calculatePhotonicQuantumClusterMetrics()` for `32K` (`32000×32000`), `64K` (`61440×32400`), and `128K` (`122880×64800`) volumetric light-field pipelines with `O(N)` Spatio-Temporal Ring-Attention and FP4/FP8 + BF16 anchor preservation.
  - **Express Backend Routes**: Mounted `GET /api/future-proof-2060/blueprint` and `POST /api/future-proof-2060/audit` in `server.ts`.
- **Primary Administration / GM / Admin / Moderator Control & Official Contact (`creatergame31@gmail.com`)**:
  - Bound root Super-Admin, Game Master (GM), Admin, and Moderator authority and official contact to `creatergame31@gmail.com` across `src/utils/enterpriseCollabEngine.ts`, `src/utils/subscriptionUtils.ts`, `src/utils/futureProof2060Engine.ts`, `src/components/TeamWorkspaceTab.tsx`, and `src/App.tsx`.
- **Agent-Ready Architecture & Build/Test Modernization (`AGENTS.md`, `package.json`, `src/utils/agentReadyArchitecture.test.ts`)**:
  - Updated `package.json` `"test"` script to use quoted glob discovery (`tsx --test "src/**/*.test.ts" "tests/**/*.test.ts"`), set `"engines": { "node": ">=22.12.0" }`, set `"start": "tsx server.ts"`, and removed legacy `autoprefixer` from `devDependencies`.
- **Complete Legal, Governance, Roadmap, Support, Architecture & GitHub Template Suite**:
  - Added and updated `LICENSE.md`, `CODE_OF_CONDUCT.md`, `PRIVACY.md`, `CHANGELOG.md`, `ROADMAP.md`, `SUPPORT.md`, `GOVERNANCE.md`, `ARCHITECTURE.md`, `.github/PULL_REQUEST_TEMPLATE.md`, and `.github/ISSUE_TEMPLATE.md`.

---

## [2.2.0] - 2026-10-30

### Added & Improved
- **Undo / Redo State Management System (`src/utils/versionHistoryEngine.ts`, `src/utils/versionHistoryEngine.test.ts`, `src/components/MemeToolbar.tsx`, `src/App.tsx`)**:
  - Integrated a non-destructive Undo/Redo state stack backed by `VersionSnapshot` history (`pushVersionSnapshot`, `stepUndoHistory`, `stepRedoHistory`, `canUndoHistory`, `canRedoHistory`).
  - Added **Undo** (`Ctrl/Cmd+Z`) and **Redo** (`Ctrl/Cmd+Y` / `Ctrl/Cmd+Shift+Z`) controls directly in the `MemeToolbar` with live version badges (`v1.x`), step counters, target snapshot tooltips, debounced text/drag snapshots, and full restoration of text layers, stickers, image filters, and canvas aspect ratios.
- **Timeline Soundboard & Real-Time Web Audio Frequency Visualizer (`src/components/MemeToolbar.tsx`, `src/components/MemeCanvas.tsx`, `src/utils/memeAudioEngine.ts`)**:
  - Added a **Timeline Soundboard** in `MemeToolbar` allowing creators to audition quick-fire SFX (**Airhorn**, **Laugh Track**, **Sad Violin**, **Vine Boom**, **Record Scratch**, **Bruh**, **Dramatic Hit**) and pin timestamped audio triggers (`0.0s`–`4.0s`) that automatically fire at exact frame timestamps during `.webm` video export.
  - Added a real-time Web Audio API `AnalyserNode` frequency visualizer on `MemeCanvas` during **"Play Sound"** preview with toggleable **Spectrum Bars** and **Oscilloscope Wave** overlays, peak-hold markers, live `dB` RMS metering, and dominant frequency (`Hz`) readout.
- **3D Text-to-Animation Video Generator with Character Voiceover, Custom Voice Upload & AI Voice Library (`src/components/TextToAnimationModal.tsx`, `src/utils/textToAnimationEngine.ts`, `src/utils/textToAnimationEngine.test.ts`)**:
  - Implemented the 10-shot dark urban fantasy anime generator (*"Nocturne in the Rainy Bookstore"* featuring `Lin_Jie` and `Ji_Zhixiu` across `Rainy_Street_And_Alley` and `Bookstore_Interior`).
  - Added **Character Voiceover** mapping, **Drag-and-Drop Custom Voice Upload** (`.mp3`/`.wav` validation and waveform duration detection), and a pre-generated **AI Character Voice Library** dropdown with 8 distinct character voice personas.
- **Expanded Automated Test Suite (23 Test Suites)**:
  - Added `src/utils/versionHistoryEngine.test.ts` and `src/utils/textToAnimationEngine.test.ts` to the `npm test` suite.

---

## [2.1.0] - 2026-10-29

### Added & Improved
- **AI Video Pilot: One Chapter to a 3-Minute Animated Episode (`config/pricing.yaml`, `style/style_guide.md`, `shots/shot_list.json`, `video_pilot/`, `aiVideoPilotEngine.ts`, `AiVideoPilotModal.tsx`)**:
  - **Config-Driven Pricing (`config/pricing.yaml`)**: September 2026 Google Gemini API paid-tier pricing for **Veo 3.1** (`veo-3.1-lite-generate-preview`: `720p $0.05/s`, `1080p $0.08/s`, no 4K; `veo-3.1-fast-generate-preview`: `720p $0.10/s`, `1080p $0.12/s`, `4K $0.30/s`; `veo-3.1-generate-preview`: `720p $0.40/s`, `1080p $0.40/s`, `4K $0.60/s`) and **Gemini Omni Flash** (`gemini-omni-1.1-flash`: `720p $0.10/s`, 10s max). Rejects any unlisted provider/resolution/duration combination and permanently blocks OpenAI Sora (shut down Sept 24, 2026).
  - **Atomic `$500` Budget Guard (`video_pilot/budget.py`)**: Enforces `spent_usd + reserved_usd + estimated_cost_usd <= cap_usd ($500.00)` with atomic in-flight reservation locking before any provider API call, zero-dependency YAML parsing, and live `costs.csv` audit ledger export.
  - **23-Shot Rainy Bookstore & Wounded Night Hunter Episode (`shots/shot_list.json`, `style/style_guide.md`)**: Adapted the *"Nocturne in the Rainy Bookstore"* chapter into 23 schema-validated shots (`21 × 8s + 2 × 6s = 180s = 3.0 minutes`) with non-verbatim literary transformation, 3 locked character turnaround anchors (`char_shopkeeper`, `char_hunter`, `char_cane_relic`), and 2 environment anchors (`loc_rainy_bookstore`, `loc_storm_alley`).
  - **Interactive 2.5D Anime Canvas Animatic Player & Chapter-to-23-Shot Compiler (`AiVideoPilotModal.tsx`)**: Real-time 60 FPS canvas animatic renderer visualizing the rainy bookstore interior, storm alley, bronze doorway bell, steaming porcelain tea cups, and silver-inlaid wooden cane alongside a live Chapter-to-23-Shot compiler (`POST /api/video-pilot/compile-chapter` with deterministic offline fallback), 10-shot provider bake-off, FFmpeg EBU R128 (`-14 LUFS`) + sidechain ducking command generator, and 5-Clause Book License Analyzer.
- **Original AI Studio Applet (`4d0cb3f2`) vs. Current Build (`70d0f32a`) Evolution Matrix (`OriginalAppletBridgeModal.tsx`)**:
  - Added a side-by-side 7-dimension architectural benchmark table comparing the original static-canvas prototype (`4d0cb3f2-610b-4819-909e-06de8300dcfb`) against the current `v2.1.0` unified workstation.
- **Resilient Dev Server Startup & Video Pilot API Endpoints (`server.ts`)**:
  - Replaced top-level eager `new GoogleGenAI` instantiation with a lazy `getGenAiClient()` helper so the Express + Vite server always starts cleanly on port `3000` even before `GEMINI_API_KEY` is configured.
  - Added `GET /api/health`, `GET /api/video-pilot/pricing`, and `POST /api/video-pilot/compile-chapter`.
- **Expanded Automated Test Suite (21 Test Suites)**:
  - Added `src/utils/aiVideoPilotEngine.test.ts` and `src/utils/userGuidesEngine.test.ts` using Node's native `node:test` runner (`npm test`).

---

## [1.8.0] - 2026-10-28

### Added & Improved
- **Build Spec: Text-to-Video Diffusion Transformer (Optimized Inference) (`CLAUDE.md`, `AGENTS.md`, `pytorchDitBuildSpecEngine.ts`, `PyTorchDitBuildSpecModal.tsx`)**:
  - Saved the software-focused PyTorch 2.x + Triton build specification at both `/CLAUDE.md` (Claude Code) and `/AGENTS.md` (Cursor, Codex) in the repository root for automatic agent ingestion.
  - **7 Core Modules & Tests (`vae.py`, `patchify.py`, `dit.py`, `attention.py`, `text.py`, `sampler.py`, `pipeline.py`, `tests/thresholds.py`, `bench.py`)**:
    1. **Causal 3D VAE (`vae.py`)**: `8x` temporal compression, `8x` (or optional `16x`) spatial compression, strictly left-only causal time padding (`(k_t - 1, 0)`), and temporal chunked decoding to bound peak VRAM.
    2. **3D Patch Tokenizer (`patchify.py`)**: `(1×2×2)` 3D patch flattening with factorized sinusoidal `(T, H, W)` positional embeddings.
    3. **Diffusion Transformer (`dit.py`)**: `RMSNorm -> Spatial/Temporal Self-Attention -> Cross-Attention to Text -> SwiGLU MLP` with `adaLN` timestep modulation, alternating Spatial Attention (within frame) and Temporal Attention (across frames at the same location) without ever running full $N \times N$ 3D attention.
    4. **Attention (`attention.py`)**: `torch.nn.functional.scaled_dot_product_attention` / FlashAttention plus `naive_attention_reference` for `BF16` testing (`atol <= 1e-3`).
    5. **Text Conditioning (`text.py`)**: Pretrained **T5-XXL (`google/t5-v1_1-xxl`, 4096-dim)** cross-attention conditioning with a deterministic tiny-config test stub.
    6. **Sampler (`sampler.py`) & Pipeline (`pipeline.py`)**: Rectified-flow / Euler denoising loop with configurable steps and Classifier-Free Guidance (`cfg_scale`), `generate(prompt, frames, height, width, steps, seed) -> video tensor [B, T, H, W, C]`, and per-channel **FP8 (E4M3) / INT8** linear quantization that keeps `input_embedding`, `timestep_embedding`, `final_output_projection`, and `vae.decode` in `BF16`.
  - **Interactive Simulator & 110 Passing Unit Tests across 17 Suites**: Added `src/utils/pytorchDitBuildSpecEngine.test.ts` and the **PyTorch DiT Build Spec (CLAUDE.md)** workbench modal in **LEO Video Studio**.

---

## [1.7.0] - 2026-10-28

### Added & Improved
- **LEO Video Studio Timeline Keyframe System (`leoKeyframeEngine.ts`, `leoKeyframeEngine.test.ts`, `LeoStudioTab.tsx`)**:
  - Animates text layer properties (**Position X/Y**, **Scale**, and **Rotation**) over time (`0%` to `100%`) with configurable easing curves (`easeInOut`, `easeOut`, `easeIn`, `linear`).
  - Added clickable diamond keyframe markers (`◆`) on both the main timeline scrubber and the dedicated **Timeline Keyframe Animator** track, 1-click motion presets (*Zoom In*, *Slide Across*, *Spin Drop*, *Lower-Third*, *Reset*), and **Export Video with Keyframed Text (`.webm`)** recording the animated canvas stream via `MediaRecorder`.
- **Reference: Operating Systems & AI Infrastructure (`linuxDitClusterEngine.ts`, `linuxDitClusterEngine.test.ts`, `LinuxDitClusterHostModal.tsx`)**:
  - **Popular Operating Systems Catalog**: Profiles **Android** (~40–72% mobile share depending on source), **Windows 11/10**, **iOS** (~19–28% mobile traffic), **macOS** (~10–15% desktop share), **Linux**, **ChromeOS**, **Ubuntu**, **RHEL**, **Debian**, and **Other** (**iPadOS**, **watchOS**, **HarmonyOS**, **FreeBSD**).
  - **Top 10 Ranked Server Operating Systems Matrix**: Ranks 1–10 by enterprise footprint and web presence (**1. Ubuntu Server**, **2. Windows Server**, **3. RHEL**, **4. Debian**, **5. Rocky Linux / AlmaLinux**, **6. Amazon Linux**, **7. Oracle Linux** with Ksplice, **8. SUSE Linux Enterprise Server (SLES)**, **9. Alpine Linux** under 10 MB, and **10. FreeBSD** for high-performance networking & video streaming at scale) with interactive search and license filtering.
  - **CentOS Status & Sora Caveats**: Documents the 2021 CentOS Linux discontinuation (**CentOS Stream** as RHEL upstream; **Rocky Linux** & **AlmaLinux** as free RHEL-compatible alternatives) and clarifies that Linux is the overwhelmingly common choice for large DiT GPU clusters without claiming to confirm OpenAI's proprietary Sora stack.
- **Expanded Automated Test Suite (104 Passing Tests across 16 Suites)**:
  - Added `src/utils/leoKeyframeEngine.test.ts` and expanded `src/utils/linuxDitClusterEngine.test.ts`.

---

## [1.6.0] - 2026-10-28

### Added & Improved
- **Target Environment: Linux Host for a Text-to-Video AI Model (`LinuxDitClusterHostModal.tsx`, `linuxDitClusterEngine.ts`, `linuxDitClusterEngine.test.ts`)**:
  - **1. GPU Cluster Orchestration**: Supports **Kubernetes** for containers alongside **Slurm** (`sbatch` / Pyxis / Enroot) or **Ray** (`KubeRay` / `TorchTrainer`) across thousands of GPUs (`NVIDIA Blackwell B200 SXM`, `NVIDIA Hopper H100 SXM5`, `NVIDIA H100 vGPU`, or `AMD Instinct MI300X` with the **AMD ROCm** compute stack).
  - **2. High-Speed Networking**: Configures **GPUDirect RDMA** (`nvidia-peermem` / `mlx5_ib`) over **InfiniBand NDR 400Gb/s** or **RoCEv2 400Gb/s** plus **SR-IOV** Virtual Functions (`sriov_numvfs` and `SriovNetworkNodePolicy`) so containers reach NICs at near-native line rate without CPU bounce buffers.
  - **3. Fast Storage & GPUDirect Storage (GDS)**: Includes client mounts for **Lustre** (`/mnt/lustre/dit_video_datasets`), **IBM Spectrum Scale / GPFS** (`/gpfs/dit_video_datasets`), and **WekaFS** (`/mnt/wekafs/dit_video_datasets`) paired with **GPUDirect Storage** (`nvidia-fs` and `/etc/cufile.json`) to DMA 4K/high-FPS video datasets straight from NVMe to GPU HBM.
  - **4. Memory Management**: Calculates **1 GB** and **2 MB HugePages** (`default_hugepagesz=1G hugepagesz=1G`, `hugetlbfs`) to slash TLB address-translation overhead when loading multi-hundred-GB DiT weights, and strictly disables swap (`swapoff -a`, `vm.swappiness=0`).
  - **5. Minimal Footprint & Recommended Linux Host OS**: Profiles **NVIDIA Base Command OS**, **Ubuntu Server 24.04 LTS (HPC Kernel)**, **RHEL 9 HPC**, **Bottlerocket**, **RHEL CoreOS**, and **Alpine Minimal** with headless `multi-user.target` enforcement, a 5-pillar readiness audit, and downloadable Linux-only host bootstrap scripts (`provision-linux-dit-host.sh`), Kubernetes SR-IOV + GDS manifests (`k8s-dit-sriov-gds-cluster.yaml`), and multi-node Slurm/Ray job scripts.
- **MemeCanvas Transition Effect Library (`MemeCanvas.tsx`, `memeTransitionEngine.ts`, `memeTransitionEngine.test.ts`)**:
  - Implemented smooth hardware-accelerated 2D canvas transitions when switching between meme templates or custom image backgrounds with **Fade** (cross-fade), **Slide** (directional push), **Dissolve** (deterministic 8×8 Bayer-like block matrix reveal), and **Instant (None)** presets, adjustable duration (`200ms`–`1200ms`), and a manual **Replay** button.
- **YouTube Mobile & Native App Handoff Protection (`YouTubePublishTab.tsx`, `youtubeUploadUtils.ts`)**:
  - Added `isSimulatedYouTubeVideoId`, `resolveYouTubeWatchBehavior`, and `formatMetadataClipboardBlock` so simulated demo uploads never open a broken `"This video is unavailable"` YouTube URL on mobile devices, while real OAuth 2.0 uploads open directly on YouTube and local MP4/WebM exports support 1-tap metadata copy + native YouTube Studio handoff.
- **Expanded Automated Test Suite (96 Passing Tests across 15 Suites)**:
  - Added `src/utils/linuxDitClusterEngine.test.ts` and `src/utils/memeTransitionEngine.test.ts` plus new mobile YouTube handoff unit tests in `src/utils/youtubeUploadUtils.test.ts`.

---

## [1.5.0] - 2026-10-28

### Added & Improved
- **Running a Sora-Style Video App: A Vibe Coder's Guide (`VibeCoderGuideModal.tsx`, `vibeCoderGuideEngine.ts`)**:
  - Interactive architecture planner comparing **Hosted Video APIs** (`Google Veo`, `Runway`, `Luma`) vs. **Single-GPU Open-Source Models** (`Wan 2.1`, `CogVideoX`) rented hourly on **RunPod**, **Lambda**, **AWS**, **Google Cloud**, or **Azure**.
  - **GPU Memory (VRAM) Watchdog & Model Offloading**: Evaluates model card VRAM (`24 GB` vs. `40–80 GB` cards) and prescribes `pipe.enable_model_cpu_offload()` or quantized `INT8`/`FP8` weights before upgrading hardware.
  - **External Video Storage Calculator**: Compares **Amazon S3 + CloudFront** and **Cloudflare R2 ($0 egress) + CDN** against expensive ephemeral GPU disks.
  - **Prompt-to-Docker & FastAPI Generator + Live Sandbox**: Generates a lean `nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04` `Dockerfile` (Python 3.11 + PyTorch CUDA) and FastAPI `app.py` exposing `POST /generate` (5-minute timeout, MP4 export, S3/R2 upload) and `GET /health` with per-job GPU VRAM logging (`torch.cuda.max_memory_allocated()`), backed by `/api/vibe-coder/health` and `/api/vibe-coder/generate` routes and unit tests (**78 passing tests across 13 suites**).
- **Mobile-First Responsive Header & Overflow Navigation (`src/App.tsx`, `src/index.css`)**:
  - Eliminated horizontal page overflow on mobile viewports (`< 640px`) by splitting the studio header into a top brand/action row and a horizontally scrollable studio switcher bar (`.nav` with `overflow-x: auto; white-space: nowrap; scrollbar-width: none`).
  - Added a compact mobile `"⋯"` (`MoreHorizontal`) overflow menu housing `Plans: Rs. 999 / Global PPP`, `Export APK & AAB`, `Share & Original Studio Bridge`, and `Install App`, while keeping `AI Co-Director` and `Magic Caption` immediately accessible.
- **Adaptive Template Grid & Multi-Line Labels (`src/components/MemeTemplateSelector.tsx`)**:
  - Refactored the template gallery grid to `repeat(auto-fill, minmax(135px, 1fr))` (`.template-grid`) with `line-clamp-2` label rendering so template titles never truncate mid-word on narrow phone screens.
- **Wrapping Typography & Color Swatch Controls (`src/components/MemeToolbar.tsx`)**:
  - Updated `Text Color`, `Stroke Color`, and `Alignment & Pill Box` controls with `flex-wrap` and `shrink-0` circular swatches so palettes wrap evenly on narrow viewports.
- **Touchscreen Ergonomics & Bottom Bar Clearance (`src/index.css`, `src/App.tsx`)**:
  - Added `@media (hover: none), (pointer: coarse) { .paste-hint { display: none !important; } }` to hide desktop-only `Paste image with Ctrl+V` hints on smartphones and tablets.
  - Added `pb-24 sm:pb-28` footer clearance so legal links and the Original Applet bridge link (`4d0cb3f2`) remain fully scrollable above floating bottom bars.
- **In-App PWA Installation Guide Modal (`src/components/PWAInstallButton.tsx`)**:
  - Replaced browser alert fallback with a dedicated in-app installation guide modal covering iOS Safari, Android Chrome, and Desktop Chrome/Edge.

---

## [1.4.0] - 2026-10-27

### Added
- **Enterprise B2B Real-Time LoRA Training Status Dashboard (`LoraTrainingStatusDashboard.tsx`)**:
  - Live 5-stage pipeline progression (`validating_dataset` → `extracting_latents` → `training_lora` → `compiling_safetensors` → `completed`), step counters, ETA countdowns, and 20-point loss convergence sparklines.
  - Dedicated GPU cluster telemetry across **NVIDIA H100 SXM5 (80GB)** and **NVIDIA B200 Blackwell (192GB)** nodes tracking compute utilization (`%`), allocated VRAM (`GB`), NVLink bandwidth (`GB/s`), power draw (`W`), and junction temperature (`°C`).
  - Operator pipeline controls for Pause, Resume, Boost (`+250 Steps`), Abort, and direct checkpoint handoff to the Model Sandbox.
- **Enterprise Model Consistency Sandbox (`ModelSandbox.tsx`)**:
  - 5 preset stress-test scenarios (*Studio Macro Travertine Pedestal*, *High Motion & Particle Drift*, *Dramatic Low-Key Chiaroscuro*, *Lifestyle Hands Interaction*, and *Micro-Typography & Foil Stamp*).
  - Custom prompt editor with automatic `{{token}}` trigger injection, cinema lens rig selector (`50mm Macro Probe Lens`, `35mm Prime Arri Alexa`, `85mm Anamorphic Panavision`, `FPV Dynamic Drone Orbit`), aspect ratio switcher (`16:9`, `9:16`, `1:1`, `21:9`), and diffusion sampling step tuning.
  - Physical invariant scorecards verifying **Logo & Kerning Integrity %** ($\ge 98.0\%$), **Geometry Silhouette IoU %** ($\ge 97.5\%$), and **BRDF Material Purity %** ($\ge 97.0\%$), interactive diagnostic overlays, SOC 2 JSON compliance report export, and one-click deployment to LEO Video Studio.
- **10–20 Image Custom LoRA Product Model Builder (`EnterpriseProductModelBuilderModal.tsx`)**:
  - Interactive multi-angle calibration dataset uploader and hyperparameter configurator (`Rank 32 / 64 / 128`, `BF16` / `FP8-Dynamic`).
- **Global Purchasing Power Parity (PPP) Subscription Engine (`subscription.md`, `subscription.json`, `pppPricingUtils.ts`)**:
  - World Bank GNI per-capita 4-tier global pricing model across 90+ countries with Card BIN + MaxMind GeoIP anti-exploitation validation.
- **30-Second Automatic Layout Persistence (`src/App.tsx`)**:
  - Automatic `localStorage` auto-save (`memeforge_autosave_layout`) every 30 seconds preserving active meme text layers, stickers, and filters across browser refreshes.
- **Expanded Automated Test Suite (73 Passing Tests across 12 Suites)**:
  - Added `src/utils/sharedCoreEngine.test.ts`, `src/utils/b2bEnterpriseEngine.test.ts`, and `src/utils/pppPricingUtils.test.ts`.

---

## [1.3.0] - 2026-10-25

### Added
- **2026 Multi-Model Video Engine Hub & Sora Migration Assistant**:
  - Added `EngineHub2026Modal.tsx` and `src/utils/engineMigration2026.ts` supporting post-Sora ecosystem models (**Google Veo 3.1 Ultra**, **Magic Hour API**, **Runway Gen-4.5**, **Kling 2.5 Master**, **Luma Dream Machine Ray 3**, and **Wan 2.1 / HunyuanVideo 8K**).
  - Drop-in Sora-2 payload migration adapter, cost comparison calculator, and `/api/magic-hour/generate` server endpoint.
- **LEO 8K Diffusion Transformer (DiT) Synthesis Engine**:
  - Added `src/utils/leo8kEngine.ts` implementing 3D spacetime patch tokenization, 4-stage cascaded resolution pipeline (`720p Base` → `2K Latent` → `4K Optical` → `8K Cinema Master [7680×4320]`), and `/api/leo/vlm-recaption` synthetic VLM dense re-captioning.
- **YouTube Data API v3 Publisher & Gemini 4 Argon SEO**:
  - Added `YouTubePublishTab.tsx` and `src/utils/youtubeUploadUtils.ts` with resumable binary chunked upload (`/api/youtube/upload`), Gemini 4 Argon viral title/description/tag synthesis (`/api/youtube/generate-metadata`), and Android Kotlin `WorkManager` code templates.
- **In-App Legal & Attribution Viewer**:
  - Expanded `LegalDocsModal.tsx` with full tabs for `Terms`, `Privacy`, `NOTICE` (Apache 2.0 Section 4(d)), and `LICENSE` (Apache 2.0).
- **Expanded Automated Test Suite (52 Passing Tests)**:
  - Added `engineMigration2026.test.ts`, `leo8kEngine.test.ts`, `youtubeUploadUtils.test.ts`, and `tests/meme-logic.test.ts`, bringing total automated test coverage to **52 passing tests across 9 suites**.

### Security & CI
- Removed hardcoded Firebase/Google API credentials (`firebase-applet-config.json`) and hardened `.gitignore` and `.env.example`.
- Added `.npmrc` (`legacy-peer-deps=true`) and updated `.github/workflows/build.yml` to prevent npm Arborist `edgesOut` dependency graph errors in GitHub Actions runners.

---

## [1.2.0] - 2026-10-22

### Added
- **Cinema VFX Studio Master**:
  - **Ultra Resolution Pipeline**: Groundwork and presets for 720p, 1080p, 2K DCI, 4K Ultra, 8K UHD, 12K Super35, 16K Master, and **32K Ultra Master (32000×32000 Omnimax / 1.024 Gigapixels per frame)**.
  - **High Frame Rate Engine**: Full temporal cadence suite supporting 23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 90, 120, 144, 165, 240, 360, 480, 600, 960, and **1000 FPS**.
  - **64-Bit Sub-Frame Timebase**: `120,000,000,000` ticks per second (`TICKS_PER_SECOND_64`) using native `BigInt` sub-millisecond arithmetic with zero round-off error at 1000 FPS.
  - **Deep Color Science & HDR**: 32-bit float color processing, **ACES 2.0 AP0**, OpenColorIO (OCIO v2), Rec.2020, DCI-P3, HDR10+, Dolby Vision Profile 7 (Dual Layer), and HLG.
  - **3D LUT (.cube) Loader**: Built-in Kodak Vision3 2383, Fujifilm ETERNA 500T, Blockbuster Teal & Orange 32K, Acid Phosphor, and Kodak Tri-X 400 emulations with custom file parsing.
  - **Broadcast HDR Scopes**: Real-time Luma Waveform (IRE 0-100), RGB Parade, Vectorscope with skin-tone line, and False Color exposure heatmap.
  - **Fairlight 192 kHz Audio Engine**: 192 kHz Studio Master sample rate, 32-bit float mixing, 7.1 Surround, Dolby Atmos (7.1.4 Bed + Objects), and EBU R128 loudness meters.
  - **Multi-Track Precision Timeline**: Multi-track lanes (V3, V2, V1, FX, A1, A2) with Selection, Razor Blade, Ripple, Rolling, Slip, Slide, and Final Cut-style Magnetic Timeline snapping.
  - **AI Cinema VFX Suite**: 1000 FPS optical flow frame interpolation, 32K neural super-resolution, AI magic mask/rotoscoping, and generative object removal.
  - **Dynamic Proxy Engine**: Seamless preview downscaling (`1:1 Full Master`, `1/2 Proxy`, `1/4 Proxy`, `1/8 Proxy`, `1/16 Super Proxy`) for editing 32K projects on consumer laptops.
  - **Cinema Unit Tests**: Added unit tests in `src/utils/cinemaEngine.test.ts` expanding test coverage to 23 passing tests.

---

## [1.1.0] - 2026-10-21

### Added
- **India Localized Subscriptions**:
  - **Individual Creator Pro (Rs. 999 / month)**: Unlocks up to 100 hours max video duration, 4K Ultra @ 120fps, zero watermarks, and 0% marketplace fees via UPI AutoPay (Google Pay, PhonePe, Paytm, BHIM).
  - **Team / Company Enterprise (Rs. 99,999 / month)**: 50 team member seats with granular RBAC, dedicated 8-node GPU cluster, unlimited 100-hour video exports, Corporate NetBanking / NEFT / RTGS, and official 18% GST Input Tax Credit B2B tax invoicing.
  - **Interactive Team Member Invitations**: In-app seat tracker (`Seats: X / 50`) and invitation modal.
  - **Three-Tier Plan Comparison Matrix**: Full comparison matrix comparing Free Tier vs Solo Pro vs Company Enterprise.

### Security
- **Store Auto-Publish Lockdown**: Disabled automated Google Play Store direct publishing across all tiers to prevent private keystore and credential exploitation; replaced by secure local offline APK & AAB compilation.

---

## [1.0.0] - 2026-10-20

### Added
- **AI Magic Caption**: Multimodal image vision analysis with 5 customizable comedy tones (Sarcastic, Gen Z/Brainrot, Tech, Corporate, Wholesome) and instant 1-click overlay.
- **Audio Layer Studio**: In-app synthetic Web Audio PCM synthesizer generating iconic sound effects (MLG Airhorn, Sad Violin, Laugh Track, Vine Boom, Emotional Damage, Metal Pipe, Bruh) with WebM video export.
- **LEO & Veo 3 Video Studio**: Text-to-video generation pipeline supporting multi-resolution, camera motion controls, prompt expansion, and extended duration up to **100 hours max**.
- **Meme Style Presets**: 1-click font style and outline presets (Classic Impact, Deep Fried Chaos, Neon Cyberpunk, Twitter Subtitle Pill, Stonks Profit).
- **Crypto & UPI Marketplace**: Web3 wallet integration (ETH, SOL, MEME, USDT) and dynamic Indian UPI payment QR flow.
- **PWA & Android Support**: Web app manifest, service worker offline caching, and native Android APK & AAB configuration.
- **CI / Quality Pipeline**: Cross-platform GitHub Actions matrix workflow (Node 20.x and 22.x) with TypeScript typechecking and automated `node:test` suites.
