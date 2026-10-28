# Cinema & VFX Workstation Architecture Implementation Plan

## 1. Overview & Goals

We are evolving the video editor (`CinemaVfxEditorTab.tsx`, `cinemaEngine.ts`, and supporting workstation modules) from a foundational preset selector into an interactive **Cinema & VFX-Grade Non-Linear Editing (NLE), Node Compositing, Color Grading, Spatial Audio, and GPU Render Graph Workstation** that unifies the strongest architectural capabilities of **Adobe Premiere Pro**, **DaVinci Resolve Studio**, and **Final Cut Pro**.

Core objectives based on your selections:
- **DaVinci-Style 5-Room Page Switcher**: Dedicated workstation rooms for **Edit & Multicam**, **Fusion Node Graph**, **Color & OCIO Grading**, **Fairlight 192 kHz Audio**, and **Deliver & GPU Render Graph**, anchored to a shared 64-bit frame-accurate timeline and dual-mode Cinema Viewport.
- **Ultra Resolution & High-Frame-Rate 64-Bit Timebase**: Full support from 720p up to **32K (`32000×32000`)** plus **Unlimited Custom Width × Height**, paired with all 19 frame rates (`23.976` to `1000 FPS`) running on a deterministic `120,000,000,000` ticks/sec 64-bit `BigInt` timebase with a live **64-Bit Timebase Frame-Accurate Benchmark Inspector**.
- **Interactive NLE Timeline, Multicam & Trim Tools**: Live **Blade (Razor split)**, **Ripple Edit**, **Rolling Edit**, **Slip**, and **Slide** operations on timeline clips, **Nested Timelines & Compound Clip** grouping/un-nesting, **Multicam 4-Angle Sync Monitor**, **Unlimited Track creation**, and an optional **Final Cut Magnetic Timeline** auto-snap engine.
- **Interactive Fusion VFX Node Graph & 11-Tool AI VFX Suite**: Direct node graph canvas (MediaIn, AI Magic Mask, Optical Flow 1000 FPS, 3D Camera Tracker, ACES ColorSpaceTransform, Merge, MediaOut) with live node bypass, parameter inspection, wire connections, and all 11 interactive AI VFX passes reflected directly on the preview canvas.
- **Color Science, Real `.cube` 3D LUT Parser & Live HDR Scopes**: Client-side `.cube` 3D LUT file upload and trilinear parser, interactive Lift/Gamma/Gain/Offset wheels, OpenColorIO (OCIO) v2 config pipeline (`ACES 2.0`, `Rec.709`, `Rec.2020`, `DCI-P3`, `BT.2100`, `HDR10+`, `HDR10+ Adaptive`, `Dolby Vision`, `HLG`), and 5 live HDR scopes (`Waveform`, `RGB Parade`, `Vectorscope`, `Histogram`, `False Color`).
- **Fairlight 192 kHz / 64-Bit Audio Console**: Unlimited audio tracks, sample rates (`44.1`–`192 kHz`), bit depths (`16-bit`, `24-bit`, `32-bit Integer`, `32-bit Float`, `64-bit Internal Mixing`), interactive **VST3 Plugin Rack**, **Audio Bus & Side-Chain Routing Matrix**, and an interactive **3D Spatial Audio Panner** for `7.1`, `Dolby Atmos (7.1.4)`, and `Ambisonics`.
- **GPU Render Graph, Tile Caching & Multi-GPU Render Farm Scheduler**: Interactive DAG visualizer for `Vulkan`, `Metal`, `DirectX 12`, `OpenGL ES`, and `WebGPU` compute shaders, live `1024×1024` **Tile Rendering & Smart RAM/VRAM Cache Grid**, zero-copy hardware decode/encode toggles, and a **Multi-GPU & Distributed Render Farm Scheduler** exporting all 12 professional codecs (`H.264`, `H.265 / HEVC`, `AV1`, `ProRes 422`, `ProRes 4444`, `DNxHR`, `CineForm`, `EXR sequence`, `TIFF sequence`, `PNG sequence`, `JPEG XL`, `OpenEXR 16/32-bit float`).

---

## 2. Aesthetic Direction & Domain Exemplars

- **Domain Exemplars**: **Blackmagic DaVinci Resolve Studio 19** (precision dark room ergonomics, bottom/top room switcher, node editor, color wheels, and broadcast scopes), **Adobe Premiere Pro** (multi-track timeline ruler, trim tool indicators, and 4-up multicam program/source monitor), and **Apple Final Cut Pro** (magnetic primary storyline lane snapping and skimming).
- **Color Palette (60-30-10 Dark Room Calibration)**:
  - **60% Dominant Neutral Canvas**: Deep studio obsidian (`#090D16` / `slate-950`) calibrated to prevent ambient color cast during HDR grading.
  - **30% Structural Surfaces**: Instrument bay charcoal (`#0F172A` / `slate-900`) with crisp `1px solid` hairline dividers (`border-slate-800`).
  - **10% High-Intent Semantic Accents**: Precision amber (`#F59E0B`) for active NLE trim tools and playhead timecode, cyan (`#06B6D4`) for Fusion VFX nodes and GPU compute tiles, emerald (`#10B981`) for Fairlight 192 kHz headroom and nominal cache states, and crimson (`#EF4444`) strictly for IRE clipping / 0 dBFS peak alerts.
- **Typography & Tabular Discipline**:
  - **Display & Room Navigation**: `Plus Jakarta Sans` / `Outfit` with clean single-line labels (`whitespace-nowrap shrink-0`).
  - **Technical Telemetry, Timecodes & Scopes**: `JetBrains Mono` / `font-mono tabular-nums` enforced across all 64-bit SMPTE timecodes (`HH:MM:SS:FFF`), tick counters, LUFS/dBFS audio meters, IRE scope readouts, and GPU memory metrics so numbers never jitter during 1000 FPS playback.
- **Anti-Slop & Layout Discipline**:
  - Flat single-elevation studio panels separated by `1px` borders; no nested card sandwiches, no thick left accent borders, and no decorative unwired buttons. Every tool, slider, node, and scope toggle mutates real engine state.

---

## 3. Key Features & User Flows

### A. Room 1: Edit & Cut (Premiere Pro + Final Cut Pro Hybrid Engine)
1. **Ultra Resolution & Custom Canvas Configurator**:
   - Select any preset from `720p HD` through `32K Ultra Master (32000×32000)` or switch to **Unlimited Custom Resolution** with live numeric Width × Height inputs (up to `65536×65536`), aspect ratio lock, and automatic proxy scaling (`1:1 Full Master` down to `1/16 Super Proxy`).
2. **Interactive NLE Trim Tools & Magnetic Timeline**:
   - **Blade Tool (`C`)**: Clicking any clip on the timeline splits it at the exact 64-bit tick position into two independent frame-accurate clips.
   - **Ripple (`B`) & Rolling (`N`) Edit**: Adjust clip duration +/- frames while automatically rippling downstream clips or rolling the edit point between adjacent clips.
   - **Slip (`Y`) & Slide (`U`)**: Shift a clip's `sourceStartTicks` in/out window or slide its position between neighbors with live timecode feedback.
   - **Compound Clips & Nested Timelines**: Select multiple clips or tracks and click **Create Compound Clip** or **Open Nested Timeline** to drill into sub-sequences via breadcrumb navigation.
   - **Magnetic Timeline Toggle**: When active, deleting or trimming a primary storyline clip automatically snaps subsequent clips to close timeline gaps.
   - **Multicam 4-Up Monitor Mode**: Toggle the main viewport between **Single Master Output** and **4-Cam Multicam Sync View** (`Cam A: 32K Wide`, `Cam B: 16K Telephoto`, `Cam C: 1000 FPS High-Speed`, `Cam D: Drone Plate`), switching angles live during playback.

### B. Room 2: Fusion VFX Node Graph & 11-Tool AI VFX Suite
1. **Interactive Node Graph Canvas**:
   - Visual node graph featuring draggable/selectable nodes (`MediaIn1 [32K RAW]`, `AI Rotomask / Magic Mask`, `OpticalFlow [1000 FPS]`, `AI SuperScale [32K]`, `OCIO ColorSpaceTransform`, `Merge3D`, `MediaOut1`).
   - Users can add nodes, toggle node bypass, inspect/edit node parameters (blend mode, mask feather, motion vector precision, optical flow warp), and view live execution timings per node in milliseconds.
2. **All 11 Interactive AI VFX Passes on the Preview Canvas**:
   - Dedicated interactive controls and visual canvas overlays for:
     1. **AI Object Removal** (interactive inpaint region toggle)
     2. **AI Masking** (subject matte highlight)
     3. **AI Rotoscoping** (animated contour spline overlay)
     4. **AI Frame Interpolation** (optical flow up to 1000 FPS)
     5. **AI Upscaling** (32K detail synthesis pass)
     6. **AI Denoise** (temporal RAW noise reduction slider)
     7. **AI Stabilization** (3D horizon lock & rolling shutter correction)
     8. **AI Subtitles** (auto-transcribed timecode-synced caption track generator)
     9. **AI Speech Enhancement** (dialogue isolation & de-reverb on audio tracks)
     10. **AI Background Replacement** (real-time alpha plate swap)
     11. **AI Color Matching** (reference shot grade transfer to active clip)

### C. Room 3: Color & Scopes (DaVinci Resolve + OpenColorIO v2 + `.cube` Loader)
1. **Real `.cube` 3D LUT File Loader & Parser**:
   - Upload any `.cube` 3D LUT file from disk (or generate/export a `.cube` file directly in-app). The engine parses `TITLE`, `LUT_3D_SIZE`, `DOMAIN_MIN`, `DOMAIN_MAX`, and RGB triplets, applying the parsed color transform and displaying LUT metadata.
2. **Interactive 4-Way Primary Wheels & OCIO Pipeline**:
   - Live sliders and interactive XY pucks for **Lift**, **Gamma**, **Gain**, and **Offset**, plus `Contrast`, `Pivot`, `Saturation`, `Color Temperature (K)`, and `Tint`.
   - Full Color Space & HDR transfer selection (`ACES 2.0`, `Rec.709`, `Rec.2020`, `DCI-P3`, `BT.2100`, `OpenColorIO v2` + `HDR10+`, `HDR10+ Adaptive`, `Dolby Vision`, `HLG`).
3. **5 Live Broadcast HDR Scopes**:
   - Toggleable **Waveform (Luma IRE / Nits)**, **RGB Parade**, **Vectorscope (with skin-tone line)**, **Histogram**, and **False Color Exposure Heatmap** that dynamically respond to the current Lift/Gamma/Gain/Offset and LUT settings.

### D. Room 4: Fairlight 192 kHz / 64-Bit Spatial Audio Console
1. **Channel Strips, VST3 Rack & Unlimited Track Expansion**:
   - Add unlimited audio tracks (`+ Add Audio Track`), configure `44.1 / 48 / 88.2 / 96 / 176.4 / 192 kHz` and `16-bit / 24-bit / 32-bit Integer / 32-bit Float / 64-bit Internal Mixing`.
   - Interactive **VST3 Plugin Chain** per track/bus (`FabFilter Pro-Q3 EQ`, `Fairlight Dynamics Compressor`, `Dolby Atmos Beamformer`, `Neural De-Noise VST3`) with bypass and wet/dry controls.
2. **Audio Buses, Side-Chain Routing & 3D Spatial Panner**:
   - Route tracks to `Dialogue Bus`, `VFX Stem Bus`, `Music Bus`, and `Sub-Bass LFE`, with live **Side-Chain Ducking** (e.g., `A1 Dialogue` automatically ducking `A2 Atmos Bed` by `-6.5 dB` when active).
   - Interactive **3D Spatial Panner (X/Y/Height Z)** for `7.1`, `Dolby Atmos (7.1.4)`, and `Ambisonics (3rd Order 16-Ch)`.

### E. Room 5: Deliver, GPU Render Graph & Multi-GPU Farm
1. **GPU Render Graph & Tile Caching Visualizer**:
   - Switch between `Vulkan`, `Metal`, `DirectX 12`, `OpenGL ES`, and `WebGPU` backends.
   - Interactive **Tile Rendering Grid (`1024×1024` Sub-Tiles)** showing real-time tile states (`Cached in RAM`, `VRAM Streaming`, `Compute Shader Active`, `Zero-Copy Output`) and **Performance Foundation** toggles (`Multi-Threaded Engine`, `SIMD Optimization`, `GPU Memory Streaming`, `Dynamic RAM Cache`, `Incremental Rendering`, `Background Decoding`, `Hardware Encoding/Decoding`, `Zero-Copy GPU Pipeline`).
2. **64-Bit Timebase Frame-Accurate Benchmark Inspector**:
   - Live verification panel testing exact tick math across all 19 frame rates (`23.976` to `1000 FPS`), proving zero floating-point drift over 24-hour timelines.
3. **Multi-GPU & Render Farm Cluster Scheduler + 12-Codec Export Queue**:
   - Configure Multi-GPU local scaling (`1x`–`8x Local GPUs`) and Distributed Render Farm nodes, add jobs to the Render Queue across all 12 professional codecs (`H.264`, `H.265 / HEVC`, `AV1`, `ProRes 422`, `ProRes 4444`, `DNxHR`, `CineForm`, `EXR sequence`, `TIFF sequence`, `PNG sequence`, `JPEG XL`, `OpenEXR 16/32-bit float`), and run live frame-by-frame render dispatch with downloadable master manifest/LUT export.

---

## 4. Technical Architecture

| File Path | Responsibility |
| :--- | :--- |
| `/src/types/cinemaEngine.ts` | Expand types to cover Unlimited Custom Resolution, Fusion VFX Node Graph (`VfxNode`, `VfxConnection`), `.cube` LUT parser structures (`ParsedCubeLut`), Fairlight VST3 / Bus / Side-chain / 3D Panner state (`AudioTrackChannelStrip`, `Vst3PluginSlot`, `SideChainRoute`), GPU Render Graph stages & Tile Cache states (`RenderGraphStage`, `RenderTileCell`, `PerformanceFoundationConfig`), Multicam angles, and Render Queue jobs. |
| `/src/utils/cinemaEngine.ts` | Implement deterministic 64-bit timeline editing functions (`splitClipAtTicks64`, `rippleTrimClip64`, `rollingEditClips64`, `slipClipSource64`, `slideClipPosition64`, `createCompoundClip64`, `applyMagneticSnap64`), real `.cube` 3D LUT file parser & generator (`parseCubeLutFile`, `generateSampleCubeLutContent`), 64-bit timebase drift benchmark calculator (`benchmarkTimebaseAccuracy64`), and GPU tile/render graph telemetry calculators. |
| `/src/utils/cinemaEngine.test.ts` | Comprehensive unit test suite validating 64-bit tick accuracy across all 19 frame rates (including `23.976`, `29.97`, `59.94`, and `1000 FPS`), Blade/Ripple/Rolling/Slip/Slide timeline math, `.cube` 3D LUT parsing, and ultra-resolution compute calculations. |
| `/src/components/CinemaVfxEditorTab.tsx` | Full 5-room DaVinci-style Cinema & VFX Workstation UI integrating the Multicam/Single Preview Canvas with 11 AI VFX overlays, 5 Live Broadcast HDR Scopes (Waveform, RGB Parade, Vectorscope, Histogram, False Color), Interactive Fusion Node Graph, Color Wheels & `.cube` Upload, Fairlight Mixer with VST3/Side-Chain/3D Atmos Panner, GPU Render Graph & Tile Visualizer, and Interactive 64-bit Multi-Track Timeline. |

---

## 5. Visual Assets Plan

- **Canvas & Procedural Hardware Rendering**: All video scopes (Waveform, RGB Parade, Vectorscope, Histogram, False Color), Fusion node graphs, 3D Atmos spatial panners, and GPU tile caches will be rendered using deterministic SVG/Canvas procedural graphics and CSS hardware shaders so they respond instantaneously at 60–120 Hz to user slider adjustments without static image latency.
