# MemeForge AI, LEO Video & Cinema VFX Studio

> **Next-generation multimedia studio combining multimodal AI meme creation, LEO/Veo video synthesis up to 100 hours, native Android (APK & AAB) packaging, localized India UPI & Enterprise subscriptions, and a cinema/VFX-grade editing architecture capable of 32K (32000×32000), 1000 FPS, 32-bit float color, and 192 kHz Fairlight audio.**

[![Gemini](https://img.shields.io/badge/Gemini%20API-3.8%20Flash%20%7C%204%20Argon-7c3aed?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Original AI Studio Applet](https://img.shields.io/badge/AI%20Studio%20Origin-4d0cb3f2--610b--4819--909e--06de8300dcfb-4f46e5?style=for-the-badge&logo=google)](https://ai.studio/apps/4d0cb3f2-610b-4819-909e-06de8300dcfb?fullscreenApplet=true)
[![Cinema VFX 32K](https://img.shields.io/badge/Cinema%20VFX-32K%20%7C%201000%20FPS-06b6d4?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
[![Fairlight Audio](https://img.shields.io/badge/Fairlight%20Audio-192%20kHz%20%7C%2032--bit%20Float-10b981?style=for-the-badge)](https://web.dev/web-audio-basics/)
[![Android APK & AAB](https://img.shields.io/badge/Android-APK%20%26%20AAB%20Offline%20Build-f59e0b?style=for-the-badge&logo=android)](https://developer.android.com/)
[![UPI & Subscriptions](https://img.shields.io/badge/India%20Billing-Rs.%20999%20%7C%20Rs.%2099%2C999-6366f1?style=for-the-badge)](https://www.npci.org.in/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

> **Original AI Studio Applet**: [`https://ai.studio/apps/4d0cb3f2-610b-4819-909e-06de8300dcfb?fullscreenApplet=true`](https://ai.studio/apps/4d0cb3f2-610b-4819-909e-06de8300dcfb?fullscreenApplet=true)

---

## 🌟 Overview

**MemeForge AI Studio** is a unified viral creation and cinema-grade production workstation. It bridges the gap between viral internet culture and high-end film engineering:

1. **Meme Studio & Auto-Save**: Multimodal Gemini Vision auto-captioning, live draggable typography canvas, 16+ trending vector templates, sticker overlays, synthesized multi-track audio layers, and **automatic 30-second `localStorage` layout persistence** (`memeforge_autosave_layout`).
2. **Marketplace & Crypto/UPI**: Buy and sell viral templates using Web3 wallets (ETH, SOL, MEME, USDT) or Indian UPI AutoPay (GPay, PhonePe, Paytm, BHIM).
3. **LEO / Veo 3 Video Studio**: AI video generation scaling from 15 seconds up to **100 hours maximum duration** in 4K/8K Ultra with camera motion controls and prompt expansion.
4. **Enterprise B2B LoRA Studio & Model Sandbox**: Train custom product digital-twin LoRA weights from 10–20 calibration images, monitor live **LoRA Training Status & NVIDIA H100/B200 GPU Telemetry**, and verify physical invariants (Logo Integrity, Silhouette IoU, BRDF Material Purity) in the **Model Consistency Sandbox** before wide-scale deployment.
5. **Cinema VFX Studio Master**: A hybrid workstation combining the best of **Adobe Premiere Pro** (multi-track precision editing & trimming), **DaVinci Resolve Studio** (ACES 2.0 color science, 3D LUTs & real-time scopes), and **Fusion / Fairlight** (AI node effects & 192 kHz 32-bit float audio).
6. **Team Hub & Global PPP Subscriptions**: 50-seat team workspace with granular RBAC permissions, version rollback snapshots, encrypted 50 TB asset vaults, localized Indian plans (Rs. 999/mo Individual Pro & Rs. 99,999/mo Corporate Enterprise), and **4-Tier Global Purchasing Power Parity (PPP)** pricing across 90+ countries.
7. **Mobile-First Responsive UI, PWA & Android Packaging**: Zero-overflow responsive studio header with horizontal scrollable navigation (`.nav`), compact mobile `"⋯"` overflow drawer, adaptive `auto-fill` template grid, wrapping color swatches, touchscreen-aware shortcut hints (`@media (hover: none)`), installable Progressive Web App (PWA) with offline service worker, and local Android APK & AAB bundle generation.

---

## 🚀 Key Feature Modules

### 1. 🎬 Cinema VFX Studio Master (32K • 1000 FPS • 192 kHz)
Designed to compete with Hollywood-grade non-linear editors and VFX workstations:

- **Ultra Resolution Pipeline (720p to 32K)**:
  - Supported Presets: 720p HD, 1080p FHD, 2K DCI, 4K DCI, 8K UHD (7680×4320), 12K Super35 (12288×6480), 16K Master (15360×8640), and **32K Ultra Master (32000×32000 Omnimax / 1.024 Gigapixels per frame)**.
  - **Dynamic Proxy Engine**: Real-time downscaling (`1:1 Full Master`, `1/2 Proxy`, `1/4 Proxy`, `1/8 Proxy`, and `1/16 Super Proxy [2000×2000]`) ensuring buttery smooth playback and editing on laptops and consumer GPUs.
  - **Compute Telemetry**: Live VRAM calculation (`16.384 GB / uncompressed frame` for 32K 32-bit float), throughput bandwidth in Gbps, and uncompressed archival TB/hour estimates.

- **High Frame Rate Engine (up to 1000 FPS)**:
  - Frame Rates: `23.976`, `24`, `25`, `29.97`, `30`, `48`, `50`, `59.94`, `60`, `90`, `120`, `144`, `165`, `240`, `360`, `480`, `600`, `960`, and **1000 FPS**.
  - **64-Bit Sub-Frame Timebase** (`TICKS_PER_SECOND_64 = 120,000,000,000n`):
    - Sub-millisecond arithmetic using native 64-bit integers.
    - Each frame at 1000 FPS spans exactly `120,000,000` ticks with 0 round-off error, guaranteeing sub-frame sync across audio and video cuts.

- **Color Science & Deep Color Pipeline**:
  - Color Precisions: 8-bit Integer, 10-bit Rec.2020, 12-bit Cinema, 16-bit Half-Float, **32-bit Float (IEEE 754)**, and 64-bit Master.
  - Color Spaces: **ACES 2.0 AP0**, ACEScc / ACEScct, Rec.709, Rec.2020, DCI-P3 D65, BT.2100, and OpenColorIO (OCIO v2).
  - HDR Standards: SDR, HDR10, HDR10+, HDR10+ Adaptive, Dolby Vision Profile 8.4, Dolby Vision Profile 7 (Dual Layer), and HLG.
  - **3D LUT (.cube) Loader**: Built-in cinematic emulations (*Kodak Vision3 2383*, *Fujifilm ETERNA 500T*, *Blockbuster Teal & Orange 32K*, *Acid Phosphor*, *Kodak Tri-X 400*) plus custom `.cube` file support.
  - **Real-Time HDR Scopes**:
    - **Luma Waveform (IRE 0–100)** with 1000-nit HDR clipping thresholds.
    - **RGB Parade** for discrete red/green/blue alignment.
    - **Vectorscope** with calibrated skin-tone indicator.
    - **False Color** heat map exposure tool (purple shadows, green 18% gray, red highlight clip).

- **Fairlight Professional Audio Engine (192 kHz)**:
  - Sample Rates: 44.1 kHz, 48 kHz, 88.2 kHz, 96 kHz, 176.4 kHz, and **192 kHz Studio Master**.
  - Internal Mixing: 32-bit Float and 64-bit internal bus summing.
  - Spatial Channel Layouts: Stereo (2.0), 5.1 Surround, 7.1 Cinema Surround, **Dolby Atmos (7.1.4 Bed + Objects)**, and Ambisonics (3rd Order 16-Channel).
  - Master Console: Real-time multi-channel level metering (L, R, C, LFE) calibrated to EBU R128 (-14 LUFS) broadcast loudness.

- **Multi-Track Precision Timeline**:
  - Editing Tools: Select (`V`), Razor Blade (`C`), Ripple Edit (`B`), Rolling Edit (`N`), Slip (`Y`), Slide (`U`), and Final Cut–style **Magnetic Timeline** snapping.
  - Multi-Layer Tracks: V3 (AI Masks/VFX), V2 (Overlays/Titles), V1 (32K Master Plate), FX (ACES 2.0 Transform), A1 (Dialogue 192kHz), A2 (Atmos Foley).

- **AI Cinema VFX Suite**:
  - **AI Frame Interpolation**: Optical flow motion vector generation synthesizing smooth 1000 FPS slow-motion.
  - **AI 32K Super-Resolution**: Neural upscaling of 4K/8K plates to 32000×32000 with generative high-frequency detail.
  - **AI Magic Mask & Rotoscoping**: Zero-keyframe automated subject and actor tracking.
  - **Generative Inpainting**: Automated removal of boom mics, wires, and unwanted background objects.

- **Deliver & Render Farm Integration**:
  - Pro Codecs: Apple ProRes 4444 XQ, Apple ProRes 422 HQ, Avid DNxHR HQX, GoPro CineForm RAW, OpenEXR 32-bit float sequences, AOMedia AV1 (12-bit), HEVC/H.265 (10-bit 4:2:2), and JPEG XL.
  - Internal GPU Render Graph targeting **WebGPU Compute Shaders**, **Vulkan**, **Apple Metal 3**, and **DirectX 12**.
  - Sub-Tile rendering (1024×1024 tiles) and distributed render farm node dispatching.

---

### 2. 💳 India Localized Subscriptions & Corporate Licensing
MemeForge features dedicated Indian pricing and payment workflows tailored for individual creators and corporate studios:

| Feature / Limit | Free Tier (Rs. 0) | India Creator Pro (Rs. 999 / mo) | Team / Company Enterprise (Rs. 99,999 / mo) |
| :--- | :--- | :--- | :--- |
| **Target Audience** | Casual creators & meme makers | Solo pros & marathon video artists | Production agencies & creative corporations |
| **Max AI Video Duration** | 15 seconds max | **Up to 100 Hours Max** | **Unlimited 100-Hour Continuous** |
| **Max Resolution & FPS** | 720p HD @ 30fps | 4K Ultra & 1080p @ 120fps | 4K / 32K Master @ 120–1000 FPS |
| **Collaborative Seats** | 2 Seats max | 1 Creator Seat (Solo) | **50 Team Member Seats** (Granular RBAC) |
| **Multi-Workspace Hub** | 1 Default Workspace | 1 Default Workspace | **10 Isolated Production Workspaces** |
| **Encrypted Cloud Vault** | 1 GB Client Cache | 100 GB AES-256 Cloud Vault | **50 TB AES-256 GCM Zero-Knowledge Multi-Region** |
| **Project Management** | — | — | **Live Production Queues, Node Telemetry & Collaborator Presence** |
| **GPU Processing Queue** | Shared Eco cluster | Priority 4-Cluster Dispatch | **Dedicated 8-Node Enterprise Cluster** (0 Wait) |
| **Activity Audit Trail** | Local session | Local session | **Immutable CSV & JSON Exportable Audit Logs** |
| **AI Magic Captions** | 10 captions / day | Unlimited Gemini Vision | Unlimited Enterprise Pool |
| **Watermark & Rights** | MemeForge corner watermark | Zero Watermark (Studio Master) | Full Broadcast Commercial Rights |
| **Marketplace Fees** | 10% platform fee | 0% Platform Fee (Instant UPI) | 0% Platform Fee (Direct corporate bank payout) |
| **Payment Methods** | Included Free | UPI AutoPay (GPay, PhonePe, Paytm) | Corporate NetBanking, UPI Mandate, NEFT/RTGS |
| **B2B Tax Invoicing** | — | Consumer receipt | **18% GST Input Tax Credit (B2B Tax Invoice)** |
| **Direct Store Publishing** | Disabled (Security Guard) | Disabled (Security Guard) | Disabled (Offline Signing Only) |

---

### 3. 🪄 AI Magic Caption & Meme Canvas Editor
- **Multimodal Gemini Vision**: Analyzes facial expressions, scene geometry, and cultural irony directly from images.
- **5 Viral Caption Tones**: Sarcastic & Witty, Gen Z / Brainrot, Tech & Developer, Corporate Workplace, and Wholesome.
- **Interactive Typography**: Classic Impact, Anton, Bebas Neue, Montserrat Bold, Orbitron, and Permanent Marker.
- **Direct Canvas Repositioning**: Freeform click-and-drag positioning, multi-layer stacking, and customizable outline strokes (0–10px) with glow effects.
- **Audio SFX Synthesizer**: In-app Web Audio API synthesizer generating iconic sound effects (MLG Airhorn, Sad Violin, Vine Boom, Wow, Record Scratch, Bruh, Dramatic Dun Dun Dun) with synchronized WebM video exports.

---

### 4. 🛒 Community Marketplace & Web3 / UPI Checkout
- **Crypto Currency Integration**: Web3 wallet connectivity supporting **ETH**, **SOL**, **MEME**, and **USDT** with simulated on-chain transaction signing.
- **Indian UPI Gateway**: Dynamic QR code generation, UPI Deep Link intent URLs (`upi://pay?pa=...`), and support for Google Pay, PhonePe, Paytm, CRED, and BHIM.
- **Transaction Ledger**: Instant audit logs with cryptographic transaction hashes and verifiable receipts.

---

### 5. 👥 Team Workspace, Multi-Workspaces & Project Management
- **Project Management & Production Dashboard**:
  - Live video production queues with real-time cluster node telemetry (RTX 4090 D, A100 SXM, H100 NVLink), frame progress counters, and ETA estimates.
  - Interactive render controls: Pause / Resume, Priority Boost, Cancel, and Preview modal with Cloud Vault synchronization.
  - Interactive Enqueue Video Production Job modal for dispatching new rendering tasks.
  - Real-time collaborator presence tracking with active workstation nodes, current clip activity, and direct **Nudge Collaborator** action.
  - Immutable activity logs with category filtering (`Queue`, `Vault`, `Workspace`, `Review`, `RBAC`) and direct **JSON & CSV export**.
- **Multi-Workspace Hub (Up to 10 Isolated Workspaces)**:
  - Create and manage isolated production workspaces for different client accounts or film projects.
  - Per-workspace GPU node allocation, team member assignments, and storage isolation.
- **Encrypted 50 TB Cloud Vault**:
  - Enterprise-grade asset repository with **AES-256 GCM Zero-Knowledge Multi-Region** encryption.
  - Edge caching telemetry with sub-10ms CDN delivery across APAC (Mumbai), EU (Frankfurt), and US (Virginia).
  - Multi-tier permission controls: *Team Read/Write*, *Owner & Director Only*, *VFX Restricted*, and *Public CDN Cached*.
- **Version Snapshots & Rollback**: Instant branching (`main-cut`) with one-click snapshot rollback.
- **Role-Based Access Control (RBAC)**: Manage workspace permissions across Owner, Director, VFX Artist, Editor, Sound Designer, Reviewer, and Producer.
- **Interactive Seat Management**: Real-time capacity tracking (`Seats: X / 50`) with in-app member invites and direct seat upgrades.

---

### 6. 📱 Android APK & AAB Packaging (Security First)
- **Local Offline Compilation**: Full support for compiling standalone Android APKs and Google Play Store App Bundles (`.aab`).
- **Security Hardening**: Automated direct-to-store publishing has been permanently disabled across all studio tiers to protect developer account credentials, private keystores, and API tokens from exploitation.

---

### 7. 🏢 Enterprise B2B LoRA Training Dashboard & Model Consistency Sandbox
- **10–20 Image Product Digital-Twin LoRA Builder (`EnterpriseProductModelBuilderModal.tsx`)**:
  - Calibrate custom product LoRA weights (`Rank 32 / 64 / 128`, `BF16` or `FP8-Dynamic`) with unique trigger tokens (e.g., `aurum_flacon_v4`, `vanguard_chrono_x1`).
- **Real-Time LoRA Training Status Dashboard (`LoraTrainingStatusDashboard.tsx`)**:
  - Live 5-stage pipeline tracking (`validating_dataset` → `extracting_latents` → `training_lora` → `compiling_safetensors` → `completed`), step progress counters, dynamic ETA countdowns, and loss convergence sparklines.
  - **Dedicated GPU Cluster Telemetry**: Real-time monitoring across **NVIDIA H100 SXM5 (80GB)** and **NVIDIA B200 Blackwell (192GB)** nodes, displaying compute utilization (`%`), allocated VRAM (`GB`), NVLink interconnect bandwidth (`GB/s`), power draw (`W`), and junction temperatures (`°C`).
  - Interactive operator controls to Pause, Resume, Boost (`+250 Steps`), Abort, or open checkpoints directly in the Model Sandbox.
- **Model Consistency Sandbox (`ModelSandbox.tsx`)**:
  - **5 Enterprise Preset Stress-Test Scenarios**: *Studio Macro Travertine Pedestal*, *High Motion & Particle Drift*, *Dramatic Low-Key Chiaroscuro*, *Lifestyle Hands Interaction*, and *Micro-Typography & Foil Stamp*.
  - **Custom Optics & Prompt Controls**: Automatic `{{token}}` trigger injection, cinema lens rig selector (`50mm Macro Probe Lens`, `35mm Prime Arri Alexa`, `85mm Anamorphic Panavision`, `FPV Dynamic Drone Orbit`), aspect ratios (`16:9`, `9:16`, `1:1`, `21:9`), and diffusion sampling step tuning (`20–60 steps`).
  - **Physical Invariant Scorecards & Inspection Viewport**: Verifies **Logo & Kerning Integrity %** ($\ge 98.0\%$), **Geometry Silhouette IoU %** ($\ge 97.5\%$), and **BRDF Material Purity %** ($\ge 97.0\%$) with interactive viewport overlays (*Color Render*, *Logo Mask*, *Silhouette IoU*, *BRDF Materials*), downloadable SOC 2 JSON compliance reports, and one-click deployment to LEO Video Studio.

### 8. 📲 Mobile-First Responsive Studio & Progressive Web App (PWA)
- **Zero-Overflow Responsive Header & Navigation**:
  - Top bar splits cleanly on small viewports (`< 640px`): brand logo and primary actions (`AI Co-Director`, `Magic Caption`, and a `"⋯"` quick-action menu) stay pinned at the top while the 7-studio workspace switcher (`.nav`) scrolls horizontally (`overflow-x: auto; white-space: nowrap; scrollbar-width: none`) without pushing the page or meme preview off-screen.
  - Secondary studio actions (`Plans: Rs. 999 / Global PPP`, `Export APK & AAB`, `Share & Original Studio Bridge`, and `Install App`) automatically collapse into an accessible `"⋯"` overflow popover on phones.
- **Adaptive Template Grid & Multi-Line Labels**:
  - Uses CSS Grid `repeat(auto-fill, minmax(135px, 1fr))` (`.template-grid`) with `line-clamp-2` titles so template cards and long names (*"Disappointed Guy (Happy vs Sad)"*) remain legible across narrow mobile screens.
- **Wrapping Typography & Color Swatch Toolbars**:
  - `Text Color`, `Stroke Color`, and `Alignment & Pill Box` controls use `flex-wrap` with `shrink-0` circular swatches so palettes wrap cleanly onto a second row instead of overflowing or squashing.
- **Touchscreen Media Query Ergonomics & Viewport Clearance**:
  - Desktop-only keyboard hints (`Paste image with Ctrl+V`) are automatically hidden on touch devices via `@media (hover: none), (pointer: coarse) { .paste-hint { display: none !important; } }`.
  - Extra bottom footer clearance (`pb-24 sm:pb-28`) keeps legal links, attribution notices, and the Original Applet link (`4d0cb3f2`) scrollable above floating bottom bars.
- **Progressive Web App (PWA) & Offline Support**:
  - Full Web App Manifest (`public/manifest.webmanifest`), offline service worker (`public/sw.js`), `beforeinstallprompt` hook (`src/hooks/usePWAInstall.ts`), and an in-app installation guide modal (`src/components/PWAInstallButton.tsx`) for iOS Safari, Android Chrome, and Desktop browsers.

### 9. 🖥️ Running a Sora-Style Video App: A Vibe Coder's Guide (`VibeCoderGuideModal.tsx` & `vibeCoderGuideEngine.ts`)
- **Start Small (Hosted API vs. Single-GPU Open Source)**:
  - Side-by-side planner comparing pay-per-clip Hosted Video APIs (**Google Veo**, **Runway**, **Luma**) against open-source models (**Wan 2.1**, **CogVideoX**) running on a single rented GPU.
- **Hourly GPU Rental & Single-Container Docker**:
  - Curated hourly GPU catalog across **RunPod**, **Lambda**, **AWS**, **Google Cloud**, and **Azure** built on a lean **Ubuntu 22.04 CUDA** server image (skipping Kubernetes/Slurm, InfiniBand/RDMA, desktop environments, Bottlerocket, and enterprise NVIDIA DGX OS).
- **GPU Memory (VRAM) Watchdog & Model Offloading**:
  - Checks model card VRAM requirements (`24 GB` vs. `40–80 GB` cards) and automatically recommends quantized weights (`INT8` / `FP8`) or `pipe.enable_model_cpu_offload()` before upgrading hardware.
- **External Object Storage & CDN Calculator**:
  - Calculates monthly storage and bandwidth savings when offloading generated MP4 clips from expensive ephemeral GPU disks to **Amazon S3 + CloudFront** or **Cloudflare R2 ($0 egress) + CDN**.
- **Prompt-to-Dockerfile & FastAPI Generator + Live Sandbox**:
  - Interactive generator for the exact plain-English prompts:
    1. `Dockerfile` based on `nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04` with Python 3.11, PyTorch CUDA, Diffusers, FastAPI, and Boto3.
    2. `app.py` exposing `POST /generate` (5-minute timeout, MP4 export, S3/R2 upload & CDN link) and the follow-up `GET /health` endpoint + per-job GPU VRAM memory logging (`torch.cuda.max_memory_allocated()`).

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v20.0.0 or higher
- npm, pnpm, or bun

### 1. Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Gitinclo/MemeForge-AI-Sora-Video-Studio.git
   cd MemeForge-AI-Sora-Video-Studio
   ```
2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```
3. **Set up environment variables:**
   Copy the example environment file and fill in your keys:
   ```bash
   cp .env.example .env
   ```

### 2. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

Run the automated unit and integration test suite:
```bash
npm test
```
Runs the full **78-test suite across 13 test suites** covering:
- **Shared Core Engine (`sharedCoreEngine.test.ts`)**: Numeric clamping, UTF-8 SVG data URI encoding, byte size formatting, prefixed ID generation, `localStorage` JSON adapters, and Original AI Studio Applet (`4d0cb3f2-610b-4819-909e-06de8300dcfb`) URL resolution.
- **Vibe Coder Sora-Style App Guide Engine (`vibeCoderGuideEngine.test.ts`)**: 24 GB vs. 40–80 GB GPU VRAM evaluation, `enable_model_cpu_offload()` compatibility, Amazon S3 vs. Cloudflare R2 CDN cost calculation, and Ubuntu CUDA `Dockerfile` + FastAPI `/generate` (5m timeout) & `/health` code generation.
- **Enterprise B2B LoRA & Model Sandbox Engine (`b2bEnterpriseEngine.test.ts`)**: 5-stage LoRA training progression, ETA formatting, H100/B200 GPU telemetry perturbation, `{{token}}` prompt injection, and physical invariant consistency scoring.
- **Global Purchasing Power Parity Pricing (`pppPricingUtils.test.ts`)**: World Bank GNI 4-tier regional discount resolution, India INR anchor pricing, and Card BIN + GeoIP anti-arbitrage verification.
- **2026 Multi-Model Engine Migration (`engineMigration2026.test.ts`)**: Sora-2 to Magic Hour / Veo 3.1 / Kling 2.5 / Runway Gen-4.5 / Luma Ray 3 payload adapters and pricing calculators.
- **LEO 8K DiT Engine (`leo8kEngine.test.ts`)**: 3D spacetime patch tokenization, cascaded 720p→2K→4K→8K pipeline stages, and VLM dense re-captioning.
- **Audio Synthesis & WAV Encoding (`memeAudioEngine.test.ts`)**: PCM stereo synthesis and 44-byte RIFF WAVE header encoding.
- **Meme Style Presets (`memeStylePresets.test.ts`)**: Typography preset application and text layer transforms.
- **Subscription & Enterprise RBAC (`subscriptionUtils.test.ts`)**: Free vs. India Creator Pro (Rs. 999/mo) vs. Company Enterprise (Rs. 99,999/mo), 10 isolated workspaces, and 50 TB Cloud Vault limits.
- **Video Duration & Compute Telemetry (`videoDurationUtils.test.ts`)**: 100-hour max duration clamping, timecode formatting, and frame compute metrics.
- **YouTube Data API v3 & Argon Metadata (`youtubeUploadUtils.test.ts`)**: Tag parsing, metadata validation, resumable chunk progress, and Kotlin WorkManager generator templates.
- **Cinema VFX 32K & 1000 FPS Engine (`cinemaEngine.test.ts`)**: 64-bit sub-frame timebase (`120,000,000,000` ticks/sec), 32K Gigapixel math, and 192 kHz Fairlight audio.
- **Canvas & Marketplace Logic (`tests/meme-logic.test.ts`)**: Word-wrap, category/mood filtering, and Web3/UPI wallet ledger balance calculations.

Type-check the entire project without emitting files:
```bash
npm run lint
```

---

## 📦 Deployment

### Web / Cloud Run / Docker Production Build
1. **Build the production client bundle:**
   ```bash
   npm run build
   ```
2. **Start the full-stack production server (Express + static `dist/`):**
   ```bash
   NODE_ENV=production PORT=3000 npm start
   ```
   The server binds to `0.0.0.0:3000` and serves both the compiled SPA (`dist/`) and all `/api/*` endpoints.

### 📱 Android Build Instructions (APK & AAB)

#### Method A: Building the Release App Bundle (`.aab`)
```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

#### Method B: Building the Debug/Release APK (`.apk`) for Sideloading
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📡 Backend API Reference

All AI model and publishing operations are handled server-side via Express routes in `server.ts`:

| Route | Method | Model / Service | Description |
| :--- | :---: | :--- | :--- |
| `/api/magic-captions` | `POST` | `gemini-3.8-flash` | Multimodal vision analysis of meme image with 5 viral captions |
| `/api/generate-meme-image`| `POST` | `gemini-3.1-flash-lite-image` | Generative custom meme template & background synthesis |
| `/api/chat-director` | `POST` | `gemini-4-argon` / `3.8-flash` | Multi-turn comedy co-director chat with deep thinking mode |
| `/api/expand-prompt` | `POST` | `gemini-3.1-flash-lite` | Low-latency cinematic prompt expansion for video synthesis |
| `/api/leo/vlm-recaption` | `POST` | `gemini-3.1-flash-lite` | Synthetic VLM dense re-captioning with ARRI Alexa 65 optics specs |
| `/api/youtube/generate-metadata` | `POST` | `gemini-4-argon` | High-CTR YouTube Title, Description, Tags & Virality Score generator |
| `/api/youtube/upload` | `POST` | YouTube Data API v3 | Resumable binary video upload with OAuth 2.0 Bearer token |
| `/api/magic-hour/generate` | `POST` | Magic Hour / 2026 Hub | Sora-compatible drop-in video generation & migration dispatcher |
| `/api/vibe-coder/health` | `GET` | Single-GPU FastAPI Health | Returns CUDA availability, device name, and allocated/reserved VRAM |
| `/api/vibe-coder/generate` | `POST` | Single-GPU Video Worker | Runs `/generate` with 5m timeout, logs per-job VRAM, and returns S3/R2 MP4 link |

---

## 📂 Project Directory Structure

```text
├── .github/
│   ├── ISSUE_TEMPLATE/              # Bug report & feature request templates
│   ├── workflows/
│   │   └── build.yml                # GitHub Actions CI (Node 20.x & 22.x lint, test, build)
│   ├── dependabot.yml               # Automated dependency security updates
│   └── pull_request_template.md     # Standardized PR checklist
├── android/                         # Native Android Gradle project (SDK 36, minSdk 24)
├── public/                          # PWA icons, SVG logo & manifest.webmanifest
├── scripts/                         # Build & icon automation scripts
│   ├── build-apk-aab.sh
│   └── generate_pwa_icons.py
├── tests/
│   └── meme-logic.test.ts           # Word-wrap, tag/mood filters & Web3/UPI wallet tests
├── src/
│   ├── components/
│   │   ├── AiCaptionSuggestionsBar.tsx
│   │   ├── AiDirectorChatModal.tsx
│   │   ├── AndroidPackageModal.tsx
│   │   ├── CinemaVfxEditorTab.tsx   # 32K, 1000 FPS, ACES 2.0 & 192 kHz Cinema VFX Workstation
│   │   ├── EngineHub2026Modal.tsx   # 2026 Multi-Model Video Hub & Sora Migration Assistant
│   │   ├── EnterpriseB2BTab.tsx     # Enterprise B2B LoRA Suite, Training Telemetry & Model Sandbox
│   │   ├── EnterpriseProductModelBuilderModal.tsx # 10–20 Image Custom LoRA Calibration Builder
│   │   ├── LegalDocsModal.tsx       # In-app Terms, Privacy, NOTICE & Apache 2.0 License viewer
│   │   ├── LeoStudioTab.tsx         # LEO 8K DiT Video Studio (up to 100-hour duration)
│   │   ├── LoraTrainingStatusDashboard.tsx # Real-time LoRA training progress, ETA & H100/B200 telemetry
│   │   ├── MagicCaptionModal.tsx    # Gemini Vision multimodal auto-captioning
│   │   ├── MarketplaceCheckoutModal.tsx
│   │   ├── MarketplaceTab.tsx
│   │   ├── MemeAudioLayerPanel.tsx
│   │   ├── MemeCanvas.tsx
│   │   ├── MemeStylePresetPicker.tsx
│   │   ├── MemeTemplateSelector.tsx
│   │   ├── MemeToolbar.tsx
│   │   ├── ModelSandbox.tsx         # Pre-deployment LoRA consistency sandbox & invariant verifier
│   │   ├── OriginalAppletBridgeModal.tsx # Canonical AI Studio Applet (4d0cb3f2) launcher & state bridge
│   │   ├── PWAInstallButton.tsx
│   │   ├── SubscriptionModal.tsx    # India UPI & 4-Tier Global PPP subscription manager
│   │   ├── TeamWorkspaceTab.tsx
│   │   ├── VibeCoderGuideModal.tsx  # Vibe Coder's Sora-Style App Guide, VRAM Advisor & FastAPI Builder
│   │   ├── YouTubePublishTab.tsx    # YouTube Data API v3 Resumable Publisher & Argon SEO
│   │   └── index.ts                 # Centralized component barrel export
│   ├── data/
│   │   ├── memeTemplates.ts
│   │   └── memeStylePresets.ts
│   ├── hooks/
│   │   └── usePWAInstall.ts         # PWA beforeinstallprompt & standalone mode detection hook
│   ├── types/
│   │   ├── b2bEnterprise.ts
│   │   ├── cinemaEngine.ts
│   │   ├── meme.ts
│   │   ├── subscription.ts
│   │   └── index.ts                 # Centralized domain type barrel export
│   ├── utils/
│   │   ├── sharedCoreEngine.ts      # Shared core helpers, storage adapters & Original Applet URL engine
│   │   ├── b2bEnterpriseEngine.ts
│   │   ├── cinemaEngine.ts
│   │   ├── engineMigration2026.ts
│   │   ├── leo8kEngine.ts
│   │   ├── memeAudioEngine.ts
│   │   ├── pppPricingUtils.ts
│   │   ├── subscriptionUtils.ts
│   │   ├── vibeCoderGuideEngine.ts  # Single-GPU VRAM calculator, S3/R2 estimator & Dockerfile/FastAPI generator
│   │   ├── videoDurationUtils.ts
│   │   ├── youtubeUploadUtils.ts
│   │   └── index.ts                 # Centralized engine & utility barrel export
│   ├── App.tsx                      # Main studio orchestrator + responsive header + 30s auto-save
│   ├── index.css                    # Tailwind v4 + responsive layout & touchscreen media rules
│   └── main.tsx
├── .env.example                     # Safe environment variable template (zero secrets)
├── .gitignore                       # Git ignore rules including keystores & local secrets
├── .npmrc                           # npm configuration (legacy-peer-deps=true)
├── CHANGELOG.md                     # Version history and release notes
├── CODE_OF_CONDUCT.md               # Contributor Covenant v2.1
├── CONTRIBUTING.md                  # Contribution workflow & testing guidelines
├── LICENSE                          # Apache License, Version 2.0
├── NOTICE                           # Apache 2.0 Section 4(d) Attribution Notice
├── PRIVACY.md                       # GDPR, CCPA & India DPDPA Privacy Policy
├── SECURITY.md                      # Vulnerability disclosure & keystore security policy
├── TERMS.md                         # Commercial licensing & subscription terms
├── subscription.json                # Machine-readable Global PPP pricing tiers & BIN rules
├── subscription.md                  # Global Purchasing Power Parity (PPP) pricing documentation
├── server.ts                        # Express backend proxying Gemini & YouTube routes
└── package.json                     # Project scripts & dependencies
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) before opening an issue or submitting a pull request.

---

## ⚖️ Legal & Governance Documents

- **[License (LICENSE)](LICENSE)**: Licensed under the **Apache License, Version 2.0**.
- **[Attribution Notice (NOTICE)](NOTICE)**: Mandatory Apache-2.0 Section 4(d) attribution declaration for `Copyright 2026 MemeForge-AI Studio Contributors` and lead architect `Gitinclo`.
- **[Privacy Policy (PRIVACY.md)](PRIVACY.md)**: Account data retention, Right to be Forgotten (GDPR), password/credential encryption, payment processor disclosures, and India DPDPA compliance.
- **[Terms & Conditions (TERMS.md)](TERMS.md)**: Account security responsibilities, right to terminate/ban abusive accounts without notice, commercial licensing rights, and subscription billing terms.
- **[Security Policy (SECURITY.md)](SECURITY.md)**: Private vulnerability disclosure procedures via GitHub Security Advisories or maintainer email (`lijogeorge1133@gmail.com` / `creatergame31@gmail.com`).
- **[Global PPP Pricing (subscription.md)](subscription.md)**: World Bank GNI Purchasing Power Parity 4-tier global pricing model (`subscription.md` & `subscription.json`).
- **[Changelog (CHANGELOG.md)](CHANGELOG.md)**: Release history and architectural milestones.

## 📄 License

This project is licensed under the **Apache License 2.0** — see the [LICENSE](LICENSE) and [NOTICE](NOTICE) files for details.
