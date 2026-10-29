import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_LORA_JOBS } from './b2bEnterpriseEngine';
import {
  MLOPS_RBAC_ROLES,
  INITIAL_HF_DATASETS,
  INITIAL_GITHUB_COMMITS,
  INITIAL_CLOUD_PROVIDERS,
  buildRealtimeSampleForJob,
  buildCheckpointExportManifest,
  createSora2AnimationScene,
} from './loraFlowMlopsEngine';

test('LoRAFlow MLOps Engine: generates real-time sample images at arbitrary steps with SVG data URI', () => {
  const job = INITIAL_LORA_JOBS[0];
  const sample = buildRealtimeSampleForJob(job, 'Macro shot on obsidian stone', 8.0, 1.1, 750);

  assert.equal(sample.jobId, job.id);
  assert.equal(sample.step, 750);
  assert.ok(sample.lossAtStep > 0);
  assert.ok(sample.imageDataUri.startsWith('data:image/svg+xml'));
});

test('LoRAFlow MLOps Engine: enforces RBAC permissions when exporting safetensors checkpoints', () => {
  const job = INITIAL_LORA_JOBS[0];
  const adminManifest = buildCheckpointExportManifest(job, 'mlops_admin');
  assert.equal(adminManifest.model.jobId, job.id);
  assert.equal(adminManifest.security.encryptionAtRest, 'AES-256-GCM');

  assert.throws(() => {
    buildCheckpointExportManifest(job, 'viewer');
  }, /RBAC Policy Denied/);
});

test('LoRAFlow MLOps Engine: builds Sora 2 text-to-animation scene with LoRA trigger token and 4 keyframes', () => {
  const job = INITIAL_LORA_JOBS[1];
  const scene = createSora2AnimationScene({
    prompt: 'Neon cybernetic watch gears assembling in zero gravity',
    style: '2.5D Anime Cel-Shaded',
    job,
    loraScale: 1.05,
    fps: 120,
    durationSeconds: 12,
  });

  assert.ok(scene.prompt.includes(job.triggerToken));
  assert.equal(scene.style, '2.5D Anime Cel-Shaded');
  assert.equal(scene.keyframes.length, 4);
  assert.equal(scene.fps, 120);
});

test('LoRAFlow MLOps Engine: provides pre-verified Hugging Face datasets, GitHub commits, and cloud nodes', () => {
  assert.ok(INITIAL_HF_DATASETS.length >= 3);
  assert.ok(INITIAL_GITHUB_COMMITS.length >= 3);
  assert.ok(INITIAL_CLOUD_PROVIDERS.length >= 4);
  assert.equal(MLOPS_RBAC_ROLES.mlops_admin.canManageRbacAndMfa, true);
  assert.equal(MLOPS_RBAC_ROLES.viewer.canLaunchRuns, false);
});
