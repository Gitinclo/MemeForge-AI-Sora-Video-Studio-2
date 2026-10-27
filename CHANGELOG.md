# Changelog

All notable changes to **MemeForge AI, LEO Video & Cinema VFX Studio** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Expanded Automated Test Suite (73 Passing Tests across 11 Suites)**:
  - Added `src/utils/b2bEnterpriseEngine.test.ts` and `src/utils/pppPricingUtils.test.ts`.

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
