export type LoraTrainingPhase =
  | 'validating_dataset'
  | 'extracting_latents'
  | 'training_lora'
  | 'compiling_safetensors'
  | 'completed'
  | 'paused'
  | 'failed';

export type GpuHardwareArchitecture = 'NVIDIA H100 SXM5 (80GB)' | 'NVIDIA B200 Blackwell (192GB)';

export interface GpuClusterNodeMetrics {
  nodeId: string;
  hostname: string;
  architecture: GpuHardwareArchitecture;
  utilizationPercent: number;
  vramUsedGb: number;
  vramTotalGb: number;
  nvlinkBandwidthGbps: number;
  powerDrawWatts: number;
  powerCapWatts: number;
  junctionTempCelsius: number;
  activeJobId: string | null;
}

export interface LoraLossPoint {
  step: number;
  loss: number;
  learningRate: number;
}

export interface LoraTrainingJob {
  id: string;
  modelName: string;
  triggerToken: string;
  brandClient: string;
  category: 'Luxury Fragrance & Glass' | 'Consumer Electronics' | 'Automotive & Mobility' | 'Apparel & Footwear' | 'Beverage & Packaging';
  phase: LoraTrainingPhase;
  currentStep: number;
  totalSteps: number;
  datasetImageCount: number;
  networkRankDim: 32 | 64 | 128;
  networkAlpha: 16 | 32 | 64;
  precision: 'BF16' | 'FP8-Dynamic';
  estimatedSecondsRemaining: number;
  currentLoss: number;
  lossHistory: LoraLossPoint[];
  assignedNodeIds: string[];
  startedAtIso: string;
  completedAtIso?: string;
  safetensorsSizeMb: number;
  sha256Checksum: string;
  previewImageUrl: string;
  datasetSampleUrls: string[];
  invariantTargets: {
    logoIntegrityTarget: number;
    geometrySilhouetteIouTarget: number;
    materialPurityTarget: number;
  };
}

export type SandboxLensPreset =
  | '35mm Prime Arri Alexa'
  | '85mm Anamorphic Panavision'
  | '50mm Macro Probe Lens'
  | 'FPV Dynamic Drone Orbit';

export type SandboxAspectRatio = '16:9' | '9:16' | '1:1' | '21:9';

export type SandboxInspectionOverlay = 'color' | 'logo_mask' | 'geometry_iou' | 'materials';

export interface SandboxPresetScenario {
  id: string;
  title: string;
  subtitle: string;
  focusArea: string;
  promptTemplate: string;
  recommendedLens: SandboxLensPreset;
  recommendedAspectRatio: SandboxAspectRatio;
  recommendedSteps: number;
  baselineScores: {
    logoIntegrity: number;
    geometrySilhouetteIou: number;
    materialPurity: number;
  };
  lightingSetup: string;
  referenceRenderSvg: string;
}

export interface SandboxEvaluationRun {
  id: string;
  jobId: string;
  modelName: string;
  triggerToken: string;
  presetId: string;
  resolvedPrompt: string;
  lens: SandboxLensPreset;
  aspectRatio: SandboxAspectRatio;
  inferenceSteps: number;
  cfgScale: number;
  seed: number;
  timestampIso: string;
  inferenceLatencyMs: number;
  scores: {
    logoIntegrity: number;
    geometrySilhouetteIou: number;
    materialPurity: number;
    overallConsistency: number;
  };
  passedEnterpriseThreshold: boolean;
}

export interface DatasetUploadImage {
  id: string;
  filename: string;
  angleLabel: string;
  lightingLabel: string;
  resolution: string;
  qualityScore: number;
  previewDataUri: string;
}
