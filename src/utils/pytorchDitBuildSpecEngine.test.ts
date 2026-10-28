import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TINY_DIT_CONFIG,
  PRODUCTION_OPTIMIZED_DIT_CONFIG,
  BF16_PROTECTED_MODULES,
  DIT_BUILD_ORDER_STEPS,
  PYTORCH_DIT_SPEC_FILES,
  calculateDitInferenceSpec,
  runDitAcceptanceTestSuite,
  getPyTorchDitSpecFileById,
} from './pytorchDitBuildSpecEngine';

describe('pytorchDitBuildSpecEngine — Build Spec: Text-to-Video Diffusion Transformer', () => {
  it('computes exact latent and patch token shapes for Step 1 Tiny Config (8 frames @ 64x64)', () => {
    const report = calculateDitInferenceSpec(TINY_DIT_CONFIG);

    // Input video shape in [B, T, H, W, C]
    assert.deepEqual(report.inputVideoShapeBTHWC, [1, 8, 64, 64, 3]);
    assert.deepEqual(report.inputVideoShapeBCTHW, [1, 3, 8, 64, 64]);

    // 8x temporal, 8x spatial compression -> [1, 1, 8, 8, 16]
    assert.deepEqual(report.latentShapeBTHWC, [1, 1, 8, 8, 16]);
    assert.deepEqual(report.latentShapeBCTHW, [1, 16, 1, 8, 8]);

    // Patch size (1, 2, 2) -> [1, 4, 4] = 16 tokens
    assert.deepEqual(report.patchGridTHW, [1, 4, 4]);
    assert.equal(report.totalPatchTokens, 16);
    assert.equal(report.spatialTokensPerFrame, 16);
    assert.equal(report.temporalTokensPerLocation, 1);
  });

  it('computes factorized spatial+temporal attention savings vs full N*N attention for 32x512x512', () => {
    const report = calculateDitInferenceSpec(PRODUCTION_OPTIMIZED_DIT_CONFIG);

    // 32 frames @ 512x512 -> latent [1, 4, 64, 64, 16] -> patch (1,2,2) -> [4, 32, 32] = 4096 tokens
    assert.deepEqual(report.latentShapeBTHWC, [1, 4, 64, 64, 16]);
    assert.deepEqual(report.patchGridTHW, [4, 32, 32]);
    assert.equal(report.totalPatchTokens, 4096);

    // Full attention pairs = 4096^2 = 16,777,216
    assert.equal(report.fullAttentionPairsPerHead, 16777216);
    // Factorized pairs = 4 * (1024^2) + 1024 * (4^2) = 4,194,304 + 16,384 = 4,210,688 (< 4x smaller)
    assert.ok(report.factorizedAttentionPairsPerHead < report.fullAttentionPairsPerHead);
    assert.ok(report.attentionMemorySavingsRatio >= 3.9);
  });

  it('supports optional 16x spatial compression in Causal 3D VAE', () => {
    const report8x = calculateDitInferenceSpec({
      frames: 16,
      height: 256,
      width: 256,
      spatialCompression: 8,
    });
    const report16x = calculateDitInferenceSpec({
      frames: 16,
      height: 256,
      width: 256,
      spatialCompression: 16,
    });

    assert.deepEqual(report8x.latentShapeBTHWC, [1, 2, 32, 32, 16]);
    assert.deepEqual(report16x.latentShapeBTHWC, [1, 2, 16, 16, 16]);
    assert.equal(report8x.totalPatchTokens, 2 * 16 * 16);
    assert.equal(report16x.totalPatchTokens, 2 * 8 * 8);
  });

  it('keeps input_embedding, timestep_embedding, final_output_projection, and vae.decode in BF16', () => {
    assert.equal(BF16_PROTECTED_MODULES.length, 4);
    assert.ok(BF16_PROTECTED_MODULES.some((m) => m.includes('input_embedding')));
    assert.ok(BF16_PROTECTED_MODULES.some((m) => m.includes('timestep_embedding')));
    assert.ok(BF16_PROTECTED_MODULES.some((m) => m.includes('final_output_projection')));
    assert.ok(BF16_PROTECTED_MODULES.some((m) => m.includes('vae.decode')));
  });

  it('passes all 5 Acceptance Tests across Tiny BF16 and Production FP8_E4M3 configs', () => {
    const tinyResults = runDitAcceptanceTestSuite(TINY_DIT_CONFIG);
    assert.equal(tinyResults.length, 5);
    for (const res of tinyResults) {
      assert.equal(res.passed, true, `Expected test ${res.id} to pass`);
    }

    const prodResults = runDitAcceptanceTestSuite(PRODUCTION_OPTIMIZED_DIT_CONFIG);
    assert.equal(prodResults.length, 5);
    for (const res of prodResults) {
      assert.equal(res.passed, true, `Expected production test ${res.id} to pass`);
    }
  });

  it('defines all 7 Build Order steps and all 10 required Python/Markdown spec files with [B, T, H, W, C] docstrings', () => {
    assert.equal(DIT_BUILD_ORDER_STEPS.length, 7);
    assert.equal(PYTORCH_DIT_SPEC_FILES.length, 10);

    const requiredIds = [
      'CLAUDE.md',
      'vae.py',
      'patchify.py',
      'dit.py',
      'attention.py',
      'text.py',
      'sampler.py',
      'pipeline.py',
      'tests/thresholds.py',
      'bench.py',
    ] as const;

    for (const id of requiredIds) {
      const file = getPyTorchDitSpecFileById(id);
      assert.equal(file.id, id);
      assert.ok(
        file.code.includes('[B, T, H, W, C]'),
        `Expected ${id} to document tensor shapes using [B, T, H, W, C]`
      );
    }
  });
});
