import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SORA2_ULTRA_CONFIG,
  calculateSora2UltraMetrics,
  buildSora2UltraChapterPlan,
} from './sora2UltraEngine.ts';

test('calculateSora2UltraMetrics: calculates 32K (32000x32000), 1000 FPS, 100-hour metrics accurately', () => {
  const metrics = calculateSora2UltraMetrics(DEFAULT_SORA2_ULTRA_CONFIG);

  assert.equal(metrics.width, 32000);
  assert.equal(metrics.height, 32000);
  assert.equal(metrics.megapixelsPerFrame, 1024);
  assert.equal(metrics.totalSeconds, 360000);
  assert.equal(metrics.totalFrames, 360000000); // 360M frames @ 1000 FPS over 100 hours
  assert.equal(metrics.latentWidth, 4000); // 32000 / 8
  assert.equal(metrics.latentHeight, 4000); // 32000 / 8
  assert.equal(metrics.shutterIntervalMs, 1); // 1ms per frame at 1000 FPS
  assert.ok(metrics.activeVramPerGpuGb > 0 && metrics.activeVramPerGpuGb <= 80);
  assert.ok(metrics.nvmeGpuDirectThroughputGbps > 0);
});

test('buildSora2UltraChapterPlan: generates 5 hierarchical episodic chapters spanning 100 hours', () => {
  const chapters = buildSora2UltraChapterPlan(
    100,
    1000,
    '32K Master (32000×32000)',
    'Orbital ring metropolis at 32K 1000fps'
  );

  assert.equal(chapters.length, 5);
  assert.equal(chapters[0].actNumber, 1);
  assert.equal(chapters[0].startTimecode, '00:00:00');
  assert.equal(chapters[4].actNumber, 5);
  assert.equal(chapters[4].endTimecode, '100:00:00');
  assert.equal(chapters[4].endFrame, 360000000);
  assert.ok(chapters.every((c) => c.anchorLatentHash.startsWith('0xSORA2_A')));
});
