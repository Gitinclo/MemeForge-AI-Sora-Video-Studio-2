export type ResolutionPreset =
  | '720p HD'
  | '1080p FHD'
  | '2K DCI'
  | '4K Ultra'
  | '8K UHD'
  | '12K Blackmagic'
  | '16K Master'
  | '32K Ultra Master'
  | 'Custom';

export interface ResolutionConfig {
  id: ResolutionPreset;
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
  pixelCount: number;
  megapixels: number;
  vramEstimateGbPerFrame: number;
  category: 'Consumer' | 'Cinema' | 'VFX Master' | 'Future IMAX';
}

export type FrameRatePreset =
  | 23.976
  | 24
  | 25
  | 29.97
  | 30
  | 48
  | 50
  | 59.94
  | 60
  | 90
  | 120
  | 144
  | 165
  | 240
  | 360
  | 480
  | 600
  | 960
  | 1000;

export type ColorBitDepth =
  | '8-bit Integer'
  | '10-bit Rec.2020'
  | '12-bit Cinema'
  | '16-bit Half-Float'
  | '24-bit Studio RGB'
  | '32-bit Float'
  | '64-bit Float Master';

export type ColorSpaceStandard =
  | 'Rec.709'
  | 'Rec.2020'
  | 'DCI-P3'
  | 'BT.2100'
  | 'ACES 2.0 AP0'
  | 'ACEScc / ACEScct'
  | 'OpenColorIO (OCIO v2)';

export type HdrStandard =
  | 'SDR'
  | 'HDR10'
  | 'HDR10+'
  | 'HDR10+ Adaptive'
  | 'Dolby Vision Profile 8.4'
  | 'Dolby Vision Profile 7 (Dual Layer)'
  | 'HLG (Hybrid Log-Gamma)';

export type AudioSampleRate =
  | 44100
  | 48000
  | 88200
  | 96000
  | 176400
  | 192000;

export type AudioBitDepth =
  | '16-bit Integer'
  | '24-bit Broadcast Wave'
  | '32-bit Integer'
  | '32-bit Float'
  | '64-bit Internal Mixing';

export type AudioChannelLayout =
  | 'Mono (1.0)'
  | 'Stereo (2.0)'
  | '5.1 Surround'
  | '7.1 Cinema Surround'
  | 'Dolby Atmos (7.1.4 Bed + Objects)'
  | 'Ambisonics (3rd Order 16-Ch)';

export type ProCodec =
  | 'H.264 Broadcast'
  | 'HEVC / H.265 (10-bit 4:2:2)'
  | 'AOMedia AV1 (12-bit)'
  | 'Apple ProRes 422 HQ'
  | 'Apple ProRes 4444 XQ'
  | 'Avid DNxHR HQX'
  | 'GoPro CineForm RAW'
  | 'EXR Sequence (Linear)'
  | 'TIFF 16-bit Sequence'
  | 'PNG 16-bit Sequence'
  | 'JPEG XL (JXL HDR)'
  | 'OpenEXR 16-bit Half-Float Sequence'
  | 'OpenEXR 32-bit Float Sequence';

export type RenderEngineBackend =
  | 'WebGPU Compute Graph'
  | 'Vulkan Hardware Acceleration'
  | 'OpenGL ES 3.2 Compute'
  | 'Apple Metal 3'
  | 'DirectX 12 Agility'
  | 'Distributed Render Farm';

export type ProxyQuality =
  | '1:1 Full Master'
  | '1/2 Proxy'
  | '1/4 Proxy'
  | '1/8 Proxy'
  | '1/16 Super Proxy';

export type TimelineTool =
  | 'select'
  | 'blade'
  | 'ripple'
  | 'rolling'
  | 'slip'
  | 'slide'
  | 'hand'
  | 'zoom';

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'adjustment' | 'subtitle' | 'fusion' | 'multicam';
  isMuted: boolean;
  isLocked: boolean;
  isSolo?: boolean;
  color: string;
  clips: TimelineClip[];
}

export interface TimelineClip {
  id: string;
  trackId: string;
  name: string;
  startTicks: bigint; // 64-bit timebase
  durationTicks: bigint;
  sourceStartTicks: bigint;
  color: string;
  thumbnail?: string;
  speedMultiplier: number;
  isCompoundClip?: boolean;
  nestedClips?: TimelineClip[];
  multicamAngleId?: string;
  fusionCompId?: string;
}

export interface MulticamAngle {
  id: string;
  label: string;
  cameraModel: string;
  resolution: string;
  fps: FrameRatePreset;
  lens: string;
  colorAccent: string;
  timecodeOffsetTicks: bigint;
}

export interface ScopeMode {
  waveform: boolean;
  rgbParade: boolean;
  vectorscope: boolean;
  histogram: boolean;
  falseColor: boolean;
}

export interface ColorGradeControls {
  lift: { r: number; g: number; b: number; luma: number }; // -100 to +100
  gamma: { r: number; g: number; b: number; luma: number };
  gain: { r: number; g: number; b: number; luma: number };
  offset: { r: number; g: number; b: number; luma: number };
  contrast: number; // 0.5 to 2.0
  pivot: number; // 0.0 to 1.0
  saturation: number; // 0 to 200%
  temperature: number; // 2000K to 12000K
  tint: number; // -100 to +100
  activeLut?: string;
}

export interface CubeRgbTriplet {
  r: number;
  g: number;
  b: number;
}

export interface ParsedCubeLut {
  id: string;
  fileName: string;
  title: string;
  size: number;
  domainMin: CubeRgbTriplet;
  domainMax: CubeRgbTriplet;
  sampleCount: number;
  averageTint: CubeRgbTriplet;
  contrastBoost: number;
  saturationBoost: number;
  hueShiftDeg: number;
  cssFilterApproximation: string;
}

export type VfxNodeCategory =
  | 'io'
  | 'ai_neural'
  | 'color_ocio'
  | 'composite'
  | 'optical_flow'
  | 'deep_exr';

export interface VfxNodeParameter {
  key: string;
  label: string;
  value: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface VfxNode {
  id: string;
  label: string;
  category: VfxNodeCategory;
  bypassed: boolean;
  computeTimeMs: number;
  vramMb: number;
  x: number;
  y: number;
  inputs: string[];
  outputs: string[];
  parameters: VfxNodeParameter[];
}

export interface VfxNodeConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  channel: 'RGBA 32f' | 'Alpha Matte' | 'Motion Vectors' | 'Deep Z';
}

export type AiVfxFeatureId =
  | 'object_removal'
  | 'ai_masking'
  | 'ai_rotoscoping'
  | 'frame_interpolation'
  | 'ai_upscaling'
  | 'ai_denoise'
  | 'ai_stabilization'
  | 'ai_subtitles'
  | 'speech_enhancement'
  | 'background_replacement'
  | 'color_matching';

export interface AiVfxToolState {
  id: AiVfxFeatureId;
  name: string;
  category: 'Spatial VFX' | 'Temporal Motion' | 'Audio & Dialogue' | 'Color Science';
  description: string;
  enabled: boolean;
  intensity: number; // 0 to 100
  gpuComputeMs: number;
  modelArchitecture: string;
}

export interface Vst3PluginSlot {
  id: string;
  name: string;
  vendor: string;
  category: 'EQ' | 'Dynamics' | 'Spatial Atmos' | 'Neural Denoise' | 'Limiter';
  bypassed: boolean;
  wetMixPct: number;
  latencySamples: number;
}

export interface SpatialAudio3DPosition {
  azimuthDeg: number; // -180 to +180
  elevationDeg: number; // -45 to +90
  distance: number; // 0.0 to 1.0
  heightCeilingPct: number; // 0 to 100
  lfeSendDb: number; // -60 to +6
}

export interface AudioBusConfig {
  id: string;
  name: string;
  layout: AudioChannelLayout;
  faderDb: number;
  peakDbfs: number;
  lufsIntegrated: number;
  sideChainSourceTrackId?: string;
  sideChainThresholdDb: number;
  sideChainReductionDb: number;
}

export interface AudioTrackChannelStrip {
  trackId: string;
  name: string;
  busId: string;
  faderDb: number; // -60 to +12
  panX: number; // -1.0 (L) to +1.0 (R)
  panY: number; // -1.0 (Rear) to +1.0 (Front)
  heightZ: number; // 0.0 (Floor) to 1.0 (Ceiling Atmos)
  isMuted: boolean;
  isSolo: boolean;
  recordArmed: boolean;
  vst3Chain: Vst3PluginSlot[];
  sideChainSendActive: boolean;
}

export interface RenderGraphStage {
  id: string;
  name: string;
  shaderType: 'Compute Shader' | 'Raster Tile' | 'Tensor Core FP16/FP32' | 'DMA Zero-Copy';
  executionTimeMs: number;
  vramAllocatedGb: number;
  status: 'active' | 'cached' | 'streaming';
}

export interface RenderTileCell {
  id: string;
  row: number;
  col: number;
  tileResolution: string;
  state: 'cached_ram' | 'vram_resident' | 'compute_active' | 'dirty_pending';
  renderTimeMs: number;
  gpuIndex: number;
}

export interface PerformanceFoundationConfig {
  multiThreadedEngine: boolean;
  workerThreadCount: number;
  simdOptimization: boolean;
  gpuMemoryStreaming: boolean;
  dynamicRamCacheGb: number;
  incrementalRendering: boolean;
  backgroundDecoding: boolean;
  hardwareEncodingDecoding: boolean;
  zeroCopyGpuPipeline: boolean;
  tileRenderingSize: 512 | 1024 | 2048;
  multiGpuCount: number;
  backgroundConformActive: boolean;
}

export interface RenderQueueJob {
  id: string;
  title: string;
  codec: ProCodec;
  resolutionLabel: string;
  fps: FrameRatePreset;
  colorSpace: ColorSpaceStandard;
  hdrStandard: HdrStandard;
  status: 'queued' | 'rendering' | 'completed';
  progressPct: number;
  assignedNodes: number;
  estimatedSizeGb: number;
}

export interface TimebaseBenchmarkRow {
  fps: FrameRatePreset;
  ticksPerFrame: bigint;
  exactDivision: boolean;
  driftAfter24HoursMicroseconds: number;
  sampleTimecodeAtFrame1000: string;
}

export interface CinemaProjectSpec {
  id: string;
  title: string;
  resolutionPreset: ResolutionPreset;
  width: number;
  height: number;
  frameRate: FrameRatePreset;
  colorDepth: ColorBitDepth;
  colorSpace: ColorSpaceStandard;
  hdrStandard: HdrStandard;
  audioSampleRate: AudioSampleRate;
  audioBitDepth: AudioBitDepth;
  audioLayout: AudioChannelLayout;
  codec: ProCodec;
  renderBackend: RenderEngineBackend;
  proxyQuality: ProxyQuality;
  enableMagneticTimeline: boolean;
  enableSimdAcceleration: boolean;
  enableZeroCopyGpu: boolean;
  renderFarmNodes: number;
}
