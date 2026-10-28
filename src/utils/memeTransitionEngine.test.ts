import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampTransitionProgress,
  applyTransitionEasing,
  computeCoverDrawRect,
  computeFadeWeights,
  computeSlideOffsets,
  getDissolveCellThreshold,
  shouldRevealDissolveCell,
  MEME_TRANSITION_PRESETS,
  DEFAULT_MEME_TRANSITION_CONFIG,
} from './memeTransitionEngine';

describe('memeTransitionEngine', () => {
  it('exposes presets for none, fade, slide, and dissolve', () => {
    const ids = MEME_TRANSITION_PRESETS.map((p) => p.id);
    assert.deepEqual(ids, ['none', 'fade', 'slide', 'dissolve']);
    assert.equal(DEFAULT_MEME_TRANSITION_CONFIG.type, 'fade');
  });

  it('clamps progress values to [0, 1]', () => {
    assert.equal(clampTransitionProgress(-0.5), 0);
    assert.equal(clampTransitionProgress(0), 0);
    assert.equal(clampTransitionProgress(0.45), 0.45);
    assert.equal(clampTransitionProgress(1.8), 1);
    assert.equal(clampTransitionProgress(Number.NaN), 1);
  });

  it('computes complementary fade alpha weights at boundaries and midpoint', () => {
    const start = computeFadeWeights(0, 'linear');
    assert.equal(start.outgoingAlpha, 1);
    assert.equal(start.incomingAlpha, 0);

    const mid = computeFadeWeights(0.5, 'easeInOutCubic');
    assert.equal(mid.outgoingAlpha, 0.5);
    assert.equal(mid.incomingAlpha, 0.5);

    const end = computeFadeWeights(1, 'easeOutQuart');
    assert.equal(end.outgoingAlpha, 0);
    assert.equal(end.incomingAlpha, 1);
  });

  it('computes directional slide offsets for left, right, up, and down', () => {
    const startLeft = computeSlideOffsets(0, 800, 600, 'left', 'linear');
    assert.equal(startLeft.outgoingOffsetX, 0);
    assert.equal(startLeft.incomingOffsetX, 800);

    const endLeft = computeSlideOffsets(1, 800, 600, 'left', 'linear');
    assert.equal(endLeft.outgoingOffsetX, -800);
    assert.equal(endLeft.incomingOffsetX, 0);

    const midUp = computeSlideOffsets(0.5, 800, 600, 'up', 'linear');
    assert.equal(midUp.outgoingOffsetY, -300);
    assert.equal(midUp.incomingOffsetY, 300);
  });

  it('reveals 0% of dissolve cells at progress 0 and 100% at progress 1', () => {
    const grid = 8;
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const threshold = getDissolveCellThreshold(r, c, grid, grid);
        assert.ok(threshold > 0 && threshold < 1);
        assert.equal(shouldRevealDissolveCell(r, c, grid, grid, 0, 'linear'), false);
        assert.equal(shouldRevealDissolveCell(r, c, grid, grid, 1, 'linear'), true);
      }
    }
  });

  it('computes object-fit cover draw rectangles accurately', () => {
    const wideRect = computeCoverDrawRect(1600, 800, 800, 800);
    assert.equal(wideRect.drawH, 800);
    assert.equal(wideRect.drawW, 1600);
    assert.equal(wideRect.drawX, -400);
    assert.equal(wideRect.drawY, 0);

    const tallRect = computeCoverDrawRect(800, 1600, 800, 800);
    assert.equal(tallRect.drawW, 800);
    assert.equal(tallRect.drawH, 1600);
    assert.equal(tallRect.drawX, 0);
    assert.equal(tallRect.drawY, -400);
  });

  it('applies easing curves monotonically in [0, 1]', () => {
    const p1 = applyTransitionEasing(0.25, 'easeInOutCubic');
    const p2 = applyTransitionEasing(0.75, 'easeInOutCubic');
    assert.ok(p1 > 0 && p1 < 0.5);
    assert.ok(p2 > 0.5 && p2 < 1);
  });
});
