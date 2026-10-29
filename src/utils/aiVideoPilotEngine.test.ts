import { describe, it, expect } from 'vitest';
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
    expect(fast1080p.valid).toBe(true);
    expect(fast1080p.ratePerSecondUsd).toBe(0.12);
    expect(fast1080p.estimatedCostUsd).toBe(0.96);
    expect(fast1080p.modelId).toBe('veo-3.1-fast-generate-preview');

    const table = getBudgetReferenceTable();
    const fast1080Row = table.find((r) => r.label === 'Fast 1080p');
    expect(fast1080Row).toBeDefined();
    expect(fast1080Row?.one8sClipUsd).toBe(0.96);
    expect(fast1080Row?.pilot540sUsd).toBe(65);
    expect(fast1080Row?.scale100h1TryUsd).toBe(43200);
    expect(fast1080Row?.scale100h3TriesUsd).toBe(129600);
  });

  it('rejects unsupported combinations (e.g., Veo 3.1 Lite at 4K) and blocks OpenAI Sora', () => {
    const lite4k = estimateJobCostUsd('veo', 'lite', '4k', 8);
    expect(lite4k.valid).toBe(false);
    expect(lite4k.error).toContain('does not support 4K');

    const invalidDuration = estimateJobCostUsd('veo', 'fast', '1080p', 5);
    expect(invalidDuration.valid).toBe(false);
    expect(invalidDuration.error).toContain('[4, 6, 8]');

    const soraCall = estimateJobCostUsd('sora', 'standard', '1080p', 8);
    expect(soraCall.valid).toBe(false);
    expect(soraCall.error).toContain('Sept 24, 2026');
  });

  it('enforces the $500 hard cap including in-flight reserved budget', () => {
    expect(PRICING_YAML_CONFIG.defaultPilotCapUsd).toBe(500);
    const okCheck = evaluateBudgetGuard(498.0, 0.96, 0.96, 500);
    expect(okCheck.allowed).toBe(true);
    expect(okCheck.projectedTotalUsd).toBe(499.92);

    const breachCheck = evaluateBudgetGuard(498.5, 0.96, 0.96, 500);
    expect(breachCheck.allowed).toBe(false);
    expect(breachCheck.reason).toContain('STOPPED BY BUDGET GUARD');
  });

  it('validates the 23-shot episode manifest (~3 minutes total) against the schema', () => {
    const report = validatePilotShotList(PILOT_23_SHOT_LIST);
    expect(report.valid).toBe(true);
    expect(report.shotCount).toBe(23);
    expect(report.totalDurationSeconds).toBe(180); // Exactly 3.0 minutes!
    expect(report.averageDurationSeconds).toBeCloseTo(7.83, 1);
    expect(report.estimatedPilotSecondsWith3Tries).toBe(540);
  });

  it('evaluates the 5-clause Book License Gate and blocks public scaling when clauses are silent', () => {
    const silentAudit = evaluateBookLicenseText(SAMPLE_LICENSE_PRESETS.missing_or_unverified.text);
    expect(silentAudit.overallStatus).toBe('PRIVATE_TESTING_ONLY');

    const excludedAudit = evaluateBookLicenseText(SAMPLE_LICENSE_PRESETS.print_only_legacy.text);
    expect(excludedAudit.overallStatus).toBe('BLOCKED_EXPLICIT_EXCLUSION');

    const clearedAudit = evaluateBookLicenseText(SAMPLE_LICENSE_PRESETS.ai_cleared_animation_addendum.text);
    expect(clearedAudit.overallStatus).toBe('CLEARED_FOR_PUBLIC_SCALING');

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
    expect(gatesWithCleared.allGatesPassed).toBe(true);
    expect(gatesWithCleared.allowedScaleStage).toBe('Stage 1: Full 25-Min Episode');
  });

  it('runs the 10-shot provider bake-off simulation', () => {
    const results = runTenShotBakeoffSimulation(true);
    expect(results.length).toBe(4);
    const fast = results.find((r) => r.candidateId === 'veo-fast-1080p');
    expect(fast?.passesPilotGates).toBe(true);
    expect(fast?.consistencyPassOutOf10).toBeGreaterThanOrEqual(9);
  });
});
