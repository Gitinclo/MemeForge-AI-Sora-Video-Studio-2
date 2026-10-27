import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_LORA_JOBS,
  INITIAL_GPU_CLUSTER_NODES,
  SANDBOX_PRESET_SCENARIOS,
  advanceTrainingJobTick,
  resolvePhaseForStep,
  injectTriggerTokenIntoPrompt,
  evaluateSandboxConsistency,
  formatDurationEta,
  generateDefaultCalibrationDataset,
  perturbGpuClusterTelemetry,
} from './b2bEnterpriseEngine';

test('B2B Enterprise Engine: resolves LoRA training phases accurately across step progression', () => {
  assert.equal(resolvePhaseForStep(10, 1500), 'validating_dataset');
  assert.equal(resolvePhaseForStep(120, 1500), 'extracting_latents');
  assert.equal(resolvePhaseForStep(800, 1500), 'training_lora');
  assert.equal(resolvePhaseForStep(1400, 1500), 'compiling_safetensors');
  assert.equal(resolvePhaseForStep(1500, 1500), 'completed');
});

test('B2B Enterprise Engine: advances active LoRA job steps, reduces ETA, and updates loss curve', () => {
  const activeJob = INITIAL_LORA_JOBS.find((j) => j.phase === 'training_lora')!;
  assert.ok(activeJob, 'Expected an active training_lora job in INITIAL_LORA_JOBS');

  const updated = advanceTrainingJobTick(activeJob, 100);
  assert.equal(updated.currentStep, activeJob.currentStep + 100);
  assert.ok(updated.estimatedSecondsRemaining < activeJob.estimatedSecondsRemaining);
  assert.ok(updated.lossHistory.length > 0);
});

test('B2B Enterprise Engine: injects trigger token into preset and custom prompts', () => {
  const template = 'Studio shot of {{token}} on travertine stone.';
  const resolved = injectTriggerTokenIntoPrompt(template, 'aurum_flacon_v4');
  assert.equal(resolved, 'Studio shot of aurum_flacon_v4 on travertine stone.');

  const customWithoutPlaceholder = 'High speed macro shot in rain';
  const resolvedCustom = injectTriggerTokenIntoPrompt(customWithoutPlaceholder, 'aurum_flacon_v4');
  assert.ok(resolvedCustom.includes('aurum_flacon_v4'));
});

test('B2B Enterprise Engine: evaluates Model Sandbox preset scenarios and computes physical invariant scores', () => {
  const completedJob = INITIAL_LORA_JOBS[0];
  const preset = SANDBOX_PRESET_SCENARIOS[0];

  const evaluation = evaluateSandboxConsistency({
    job: completedJob,
    preset,
    lens: preset.recommendedLens,
    aspectRatio: preset.recommendedAspectRatio,
    inferenceSteps: 45,
  });

  assert.equal(evaluation.jobId, completedJob.id);
  assert.ok(evaluation.resolvedPrompt.includes(completedJob.triggerToken));
  assert.ok(evaluation.scores.logoIntegrity >= 98.0);
  assert.ok(evaluation.scores.geometrySilhouetteIou >= 97.5);
  assert.ok(evaluation.scores.materialPurity >= 97.0);
  assert.equal(evaluation.passedEnterpriseThreshold, true);
});

test('B2B Enterprise Engine: Perturbs GPU cluster telemetry within realistic H100/B200 bounds', () => {
  const updatedNodes = perturbGpuClusterTelemetry(INITIAL_GPU_CLUSTER_NODES, INITIAL_LORA_JOBS);
  assert.equal(updatedNodes.length, INITIAL_GPU_CLUSTER_NODES.length);
  for (const node of updatedNodes) {
    assert.ok(node.utilizationPercent >= 10 && node.utilizationPercent <= 100);
    assert.ok(node.vramUsedGb <= node.vramTotalGb);
  }
});

test('B2B Enterprise Engine: generates 12-angle calibration dataset and formats ETA strings', () => {
  const dataset = generateDefaultCalibrationDataset('Aurum Flacon');
  assert.equal(dataset.length, 12);
  assert.equal(formatDurationEta(0), 'Completed (0s)');
  assert.equal(formatDurationEta(125), '2m 05s remaining');
});
