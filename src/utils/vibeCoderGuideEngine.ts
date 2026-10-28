/**
 * Vibe Coder's Sora-Style Video App Architecture & Deployment Engine
 * Implements the industry-standard guide for running Sora-style AI video apps:
 * - Start Small: Hosted Video APIs (Runway, Luma, Google Veo) vs. Single-GPU Open-Source (Wan, CogVideoX)
 * - Hourly GPU Rental: RunPod, Lambda, AWS, Google Cloud, Azure with single Docker container (no K8s/Slurm)
 * - Lean OS Selection: Standard Ubuntu CUDA image (no desktop bloat, Bottlerocket, or enterprise DGX OS)
 * - Networking & Storage: No InfiniBand/RDMA needed for single-GPU inference; store MP4s on S3 or Cloudflare R2 + CDN
 * - GPU Memory (VRAM) Watchdog: 24 GB vs 40–80 GB cards, quantization, and CPU model offloading
 * - FastAPI /generate (5-minute timeout + S3/R2 upload) & /health + per-job GPU VRAM logging
 */

import { clampNumber, createPrefixedId } from './sharedCoreEngine';

export type VibeDeploymentApproach = 'hosted_api' | 'single_gpu_open_source';

export type HostedVideoApiProviderId = 'google_veo' | 'runway' | 'luma';

export type OpenSourceVideoModelId =
  | 'wan-2.1-t2v-1.3b'
  | 'cogvideox-2b'
  | 'cogvideox-5b-int8'
  | 'cogvideox-5b-bf16'
  | 'wan-2.1-t2v-14b-fp8'
  | 'wan-2.1-t2v-14b-bf16';

export type CloudGpuProviderId = 'runpod' | 'lambda' | 'aws' | 'gcp' | 'azure';

export type ObjectStorageProviderId = 'aws_s3' | 'cloudflare_r2';

export interface HostedVideoApiOption {
  id: HostedVideoApiProviderId;
  name: string;
  provider: string;
  costPerClipUsd: number;
  avgLatencySec: number;
  maxResolution: string;
  bestFor: string;
}

export interface OpenSourceVideoModelCard {
  id: OpenSourceVideoModelId;
  name: string;
  hfRepoId: string;
  parametersBillions: number;
  precision: 'BF16' | 'FP8' | 'INT8';
  minVramGbNative: number;
  minVramGbWithOffload: number;
  recommendedGpuTier: '24 GB' | '40 GB' | '48 GB' | '80 GB';
  avgGenerationSecPerClip: number;
  summary: string;
}

export interface RentedGpuInstanceSpec {
  id: string;
  providerId: CloudGpuProviderId;
  providerName: string;
  gpuName: string;
  vramGb: number;
  hourlyRateUsd: number;
  osImage: string;
  networkingNote: string;
}

export interface VramCompatibilityEvaluation {
  model: OpenSourceVideoModelCard;
  gpuVramGb: number;
  enableCpuOffload: boolean;
  fitsInVram: boolean;
  effectiveVramRequiredGb: number;
  headroomGb: number;
  status: 'optimal' | 'fits_with_offload' | 'oom_risk';
  recommendation: string;
  suggestedAlternativeModelId?: OpenSourceVideoModelId;
}

export interface StorageCostEstimate {
  provider: ObjectStorageProviderId;
  providerLabel: string;
  clipsPerMonth: number;
  avgClipSizeMb: number;
  totalStorageGb: number;
  estimatedBandwidthGb: number;
  monthlyStorageUsd: number;
  monthlyEgressUsd: number;
  monthlyTotalUsd: number;
  gpuDiskComparisonUsd: number;
  monthlySavingsUsd: number;
  cdnDomainExample: string;
}

export interface VibeDockerStackConfig {
  modelId: OpenSourceVideoModelId;
  storageProvider: ObjectStorageProviderId;
  bucketName: string;
  cdnBaseUrl: string;
  timeoutSeconds: number;
  enableCpuOffload: boolean;
  includeHealthAndVramLogs: boolean;
}

export interface VibeJobVramLog {
  jobId: string;
  timestampIso: string;
  prompt: string;
  modelId: OpenSourceVideoModelId;
  gpuName: string;
  totalVramMb: number;
  allocatedVramMb: number;
  reservedVramMb: number;
  peakVramMb: number;
  cpuOffloadActive: boolean;
  durationSec: number;
  timeoutLimitSec: number;
  storageProvider: ObjectStorageProviderId;
  mp4Url: string;
  s3ObjectKey: string;
  status: 'completed' | 'timed_out';
}

export interface VibeGuideSection {
  id: string;
  stepNumber: string;
  title: string;
  takeaway: string;
  description: string;
  doThis: string;
  skipThis: string;
}

export const VIBE_CODER_GUIDE_SECTIONS: VibeGuideSection[] = [
  {
    id: 'start-small',
    stepNumber: '01',
    title: 'Start Small: Hosted API vs. Single-GPU Open Source',
    takeaway: 'Skip massive training clusters. Pay per clip via API or run Wan / CogVideoX on one rented GPU.',
    description:
      'Large models like Sora are trained on huge GPU clusters, but a side project does not need that. Most vibe-coded video apps either call a hosted video API (Runway, Luma, or Google Veo) and pay per clip, or run an open-source model like Wan or CogVideoX on a single rented GPU.',
    doThis: 'Use Google Veo / Runway / Luma APIs for zero ops, or run Wan 2.1 / CogVideoX on 1 rented GPU.',
    skipThis: 'Building multi-node training infrastructure before validating your app idea.',
  },
  {
    id: 'rent-gpus-hourly',
    stepNumber: '02',
    title: 'Rent GPUs by the Hour & Package in Docker',
    takeaway: 'For one or a few GPUs, a single Docker container on RunPod or Lambda is enough.',
    description:
      'Rent hourly GPUs from RunPod or Lambda, or from GPU instances on AWS, Google Cloud, or Azure. Package the app in Docker so it runs identically on your laptop and on the rented machine. Kubernetes and Slurm are for teams managing dozens of machines.',
    doThis: 'Single Dockerfile + `docker run --gpus all` on an hourly GPU instance.',
    skipThis: 'Kubernetes clusters, Slurm job schedulers, or long-term hardware contracts.',
  },
  {
    id: 'networking',
    stepNumber: '03',
    title: 'Networking Is Usually Not Your Concern',
    takeaway: 'A single-GPU inference app generating videos does not need InfiniBand or RDMA.',
    description:
      'High-speed interconnects like InfiniBand and RDMA only matter when many GPUs exchange gradients constantly across machines during distributed training. Single-GPU video generation only needs standard cloud networking to receive prompts and upload finished MP4 clips.',
    doThis: 'Standard PCIe GPU instance with normal HTTPS egress to object storage.',
    skipThis: 'Paying a premium for InfiniBand / RoCEv2 / RDMA multi-node fabrics.',
  },
  {
    id: 'external-storage',
    stepNumber: '04',
    title: 'Store Video Outside the GPU Machine',
    takeaway: 'Save clips to Amazon S3 or Cloudflare R2 and serve them through a CDN.',
    description:
      'Generated videos are large, and rented GPU disks are temporary and expensive. Upload every generated MP4 directly to object storage (Amazon S3 or Cloudflare R2) and deliver links through a CDN for fast global playback.',
    doThis: 'Stream finished MP4s to S3 or Cloudflare R2 and delete local `/tmp` files immediately.',
    skipThis: 'Storing user video libraries on ephemeral NVMe/block storage attached to rented GPUs.',
  },
  {
    id: 'watch-gpu-memory',
    stepNumber: '05',
    title: 'Watch Your GPU Memory (VRAM)',
    takeaway: 'Check the model card first: 24 GB for smaller/quantized models, 40–80 GB for larger models.',
    description:
      'Video models hold billions of parameters in VRAM. Smaller or quantized versions fit on 24 GB cards, while larger models require 40 to 80 GB+. If your GPU is too small, switch to a smaller model or enable CPU model offloading before paying for a bigger GPU.',
    doThis: 'Enable `pipe.enable_model_cpu_offload()` or use INT8/FP8 quantized weights on 24 GB GPUs.',
    skipThis: 'Blindly renting 8x H100 nodes when a single 24 GB or 40 GB card with offloading suffices.',
  },
  {
    id: 'lean-os',
    stepNumber: '06',
    title: 'Pick a Lean Operating System',
    takeaway: 'Choose a standard Ubuntu GPU image with NVIDIA drivers and CUDA preinstalled.',
    description:
      'Most cloud providers offer a standard Ubuntu GPU image with NVIDIA drivers and CUDA ready to go. Skip desktop environments and unnecessary background services. Container-only OSes like Bottlerocket exist, and NVIDIA DGX OS is built for enterprise DGX hardware—plain Ubuntu with Docker is much easier to debug.',
    doThis: 'Ubuntu 22.04 / 24.04 LTS Server with preinstalled NVIDIA driver + CUDA 12.x + Docker.',
    skipThis: 'Desktop GUI environments, Bottlerocket OS complexity, or enterprise NVIDIA DGX OS.',
  },
];

export const HOSTED_VIDEO_API_OPTIONS: HostedVideoApiOption[] = [
  {
    id: 'google_veo',
    name: 'Google Veo 3.1 API',
    provider: 'Google Cloud / Vertex AI',
    costPerClipUsd: 0.35,
    avgLatencySec: 28,
    maxResolution: '4K Ultra (3840×2160)',
    bestFor: 'Photorealistic cinematography, prompt adherence, and zero infrastructure maintenance.',
  },
  {
    id: 'runway',
    name: 'Runway Gen-4.5 API',
    provider: 'RunwayML',
    costPerClipUsd: 0.50,
    avgLatencySec: 32,
    maxResolution: '4K (3840×2160)',
    bestFor: 'Artistic motion brush control, commercial storyboards, and camera path control.',
  },
  {
    id: 'luma',
    name: 'Luma Dream Machine Ray 3',
    provider: 'Luma AI',
    costPerClipUsd: 0.30,
    avgLatencySec: 22,
    maxResolution: '1080p / 4K Upscaled',
    bestFor: 'Fast keyframe-to-keyframe transitions and rapid vibe-coded prototyping.',
  },
];

export const OPEN_SOURCE_VIDEO_MODELS: OpenSourceVideoModelCard[] = [
  {
    id: 'wan-2.1-t2v-1.3b',
    name: 'Wan 2.1 T2V (1.3B)',
    hfRepoId: 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers',
    parametersBillions: 1.3,
    precision: 'BF16',
    minVramGbNative: 14,
    minVramGbWithOffload: 9,
    recommendedGpuTier: '24 GB',
    avgGenerationSecPerClip: 42,
    summary: 'Compact, fast open-source DiT model that runs comfortably on a single 24 GB GPU.',
  },
  {
    id: 'cogvideox-2b',
    name: 'CogVideoX-2B',
    hfRepoId: 'THUDM/CogVideoX-2b',
    parametersBillions: 2.0,
    precision: 'BF16',
    minVramGbNative: 18,
    minVramGbWithOffload: 11,
    recommendedGpuTier: '24 GB',
    avgGenerationSecPerClip: 55,
    summary: 'Entry-level CogVideoX model ideal for 24 GB consumer/cloud cards (RTX 4090 / L4).',
  },
  {
    id: 'cogvideox-5b-int8',
    name: 'CogVideoX-5B (INT8 Quantized)',
    hfRepoId: 'THUDM/CogVideoX-5b',
    parametersBillions: 5.0,
    precision: 'INT8',
    minVramGbNative: 21,
    minVramGbWithOffload: 14,
    recommendedGpuTier: '24 GB',
    avgGenerationSecPerClip: 75,
    summary: 'Quantized 5B model delivering high motion quality while fitting inside a 24 GB VRAM ceiling.',
  },
  {
    id: 'cogvideox-5b-bf16',
    name: 'CogVideoX-5B (Full BF16)',
    hfRepoId: 'THUDM/CogVideoX-5b',
    parametersBillions: 5.0,
    precision: 'BF16',
    minVramGbNative: 34,
    minVramGbWithOffload: 20,
    recommendedGpuTier: '40 GB',
    avgGenerationSecPerClip: 68,
    summary: 'Unquantized 5B model; needs a 40 GB card natively or CPU offloading to fit on 24 GB.',
  },
  {
    id: 'wan-2.1-t2v-14b-fp8',
    name: 'Wan 2.1 T2V (14B FP8 Quantized)',
    hfRepoId: 'Wan-AI/Wan2.1-T2V-14B-Diffusers',
    parametersBillions: 14.0,
    precision: 'FP8',
    minVramGbNative: 38,
    minVramGbWithOffload: 23,
    recommendedGpuTier: '48 GB',
    avgGenerationSecPerClip: 110,
    summary: 'Flagship 14B open-source model quantized to FP8 for 40–48 GB GPUs (A100 40GB / L40S).',
  },
  {
    id: 'wan-2.1-t2v-14b-bf16',
    name: 'Wan 2.1 T2V (14B Full BF16)',
    hfRepoId: 'Wan-AI/Wan2.1-T2V-14B-Diffusers',
    parametersBillions: 14.0,
    precision: 'BF16',
    minVramGbNative: 64,
    minVramGbWithOffload: 38,
    recommendedGpuTier: '80 GB',
    avgGenerationSecPerClip: 95,
    summary: 'Full-precision 14B cinema model requiring an 80 GB A100/H100 (or 40 GB with CPU offload).',
  },
];

export const RENTED_GPU_INSTANCES: RentedGpuInstanceSpec[] = [
  {
    id: 'runpod-rtx4090-24gb',
    providerId: 'runpod',
    providerName: 'RunPod',
    gpuName: 'NVIDIA RTX 4090 (1x GPU)',
    vramGb: 24,
    hourlyRateUsd: 0.69,
    osImage: 'Ubuntu 22.04 LTS + CUDA 12.4 (Lean Container Image)',
    networkingNote: 'Standard PCIe Gen4 (No InfiniBand/RDMA needed)',
  },
  {
    id: 'lambda-a10-24gb',
    providerId: 'lambda',
    providerName: 'Lambda Cloud',
    gpuName: 'NVIDIA A10 (1x GPU)',
    vramGb: 24,
    hourlyRateUsd: 0.75,
    osImage: 'Ubuntu 22.04 LTS + Lambda Stack CUDA 12.4',
    networkingNote: 'Standard Cloud Ethernet (Single-GPU Inference)',
  },
  {
    id: 'runpod-l40s-48gb',
    providerId: 'runpod',
    providerName: 'RunPod',
    gpuName: 'NVIDIA L40S (1x GPU)',
    vramGb: 48,
    hourlyRateUsd: 1.14,
    osImage: 'Ubuntu 22.04 LTS + CUDA 12.4',
    networkingNote: 'Standard PCIe Gen4 (Single Container)',
  },
  {
    id: 'gcp-a100-40gb',
    providerId: 'gcp',
    providerName: 'Google Cloud (a2-highgpu-1g)',
    gpuName: 'NVIDIA A100 (1x 40GB)',
    vramGb: 40,
    hourlyRateUsd: 1.65,
    osImage: 'Deep Learning VM Ubuntu 22.04 + CUDA 12.4',
    networkingNote: 'Standard VPC Networking',
  },
  {
    id: 'aws-g5-24gb',
    providerId: 'aws',
    providerName: 'AWS EC2 (g5.xlarge)',
    gpuName: 'NVIDIA A10G (1x 24GB)',
    vramGb: 24,
    hourlyRateUsd: 1.01,
    osImage: 'AWS Deep Learning Base Ubuntu 22.04 AMI',
    networkingNote: 'Standard ENA (Skip EFA/RDMA for 1 GPU)',
  },
  {
    id: 'lambda-a100-80gb',
    providerId: 'lambda',
    providerName: 'Lambda Cloud',
    gpuName: 'NVIDIA A100 SXM (1x 80GB)',
    vramGb: 80,
    hourlyRateUsd: 1.89,
    osImage: 'Ubuntu 22.04 LTS + CUDA 12.4',
    networkingNote: 'Single-node container deployment',
  },
  {
    id: 'azure-nc-a100-80gb',
    providerId: 'azure',
    providerName: 'Azure (Standard_NC24ads_A100_v4)',
    gpuName: 'NVIDIA A100 PCIe (1x 80GB)',
    vramGb: 80,
    hourlyRateUsd: 2.20,
    osImage: 'Ubuntu Server 22.04 LTS + NVIDIA GPU Driver Extension',
    networkingNote: 'Standard Azure VNet',
  },
];

export const VIBE_PROMPTS_TO_TRY = {
  initialPrompt: `Create a Dockerfile based on an NVIDIA CUDA Ubuntu image. Install Python 3.11, PyTorch with CUDA, and an open-source text-to-video model. Expose a FastAPI endpoint at /generate that accepts a text prompt, returns an MP4, and times out after 5 minutes. Upload each result to S3 and return a link.`,
  followUpPrompt: `Add a health check endpoint and log GPU memory use for each job.`,
};

/**
 * Evaluates whether a chosen open-source video model fits in the selected GPU's VRAM,
 * and prescribes either model offloading (`enable_model_cpu_offload()`) or a smaller/quantized model
 * before upgrading to more expensive hardware.
 */
export function evaluateVramCompatibility(
  modelId: OpenSourceVideoModelId,
  gpuVramGb: number,
  enableCpuOffload: boolean
): VramCompatibilityEvaluation {
  const model =
    OPEN_SOURCE_VIDEO_MODELS.find((m) => m.id === modelId) || OPEN_SOURCE_VIDEO_MODELS[0];
  const safeVram = clampNumber(gpuVramGb, 8, 192);

  const effectiveVramRequiredGb = enableCpuOffload
    ? model.minVramGbWithOffload
    : model.minVramGbNative;

  const fitsInVram = safeVram >= effectiveVramRequiredGb;
  const headroomGb = Number((safeVram - effectiveVramRequiredGb).toFixed(1));

  if (safeVram >= model.minVramGbNative) {
    return {
      model,
      gpuVramGb: safeVram,
      enableCpuOffload,
      fitsInVram: true,
      effectiveVramRequiredGb,
      headroomGb,
      status: 'optimal',
      recommendation: `${model.name} fits natively in ${safeVram} GB VRAM (${headroomGb} GB headroom). Ready for full-speed single-container inference.`,
    };
  }

  if (safeVram >= model.minVramGbWithOffload) {
    if (enableCpuOffload) {
      return {
        model,
        gpuVramGb: safeVram,
        enableCpuOffload: true,
        fitsInVram: true,
        effectiveVramRequiredGb,
        headroomGb,
        status: 'fits_with_offload',
        recommendation: `Model offloading enabled! ${model.name} requires ${model.minVramGbNative} GB natively, but fits inside ${safeVram} GB (${headroomGb} GB headroom) via pipe.enable_model_cpu_offload().`,
      };
    }

    return {
      model,
      gpuVramGb: safeVram,
      enableCpuOffload: false,
      fitsInVram: false,
      effectiveVramRequiredGb,
      headroomGb,
      status: 'oom_risk',
      recommendation: `CUDA Out-of-Memory risk: ${model.name} needs ${model.minVramGbNative} GB natively on a ${safeVram} GB GPU. Enable CPU Model Offloading (drops requirement to ${model.minVramGbWithOffload} GB) or switch to Wan 2.1 1.3B / quantized CogVideoX-5B INT8 before upgrading hardware.`,
      suggestedAlternativeModelId: 'cogvideox-5b-int8',
    };
  }

  return {
    model,
    gpuVramGb: safeVram,
    enableCpuOffload,
    fitsInVram: false,
    effectiveVramRequiredGb,
    headroomGb,
    status: 'oom_risk',
    recommendation: `GPU too small (${safeVram} GB) for ${model.name} even with offloading (${model.minVramGbWithOffload} GB required). Switch to Wan 2.1 1.3B (14 GB native / 9 GB offload) or rent a 40–80 GB GPU.`,
    suggestedAlternativeModelId: 'wan-2.1-t2v-1.3b',
  };
}

/**
 * Calculates external object storage + CDN costs (Amazon S3 vs. Cloudflare R2)
 * compared against storing generated MP4 clips on expensive ephemeral GPU block disks.
 */
export function calculateExternalStorageCost(
  provider: ObjectStorageProviderId,
  clipsPerMonth: number,
  avgClipSizeMb = 25,
  viewsPerClip = 10
): StorageCostEstimate {
  const safeClips = clampNumber(clipsPerMonth, 10, 1_000_000);
  const safeClipMb = clampNumber(avgClipSizeMb, 1, 2000);
  const safeViews = clampNumber(viewsPerClip, 1, 10000);

  const totalStorageGb = Number(((safeClips * safeClipMb) / 1024).toFixed(2));
  const estimatedBandwidthGb = Number((totalStorageGb * safeViews).toFixed(2));

  // AWS S3 ($0.023/GB storage + ~$0.085/GB CloudFront CDN egress after free tier)
  // Cloudflare R2 ($0.015/GB storage + $0.00/GB egress via Cloudflare CDN)
  const storageRatePerGb = provider === 'cloudflare_r2' ? 0.015 : 0.023;
  const egressRatePerGb = provider === 'cloudflare_r2' ? 0.0 : 0.05;

  const monthlyStorageUsd = Number((totalStorageGb * storageRatePerGb).toFixed(2));
  const monthlyEgressUsd = Number((estimatedBandwidthGb * egressRatePerGb).toFixed(2));
  const monthlyTotalUsd = Number((monthlyStorageUsd + monthlyEgressUsd).toFixed(2));

  // Rented GPU persistent NVMe volume typically costs ~$0.15–$0.20/GB/month + instance idle charges
  const gpuDiskComparisonUsd = Number(Math.max(15, totalStorageGb * 0.2 + 12).toFixed(2));
  const monthlySavingsUsd = Number(Math.max(0, gpuDiskComparisonUsd - monthlyTotalUsd).toFixed(2));

  return {
    provider,
    providerLabel:
      provider === 'cloudflare_r2'
        ? 'Cloudflare R2 + Cloudflare CDN (Zero Egress)'
        : 'Amazon S3 + CloudFront CDN',
    clipsPerMonth: safeClips,
    avgClipSizeMb: safeClipMb,
    totalStorageGb,
    estimatedBandwidthGb,
    monthlyStorageUsd,
    monthlyEgressUsd,
    monthlyTotalUsd,
    gpuDiskComparisonUsd,
    monthlySavingsUsd,
    cdnDomainExample:
      provider === 'cloudflare_r2'
        ? 'https://cdn.vibe-video.r2.dev/clips'
        : 'https://d111111abcdef8.cloudfront.net/clips',
  };
}

/**
 * Generates the exact Dockerfile based on a lean NVIDIA CUDA Ubuntu image
 * with Python 3.11, PyTorch with CUDA, Diffusers, FastAPI, and S3/R2 boto3 uploader.
 */
export function generateVibeCoderDockerfile(config: VibeDockerStackConfig): string {
  const model =
    OPEN_SOURCE_VIDEO_MODELS.find((m) => m.id === config.modelId) || OPEN_SOURCE_VIDEO_MODELS[0];

  return `# ============================================================================
# Vibe Coder's Single-GPU Sora-Style Video App Dockerfile
# Base: Lean NVIDIA CUDA 12.4 Ubuntu 22.04 Server Image (No Desktop GUI bloat)
# Model: ${model.name} (${model.hfRepoId})
# ============================================================================
FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \\
    PYTHONUNBUFFERED=1 \\
    PYTHONDONTWRITEBYTECODE=1 \\
    HF_HOME=/workspace/hf_cache \\
    MODEL_REPO_ID="${model.hfRepoId}" \\
    ENABLE_CPU_OFFLOAD="${config.enableCpuOffload ? 'true' : 'false'}" \\
    GENERATE_TIMEOUT_SECONDS="${config.timeoutSeconds}" \\
    S3_BUCKET_NAME="${config.bucketName}" \\
    CDN_BASE_URL="${config.cdnBaseUrl}"

# 1. Install Python 3.11, ffmpeg (for MP4 encoding), and lean system tools
RUN apt-get update && apt-get install -y --no-install-recommends \\
    software-properties-common \\
    curl \\
    git \\
    ffmpeg \\
    && add-apt-repository ppa:deadsnakes/ppa -y \\
    && apt-get update && apt-get install -y --no-install-recommends \\
    python3.11 \\
    python3.11-venv \\
    python3.11-dev \\
    python3-pip \\
    && ln -sf /usr/bin/python3.11 /usr/bin/python \\
    && ln -sf /usr/bin/python3.11 /usr/bin/python3 \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Install PyTorch with CUDA 12.4, HuggingFace Diffusers, FastAPI, and Boto3 (S3/R2)
RUN python -m pip install --upgrade pip && \\
    pip install --no-cache-dir \\
      torch torchvision --index-url https://download.pytorch.org/whl/cu124 && \\
    pip install --no-cache-dir \\
      fastapi==0.115.0 \\
      uvicorn[standard]==0.31.0 \\
      diffusers>=0.32.0 \\
      transformers>=4.46.0 \\
      accelerate>=1.1.0 \\
      imageio[ffmpeg] \\
      boto3 \\
      pydantic

COPY app.py /app/app.py

EXPOSE 8000

${
  config.includeHealthAndVramLogs
    ? `# Container Healthcheck polling FastAPI /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \\
  CMD curl -f http://localhost:8000/health || exit 1
`
    : ''
}CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]`;
}

/**
 * Generates the FastAPI server (`app.py`) exposing:
 * - POST `/generate` (accepts text prompt, 5-minute timeout, exports MP4, uploads to S3/R2, returns CDN link)
 * - GET `/health` and per-job GPU VRAM logging (`torch.cuda.max_memory_allocated()`)
 */
export function generateVibeCoderFastApiCode(config: VibeDockerStackConfig): string {
  const model =
    OPEN_SOURCE_VIDEO_MODELS.find((m) => m.id === config.modelId) || OPEN_SOURCE_VIDEO_MODELS[0];
  const isR2 = config.storageProvider === 'cloudflare_r2';

  return `"""
FastAPI Single-GPU Video Generation Server
- Model: ${model.name} (${model.hfRepoId})
- Endpoint: POST /generate (5-minute timeout, MP4 export, ${isR2 ? 'Cloudflare R2' : 'Amazon S3'} upload)
${config.includeHealthAndVramLogs ? '- Follow-up: GET /health endpoint + per-job GPU VRAM memory logging' : ''}
"""
import asyncio
import logging
import os
import tempfile
import time
import uuid
import boto3
import torch
from diffusers import AutoPipelineForText2Video
from diffusers.utils import export_to_video
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("vibe-video-worker")

MODEL_REPO_ID = os.getenv("MODEL_REPO_ID", "${model.hfRepoId}")
ENABLE_CPU_OFFLOAD = os.getenv("ENABLE_CPU_OFFLOAD", "${config.enableCpuOffload ? 'true' : 'false'}").lower() == "true"
GENERATE_TIMEOUT_SECONDS = int(os.getenv("GENERATE_TIMEOUT_SECONDS", "${config.timeoutSeconds}"))
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "${config.bucketName}")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", ${isR2 ? '"https://<ACCOUNT_ID>.r2.cloudflarestorage.com"' : 'None'})
CDN_BASE_URL = os.getenv("CDN_BASE_URL", "${config.cdnBaseUrl}").rstrip("/")

app = FastAPI(title="Vibe Coder Single-GPU Video Service", version="1.0.0")

# Initialize S3 / Cloudflare R2 client (stores large MP4s outside the rented GPU disk)
s3_client = boto3.client("s3", endpoint_url=S3_ENDPOINT_URL)

logger.info("Loading video model %s (CPU Offload=%s)...", MODEL_REPO_ID, ENABLE_CPU_OFFLOAD)
pipe = AutoPipelineForText2Video.from_pretrained(
    MODEL_REPO_ID,
    torch_dtype=torch.bfloat16,
)
if ENABLE_CPU_OFFLOAD:
    # Fits larger models onto 24 GB GPUs by streaming submodules between RAM and VRAM
    pipe.enable_model_cpu_offload()
else:
    pipe.to("cuda")


class GenerateVideoRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000)
    num_frames: int = Field(default=49, ge=16, le=97)
    num_inference_steps: int = Field(default=30, ge=10, le=50)


def get_gpu_vram_snapshot() -> dict:
    if not torch.cuda.is_available():
        return {"cuda_available": False, "allocated_mb": 0, "reserved_mb": 0, "peak_allocated_mb": 0}
    return {
        "cuda_available": True,
        "device_name": torch.cuda.get_device_name(0),
        "allocated_mb": round(torch.cuda.memory_allocated(0) / (1024 ** 2), 1),
        "reserved_mb": round(torch.cuda.memory_reserved(0) / (1024 ** 2), 1),
        "peak_allocated_mb": round(torch.cuda.max_memory_allocated(0) / (1024 ** 2), 1),
    }
${
  config.includeHealthAndVramLogs
    ? `

@app.get("/health")
async def health_check():
    """Health check endpoint with live GPU VRAM telemetry."""
    vram = get_gpu_vram_snapshot()
    return {
        "status": "healthy",
        "model": MODEL_REPO_ID,
        "cpu_offload": ENABLE_CPU_OFFLOAD,
        "storage_bucket": S3_BUCKET_NAME,
        "gpu_memory": vram,
    }
`
    : ''
}

def _run_inference_and_upload(req: GenerateVideoRequest, job_id: str) -> dict:
    if torch.cuda.is_available():
        torch.cuda.reset_peak_memory_stats(0)

    start_ts = time.time()
    output = pipe(
        prompt=req.prompt,
        num_frames=req.num_frames,
        num_inference_steps=req.num_inference_steps,
    )
    frames = output.frames[0]

    # Write temporary MP4, upload to S3/R2, then clean up rented GPU disk immediately
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=True) as tmp_mp4:
        export_to_video(frames, tmp_mp4.name, fps=24)
        object_key = f"renders/{job_id}.mp4"
        s3_client.upload_file(
            tmp_mp4.name,
            S3_BUCKET_NAME,
            object_key,
            ExtraArgs={"ContentType": "video/mp4"},
        )

    elapsed_sec = round(time.time() - start_ts, 2)
    vram_stats = get_gpu_vram_snapshot()
    logger.info(
        "[JOB %s] Completed in %ss | Peak VRAM: %s MB | Reserved VRAM: %s MB | Key: s3://%s/%s",
        job_id,
        elapsed_sec,
        vram_stats.get("peak_allocated_mb"),
        vram_stats.get("reserved_mb"),
        S3_BUCKET_NAME,
        object_key,
    )

    return {
        "job_id": job_id,
        "status": "completed",
        "mp4_url": f"{CDN_BASE_URL}/{object_key}",
        "s3_key": object_key,
        "elapsed_seconds": elapsed_sec,
        "gpu_memory_mb": vram_stats,
    }


@app.post("/generate")
async def generate_video(req: GenerateVideoRequest):
    """Accepts a text prompt, enforces a 5-minute timeout, uploads MP4 to S3/R2, and returns a CDN link."""
    job_id = f"vid_{uuid.uuid4().hex[:10]}"
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(_run_inference_and_upload, req, job_id),
            timeout=GENERATE_TIMEOUT_SECONDS,
        )
        return result
    except asyncio.TimeoutError:
        logger.error("[JOB %s] Timed out after %s seconds", job_id, GENERATE_TIMEOUT_SECONDS)
        raise HTTPException(
            status_code=504,
            detail=f"Video generation timed out after {GENERATE_TIMEOUT_SECONDS} seconds (5 minutes).",
        )`;
}

/**
 * Generates single-container Docker build & run commands for rented hourly GPUs
 * (RunPod, Lambda, AWS, GCP, Azure) without Kubernetes or Slurm overhead.
 */
export function generateSingleContainerDeployScript(config: VibeDockerStackConfig): string {
  const isR2 = config.storageProvider === 'cloudflare_r2';
  return `# 1. Build the container image on your laptop or rented Ubuntu GPU machine
docker build -t vibe-video-worker:latest .

# 2. Run on a single rented GPU (RunPod / Lambda / AWS / GCP / Azure)
# No Kubernetes or Slurm required — standard Docker with --gpus all is enough
docker run -d --name vibe-video-worker \\
  --gpus all \\
  -p 8000:8000 \\
  -e AWS_ACCESS_KEY_ID="YOUR_${isR2 ? 'R2' : 'S3'}_KEY_ID" \\
  -e AWS_SECRET_ACCESS_KEY="YOUR_${isR2 ? 'R2' : 'S3'}_SECRET_KEY" \\
  -e S3_BUCKET_NAME="${config.bucketName}" \\
  -e CDN_BASE_URL="${config.cdnBaseUrl}" \\
  -e ENABLE_CPU_OFFLOAD="${config.enableCpuOffload ? 'true' : 'false'}" \\
  vibe-video-worker:latest

# 3. Verify health & GPU VRAM status
curl -s http://localhost:8000/health | jq .

# 4. Generate a video clip (5-minute timeout, auto-uploads MP4 to ${isR2 ? 'Cloudflare R2' : 'Amazon S3'})
curl -X POST http://localhost:8000/generate \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "A cinematic tracking shot of a neon noodle stall in rainy Tokyo, 35mm film", "num_frames": 49}'`;
}

/**
 * Simulates a single-GPU `/generate` execution with realistic VRAM telemetry logging
 * and S3/R2 CDN link generation.
 */
export function simulateVibeCoderJob(params: {
  prompt: string;
  modelId: OpenSourceVideoModelId;
  gpuVramGb: number;
  enableCpuOffload: boolean;
  storageProvider: ObjectStorageProviderId;
  timeoutSeconds?: number;
}): VibeJobVramLog {
  const evaluation = evaluateVramCompatibility(
    params.modelId,
    params.gpuVramGb,
    params.enableCpuOffload
  );
  const jobId = createPrefixedId('vibe');
  const totalVramMb = evaluation.gpuVramGb * 1024;
  const peakVramMb = Math.round(evaluation.effectiveVramRequiredGb * 1024 * 0.96);
  const allocatedVramMb = Math.round(peakVramMb * 0.88);
  const reservedVramMb = Math.min(totalVramMb, Math.round(peakVramMb * 1.04));

  const s3ObjectKey = `renders/${jobId}.mp4`;
  const cdnBase =
    params.storageProvider === 'cloudflare_r2'
      ? 'https://cdn.vibe-video.r2.dev'
      : 'https://d111111abcdef8.cloudfront.net';

  return {
    jobId,
    timestampIso: new Date().toISOString(),
    prompt: params.prompt.trim() || 'Cinematic neon street reflection at night, 24fps',
    modelId: evaluation.model.id,
    gpuName:
      evaluation.gpuVramGb <= 24
        ? 'NVIDIA RTX 4090 (24 GB)'
        : evaluation.gpuVramGb <= 48
        ? `NVIDIA A100 / L40S (${evaluation.gpuVramGb} GB)`
        : 'NVIDIA A100 / H100 (80 GB)',
    totalVramMb,
    allocatedVramMb,
    reservedVramMb,
    peakVramMb,
    cpuOffloadActive: params.enableCpuOffload,
    durationSec: evaluation.model.avgGenerationSecPerClip,
    timeoutLimitSec: params.timeoutSeconds ?? 300,
    storageProvider: params.storageProvider,
    mp4Url: `${cdnBase}/${s3ObjectKey}`,
    s3ObjectKey,
    status: 'completed',
  };
}
