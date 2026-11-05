/**
 * Strict Agent-Ready Engine Contracts for MemeForge-AI-Sora-Video-Studio (v2.2.0)
 *
 * Isolates AI video generation payloads (Sora 2 Ultra, Veo 3.1, PyTorch DiT),
 * 3D Text-to-Animation character voiceover contracts, timeline frame-buffers,
 * and Undo/Redo + Web Audio soundboard synchronization states.
 * Coding agents only need to read this compact contract file to wire new features safely.
 */

export type StudioVideoModelId =
  | 'veo-3.1-generate-preview'
  | 'veo-3.1-fast-generate-preview'
  | 'veo-3.1-lite-generate-preview'
  | 'sora-2-ultra-32k'
  | 'pytorch-dit-t5-xxl-fp8';

export type StudioTtsVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

/** 1. Unified AI Video Generation & Job Polling Contract */
export interface AiVideoGenerationPayload {
  model: StudioVideoModelId;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '21:9';
  resolution: '720p' | '1080p' | '4k' | '8k' | '32k';
  durationSeconds: 4 | 6 | 8 | 10 | 15 | 60;
  fps: 24 | 30 | 60 | 120 | 1000;
  seed?: number;
  referenceAssetIds?: string[];
}

export interface AiVideoJobStatusResponse {
  jobId: string;
  operationName: string;
  done: boolean;
  progressPct: number;
  videoUri?: string;
  fallbackMode?: boolean;
  estimatedCostUsd?: number;
  error?: string;
}

/** 2. 3D Text-to-Animation & Character Voiceover Studio Contract */
export interface AnimationCharacterVoiceBinding {
  characterId: 'Character_A' | 'Character_B' | string;
  characterName: string;
  sourceType: 'ai-voice-library' | 'custom-upload' | 'gemini-tts';
  voicePresetId?: string;
  geminiVoiceName?: StudioTtsVoiceName;
  customAudioFileName?: string;
  customAudioMimeType?: 'audio/mpeg' | 'audio/wav';
  customAudioObjectUrl?: string;
  pitchSemitones: number;
  speakingRate: number;
}

export interface AnimationShotContract {
  shotId: string;
  sceneNumber: number;
  shotNumber: number;
  title: string;
  durationSec: number;
  environmentId: 'Environment_A' | 'Environment_B' | string;
  visualPrompt: string;
  cameraDirective: string;
  dialogueSpeakerId?: string;
  dialogueLine?: string;
  synthesizedAudioDataUri?: string;
}

/** 3. Timeline Frame-Buffer, Audio Visualizer & Soundboard Sync Contract */
export interface SoundboardCueTriggerContract {
  id: string;
  effectId: 'airhorn' | 'laugh' | 'sad-violin' | 'vine-boom' | 'record-scratch' | ' applause' | string;
  label: string;
  timestampSec: number;
  durationSec: number;
  volume: number;
}

export interface TimelineFrameBufferContract {
  currentFrame: number;
  totalFrames: number;
  fps: number;
  isPlaying: boolean;
  isAudioVisualizerActive: boolean;
  frequencyBinsUint8: number[];
  soundboardTriggers: SoundboardCueTriggerContract[];
}

/** 4. Deterministic Undo/Redo Version History Contract */
export interface StudioDesignSnapshotContract {
  topText: string;
  bottomText: string;
  fontSize: number;
  textColor: string;
  strokeColor: string;
  stylePresetId: string;
  transitionType: string;
  soundboardTriggerCount: number;
}

export interface VersionHistoryStateContract<T = StudioDesignSnapshotContract> {
  past: T[];
  present: T;
  future: T[];
  maxDepth: number;
  canUndo: boolean;
  canRedo: boolean;
}

/** 5. 2060/01/01 Architecture & Full-Stack Future-Proofing Contracts */
export type FutureProof2060ResolutionTier = '32K' | '64K' | '128K';

export interface FutureProof2060PillarContract {
  id: string;
  order: string;
  title: string;
  category:
    | 'temporal-128bit'
    | 'post-quantum-crypto'
    | 'photonic-quantum-dit'
    | 'volumetric-lightfield'
    | 'isomorphic-runtime'
    | 'orbital-edge-api';
  targetEpoch: '2060-01-01T00:00:00.000Z';
  standardSpec: string;
  summary: string;
  invariants: string[];
  readinessScore: number;
}

export interface Epoch2060TemporalComplianceReport {
  targetIso: string;
  unixSecondsStr: string;
  secondsPastY2038OverflowStr: string;
  is32BitOverflowImmune: boolean;
  ticksPerSecondStr: string;
  targetEpochTotalTicksStr: string;
  maxSupportedFps: number;
  maxSupportedHours: number;
  subFramePrecisionPicoseconds: number;
  compliant: boolean;
}

export interface PostQuantumHandshakeManifest {
  manifestId: string;
  issuedAtIso: string;
  validUntilIso: '2060-01-01T00:00:00.000Z';
  kemAlgorithm: 'ML-KEM-1024 (FIPS 203 / Kyber-1024) + X25519 Hybrid';
  signatureAlgorithm: 'ML-DSA-87 (FIPS 204 / Dilithium5) + SLH-DSA-SHA2-256s (FIPS 205)';
  symmetricCipher: 'AES-256-GCM-SIV (Quantum-Resistant 256-Bit Security)';
  c2paSpecVersion: 'C2PA v3.0 Post-Quantum Provenance';
  authorityEmail: string;
  authorityRoles: string[];
  publicKeyFingerprintHex: string;
  signaturePreviewHex: string;
}

export interface PhotonicQuantumClusterMetrics {
  resolutionTier: FutureProof2060ResolutionTier;
  widthPx: number;
  heightPx: number;
  fps: number;
  durationHours: number;
  totalFramesStr: string;
  rawLatentTokensPerFrame: number;
  opticalInterconnectBandwidthPbps: number;
  activePhotonicNodes: number;
  fp4QuantizedVramPerNodeGb: number;
  ringAttentionComplexity: 'O(N) Spatio-Temporal Ring-Attention (Zero N^2 Materialization)';
  estimatedRealtimeFactor: number;
}

export interface FullStack2060ReadinessAuditReport {
  auditVersion: '2060.01.01-v2.3.0';
  targetDateIso: '2060-01-01T00:00:00.000Z';
  overallReadinessScore: number;
  status: '2060-READY' | 'DEGRADED';
  authorityAccount: string;
  authorityContact: string;
  pillars: FutureProof2060PillarContract[];
  temporalCompliance: Epoch2060TemporalComplianceReport;
  pqcManifest: PostQuantumHandshakeManifest;
  defaultClusterMetrics: PhotonicQuantumClusterMetrics;
}

