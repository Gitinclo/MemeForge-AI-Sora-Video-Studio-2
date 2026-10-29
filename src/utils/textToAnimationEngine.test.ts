import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_GLOBAL_VISUAL_ASSETS,
  TEN_SHOT_ANIMATION_SCRIPT,
  compileExpandedT2VPrompt,
  evaluateAnimationScriptSummary,
  parseAnimationScriptText,
  RAW_USER_10_SHOT_SCRIPT_TEXT,
  normalizeDurationForVeo,
} from './textToAnimationEngine';

describe('textToAnimationEngine (Global Visual Assets & 10-Shot Script)', () => {
  it('defines Global_Art_Style, Character_A (Lin_Jie), Character_B (Ji_Zhixiu), Environment_A, and Environment_B', () => {
    assert.ok(DEFAULT_GLOBAL_VISUAL_ASSETS.globalArtStyle.includes('Dark urban fantasy anime'));
    assert.equal(DEFAULT_GLOBAL_VISUAL_ASSETS.frameRateFps, 24);
    assert.equal(DEFAULT_GLOBAL_VISUAL_ASSETS.characters.Character_A.handle, 'Lin_Jie');
    assert.equal(DEFAULT_GLOBAL_VISUAL_ASSETS.characters.Character_B.handle, 'Ji_Zhixiu');
    assert.equal(
      DEFAULT_GLOBAL_VISUAL_ASSETS.environments.Environment_A.handle,
      'Rainy_Street_And_Alley'
    );
    assert.equal(
      DEFAULT_GLOBAL_VISUAL_ASSETS.environments.Environment_B.handle,
      'Bookstore_Interior'
    );
  });

  it('validates the 10-shot sequential script totals 45s native (1080 frames @ 24fps) and 52s Veo-normalized', () => {
    assert.equal(TEN_SHOT_ANIMATION_SCRIPT.length, 10);
    const summary = evaluateAnimationScriptSummary(TEN_SHOT_ANIMATION_SCRIPT, '1080p', 'fast');
    assert.equal(summary.shotCount, 10);
    assert.equal(summary.sceneCount, 3);
    // 4 + 3 + 5 + 4 + 5 + 4 + 5 + 5 + 4 + 6 = 45 seconds
    assert.equal(summary.totalScriptDurationSec, 45);
    assert.equal(summary.totalFramesAt24Fps, 1080);
    // Normalized to [4, 6, 8]: 4 + 4 + 6 + 4 + 6 + 4 + 6 + 6 + 4 + 6 = 50 seconds
    assert.equal(summary.totalVeoNormalizedDurationSec, 50);
    assert.equal(summary.durationNormalizedShots.length, 5); // Shots 02 (3->4), 03 (5->6), 05 (5->6), 07 (5->6), 08 (5->6)
    assert.equal(summary.estimatedVeoFast1080pUsd, 6.0); // 50s * $0.12/s
    assert.equal(summary.estimatedOmniFlash720pNativeUsd, 4.5); // 45s * $0.10/s
  });

  it('compiles expanded T2V master prompts with injected character and environment sheets', () => {
    const shot01Prompt = compileExpandedT2VPrompt(TEN_SHOT_ANIMATION_SCRIPT[0]);
    assert.ok(shot01Prompt.includes('Dark urban fantasy anime'));
    assert.ok(shot01Prompt.includes('Character_A (Lin_Jie)'));
    assert.ok(shot01Prompt.includes('Environment_A (Rainy_Street_And_Alley)'));
    assert.ok(shot01Prompt.includes('Such a heavy downpour.'));

    const shot10Prompt = compileExpandedT2VPrompt(TEN_SHOT_ANIMATION_SCRIPT[9]);
    assert.ok(shot10Prompt.includes('Character_A (Lin_Jie)'));
    assert.ok(shot10Prompt.includes('Character_B (Ji_Zhixiu)'));
    assert.ok(shot10Prompt.includes('Environment_B (Bookstore_Interior)'));
  });

  it('parses raw AI markdown script into 10 structured animation shots', () => {
    const parsed = parseAnimationScriptText(RAW_USER_10_SHOT_SCRIPT_TEXT);
    assert.equal(parsed.length, 10);
    assert.equal(parsed[0].title, 'Exterior Doorway');
    assert.equal(parsed[0].scriptDurationSec, 4);
    assert.equal(parsed[1].scriptDurationSec, 3);
    assert.equal(normalizeDurationForVeo(parsed[1].scriptDurationSec), 4);
    assert.equal(parsed[9].dialogues.length, 3);
  });
});
