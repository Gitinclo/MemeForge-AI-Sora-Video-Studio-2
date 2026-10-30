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
