import { LoraTrainingJob } from '../types/b2bEnterprise';
import { clampNumber, createPrefixedId, encodeSvgDataUri } from './sharedCoreEngine';

export type MlopsRbacRole =
  | 'mlops_admin'
  | 'principal_scientist'
  | 'ml_engineer'
  | 'security_auditor'
  | 'viewer';

export interface MlopsRolePermissions {
  role: MlopsRbacRole;
  label: string;
  description: string;
  canLaunchRuns: boolean;
  canExportCheckpoints: boolean;
  canConnectReposAndDatasets: boolean;
  canScaleCloudCompute: boolean;
  canManageRbacAndMfa: boolean;
  canExportAuditCompliance: boolean;
}

export interface HuggingFaceDatasetConfig {
  id: string;
  repoId: string;
  split: 'train' | 'validation' | 'test';
  streaming: boolean;
  sampleCount: number;
  sizeGb: number;
  modality: 'Image-Text Pairs' | '3D Spatial Latents' | 'Video Motion Trajectories';
  encryptionStatus: 'AES-256-GCM Verified' | 'TLS 1.3 Stream';
  lastSyncedIso: string;
  verifiedSha256: string;
}

export interface GitHubVersionCommit {
  commitHash: string;
  branch: string;
  author: string;
  message: string;
  timestampIso: string;
  changedFiles: string[];
  loraRank: number;
  learningRate: string;
  validationLoss: number;
}

export interface CloudStorageSnapshot {
  id: string;
  name: string;
  provider: 'AWS S3 (Encrypted)' | 'Google Cloud Storage' | 'Cloudflare R2 Zero-Egress' | 'Azure Blob Vault';
  bucketUri: string;
  jobId: string;
  step: number;
  sizeMb: number;
  encryptionAtRest: 'AES-256-GCM (KMS)';
  encryptionInTransit: 'TLS 1.3 (mTLS)';
  createdAtIso: string;
  sha256: string;
}

export interface CloudComputeProviderNode {
  id: string;
  provider: 'AWS EC2 P5e' | 'Google Cloud A3 Mega' | 'Azure NDv5 H100' | 'CoreWeave HGX B200';
  region: string;
  instanceType: string;
  gpuCount: number;
  vramPerGpuGb: number;
  utilizationPct: number;
  networkThroughputGbps: number;
  hourlyCostUsd: number;
  status: 'healthy' | 'bottleneck_detected' | 'scaling';
  bottleneckReason?: string;
}

export interface MlopsSystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'security' | 'info';
  category: 'System Failure' | 'Performance Bottleneck' | 'Suspicious Activity' | 'Checkpoint Export';
  title: string;
  detail: string;
  timestampIso: string;
  acknowledged: boolean;
  pushDispatched: boolean;
  remediationAction: string;
}

export interface MlopsAuditLogEntry {
  id: string;
  timestampIso: string;
  actor: string;
  role: MlopsRbacRole;
  authMethod: 'GitHub OAuth + MFA' | 'Hugging Face SSO + Passkey' | 'Google Workspace SAML' | 'Okta Enterprise MFA';
  action: string;
  resource: string;
  ipAddress: string;
  encryptionVerified: boolean;
  chainHash: string;
  status: 'ALLOWED' | 'BLOCKED_RBAC' | 'FLAGGED_SECURITY';
}

export type Sora2AnimationStyle =
  | '2.5D Anime Cel-Shaded'
  | '3D Volumetric Pixar-Grade'
  | 'Cyberpunk Motion Vector'
  | 'Stop-Motion Claymation'
  | 'Spatial Architectural Flythrough'
  | 'Fluid Particle Dynamics';

export interface Sora2AnimationSceneSpec {
  id: string;
  prompt: string;
  style: Sora2AnimationStyle;
  boundLoraJobId: string;
  boundTriggerToken: string;
  loraScale: number;
  fps: 24 | 60 | 120 | 1000;
  durationSeconds: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  cameraMotion: 'Orbital Dolly' | 'FPV Crane Sweep' | 'Parallax Pan' | 'Anamorphic Push-In';
  seed: number;
  keyframes: Array<{
    timePct: number;
    label: string;
    cameraYaw: number;
    lightingK: number;
    motionEnergy: number;
  }>;
}

export interface LoraRealtimeSampleImage {
  id: string;
  jobId: string;
  modelName: string;
  triggerToken: string;
  step: number;
  lossAtStep: number;
  prompt: string;
  cfgScale: number;
  loraWeight: number;
  generatedAtIso: string;
  imageDataUri: string;
}

export const MLOPS_RBAC_ROLES: Record<MlopsRbacRole, MlopsRolePermissions> = {
  mlops_admin: {
    role: 'mlops_admin',
    label: 'MLOps Platform Administrator',
    description: 'Full lifecycle authority across LoRA runs, cloud scaling, RBAC policies, MFA enforcement, and encrypted backups.',
    canLaunchRuns: true,
    canExportCheckpoints: true,
    canConnectReposAndDatasets: true,
    canScaleCloudCompute: true,
    canManageRbacAndMfa: true,
    canExportAuditCompliance: true,
  },
  principal_scientist: {
    role: 'principal_scientist',
    label: 'Principal Research Scientist',
    description: 'Can launch/tune LoRA runs, export safetensors checkpoints, connect Hugging Face & GitHub repos, and scale compute.',
    canLaunchRuns: true,
    canExportCheckpoints: true,
    canConnectReposAndDatasets: true,
    canScaleCloudCompute: true,
    canManageRbacAndMfa: false,
    canExportAuditCompliance: true,
  },
  ml_engineer: {
    role: 'ml_engineer',
    label: 'Machine Learning Engineer',
    description: 'Can run experiments, generate sample images, commit configs to GitHub, and export verified checkpoints.',
    canLaunchRuns: true,
    canExportCheckpoints: true,
    canConnectReposAndDatasets: true,
    canScaleCloudCompute: false,
    canManageRbacAndMfa: false,
    canExportAuditCompliance: false,
  },
  security_auditor: {
    role: 'security_auditor',
    label: 'Compliance & Security Auditor',
    description: 'Inspects immutable audit logs, MFA compliance, encryption telemetry, and suspicious activity alerts.',
    canLaunchRuns: false,
    canExportCheckpoints: false,
    canConnectReposAndDatasets: false,
    canScaleCloudCompute: false,
    canManageRbacAndMfa: true,
    canExportAuditCompliance: true,
  },
  viewer: {
    role: 'viewer',
    label: 'Read-Only Collaborator',
    description: 'Can monitor live loss curves, inspect sample renders, and preview Sora 2 animations without mutation rights.',
    canLaunchRuns: false,
    canExportCheckpoints: false,
    canConnectReposAndDatasets: false,
    canScaleCloudCompute: false,
    canManageRbacAndMfa: false,
    canExportAuditCompliance: false,
  },
};

export const INITIAL_HF_DATASETS: HuggingFaceDatasetConfig[] = [
  {
    id: 'hf-ds-01',
    repoId: 'loraflow/spatial-product-twins-10k',
    split: 'train',
    streaming: true,
    sampleCount: 10420,
    sizeGb: 48.6,
    modality: '3D Spatial Latents',
    encryptionStatus: 'AES-256-GCM Verified',
    lastSyncedIso: '2026-10-28T22:15:00Z',
    verifiedSha256: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
  },
  {
    id: 'hf-ds-02',
    repoId: 'openai-community/sora2-motion-trajectories-hd',
    split: 'train',
    streaming: true,
    sampleCount: 28500,
    sizeGb: 142.0,
    modality: 'Video Motion Trajectories',
    encryptionStatus: 'AES-256-GCM Verified',
    lastSyncedIso: '2026-10-28T23:05:00Z',
    verifiedSha256: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
  },
  {
    id: 'hf-ds-03',
    repoId: 'laion/anime-cel-cinematic-captions-2026',
    split: 'validation',
    streaming: true,
    sampleCount: 6200,
    sizeGb: 19.4,
    modality: 'Image-Text Pairs',
    encryptionStatus: 'TLS 1.3 Stream',
    lastSyncedIso: '2026-10-28T23:30:00Z',
    verifiedSha256: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
  },
];

export const INITIAL_GITHUB_COMMITS: GitHubVersionCommit[] = [
  {
    commitHash: 'a94f21c',
    branch: 'main',
    author: 'Elena Vance (Principal Scientist)',
    message: 'feat(dit-lora): fuse RMSNorm + SwiGLU Triton kernel & lock rank-64 alpha-32 schedule',
    timestampIso: '2026-10-28T21:40:00Z',
    changedFiles: ['pytorch_dit/dit.py', 'pytorch_dit/sampler.py', 'configs/aurum_v4.yaml'],
    loraRank: 64,
    learningRate: '1.0e-4',
    validationLoss: 0.0542,
  },
  {
    commitHash: '7b81e04',
    branch: 'feat/fp8-ring-attn',
    author: 'Marcus Chen (MLOps Lead)',
    message: 'perf(attention): enable FP8 E4M3 per-channel scaling for causal 3D VAE latents',
    timestampIso: '2026-10-28T22:52:00Z',
    changedFiles: ['pytorch_dit/attention.py', 'pytorch_dit/vae.py', 'tests/thresholds.py'],
    loraRank: 64,
    learningRate: '8.5e-5',
    validationLoss: 0.0618,
  },
  {
    commitHash: '3d19c8e',
    branch: 'exp/sora2-text-to-animation',
    author: 'Aria Patel (Staff ML Engineer)',
    message: 'feat(sora2): add text-to-animation temporal cross-attention adapter weights',
    timestampIso: '2026-10-28T23:38:00Z',
    changedFiles: ['pytorch_dit/pipeline.py', 'pytorch_dit/text.py'],
    loraRank: 128,
    learningRate: '6.0e-5',
    validationLoss: 0.0491,
  },
];

export const INITIAL_CLOUD_SNAPSHOTS: CloudStorageSnapshot[] = [
  {
    id: 'snap-01',
    name: 'aurum_flacon_v4_step1500_prod.safetensors',
    provider: 'AWS S3 (Encrypted)',
    bucketUri: 's3://loraflow-vault-prod/checkpoints/aurum_flacon_v4_step1500.safetensors',
    jobId: 'lora-job-aurum-01',
    step: 1500,
    sizeMb: 288.4,
    encryptionAtRest: 'AES-256-GCM (KMS)',
    encryptionInTransit: 'TLS 1.3 (mTLS)',
    createdAtIso: '2026-10-28T21:48:00Z',
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  },
  {
    id: 'snap-02',
    name: 'vanguard_chrono_x1_step1020_ckpt.safetensors',
    provider: 'Cloudflare R2 Zero-Egress',
    bucketUri: 'r2://loraflow-checkpoints/vanguard_chrono_x1/step_1020.safetensors',
    jobId: 'lora-job-chrono-02',
    step: 1020,
    sizeMb: 312.0,
    encryptionAtRest: 'AES-256-GCM (KMS)',
    encryptionInTransit: 'TLS 1.3 (mTLS)',
    createdAtIso: '2026-10-28T23:12:00Z',
    sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
  },
];

export const INITIAL_CLOUD_PROVIDERS: CloudComputeProviderNode[] = [
  {
    id: 'cloud-aws-p5e',
    provider: 'AWS EC2 P5e',
    region: 'us-west-2 (Oregon)',
    instanceType: 'p5e.48xlarge (8× H200)',
    gpuCount: 8,
    vramPerGpuGb: 141,
    utilizationPct: 92,
    networkThroughputGbps: 3200,
    hourlyCostUsd: 68.4,
    status: 'healthy',
  },
  {
    id: 'cloud-gcp-a3',
    provider: 'Google Cloud A3 Mega',
    region: 'us-central1 (Iowa)',
    instanceType: 'a3-megagpu-8g (8× H100)',
    gpuCount: 8,
    vramPerGpuGb: 80,
    utilizationPct: 96,
    networkThroughputGbps: 1600,
    hourlyCostUsd: 54.2,
    status: 'bottleneck_detected',
    bottleneckReason: 'DataLoader I/O queue stall on shard #14 (NVMe cache miss > 18ms)',
  },
  {
    id: 'cloud-cw-b200',
    provider: 'CoreWeave HGX B200',
    region: 'ord1 (Chicago)',
    instanceType: 'gd-8xb200-sxm6 (8× B200)',
    gpuCount: 8,
    vramPerGpuGb: 192,
    utilizationPct: 89,
    networkThroughputGbps: 3600,
    hourlyCostUsd: 82.0,
    status: 'healthy',
  },
  {
    id: 'cloud-azure-ndv5',
    provider: 'Azure NDv5 H100',
    region: 'westeurope (Amsterdam)',
    instanceType: 'Standard_ND96isr_H100_v5',
    gpuCount: 8,
    vramPerGpuGb: 80,
    utilizationPct: 78,
    networkThroughputGbps: 1600,
    hourlyCostUsd: 52.8,
    status: 'healthy',
  },
];

export const INITIAL_MLOPS_ALERTS: MlopsSystemAlert[] = [
  {
    id: 'alert-01',
    severity: 'warning',
    category: 'Performance Bottleneck',
    title: 'DataLoader Prefetch Bottleneck on GCP A3 Mega Node',
    detail: 'WebDataset shard #14 experienced an 18.4ms I/O stall during latent extraction. Enable NVMe RAM-disk prefetching to restore 99.4% GPU occupancy.',
    timestampIso: '2026-10-28T23:44:12Z',
    acknowledged: false,
    pushDispatched: true,
    remediationAction: 'Enable NVMe RAM-Disk Prefetch & Pin Memory',
  },
  {
    id: 'alert-02',
    severity: 'security',
    category: 'Suspicious Activity',
    title: 'Blocked Unauthenticated Checkpoint Export Attempt',
    detail: 'IP 185.220.101.42 attempted to pull vanguard_chrono_x1.safetensors without a valid WebAuthn MFA session token. Request blocked by RBAC policy.',
    timestampIso: '2026-10-28T23:51:04Z',
    acknowledged: false,
    pushDispatched: true,
    remediationAction: 'Rotate Ephemeral KMS Token & Quarantine IP',
  },
  {
    id: 'alert-03',
    severity: 'info',
    category: 'Checkpoint Export',
    title: 'Automated Checkpoint Backup Verified (AES-256-GCM)',
    detail: 'Maison Aurum No. 9 Flacon (Step 1500) replicated to s3://loraflow-vault-prod with zero bit-drift (SHA-256 verified).',
    timestampIso: '2026-10-28T23:54:30Z',
    acknowledged: true,
    pushDispatched: false,
    remediationAction: 'View Checksum Manifest',
  },
];

export const INITIAL_AUDIT_LOGS: MlopsAuditLogEntry[] = [
  {
    id: 'AUDIT-9941',
    timestampIso: '2026-10-28T23:54:30Z',
    actor: 'elena.vance@loraflow.ai',
    role: 'principal_scientist',
    authMethod: 'GitHub OAuth + MFA',
    action: 'EXPORT_SAFETENSORS_CHECKPOINT',
    resource: 's3://loraflow-vault-prod/checkpoints/aurum_flacon_v4_step1500.safetensors',
    ipAddress: '10.42.18.91',
    encryptionVerified: true,
    chainHash: 'sha256:9f86d081884c7d659a2feaa0c55ad015',
    status: 'ALLOWED',
  },
  {
    id: 'AUDIT-9940',
    timestampIso: '2026-10-28T23:51:04Z',
    actor: 'anonymous_token_77a',
    role: 'viewer',
    authMethod: 'Okta Enterprise MFA',
    action: 'DOWNLOAD_WEIGHTS_UNAUTHORIZED',
    resource: 'r2://loraflow-checkpoints/vanguard_chrono_x1/step_1020.safetensors',
    ipAddress: '185.220.101.42',
    encryptionVerified: true,
    chainHash: 'sha256:4b227777d4dd1fc61c6f884f48641d02',
    status: 'FLAGGED_SECURITY',
  },
  {
    id: 'AUDIT-9939',
    timestampIso: '2026-10-28T23:38:19Z',
    actor: 'aria.patel@loraflow.ai',
    role: 'ml_engineer',
    authMethod: 'Hugging Face SSO + Passkey',
    action: 'SYNC_HF_DATASET_SHARDS',
    resource: 'hf://openai-community/sora2-motion-trajectories-hd',
    ipAddress: '10.42.19.104',
    encryptionVerified: true,
    chainHash: 'sha256:2c26b46b68ffc68ff99b453c1d304134',
    status: 'ALLOWED',
  },
  {
    id: 'AUDIT-9938',
    timestampIso: '2026-10-28T23:20:05Z',
    actor: 'marcus.chen@loraflow.ai',
    role: 'mlops_admin',
    authMethod: 'Google Workspace SAML',
    action: 'UPDATE_RBAC_MFA_POLICY',
    resource: 'policy://enterprise-zero-trust-mfa-enforced',
    ipAddress: '10.42.12.04',
    encryptionVerified: true,
    chainHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb924',
    status: 'ALLOWED',
  },
];

export function generateRealtimeLoraSampleSvg(params: {
  modelName: string;
  triggerToken: string;
  step: number;
  totalSteps: number;
  loss: number;
  prompt: string;
  cfgScale: number;
  loraWeight: number;
}): string {
  const progress = clampNumber(params.step / Math.max(1, params.totalSteps), 0.05, 1);
  const sharpness = Math.round(progress * 100);
  const hue = (params.step * 7) % 360;
  const accent = progress >= 0.85 ? '#10b981' : progress >= 0.45 ? '#38bdf8' : '#f59e0b';
  const safePrompt = params.prompt.slice(0, 62).replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <linearGradient id="sampleBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="hsl(${hue}, 45%, 14%)" />
      </linearGradient>
      <radialGradient id="sampleAura" cx="50%" cy="44%" r="42%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="${(0.18 + progress * 0.25).toFixed(2)}" />
        <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="800" height="500" fill="url(#sampleBg)" />
    <circle cx="400" cy="220" r="210" fill="url(#sampleAura)" />
    <!-- Spatial Latent Grid Lines -->
    <g stroke="#1e293b" stroke-width="1" opacity="0.7">
      <line x1="100" y1="380" x2="700" y2="380" />
      <line x1="160" y1="420" x2="640" y2="420" />
      <line x1="400" y1="70" x2="400" y2="430" stroke-dasharray="4 4" />
    </g>
    <!-- Synthesized 3D Digital Twin Geometry -->
    <ellipse cx="400" cy="375" rx="170" ry="28" fill="#0f172a" stroke="${accent}" stroke-width="2" stroke-opacity="0.6" />
    <rect x="315" y="130" width="170" height="225" rx="24" fill="#111827" stroke="${accent}" stroke-width="${(1.5 + progress * 2).toFixed(1)}" />
    <rect x="355" y="90" width="90" height="42" rx="10" fill="#1e293b" stroke="${accent}" stroke-width="2" />
    <circle cx="400" cy="235" r="${Math.round(32 + progress * 26)}" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="${progress >= 0.9 ? 'none' : '6 4'}" />
    <!-- Telemetry Overlay -->
    <text x="400" y="232" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="700" text-anchor="middle" letter-spacing="1.5">${params.modelName.toUpperCase().slice(0, 22)}</text>
    <text x="400" y="256" fill="${accent}" font-family="monospace" font-size="12" font-weight="600" text-anchor="middle">[${params.triggerToken}] · LoRA ${params.loraWeight.toFixed(2)}x</text>
    <rect x="36" y="28" width="728" height="36" rx="8" fill="#020617" fill-opacity="0.82" stroke="#1e293b" />
    <text x="52" y="51" fill="#e2e8f0" font-family="monospace" font-size="12">STEP ${params.step}/${params.totalSteps} (${sharpness}% CONVERGED) · LOSS ${params.loss.toFixed(4)} · CFG ${params.cfgScale.toFixed(1)}</text>
    <rect x="36" y="442" width="728" height="34" rx="8" fill="#020617" fill-opacity="0.82" stroke="#1e293b" />
    <text x="52" y="464" fill="#94a3b8" font-family="sans-serif" font-size="12">Prompt: "${safePrompt}"</text>
  </svg>`;

  return encodeSvgDataUri(svg);
}

export function buildRealtimeSampleForJob(
  job: LoraTrainingJob,
  customPrompt?: string,
  cfgScale = 7.5,
  loraWeight = 1.0,
  overrideStep?: number
): LoraRealtimeSampleImage {
  const step = overrideStep !== undefined ? clampNumber(overrideStep, 1, job.totalSteps) : job.currentStep;
  const progress = step / Math.max(1, job.totalSteps);
  const lossAtStep = Number(Math.max(0.042, 0.42 * Math.exp(-2.65 * progress) + 0.048).toFixed(4));
  const prompt =
    customPrompt && customPrompt.trim().length > 0
      ? customPrompt.trim()
      : `Studio 8K volumetric keyframe of ${job.triggerToken} under cinematic rim lighting, crisp caustic reflections`;

  return {
    id: createPrefixedId('sample'),
    jobId: job.id,
    modelName: job.modelName,
    triggerToken: job.triggerToken,
    step,
    lossAtStep,
    prompt,
    cfgScale,
    loraWeight,
    generatedAtIso: new Date().toISOString(),
    imageDataUri: generateRealtimeLoraSampleSvg({
      modelName: job.modelName,
      triggerToken: job.triggerToken,
      step,
      totalSteps: job.totalSteps,
      loss: lossAtStep,
      prompt,
      cfgScale,
      loraWeight,
    }),
  };
}

export function buildCheckpointExportManifest(job: LoraTrainingJob, role: MlopsRbacRole) {
  const permissions = MLOPS_RBAC_ROLES[role];
  if (!permissions.canExportCheckpoints) {
    throw new Error(`RBAC Policy Denied: Role "${permissions.label}" cannot export safetensors weights.`);
  }

  return {
    schemaVersion: 'loraflow-safetensors-v2.4',
    exportedAtIso: new Date().toISOString(),
    exportedByRole: role,
    model: {
      jobId: job.id,
      modelName: job.modelName,
      triggerToken: job.triggerToken,
      brandClient: job.brandClient,
      category: job.category,
      currentStep: job.currentStep,
      totalSteps: job.totalSteps,
      finalLoss: job.currentLoss,
      networkRankDim: job.networkRankDim,
      networkAlpha: job.networkAlpha,
      precision: job.precision,
      safetensorsSizeMb: job.safetensorsSizeMb,
      sha256Checksum: job.sha256Checksum,
    },
    ditArchitecture: {
      backbone: 'PyTorch Causal 3D VAE + Spacetime DiT (AGENTS.md Spec)',
      textEncoder: 'google/t5-v1_1-xxl (4096-dim)',
      attentionMode: 'Alternating Spatial + Temporal FlashAttention-3',
      quantization: job.precision === 'FP8-Dynamic' ? 'FP8 E4M3 Per-Channel' : 'BF16 Dense',
    },
    security: {
      encryptionAtRest: 'AES-256-GCM',
      encryptionInTransit: 'TLS 1.3',
      soc2IsolatedWeights: true,
    },
  };
}

export function createSora2AnimationScene(params: {
  prompt: string;
  style: Sora2AnimationStyle;
  job: LoraTrainingJob;
  loraScale?: number;
  fps?: 24 | 60 | 120 | 1000;
  durationSeconds?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  cameraMotion?: 'Orbital Dolly' | 'FPV Crane Sweep' | 'Parallax Pan' | 'Anamorphic Push-In';
}): Sora2AnimationSceneSpec {
  const cleanPrompt = params.prompt.trim() || `Cinematic animated sequence featuring ${params.job.triggerToken}`;
  const ensuredTokenPrompt = cleanPrompt.includes(params.job.triggerToken)
    ? cleanPrompt
    : `${cleanPrompt} (anchored with LoRA token ${params.job.triggerToken})`;

  return {
    id: createPrefixedId('sora2-anim'),
    prompt: ensuredTokenPrompt,
    style: params.style,
    boundLoraJobId: params.job.id,
    boundTriggerToken: params.job.triggerToken,
    loraScale: clampNumber(params.loraScale ?? 0.95, 0.1, 1.5),
    fps: params.fps ?? 60,
    durationSeconds: clampNumber(params.durationSeconds ?? 8, 2, 60),
    aspectRatio: params.aspectRatio ?? '16:9',
    cameraMotion: params.cameraMotion ?? 'Orbital Dolly',
    seed: 20261028,
    keyframes: [
      { timePct: 0, label: '01. Establishing Keyframe & Latent Seed', cameraYaw: -18, lightingK: 5200, motionEnergy: 0.35 },
      { timePct: 33, label: '02. Kinetic Subject Acceleration', cameraYaw: -4, lightingK: 5600, motionEnergy: 0.78 },
      { timePct: 66, label: '03. Hero Specular Apex & Camera Orbit', cameraYaw: 14, lightingK: 6100, motionEnergy: 0.94 },
      { timePct: 100, label: '04. Temporal Loop Resolution Lock', cameraYaw: 24, lightingK: 5400, motionEnergy: 0.42 },
    ],
  };
}
