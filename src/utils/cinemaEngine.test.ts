import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TICKS_PER_SECOND_64,
  CINEMA_RESOLUTIONS,
  CINEMA_FRAME_RATES,
  AUDIO_SAMPLE_RATES,
  PRO_CODECS,
  DEFAULT_AI_VFX_TOOLS,
  calculateUltraComputeMetrics,
  ticksToTimecode64,
  timecodeToTicks64,
  getProxyDimensions,
  getBytesPerPixel,
  splitClipAtTicks64,
  rippleTrimClip64,
  rollingEditClips64,
  slipClipSource64,
  slideClipPosition64,
  createCompoundClip64,
  applyMagneticSnap64,
  parseCubeLutFile,
  generateSampleCubeLutContent,
  benchmarkTimebaseAccuracy64,
  generateRenderTileGrid,
} from './cinemaEngine.ts';
import { TimelineClip, TimelineTrack } from '../types/cinemaEngine.ts';

test('32K resolution (32000x32000) produces 1.024 Gigapixels with correct VRAM and tile math', () => {
  const r32k = CINEMA_RESOLUTIONS.find((r) => r.id === '32K Ultra Master');
  assert.ok(r32k);
  assert.equal(r32k.width, 32000);
  assert.equal(r32k.height, 32000);
  assert.equal(r32k.pixelCount, 1_024_000_000);
  assert.equal(r32k.megapixels, 1024);

  const metrics = calculateUltraComputeMetrics(32000, 32000, 1000, '32-bit Float');
  assert.equal(metrics.megapixels, 1024);
  assert.equal(metrics.gigapixels, 1.024);
  assert.equal(metrics.recommendedProxy, '1/16 Super Proxy');
  assert.ok(metrics.throughputGbps > 100_000);
  assert.equal(metrics.tileCount1024, 1024); // ceil(32000/1024) = 32 -> 32*32 = 1024 tiles
});

test('1000 FPS High Frame Rate Engine operates with 64-bit frame accuracy across all 19 presets', () => {
  assert.equal(CINEMA_FRAME_RATES.length, 19);
  assert.ok(CINEMA_FRAME_RATES.includes(23.976));
  assert.ok(CINEMA_FRAME_RATES.includes(144));
  assert.ok(CINEMA_FRAME_RATES.includes(165));
  assert.ok(CINEMA_FRAME_RATES.includes(360));
  assert.ok(CINEMA_FRAME_RATES.includes(600));
  assert.ok(CINEMA_FRAME_RATES.includes(1000));

  const ticksPerFrame1000 = TICKS_PER_SECOND_64 / 1000n;
  assert.equal(ticksPerFrame1000, 120_000_000n);

  const tc0 = ticksToTimecode64(0n, 1000);
  assert.equal(tc0, '00:00:00:000');

  const tc500 = ticksToTimecode64(500n * ticksPerFrame1000, 1000);
  assert.equal(tc500, '00:00:00:500');

  const tc1000 = ticksToTimecode64(1000n * ticksPerFrame1000, 1000);
  assert.equal(tc1000, '00:00:01:000');

  const roundTripTicks = timecodeToTicks64('00:00:01:500', 1000);
  assert.equal(roundTripTicks, 1500n * ticksPerFrame1000);
});

test('64-bit NLE timeline tools: Blade, Ripple, Rolling, Slip, Slide, Compound, and Magnetic Snap', () => {
  const baseClip: TimelineClip = {
    id: 'clip-1',
    trackId: 'v1',
    name: 'Master Plate',
    startTicks: 0n,
    durationTicks: 10n * TICKS_PER_SECOND_64,
    sourceStartTicks: 0n,
    color: 'bg-amber-500',
    speedMultiplier: 1.0,
  };

  // 1. Blade split at 4 seconds
  const split = splitClipAtTicks64(baseClip, 4n * TICKS_PER_SECOND_64);
  assert.ok(split);
  const [left, right] = split;
  assert.equal(left.durationTicks, 4n * TICKS_PER_SECOND_64);
  assert.equal(right.startTicks, 4n * TICKS_PER_SECOND_64);
  assert.equal(right.durationTicks, 6n * TICKS_PER_SECOND_64);
  assert.equal(right.sourceStartTicks, 4n * TICKS_PER_SECOND_64);

  // 2. Ripple trim left clip by +1 second shifts right clip start to 5s
  const rippled = rippleTrimClip64([left, right], left.id, 1n * TICKS_PER_SECOND_64);
  assert.equal(rippled[0].durationTicks, 5n * TICKS_PER_SECOND_64);
  assert.equal(rippled[1].startTicks, 5n * TICKS_PER_SECOND_64);

  // 3. Rolling edit between left and right by -1 second restores edit point to 4s
  const rolled = rollingEditClips64(rippled, left.id, -1n * TICKS_PER_SECOND_64);
  assert.equal(rolled[0].durationTicks, 4n * TICKS_PER_SECOND_64);
  assert.equal(rolled[1].startTicks, 4n * TICKS_PER_SECOND_64);
  assert.equal(rolled[1].durationTicks, 7n * TICKS_PER_SECOND_64);

  // 4. Slip & Slide
  const slipped = slipClipSource64(right, 2n * TICKS_PER_SECOND_64);
  assert.equal(slipped.sourceStartTicks, 6n * TICKS_PER_SECOND_64);

  const slid = slideClipPosition64(left, 1n * TICKS_PER_SECOND_64, 20n * TICKS_PER_SECOND_64);
  assert.equal(slid.startTicks, 1n * TICKS_PER_SECOND_64);

  // 5. Magnetic snap closes gaps
  const snapped = applyMagneticSnap64([
    { ...left, startTicks: 2n * TICKS_PER_SECOND_64 },
    { ...right, startTicks: 9n * TICKS_PER_SECOND_64 },
  ]);
  assert.equal(snapped[0].startTicks, 0n);
  assert.equal(snapped[1].startTicks, left.durationTicks);

  // 6. Compound clip creation
  const track: TimelineTrack = {
    id: 'v1',
    name: 'V1',
    type: 'video',
    isMuted: false,
    isLocked: false,
    color: 'bg-amber-500',
    clips: [left, right],
  };
  const compounded = createCompoundClip64(track, 'IMAX VFX Compound');
  assert.equal(compounded.clips.length, 1);
  assert.equal(compounded.clips[0].isCompoundClip, true);
  assert.equal(compounded.clips[0].nestedClips?.length, 2);
});

test('Real .cube 3D LUT generator and parser accurately extract metadata and color matrices', () => {
  const sampleCube = generateSampleCubeLutContent('Kodak_2383_ACES_Test', 4, {
    r: 1.08,
    g: 1.0,
    b: 0.9,
  });
  const parsed = parseCubeLutFile(sampleCube, 'Kodak_2383_ACES_Test.cube');

  assert.equal(parsed.title, 'Kodak_2383_ACES_Test');
  assert.equal(parsed.size, 4);
  assert.equal(parsed.sampleCount, 64); // 4 * 4 * 4 = 64 RGB rows
  assert.ok(parsed.averageTint.r > parsed.averageTint.b);
  assert.ok(parsed.cssFilterApproximation.includes('contrast('));
});

test('Timebase benchmark, 13 Pro Codecs, 11 AI VFX tools, and GPU tile grid validate cleanly', () => {
  const rows = benchmarkTimebaseAccuracy64();
  assert.equal(rows.length, 19);
  const fps1000Row = rows.find((r) => r.fps === 1000);
  assert.ok(fps1000Row);
  assert.equal(fps1000Row.exactDivision, true);
  assert.equal(fps1000Row.driftAfter24HoursMicroseconds, 0);

  assert.equal(PRO_CODECS.length, 13);
  assert.equal(DEFAULT_AI_VFX_TOOLS.length, 11);

  const tiles = generateRenderTileGrid(4, 6, 1024, 4);
  assert.equal(tiles.length, 24);
  assert.equal(tiles[0].tileResolution, '1024×1024');
});

test('Professional Audio Engine, Proxy scaling, and Color bit depth byte multipliers', () => {
  assert.ok(AUDIO_SAMPLE_RATES.includes(192000));
  assert.ok(AUDIO_SAMPLE_RATES.includes(176400));
  assert.ok(AUDIO_SAMPLE_RATES.includes(88200));

  const p16 = getProxyDimensions(32000, 32000, '1/16 Super Proxy');
  assert.equal(p16.width, 2000);
  assert.equal(p16.height, 2000);

  assert.equal(getBytesPerPixel('8-bit Integer'), 4);
  assert.equal(getBytesPerPixel('16-bit Half-Float'), 8);
  assert.equal(getBytesPerPixel('24-bit Studio RGB'), 12);
  assert.equal(getBytesPerPixel('32-bit Float'), 16);
  assert.equal(getBytesPerPixel('64-bit Float Master'), 32);
});
