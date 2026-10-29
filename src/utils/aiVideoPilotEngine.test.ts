import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRICING_YAML_CONFIG,
  getBudgetReferenceTable,
  estimateJobCostUsd,
  evaluateBudgetGuard,
  PILOT_23_SHOT_LIST,
  validatePilotShotList,
  runTenShotBakeoffSimulation,
  SAMPLE_LICENSE_PRESETS,
  evaluateBookLicenseText,
  evaluatePilotScalingGates,
} from './aiVideoPilotEngine';

describe('aiVideoPilotEngine — Pricing, Budget Guard, Shot Validator & License Gates', () => {
  it('calculates exact Sept 2026 Gemini API Veo 3.1 rates and matches the 8-s Fast 1080p = $0.96 spec example', () => {
    const fast1080p = estimateJobCostUsd('veo', 'fast', '1080p', 8);
    assert.equal(fast1080p.valid, true);
    assert.equal(fast1080p.ratePerSecondUsd, 0.12);
    assert.equal(fast1080p.estimatedCostUsd, 0.96);
    assert.equal(fast1080p.modelId, 'veo-3.1-fast-generate-preview');

    const table = getBudgetReferenceTable();
    const fast1080Row = table.find((r) => r.label === 'Fast 1080p');
    assert.ok(fast1080Row);
    assert.equal(fast1080Row.one8sClipUsd, 0.96);
    assert.equal(fast1080Row.pilot540sUsd, 65);
    assert.equal(fast1080Row.scale100h1TryUsd, 43200);
    assert.equal(fast1080Row.scale100h3TriesUsd, 129600);
  });

  it('rejects unsupported combinations (e.g., Veo 3.1 Lite at 4K) and blocks OpenAI Sora', () => {
    const lite4k = estimateJobCostUsd('veo', 'lite', '4k', 8);
    assert.equal(lite4k.valid, false);
    assert.ok(lite4k.error?.includes('does not support 4K'));

    const invalidDuration = estimateJobCostUsd('veo', 'fast', '1080p', 5);
    assert.equal(invalidDuration.valid, false);
    assert.ok(invalidDuration.error?.includes('[4, 6, 8]'));

    const soraCall = estimateJobCostUsd('sora', 'standard', '1080p', 8);
    assert.equal(soraCall.valid, false);
    assert.ok(soraCall.error?.includes('Sept 24, 2026'));
  });

  it('enforces the $500 hard cap including in-flight reserved budget', () => {
    assert.equal(PRICING_YAML_CONFIG.defaultPilotCapUsd, 500);
    const okCheck = evaluateBudgetGuard(498.0, 0.96, 0.96, 500);
    assert.equal(okCheck.allowed, true);
    assert.equal(okCheck.projectedTotalUsd, 499.92);

    const breachCheck = evaluateBudgetGuard(498.5, 0.96, 0.96, 500);
    assert.equal(breachCheck.allowed, false);
    assert.ok(breachCheck.reason.includes('STOPPED BY BUDGET GUARD'));
  });

  it('validates the 23-shot episode manifest (~3 minutes total) against the schema', () => {
    const report = validatePilotShotList(PILOT_23_SHOT_LIST);
    assert.equal(report.valid, true);
    assert.equal(report.shotCount, 23);
    assert.equal(report.totalDurationSeconds, 180); // Exactly 3.0 minutes!
    assert.equal(report.averageDurationSeconds, 7.83);
    assert.equal(report.estimatedPilotSecondsWith3Tries, 540);
  });

  it('evaluates the 5-clause Book License Gate and blocks public scaling when clauses are silent', () => {
    const silentAudit = evaluateBookLicenseText(SAMPLE_LICENSE_PRESETS.missing_or_unverified.text);
    assert.equal(silentAudit.overallStatus, 'PRIVATE_TESTING_ONLY');

    const excludedAudit = evaluateBookLicenseText(SAMPLE_LICENSE_PRESETS.print_only_legacy.text);
    assert.equal(excludedAudit.overallStatus, 'BLOCKED_EXPLICIT_EXCLUSION');

    const clearedAudit = evaluateBookLicenseText(
      SAMPLE_LICENSE_PRESETS.ai_cleared_animation_addendum.text
    );
    assert.equal(clearedAudit.overallStatus, 'CLEARED_FOR_PUBLIC_SCALING');

    const gatesWithCleared = evaluatePilotScalingGates({
      consistencyApprovedOutOf10: 10,
      avgGenerationsPerApprovedShot: 2.1,
      totalPilotSpendUsd: 65,
      finishedPilotMinutes: 3.0,
      userMaxCostPerMinuteUsd: 30,
      providerCommercialTermsVerified: true,
      providerTermsUrl: 'https://ai.google.dev/gemini-api/terms',
      providerTermsDate: '2026-10-29',
      licenseAudit: clearedAudit,
    });
    assert.equal(gatesWithCleared.allGatesPassed, true);
    assert.equal(gatesWithCleared.allowedScaleStage, 'Stage 1: Full 25-Min Episode');
  });

  it('runs the 10-shot provider bake-off simulation', () => {
    const results = runTenShotBakeoffSimulation(true);
    assert.equal(results.length, 4);
    const fast = results.find((r) => r.candidateId === 'veo-fast-1080p');
    assert.equal(fast?.passesPilotGates, true);
    assert.ok((fast?.consistencyPassOutOf10 ?? 0) >= 9);
  });
});
