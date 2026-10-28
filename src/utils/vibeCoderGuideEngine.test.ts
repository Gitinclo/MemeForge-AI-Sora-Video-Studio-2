import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VIBE_CODER_GUIDE_SECTIONS,
  HOSTED_VIDEO_API_OPTIONS,
  OPEN_SOURCE_VIDEO_MODELS,
  RENTED_GPU_INSTANCES,
  VIBE_PROMPTS_TO_TRY,
  evaluateVramCompatibility,
  calculateExternalStorageCost,
  generateVibeCoderDockerfile,
  generateVibeCoderFastApiCode,
  generateSingleContainerDeployScript,
  simulateVibeCoderJob,
} from './vibeCoderGuideEngine';

describe('Vibe Coder Sora-Style Video App Guide Engine', () => {
  it('exposes all 6 core Vibe Coder architecture guide sections and hosted/open-source catalogs', () => {
    assert.equal(VIBE_CODER_GUIDE_SECTIONS.length, 6);
    assert.ok(HOSTED_VIDEO_API_OPTIONS.some((p) => p.id === 'google_veo'));
    assert.ok(HOSTED_VIDEO_API_OPTIONS.some((p) => p.id === 'runway'));
    assert.ok(HOSTED_VIDEO_API_OPTIONS.some((p) => p.id === 'luma'));
    assert.ok(OPEN_SOURCE_VIDEO_MODELS.some((m) => m.id === 'wan-2.1-t2v-1.3b'));
    assert.ok(OPEN_SOURCE_VIDEO_MODELS.some((m) => m.id === 'cogvideox-5b-int8'));
    assert.ok(RENTED_GPU_INSTANCES.some((g) => g.providerId === 'runpod'));
    assert.ok(RENTED_GPU_INSTANCES.some((g) => g.providerId === 'lambda'));
  });

  it('evaluates GPU VRAM compatibility and prescribes CPU model offloading when native weights exceed 24 GB', () => {
    // 1. Wan 2.1 1.3B fits natively on a 24 GB GPU
    const nativeFit = evaluateVramCompatibility('wan-2.1-t2v-1.3b', 24, false);
    assert.equal(nativeFit.fitsInVram, true);
    assert.equal(nativeFit.status, 'optimal');
    assert.ok(nativeFit.headroomGb >= 10);

    // 2. CogVideoX-5B (BF16) requires 34 GB natively -> OOM risk on 24 GB without CPU offload
    const oomWithoutOffload = evaluateVramCompatibility('cogvideox-5b-bf16', 24, false);
    assert.equal(oomWithoutOffload.fitsInVram, false);
    assert.equal(oomWithoutOffload.status, 'oom_risk');
    assert.equal(oomWithoutOffload.suggestedAlternativeModelId, 'cogvideox-5b-int8');

    // 3. Enabling CPU model offloading fits CogVideoX-5B (BF16) into 24 GB (needs 20 GB with offload)
    const offloadFit = evaluateVramCompatibility('cogvideox-5b-bf16', 24, true);
    assert.equal(offloadFit.fitsInVram, true);
    assert.equal(offloadFit.status, 'fits_with_offload');
    assert.equal(offloadFit.effectiveVramRequiredGb, 20);
  });

  it('calculates Amazon S3 vs Cloudflare R2 external object storage and CDN savings', () => {
    const s3 = calculateExternalStorageCost('aws_s3', 1000, 25, 10);
    const r2 = calculateExternalStorageCost('cloudflare_r2', 1000, 25, 10);

    assert.ok(s3.totalStorageGb > 24);
    assert.equal(r2.monthlyEgressUsd, 0);
    assert.ok(r2.monthlyTotalUsd < s3.monthlyTotalUsd);
    assert.ok(r2.monthlySavingsUsd > 0);
  });

  it('generates Dockerfile, FastAPI /generate (5-min timeout + S3 upload), and /health + VRAM logging code', () => {
    const config = {
      modelId: 'wan-2.1-t2v-1.3b' as const,
      storageProvider: 'aws_s3' as const,
      bucketName: 'my-vibe-video-clips',
      cdnBaseUrl: 'https://d111111abcdef8.cloudfront.net',
      timeoutSeconds: 300,
      enableCpuOffload: true,
      includeHealthAndVramLogs: true,
    };

    const dockerfile = generateVibeCoderDockerfile(config);
    assert.ok(dockerfile.includes('FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04'));
    assert.ok(dockerfile.includes('python3.11'));
    assert.ok(dockerfile.includes('HEALTHCHECK'));

    const fastApiCode = generateVibeCoderFastApiCode(config);
    assert.ok(fastApiCode.includes('@app.post("/generate")'));
    assert.ok(fastApiCode.includes('@app.get("/health")'));
    assert.ok(fastApiCode.includes('pipe.enable_model_cpu_offload()'));
    assert.ok(fastApiCode.includes('torch.cuda.max_memory_allocated'));
    assert.ok(fastApiCode.includes('s3_client.upload_file'));

    const deployScript = generateSingleContainerDeployScript(config);
    assert.ok(deployScript.includes('docker run -d --name vibe-video-worker'));
    assert.ok(deployScript.includes('--gpus all'));
    assert.ok(VIBE_PROMPTS_TO_TRY.initialPrompt.includes('/generate'));
    assert.ok(VIBE_PROMPTS_TO_TRY.followUpPrompt.includes('health check'));
  });

  it('simulates a single-GPU /generate job with per-job VRAM logs and S3/R2 CDN output link', () => {
    const job = simulateVibeCoderJob({
      prompt: 'A neon-lit ramen shop in rainy Tokyo',
      modelId: 'cogvideox-5b-int8',
      gpuVramGb: 24,
      enableCpuOffload: true,
      storageProvider: 'cloudflare_r2',
      timeoutSeconds: 300,
    });

    assert.equal(job.status, 'completed');
    assert.equal(job.timeoutLimitSec, 300);
    assert.ok(job.peakVramMb > 0 && job.peakVramMb <= job.totalVramMb);
    assert.ok(job.mp4Url.endsWith('.mp4'));
    assert.ok(job.s3ObjectKey.startsWith('renders/'));
  });
});
