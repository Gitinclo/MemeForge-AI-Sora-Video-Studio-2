import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LEO_ANIMATED_TEXT_LAYERS,
  LeoAnimatedTextLayer,
  applyKeyframeEasing,
  sortKeyframesByTime,
  interpolateLayerTransform,
  upsertLayerKeyframe,
  removeLayerKeyframe,
  applyMotionPresetToLayer,
} from './leoKeyframeEngine';

describe('leoKeyframeEngine — LEO Video Studio Timeline Keyframe System', () => {
  it('evaluates linear, easeIn, easeOut, and easeInOut easing curves accurately', () => {
    assert.strictEqual(applyKeyframeEasing(0, 'linear'), 0);
    assert.strictEqual(applyKeyframeEasing(0.5, 'linear'), 0.5);
    assert.strictEqual(applyKeyframeEasing(1, 'linear'), 1);

    assert.strictEqual(applyKeyframeEasing(0.5, 'easeIn'), 0.25);
    assert.strictEqual(applyKeyframeEasing(0.5, 'easeOut'), 0.75);
    assert.strictEqual(applyKeyframeEasing(0.5, 'easeInOut'), 0.5);

    // Clamps out-of-range inputs
    assert.strictEqual(applyKeyframeEasing(-0.5, 'linear'), 0);
    assert.strictEqual(applyKeyframeEasing(1.5, 'linear'), 1);
  });

  it('sorts keyframes ascending by timeProgress and clamps property bounds', () => {
    const unsorted = [
      { id: 'k2', timeProgress: 0.9, x: 120, y: -10, scale: 8, rotation: 500, easing: 'linear' as const },
      { id: 'k1', timeProgress: 0.1, x: 20, y: 30, scale: 0.05, rotation: -45, easing: 'linear' as const },
    ];
    const sorted = sortKeyframesByTime(unsorted);
    assert.strictEqual(sorted[0].id, 'k1');
    assert.strictEqual(sorted[1].id, 'k2');
    assert.strictEqual(sorted[0].scale, 0.2); // clamped min
    assert.strictEqual(sorted[1].x, 100); // clamped max
    assert.strictEqual(sorted[1].y, 0); // clamped min
    assert.strictEqual(sorted[1].scale, 4.0); // clamped max
    assert.strictEqual(sorted[1].rotation, 360); // clamped max
  });

  it('interpolates position (x, y), scale, and rotation over time between keyframes', () => {
    const testLayer: LeoAnimatedTextLayer = {
      id: 'layer_test',
      text: 'HELLO LEO',
      color: '#ffffff',
      strokeColor: '#000000',
      fontSize: 30,
      visible: true,
      keyframes: [
        {
          id: 'kf_start',
          timeProgress: 0.0,
          x: 20,
          y: 30,
          scale: 1.0,
          rotation: -20,
          easing: 'linear',
        },
        {
          id: 'kf_end',
          timeProgress: 1.0,
          x: 80,
          y: 70,
          scale: 2.0,
          rotation: 20,
          easing: 'linear',
        },
      ],
    };

    const atStart = interpolateLayerTransform(testLayer, 0);
    assert.strictEqual(atStart.x, 20);
    assert.strictEqual(atStart.y, 30);
    assert.strictEqual(atStart.scale, 1.0);
    assert.strictEqual(atStart.rotation, -20);
    assert.strictEqual(atStart.activeKeyframeId, 'kf_start');

    const atMid = interpolateLayerTransform(testLayer, 0.5);
    assert.strictEqual(atMid.x, 50);
    assert.strictEqual(atMid.y, 50);
    assert.strictEqual(atMid.scale, 1.5);
    assert.strictEqual(atMid.rotation, 0);
    assert.strictEqual(atMid.activeKeyframeId, null);

    const atEnd = interpolateLayerTransform(testLayer, 1.0);
    assert.strictEqual(atEnd.x, 80);
    assert.strictEqual(atEnd.y, 70);
    assert.strictEqual(atEnd.scale, 2.0);
    assert.strictEqual(atEnd.rotation, 20);
    assert.strictEqual(atEnd.activeKeyframeId, 'kf_end');
  });

  it('upserts new keyframes and updates existing keyframes within snap tolerance', () => {
    let layer = DEFAULT_LEO_ANIMATED_TEXT_LAYERS[0];
    const initialCount = layer.keyframes.length;

    // Insert a new keyframe at t = 0.25
    layer = upsertLayerKeyframe(layer, {
      timeProgress: 0.25,
      x: 42,
      y: 64,
      scale: 1.25,
      rotation: 15,
      easing: 'easeInOut',
    });
    assert.strictEqual(layer.keyframes.length, initialCount + 1);
    const inserted = layer.keyframes.find((k) => Math.abs(k.timeProgress - 0.25) < 0.01);
    assert.ok(inserted);
    assert.strictEqual(inserted.x, 42);
    assert.strictEqual(inserted.rotation, 15);

    // Update the existing keyframe at t = 0.255 (within 0.015 snap tolerance)
    layer = upsertLayerKeyframe(layer, {
      timeProgress: 0.255,
      x: 60,
      y: 40,
      scale: 1.8,
      rotation: -12,
      easing: 'easeOut',
    });
    assert.strictEqual(layer.keyframes.length, initialCount + 1);
    const updated = layer.keyframes.find((k) => k.id === inserted.id);
    assert.ok(updated);
    assert.strictEqual(updated.x, 60);
    assert.strictEqual(updated.scale, 1.8);
    assert.strictEqual(updated.rotation, -12);
  });

  it('removes keyframes while always retaining at least 1 keyframe on a layer', () => {
    let layer = DEFAULT_LEO_ANIMATED_TEXT_LAYERS[1]; // has 2 keyframes
    assert.strictEqual(layer.keyframes.length, 2);

    const firstId = layer.keyframes[0].id;
    layer = removeLayerKeyframe(layer, firstId);
    assert.strictEqual(layer.keyframes.length, 1);

    // Attempting to remove the last remaining keyframe preserves it
    const remainingId = layer.keyframes[0].id;
    layer = removeLayerKeyframe(layer, remainingId);
    assert.strictEqual(layer.keyframes.length, 1);
  });

  it('applies motion presets (cinematic_zoom_in, slide_across, spin_drop, lower_third_rise, static_center)', () => {
    const base = DEFAULT_LEO_ANIMATED_TEXT_LAYERS[0];
    for (const preset of [
      'cinematic_zoom_in',
      'slide_across',
      'spin_drop',
      'lower_third_rise',
      'static_center',
    ] as const) {
      const updated = applyMotionPresetToLayer(base, preset);
      assert.ok(updated.keyframes.length >= 2);
      assert.strictEqual(updated.keyframes[0].timeProgress, 0);
      assert.strictEqual(updated.keyframes[updated.keyframes.length - 1].timeProgress, 1);
    }
  });
});
