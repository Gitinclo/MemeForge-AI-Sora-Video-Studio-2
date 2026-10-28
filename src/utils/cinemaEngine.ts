import {
  ResolutionPreset,
  ResolutionConfig,
  FrameRatePreset,
  ColorBitDepth,
  ColorSpaceStandard,
  HdrStandard,
  AudioSampleRate,
  AudioBitDepth,
  AudioChannelLayout,
  ProCodec,
  RenderEngineBackend,
  ProxyQuality,
  CinemaProjectSpec,
  TimelineClip,
  TimelineTrack,
  ParsedCubeLut,
  ColorGradeControls,
  VfxNode,
  VfxNodeConnection,
  AiVfxToolState,
  AudioBusConfig,
  AudioTrackChannelStrip,
  RenderGraphStage,
  RenderTileCell,
  PerformanceFoundationConfig,
  MulticamAngle,
  TimebaseBenchmarkRow,
} from '../types/cinemaEngine';

/**
 * High-precision 64-bit timebase tick frequency:
 * 120,000,000,000 ticks per second (120 billion ticks/sec).
 * Even at 1000 FPS, each frame spans exactly 120,000,000 ticks with zero remainder!
 */
export const TICKS_PER_SECOND_64: bigint = 120_000_000_000n;

export const CINEMA_RESOLUTIONS: ResolutionConfig[] = [
  {
    id: '720p HD',
    label: '720p HD (1280×720)',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    pixelCount: 921_600,
    megapixels: 0.92,
    vramEstimateGbPerFrame: 0.015,
    category: 'Consumer',
  },
  {
    id: '1080p FHD',
    label: '1080p FHD Broadcast (1920×1080)',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    pixelCount: 2_073_600,
    megapixels: 2.07,
    vramEstimateGbPerFrame: 0.033,
    category: 'Consumer',
  },
  {
    id: '2K DCI',
    label: '2K DCI Cinema Scope (2048×1080)',
    width: 2048,
    height: 1080,
    aspectRatio: '1.90:1',
    pixelCount: 2_211_840,
    megapixels: 2.21,
    vramEstimateGbPerFrame: 0.035,
    category: 'Cinema',
  },
  {
    id: '4K Ultra',
    label: '4K DCI Production (4096×2160)',
    width: 4096,
    height: 2160,
    aspectRatio: '1.90:1',
    pixelCount: 8_847_360,
    megapixels: 8.85,
    vramEstimateGbPerFrame: 0.141,
    category: 'Cinema',
  },
  {
    id: '8K UHD',
    label: '8K Master Vista (7680×4320)',
    width: 7680,
    height: 4320,
    aspectRatio: '16:9',
    pixelCount: 33_177_600,
    megapixels: 33.18,
    vramEstimateGbPerFrame: 0.531,
    category: 'VFX Master',
  },
  {
    id: '12K Blackmagic',
    label: '12K Super35 RAW (12288×6480)',
    width: 12288,
    height: 6480,
    aspectRatio: '17:9',
    pixelCount: 79_626_240,
    megapixels: 79.63,
    vramEstimateGbPerFrame: 1.274,
    category: 'VFX Master',
  },
  {
    id: '16K Master',
    label: '16K Ultra Archival (15360×8640)',
    width: 15360,
    height: 8640,
    aspectRatio: '16:9',
    pixelCount: 132_710_400,
    megapixels: 132.71,
    vramEstimateGbPerFrame: 2.123,
    category: 'VFX Master',
  },
  {
    id: '32K Ultra Master',
    label: '32K IMAX OmniMaster (32000×32000)',
    width: 32000,
    height: 32000,
    aspectRatio: '1:1 Omnimax',
    pixelCount: 1_024_000_000,
    megapixels: 1024.0,
    vramEstimateGbPerFrame: 16.384,
    category: 'Future IMAX',
  },
  {
    id: 'Custom',
    label: 'Unlimited Custom Resolution (User Defined)',
    width: 24000,
    height: 13500,
    aspectRatio: 'Custom',
    pixelCount: 324_000_000,
    megapixels: 324.0,
    vramEstimateGbPerFrame: 5.184,
    category: 'Future IMAX',
  },
];

export const CINEMA_FRAME_RATES: FrameRatePreset[] = [
  23.976,
  24,
  25,
  29.97,
  30,
  48,
  50,
  59.94,
  60,
  90,
  120,
  144,
  165,
  240,
  360,
  480,
  600,
  960,
  1000,
];

export const AUDIO_SAMPLE_RATES: AudioSampleRate[] = [
  44100,
  48000,
  88200,
  96000,
  176400,
  192000,
];

export const AUDIO_BIT_DEPTHS: AudioBitDepth[] = [
  '16-bit Integer',
  '24-bit Broadcast Wave',
  '32-bit Integer',
  '32-bit Float',
  '64-bit Internal Mixing',
];

export const AUDIO_CHANNEL_LAYOUTS: AudioChannelLayout[] = [
  'Mono (1.0)',
  'Stereo (2.0)',
  '5.1 Surround',
  '7.1 Cinema Surround',
  'Dolby Atmos (7.1.4 Bed + Objects)',
  'Ambisonics (3rd Order 16-Ch)',
];

export const COLOR_BIT_DEPTHS: ColorBitDepth[] = [
  '8-bit Integer',
  '10-bit Rec.2020',
  '12-bit Cinema',
  '16-bit Half-Float',
  '24-bit Studio RGB',
  '32-bit Float',
  '64-bit Float Master',
];

export const COLOR_SPACES: ColorSpaceStandard[] = [
  'Rec.709',
  'Rec.2020',
  'DCI-P3',
  'BT.2100',
  'ACES 2.0 AP0',
  'ACEScc / ACEScct',
  'OpenColorIO (OCIO v2)',
];

export const HDR_STANDARDS: HdrStandard[] = [
  'SDR',
  'HDR10',
  'HDR10+',
  'HDR10+ Adaptive',
  'Dolby Vision Profile 8.4',
  'Dolby Vision Profile 7 (Dual Layer)',
  'HLG (Hybrid Log-Gamma)',
];

export const PRO_CODECS: ProCodec[] = [
  'Apple ProRes 4444 XQ',
  'Apple ProRes 422 HQ',
  'Avid DNxHR HQX',
  'GoPro CineForm RAW',
  'OpenEXR 32-bit Float Sequence',
  'OpenEXR 16-bit Half-Float Sequence',
  'EXR Sequence (Linear)',
  'AOMedia AV1 (12-bit)',
  'HEVC / H.265 (10-bit 4:2:2)',
  'H.264 Broadcast',
  'TIFF 16-bit Sequence',
  'PNG 16-bit Sequence',
  'JPEG XL (JXL HDR)',
];

export const RENDER_BACKENDS: RenderEngineBackend[] = [
  'WebGPU Compute Graph',
  'Vulkan Hardware Acceleration',
  'OpenGL ES 3.2 Compute',
  'Apple Metal 3',
  'DirectX 12 Agility',
  'Distributed Render Farm',
];

export const MULTICAM_ANGLES_DEFAULT: MulticamAngle[] = [
  {
    id: 'cam-a',
    label: 'CAM A • 32K Omnimax Wide',
    cameraModel: 'ARRI Alexa 265 / 32K Array',
    resolution: '32000×32000',
    fps: 1000,
    lens: '24mm Master Prime T1.3',
    colorAccent: 'border-cyan-400 text-cyan-300',
    timecodeOffsetTicks: 0n,
  },
  {
    id: 'cam-b',
    label: 'CAM B • 16K Anamorphic Close',
    cameraModel: 'RED V-Raptor XL 16K VV',
    resolution: '15360×8640',
    fps: 240,
    lens: '85mm Atlas Orion 2x',
    colorAccent: 'border-amber-400 text-amber-300',
    timecodeOffsetTicks: 0n,
  },
  {
    id: 'cam-c',
    label: 'CAM C • 1000 FPS Phantom High-Speed',
    cameraModel: 'Phantom TMX 7510 Ultra',
    resolution: '7680×4320',
    fps: 1000,
    lens: '50mm Zeiss Supreme Prime',
    colorAccent: 'border-purple-400 text-purple-300',
    timecodeOffsetTicks: 0n,
  },
  {
    id: 'cam-d',
    label: 'CAM D • 12K FPV Gimbal Plate',
    cameraModel: 'Blackmagic URSA Cine 12K LF',
    resolution: '12288×6480',
    fps: 120,
    lens: '18mm Cooke S8/i FF',
    colorAccent: 'border-emerald-400 text-emerald-300',
    timecodeOffsetTicks: 0n,
  },
];

export const DEFAULT_VFX_NODES: VfxNode[] = [
  {
    id: 'node-media-in',
    label: 'MediaIn1 (32K RAW Plate)',
    category: 'io',
    bypassed: false,
    computeTimeMs: 0.42,
    vramMb: 4096,
    x: 40,
    y: 80,
    inputs: [],
    outputs: ['RGBA 32f', 'Deep Z'],
    parameters: [
      { key: 'debayer', label: 'RAW Debayer Matrix', value: 'ACES 2.0 AP0 Linear' },
      { key: 'bitDepth', label: 'Float Precision', value: '32-bit Float' },
    ],
  },
  {
    id: 'node-ai-rotomask',
    label: 'AI Magic Mask & RotoSpline',
    category: 'ai_neural',
    bypassed: false,
    computeTimeMs: 1.85,
    vramMb: 2048,
    x: 240,
    y: 35,
    inputs: ['RGBA 32f'],
    outputs: ['Alpha Matte'],
    parameters: [
      { key: 'feather', label: 'Edge Feather Radius', value: 2.4, min: 0, max: 25, step: 0.1, unit: 'px' },
      { key: 'motionTrack', label: '1000 FPS Optical Contour Lock', value: true },
    ],
  },
  {
    id: 'node-optical-flow',
    label: 'OpticalFlow 1000 FPS Kronos',
    category: 'optical_flow',
    bypassed: false,
    computeTimeMs: 2.1,
    vramMb: 3072,
    x: 240,
    y: 145,
    inputs: ['RGBA 32f'],
    outputs: ['Motion Vectors', 'RGBA 32f'],
    parameters: [
      { key: 'vectorDetail', label: 'Vector Grid Density', value: 0.92, min: 0.1, max: 1.0, step: 0.02 },
      { key: 'shutterAngle', label: 'Motion Blur Shutter', value: 180, min: 0, max: 360, step: 15, unit: 'deg' },
    ],
  },
  {
    id: 'node-ocio-transform',
    label: 'OCIO v2 ColorSpaceTransform',
    category: 'color_ocio',
    bypassed: false,
    computeTimeMs: 0.31,
    vramMb: 512,
    x: 460,
    y: 80,
    inputs: ['RGBA 32f', 'Alpha Matte'],
    outputs: ['RGBA 32f'],
    parameters: [
      { key: 'inputSpace', label: 'Input Gamut', value: 'ACES 2.0 AP0' },
      { key: 'outputSpace', label: 'Output ODT', value: 'Dolby Vision P7 / BT.2100' },
    ],
  },
  {
    id: 'node-deep-merge',
    label: 'DeepMerge3D + Z-Defocus',
    category: 'deep_exr',
    bypassed: false,
    computeTimeMs: 1.14,
    vramMb: 1536,
    x: 670,
    y: 80,
    inputs: ['RGBA 32f', 'Deep Z'],
    outputs: ['RGBA 32f'],
    parameters: [
      { key: 'bokehBlades', label: 'Aperture Blades', value: 9, min: 5, max: 15, step: 1 },
      { key: 'focalPlane', label: 'Focal Distance', value: 4.2, min: 0.5, max: 50, step: 0.1, unit: 'm' },
    ],
  },
  {
    id: 'node-media-out',
    label: 'MediaOut1 (Master Bus)',
    category: 'io',
    bypassed: false,
    computeTimeMs: 0.18,
    vramMb: 1024,
    x: 870,
    y: 80,
    inputs: ['RGBA 32f'],
    outputs: [],
    parameters: [
      { key: 'zeroCopy', label: 'Zero-Copy GPU DMA Output', value: true },
    ],
  },
];

export const DEFAULT_VFX_CONNECTIONS: VfxNodeConnection[] = [
  { id: 'conn-1', fromNodeId: 'node-media-in', toNodeId: 'node-ai-rotomask', channel: 'RGBA 32f' },
  { id: 'conn-2', fromNodeId: 'node-media-in', toNodeId: 'node-optical-flow', channel: 'RGBA 32f' },
  { id: 'conn-3', fromNodeId: 'node-ai-rotomask', toNodeId: 'node-ocio-transform', channel: 'Alpha Matte' },
  { id: 'conn-4', fromNodeId: 'node-optical-flow', toNodeId: 'node-ocio-transform', channel: 'RGBA 32f' },
  { id: 'conn-5', fromNodeId: 'node-ocio-transform', toNodeId: 'node-deep-merge', channel: 'RGBA 32f' },
  { id: 'conn-6', fromNodeId: 'node-deep-merge', toNodeId: 'node-media-out', channel: 'RGBA 32f' },
];

export const DEFAULT_AI_VFX_TOOLS: AiVfxToolState[] = [
  {
    id: 'object_removal',
    name: 'AI Object Removal',
    category: 'Spatial VFX',
    description: 'Temporal clean-plate inpainting for boom mics, rigs, wires, and bystanders',
    enabled: false,
    intensity: 85,
    gpuComputeMs: 3.2,
    modelArchitecture: 'Temporal-Inpaint-32K-FP16',
  },
  {
    id: 'ai_masking',
    name: 'AI Subject Masking',
    category: 'Spatial VFX',
    description: 'Sub-pixel semantic alpha matte generation with hair and motion blur preservation',
    enabled: true,
    intensity: 92,
    gpuComputeMs: 1.4,
    modelArchitecture: 'SAM-Cinema-v3-TensorRT',
  },
  {
    id: 'ai_rotoscoping',
    name: 'AI Rotoscoping Splines',
    category: 'Spatial VFX',
    description: 'Automated Bezier contour tracking across 1000 FPS high-speed sequences',
    enabled: true,
    intensity: 88,
    gpuComputeMs: 1.9,
    modelArchitecture: 'RotoFlow-64Bit-Tracker',
  },
  {
    id: 'frame_interpolation',
    name: 'AI Frame Interpolation (1000 FPS)',
    category: 'Temporal Motion',
    description: 'Bidirectional optical flow motion vector synthesis up to 1000 FPS',
    enabled: true,
    intensity: 100,
    gpuComputeMs: 2.1,
    modelArchitecture: 'Kronos-OpticalFlow-FP32',
  },
  {
    id: 'ai_upscaling',
    name: 'AI 32K Super-Scale Upscaling',
    category: 'Spatial VFX',
    description: 'Multi-frame detail synthesis from 4K/8K plates to 32000×32000 IMAX Master',
    enabled: true,
    intensity: 90,
    gpuComputeMs: 4.5,
    modelArchitecture: 'OmniUpscale-32K-Diffusion',
  },
  {
    id: 'ai_denoise',
    name: 'AI Temporal RAW Denoise',
    category: 'Spatial VFX',
    description: '5-frame optical-flow chroma and luma noise reduction preserving film grain',
    enabled: false,
    intensity: 65,
    gpuComputeMs: 1.6,
    modelArchitecture: 'DeepPrime-Cinema-RAW',
  },
  {
    id: 'ai_stabilization',
    name: 'AI 3D Camera Stabilization',
    category: 'Temporal Motion',
    description: '6-DoF gyroscopic horizon lock and rolling shutter distortion correction',
    enabled: false,
    intensity: 75,
    gpuComputeMs: 0.9,
    modelArchitecture: 'GyroMesh-3D-Solver',
  },
  {
    id: 'ai_subtitles',
    name: 'AI Timecode Subtitles',
    category: 'Audio & Dialogue',
    description: 'Frame-accurate multi-speaker transcription synced to 64-bit timeline ticks',
    enabled: true,
    intensity: 100,
    gpuComputeMs: 0.5,
    modelArchitecture: 'Whisper-Cinema-192kHz',
  },
  {
    id: 'speech_enhancement',
    name: 'AI Dialogue & Speech Isolation',
    category: 'Audio & Dialogue',
    description: '32-bit float spectral de-reverb and background noise separation at 192 kHz',
    enabled: true,
    intensity: 84,
    gpuComputeMs: 0.7,
    modelArchitecture: 'Fairlight-VoiceIsolate-64',
  },
  {
    id: 'background_replacement',
    name: 'AI Virtual Stage Background',
    category: 'Spatial VFX',
    description: 'Real-time green-screenfree environment replacement with light-wrap matching',
    enabled: false,
    intensity: 80,
    gpuComputeMs: 2.8,
    modelArchitecture: 'StageCraft-NeuralKey-v2',
  },
  {
    id: 'color_matching',
    name: 'AI Reference Shot Color Match',
    category: 'Color Science',
    description: 'Automatic 3D LUT and CDL primary balance transfer across multicam angles',
    enabled: false,
    intensity: 95,
    gpuComputeMs: 0.6,
    modelArchitecture: 'ACES-MatchGrade-OCIO',
  },
];

export const DEFAULT_AUDIO_BUSES: AudioBusConfig[] = [
  {
    id: 'bus-master-atmos',
    name: 'Master Bus • Dolby Atmos 7.1.4',
    layout: 'Dolby Atmos (7.1.4 Bed + Objects)',
    faderDb: 0.0,
    peakDbfs: -1.8,
    lufsIntegrated: -14.0,
    sideChainThresholdDb: -18,
    sideChainReductionDb: 0,
  },
  {
    id: 'bus-dialogue',
    name: 'Bus A • Dialogue & ADR Stem',
    layout: '7.1 Cinema Surround',
    faderDb: 0.5,
    peakDbfs: -3.2,
    lufsIntegrated: -16.4,
    sideChainThresholdDb: -24,
    sideChainReductionDb: 0,
  },
  {
    id: 'bus-music-score',
    name: 'Bus B • Orchestral Score (Side-Chained)',
    layout: 'Dolby Atmos (7.1.4 Bed + Objects)',
    faderDb: -2.0,
    peakDbfs: -5.4,
    lufsIntegrated: -18.2,
    sideChainSourceTrackId: 'a1',
    sideChainThresholdDb: -22,
    sideChainReductionDb: -6.5,
  },
  {
    id: 'bus-ambisonics',
    name: 'Bus C • 3rd Order Ambisonics VFX',
    layout: 'Ambisonics (3rd Order 16-Ch)',
    faderDb: -1.2,
    peakDbfs: -4.1,
    lufsIntegrated: -17.5,
    sideChainSourceTrackId: 'a1',
    sideChainThresholdDb: -20,
    sideChainReductionDb: -4.0,
  },
];

export const DEFAULT_AUDIO_STRIPS: AudioTrackChannelStrip[] = [
  {
    trackId: 'a1',
    name: 'A1 • Lead Dialogue 192kHz',
    busId: 'bus-dialogue',
    faderDb: 0.0,
    panX: 0.0,
    panY: 0.85,
    heightZ: 0.15,
    isMuted: false,
    isSolo: false,
    recordArmed: false,
    sideChainSendActive: true,
    vst3Chain: [
      {
        id: 'vst-1',
        name: 'FabFilter Pro-Q3 Linear Phase',
        vendor: 'FabFilter',
        category: 'EQ',
        bypassed: false,
        wetMixPct: 100,
        latencySamples: 64,
      },
      {
        id: 'vst-2',
        name: 'Fairlight Neural Voice Isolator',
        vendor: 'Blackmagic Design',
        category: 'Neural Denoise',
        bypassed: false,
        wetMixPct: 88,
        latencySamples: 128,
      },
    ],
  },
  {
    trackId: 'a2',
    name: 'A2 • Atmos 7.1.4 Score Bed',
    busId: 'bus-music-score',
    faderDb: -2.5,
    panX: -0.25,
    panY: 0.2,
    heightZ: 0.65,
    isMuted: false,
    isSolo: false,
    recordArmed: false,
    sideChainSendActive: false,
    vst3Chain: [
      {
        id: 'vst-3',
        name: 'Dolby Atmos 3D Panner & Bed Router',
        vendor: 'Dolby Laboratories',
        category: 'Spatial Atmos',
        bypassed: false,
        wetMixPct: 100,
        latencySamples: 32,
      },
      {
        id: 'vst-4',
        name: 'Fairlight Side-Chain Bus Compressor',
        vendor: 'Blackmagic Design',
        category: 'Dynamics',
        bypassed: false,
        wetMixPct: 100,
        latencySamples: 16,
      },
    ],
  },
  {
    trackId: 'a3',
    name: 'A3 • Ambisonics 16-Ch Sub-LFE Foley',
    busId: 'bus-ambisonics',
    faderDb: -1.0,
    panX: 0.4,
    panY: -0.45,
    heightZ: 0.85,
    isMuted: false,
    isSolo: false,
    recordArmed: false,
    sideChainSendActive: false,
    vst3Chain: [
      {
        id: 'vst-5',
        name: 'Sennheiser Ambeo 3rd-Order Decoder',
        vendor: 'Sennheiser',
        category: 'Spatial Atmos',
        bypassed: false,
        wetMixPct: 100,
        latencySamples: 48,
      },
      {
        id: 'vst-6',
        name: 'Oxford True-Peak Brickwall Limiter',
        vendor: 'Sonnox',
        category: 'Limiter',
        bypassed: false,
        wetMixPct: 100,
        latencySamples: 32,
      },
    ],
  },
];

export const DEFAULT_RENDER_GRAPH_STAGES: RenderGraphStage[] = [
  {
    id: 'stage-1',
    name: 'Zero-Copy NVMe / GPU DMA Ingest',
    shaderType: 'DMA Zero-Copy',
    executionTimeMs: 0.35,
    vramAllocatedGb: 4.2,
    status: 'active',
  },
  {
    id: 'stage-2',
    name: '1024×1024 Tile Split & Proxy Pyramid',
    shaderType: 'Raster Tile',
    executionTimeMs: 0.62,
    vramAllocatedGb: 3.8,
    status: 'cached',
  },
  {
    id: 'stage-3',
    name: 'ACES 2.0 AP0 32-bit Float OCIO Shader',
    shaderType: 'Compute Shader',
    executionTimeMs: 0.48,
    vramAllocatedGb: 2.4,
    status: 'active',
  },
  {
    id: 'stage-4',
    name: 'Fusion VFX & TensorRT AI Pass',
    shaderType: 'Tensor Core FP16/FP32',
    executionTimeMs: 2.15,
    vramAllocatedGb: 6.5,
    status: 'active',
  },
  {
    id: 'stage-5',
    name: 'Multi-GPU Tile Gather & Hardware Encode',
    shaderType: 'Compute Shader',
    executionTimeMs: 0.74,
    vramAllocatedGb: 2.1,
    status: 'streaming',
  },
];

export const DEFAULT_PERFORMANCE_FOUNDATION: PerformanceFoundationConfig = {
  multiThreadedEngine: true,
  workerThreadCount: 32,
  simdOptimization: true,
  gpuMemoryStreaming: true,
  dynamicRamCacheGb: 64,
  incrementalRendering: true,
  backgroundDecoding: true,
  hardwareEncodingDecoding: true,
  zeroCopyGpuPipeline: true,
  tileRenderingSize: 1024,
  multiGpuCount: 4,
  backgroundConformActive: true,
};

/**
 * Returns byte multiplier per RGBA pixel given color bit depth
 */
export function getBytesPerPixel(bitDepth: ColorBitDepth): number {
  switch (bitDepth) {
    case '8-bit Integer':
      return 4;
    case '10-bit Rec.2020':
      return 5;
    case '12-bit Cinema':
      return 6;
    case '16-bit Half-Float':
      return 8;
    case '24-bit Studio RGB':
      return 12;
    case '32-bit Float':
      return 16;
    case '64-bit Float Master':
      return 32;
    default:
      return 16;
  }
}

export interface UltraComputeMetrics {
  totalPixels: number;
  megapixels: number;
  gigapixels: number;
  frameSizeBytes: number;
  frameSizeMb: number;
  frameSizeGb: number;
  throughputGbps: number;
  throughputTbPerHour: number;
  recommendedProxy: ProxyQuality;
  clusterNodesRecommended: number;
  tileCount1024: number;
}

export function calculateUltraComputeMetrics(
  width: number,
  height: number,
  fps: number,
  bitDepth: ColorBitDepth = '32-bit Float'
): UltraComputeMetrics {
  const safeWidth = Math.max(16, Math.round(width || 1920));
  const safeHeight = Math.max(16, Math.round(height || 1080));
  const safeFps = fps > 0 ? fps : 24;

  const totalPixels = safeWidth * safeHeight;
  const megapixels = totalPixels / 1_000_000;
  const gigapixels = totalPixels / 1_000_000_000;
  const bpp = getBytesPerPixel(bitDepth);

  const frameSizeBytes = totalPixels * bpp;
  const frameSizeMb = frameSizeBytes / (1024 * 1024);
  const frameSizeGb = frameSizeBytes / (1024 * 1024 * 1024);

  const throughputGbps = (frameSizeBytes * safeFps * 8) / 1_000_000_000;
  const throughputTbPerHour = (frameSizeBytes * safeFps * 3600) / (1024 * 1024 * 1024 * 1024);

  let recommendedProxy: ProxyQuality = '1:1 Full Master';
  let clusterNodesRecommended = 1;

  if (megapixels > 500) {
    recommendedProxy = '1/16 Super Proxy';
    clusterNodesRecommended = Math.ceil((safeFps / 24) * 8);
  } else if (megapixels > 100) {
    recommendedProxy = '1/8 Proxy';
    clusterNodesRecommended = Math.ceil((safeFps / 24) * 4);
  } else if (megapixels > 30) {
    recommendedProxy = '1/4 Proxy';
    clusterNodesRecommended = Math.ceil((safeFps / 30) * 2);
  } else if (megapixels > 8) {
    recommendedProxy = '1/2 Proxy';
    clusterNodesRecommended = 1;
  }

  const tileCount1024 = Math.ceil(safeWidth / 1024) * Math.ceil(safeHeight / 1024);

  return {
    totalPixels,
    megapixels: Number(megapixels.toFixed(2)),
    gigapixels: Number(gigapixels.toFixed(4)),
    frameSizeBytes,
    frameSizeMb: Number(frameSizeMb.toFixed(2)),
    frameSizeGb: Number(frameSizeGb.toFixed(3)),
    throughputGbps: Number(throughputGbps.toFixed(2)),
    throughputTbPerHour: Number(throughputTbPerHour.toFixed(2)),
    recommendedProxy,
    clusterNodesRecommended,
    tileCount1024,
  };
}

/**
 * 64-bit frame-accurate timecode converter (works accurately even at 1000 FPS)
 */
export function ticksToTimecode64(ticks: bigint, fps: number): string {
  if (ticks < 0n) ticks = 0n;
  const safeFps = fps > 0 ? fps : 24;

  const totalSeconds = Number(ticks / TICKS_PER_SECOND_64);
  const ticksIntoCurrentSecond = ticks % TICKS_PER_SECOND_64;

  const ticksPerFrame = BigInt(Math.round(Number(TICKS_PER_SECOND_64) / safeFps));
  const currentFrame = ticksPerFrame > 0n ? Number(ticksIntoCurrentSecond / ticksPerFrame) : 0;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number, digits: number = 2) => String(n).padStart(digits, '0');
  const framePadding = safeFps >= 100 ? 3 : 2;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(currentFrame, framePadding)}`;
}

/**
 * Converts a SMPTE timecode (HH:MM:SS:FF) into 64-bit ticks
 */
export function timecodeToTicks64(timecode: string, fps: number): bigint {
  const parts = timecode.split(':').map((p) => parseFloat(p) || 0);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;
  const frames = parts[3] || 0;

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const secondsTicks = BigInt(Math.round(totalSeconds)) * TICKS_PER_SECOND_64;

  const ticksPerFrame = BigInt(Math.round(Number(TICKS_PER_SECOND_64) / (fps || 24)));
  const frameTicks = BigInt(Math.round(frames)) * ticksPerFrame;

  return secondsTicks + frameTicks;
}

/**
 * Computes preview downscaled dimensions given proxy quality setting
 */
export function getProxyDimensions(
  width: number,
  height: number,
  proxy: ProxyQuality
): { width: number; height: number; scale: number } {
  let scale = 1.0;
  switch (proxy) {
    case '1/2 Proxy':
      scale = 0.5;
      break;
    case '1/4 Proxy':
      scale = 0.25;
      break;
    case '1/8 Proxy':
      scale = 0.125;
      break;
    case '1/16 Super Proxy':
      scale = 0.0625;
      break;
    default:
      scale = 1.0;
  }
  return {
    width: Math.max(16, Math.round(width * scale)),
    height: Math.max(16, Math.round(height * scale)),
    scale,
  };
}

/**
 * 64-Bit NLE Timeline Operations (Blade, Ripple, Rolling, Slip, Slide, Compound, Magnetic Snap)
 */
export function splitClipAtTicks64(
  clip: TimelineClip,
  splitTicks: bigint
): [TimelineClip, TimelineClip] | null {
  const clipEnd = clip.startTicks + clip.durationTicks;
  const minSlice = TICKS_PER_SECOND_64 / 1000n; // at least 1ms per slice
  if (splitTicks <= clip.startTicks + minSlice || splitTicks >= clipEnd - minSlice) {
    return null;
  }

  const leftDuration = splitTicks - clip.startTicks;
  const rightDuration = clipEnd - splitTicks;

  const leftClip: TimelineClip = {
    ...clip,
    id: `${clip.id}-L`,
    name: `${clip.name} (Part 1)`,
    durationTicks: leftDuration,
  };

  const rightClip: TimelineClip = {
    ...clip,
    id: `${clip.id}-R`,
    name: `${clip.name} (Part 2)`,
    startTicks: splitTicks,
    durationTicks: rightDuration,
    sourceStartTicks: clip.sourceStartTicks + leftDuration,
  };

  return [leftClip, rightClip];
}

export function applyMagneticSnap64(clips: TimelineClip[]): TimelineClip[] {
  const sorted = [...clips].sort((a, b) =>
    a.startTicks < b.startTicks ? -1 : a.startTicks > b.startTicks ? 1 : 0
  );
  let cursor = 0n;
  return sorted.map((clip) => {
    const snapped: TimelineClip = {
      ...clip,
      startTicks: cursor,
    };
    cursor += clip.durationTicks;
    return snapped;
  });
}

export function rippleTrimClip64(
  clips: TimelineClip[],
  clipId: string,
  deltaTicks: bigint,
  minDurationTicks: bigint = TICKS_PER_SECOND_64 / 10n
): TimelineClip[] {
  const target = clips.find((c) => c.id === clipId);
  if (!target) return clips;

  const newDuration =
    target.durationTicks + deltaTicks < minDurationTicks
      ? minDurationTicks
      : target.durationTicks + deltaTicks;
  const actualDelta = newDuration - target.durationTicks;

  return clips.map((c) => {
    if (c.id === clipId) {
      return { ...c, durationTicks: newDuration };
    }
    if (c.startTicks > target.startTicks) {
      const shifted = c.startTicks + actualDelta;
      return { ...c, startTicks: shifted < 0n ? 0n : shifted };
    }
    return c;
  });
}

export function rollingEditClips64(
  clips: TimelineClip[],
  leftClipId: string,
  deltaTicks: bigint,
  minDurationTicks: bigint = TICKS_PER_SECOND_64 / 10n
): TimelineClip[] {
  const sorted = [...clips].sort((a, b) =>
    a.startTicks < b.startTicks ? -1 : a.startTicks > b.startTicks ? 1 : 0
  );
  const idx = sorted.findIndex((c) => c.id === leftClipId);
  if (idx === -1 || idx + 1 >= sorted.length) {
    return rippleTrimClip64(clips, leftClipId, deltaTicks, minDurationTicks);
  }

  const left = sorted[idx];
  const right = sorted[idx + 1];

  const newLeftDuration = left.durationTicks + deltaTicks;
  const newRightDuration = right.durationTicks - deltaTicks;

  if (newLeftDuration < minDurationTicks || newRightDuration < minDurationTicks) {
    return clips;
  }

  return clips.map((c) => {
    if (c.id === left.id) {
      return { ...c, durationTicks: newLeftDuration };
    }
    if (c.id === right.id) {
      return {
        ...c,
        startTicks: right.startTicks + deltaTicks,
        durationTicks: newRightDuration,
        sourceStartTicks:
          right.sourceStartTicks + deltaTicks < 0n ? 0n : right.sourceStartTicks + deltaTicks,
      };
    }
    return c;
  });
}

export function slipClipSource64(
  clip: TimelineClip,
  deltaSourceTicks: bigint
): TimelineClip {
  const nextSource = clip.sourceStartTicks + deltaSourceTicks;
  return {
    ...clip,
    sourceStartTicks: nextSource < 0n ? 0n : nextSource,
  };
}

export function slideClipPosition64(
  clip: TimelineClip,
  deltaStartTicks: bigint,
  maxTimelineTicks: bigint
): TimelineClip {
  let nextStart = clip.startTicks + deltaStartTicks;
  if (nextStart < 0n) nextStart = 0n;
  if (nextStart + clip.durationTicks > maxTimelineTicks) {
    nextStart = maxTimelineTicks - clip.durationTicks;
  }
  return {
    ...clip,
    startTicks: nextStart < 0n ? 0n : nextStart,
  };
}

export function createCompoundClip64(
  track: TimelineTrack,
  compoundName: string = 'Nested VFX Compound Sequence'
): TimelineTrack {
  if (track.clips.length === 0) return track;
  const minStart = track.clips.reduce(
    (min, c) => (c.startTicks < min ? c.startTicks : min),
    track.clips[0].startTicks
  );
  const maxEnd = track.clips.reduce(
    (max, c) => (c.startTicks + c.durationTicks > max ? c.startTicks + c.durationTicks : max),
    0n
  );

  const compoundClip: TimelineClip = {
    id: `compound-${track.id}-${Date.now()}`,
    trackId: track.id,
    name: `${compoundName} (${track.clips.length} clips)`,
    startTicks: minStart,
    durationTicks: maxEnd - minStart,
    sourceStartTicks: 0n,
    color: 'bg-cyan-600/45 border-cyan-300 text-white',
    speedMultiplier: 1.0,
    isCompoundClip: true,
    nestedClips: [...track.clips],
  };

  return {
    ...track,
    clips: [compoundClip],
  };
}

/**
 * Real .cube 3D LUT Parser & Generator
 */
export function parseCubeLutFile(
  content: string,
  fileName: string = 'CustomGrade.cube'
): ParsedCubeLut {
  const lines = content.split(/\r?\n/);
  let title = fileName.replace(/\.cube$/i, '');
  let size = 33;
  let domainMin = { r: 0, g: 0, b: 0 };
  let domainMax = { r: 1, g: 1, b: 1 };

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sampleCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.toUpperCase().startsWith('TITLE')) {
      const match = line.match(/TITLE\s+"?([^"]+)"?/i);
      if (match && match[1]) {
        title = match[1].trim();
      }
      continue;
    }

    if (line.toUpperCase().startsWith('LUT_3D_SIZE')) {
      const parts = line.split(/\s+/);
      const parsedSize = parseInt(parts[1], 10);
      if (!Number.isNaN(parsedSize) && parsedSize >= 2 && parsedSize <= 256) {
        size = parsedSize;
      }
      continue;
    }

    if (line.toUpperCase().startsWith('DOMAIN_MIN')) {
      const parts = line.split(/\s+/).slice(1).map(Number);
      if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
        domainMin = { r: parts[0], g: parts[1], b: parts[2] };
      }
      continue;
    }

    if (line.toUpperCase().startsWith('DOMAIN_MAX')) {
      const parts = line.split(/\s+/).slice(1).map(Number);
      if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
        domainMax = { r: parts[0], g: parts[1], b: parts[2] };
      }
      continue;
    }

    const numericParts = line.split(/\s+/).map(Number);
    if (
      numericParts.length === 3 &&
      numericParts.every((n) => Number.isFinite(n))
    ) {
      sumR += numericParts[0];
      sumG += numericParts[1];
      sumB += numericParts[2];
      sampleCount++;
    }
  }

  const avgR = sampleCount > 0 ? sumR / sampleCount : 0.5;
  const avgG = sampleCount > 0 ? sumG / sampleCount : 0.5;
  const avgB = sampleCount > 0 ? sumB / sampleCount : 0.5;

  const lumaAvg = (avgR + avgG + avgB) / 3;
  const contrastBoost = Number((1 + (lumaAvg - 0.5) * 0.45).toFixed(2));
  const colorSpread = Math.abs(avgR - avgB) + Math.abs(avgG - lumaAvg);
  const saturationBoost = Number((1 + colorSpread * 0.85).toFixed(2));
  const hueShiftDeg = Math.round((avgR - avgB) * 45);

  const cssFilterApproximation = `contrast(${contrastBoost}) saturate(${saturationBoost}) hue-rotate(${hueShiftDeg}deg)`;

  return {
    id: `custom-cube-${Date.now()}`,
    fileName,
    title,
    size,
    domainMin,
    domainMax,
    sampleCount,
    averageTint: {
      r: Number(avgR.toFixed(4)),
      g: Number(avgG.toFixed(4)),
      b: Number(avgB.toFixed(4)),
    },
    contrastBoost,
    saturationBoost,
    hueShiftDeg,
    cssFilterApproximation,
  };
}

export function generateSampleCubeLutContent(
  title: string = 'ACES_2.0_Kodak_2383_Master',
  size: number = 4,
  tint: { r: number; g: number; b: number } = { r: 1.06, g: 0.99, b: 0.92 }
): string {
  const safeSize = Math.max(2, Math.min(17, size));
  const lines: string[] = [
    `# Created by Cinema VFX Studio Master OpenColorIO v2 Engine`,
    `TITLE "${title}"`,
    `LUT_3D_SIZE ${safeSize}`,
    `DOMAIN_MIN 0.0 0.0 0.0`,
    `DOMAIN_MAX 1.0 1.0 1.0`,
  ];

  for (let b = 0; b < safeSize; b++) {
    for (let g = 0; g < safeSize; g++) {
      for (let r = 0; r < safeSize; r++) {
        const nr = Math.min(1, Math.max(0, (r / (safeSize - 1)) * tint.r));
        const ng = Math.min(1, Math.max(0, (g / (safeSize - 1)) * tint.g));
        const nb = Math.min(1, Math.max(0, (b / (safeSize - 1)) * tint.b));
        lines.push(`${nr.toFixed(6)} ${ng.toFixed(6)} ${nb.toFixed(6)}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Combines Lift/Gamma/Gain/Contrast/Saturation/Temp controls + active LUT into a live CSS filter
 */
export function buildCombinedColorFilter(
  grade: ColorGradeControls,
  activeLutFilter?: string
): string {
  const lumaOffset = (grade.lift.luma + grade.gamma.luma + grade.gain.luma + grade.offset.luma) / 200;
  const brightness = Math.max(0.4, Math.min(1.8, Number((1 + lumaOffset).toFixed(2))));
  const contrast = Math.max(0.5, Math.min(2.2, grade.contrast));
  const saturate = Math.max(0, Math.min(3, Number((grade.saturation / 100).toFixed(2))));
  const tempHue = Math.round(((grade.temperature - 5600) / 6400) * 18 + grade.tint * 0.25);

  const primaryFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) hue-rotate(${tempHue}deg)`;
  if (activeLutFilter && activeLutFilter !== 'none') {
    return `${activeLutFilter} ${primaryFilter}`;
  }
  return primaryFilter;
}

/**
 * 64-Bit Timebase Frame-Accurate Benchmark Inspector across all 19 frame rates
 */
export function benchmarkTimebaseAccuracy64(
  fpsList: FrameRatePreset[] = CINEMA_FRAME_RATES
): TimebaseBenchmarkRow[] {
  return fpsList.map((fps) => {
    const ticksPerFrame = BigInt(Math.round(Number(TICKS_PER_SECOND_64) / fps));
    const exactDivision = Number(TICKS_PER_SECOND_64) % fps === 0;
    const idealTicksPer24Hours = Number(TICKS_PER_SECOND_64) * 86400;
    const totalFrames24Hours = Math.round(fps * 86400);
    const actualTicks24Hours = Number(ticksPerFrame) * totalFrames24Hours;
    const driftTicks = Math.abs(idealTicksPer24Hours - actualTicks24Hours);
    const driftAfter24HoursMicroseconds = Number(
      ((driftTicks / Number(TICKS_PER_SECOND_64)) * 1_000_000).toFixed(4)
    );

    const sampleTimecodeAtFrame1000 = ticksToTimecode64(ticksPerFrame * 1000n, fps);

    return {
      fps,
      ticksPerFrame,
      exactDivision,
      driftAfter24HoursMicroseconds,
      sampleTimecodeAtFrame1000,
    };
  });
}

/**
 * Generates GPU Tile Rendering Grid cells for visualizing tile caching & multi-GPU scheduling
 */
export function generateRenderTileGrid(
  rows: number = 4,
  cols: number = 6,
  tileSize: 512 | 1024 | 2048 = 1024,
  multiGpuCount: number = 4
): RenderTileCell[] {
  const cells: RenderTileCell[] = [];
  const states: RenderTileCell['state'][] = [
    'vram_resident',
    'cached_ram',
    'compute_active',
    'vram_resident',
  ];

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const state = states[(r * cols + c) % states.length];
      const gpuIndex = idx % Math.max(1, multiGpuCount);
      const renderTimeMs = Number((0.18 + ((r * 3 + c * 7) % 11) * 0.06).toFixed(2));
      cells.push({
        id: `tile-${r}-${c}`,
        row: r,
        col: c,
        tileResolution: `${tileSize}×${tileSize}`,
        state,
        renderTimeMs,
        gpuIndex,
      });
      idx++;
    }
  }
  return cells;
}

/**
 * Built-in Cinema 3D LUT Presets (.cube simulator)
 */
export interface CinemaLutPreset {
  id: string;
  name: string;
  description: string;
  targetSpace: string;
  colorFilter: string;
}

export const CINEMA_LUT_PRESETS: CinemaLutPreset[] = [
  {
    id: 'kodak_2383',
    name: 'Kodak Vision3 2383 Film Print',
    description: 'Iconic warm film print with rich shadow contrast and organic roll-off',
    targetSpace: 'DCI-P3 D65',
    colorFilter: 'sepia(0.18) saturate(1.25) contrast(1.15) hue-rotate(-6deg)',
  },
  {
    id: 'fuji_eterna',
    name: 'Fujifilm ETERNA 500T Cine',
    description: 'Soft highlight rolloff, muted cinematic pastel skin tones and deep cyan shadows',
    targetSpace: 'Rec.709',
    colorFilter: 'contrast(1.05) saturate(0.92) hue-rotate(4deg) brightness(1.02)',
  },
  {
    id: 'hollywood_teal_orange',
    name: 'Blockbuster Teal & Orange 32K',
    description: 'Complementary color separation with cyan shadows and warm sunlit skin highlights',
    targetSpace: 'Rec.2020 HDR',
    colorFilter: 'contrast(1.22) saturate(1.35) hue-rotate(-12deg)',
  },
  {
    id: 'matrix_green_grade',
    name: 'Cyberpunk Acid Phosphor',
    description: 'High contrast stylized green-tinted shadows for sci-fi and nighttime VFX',
    targetSpace: 'ACES 2.0',
    colorFilter: 'contrast(1.3) saturate(1.1) hue-rotate(55deg)',
  },
  {
    id: 'monochrome_tri_x',
    name: 'Kodak Tri-X 400 Silver Halide',
    description: 'Deep high-contrast black & white with wide dynamic range tonality',
    targetSpace: 'Linear ACES',
    colorFilter: 'grayscale(1) contrast(1.4) brightness(0.95)',
  },
];

/**
 * Default Cinema Project Specification
 */
export const DEFAULT_CINEMA_PROJECT: CinemaProjectSpec = {
  id: 'cin-proj-1',
  title: 'MemeForge Cinema VFX Master Project',
  resolutionPreset: '32K Ultra Master',
  width: 32000,
  height: 32000,
  frameRate: 1000,
  colorDepth: '32-bit Float',
  colorSpace: 'ACES 2.0 AP0',
  hdrStandard: 'Dolby Vision Profile 7 (Dual Layer)',
  audioSampleRate: 192000,
  audioBitDepth: '32-bit Float',
  audioLayout: 'Dolby Atmos (7.1.4 Bed + Objects)',
  codec: 'Apple ProRes 4444 XQ',
  renderBackend: 'WebGPU Compute Graph',
  proxyQuality: '1/16 Super Proxy',
  enableMagneticTimeline: true,
  enableSimdAcceleration: true,
  enableZeroCopyGpu: true,
  renderFarmNodes: 8,
};
