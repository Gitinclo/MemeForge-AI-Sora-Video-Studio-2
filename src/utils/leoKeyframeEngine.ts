/**
 * LEO Video Studio — Timeline Keyframe Animation Engine
 *
 * Provides deterministic keyframe storage, sorting, easing curves,
 * and real-time property interpolation (position X/Y, scale, rotation)
 * for text layers across timeline scrubbing and video export.
 */

import { clampNumber, createPrefixedId } from './sharedCoreEngine';

export type KeyframeEasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export type KeyframeMotionPresetId =
  | 'cinematic_zoom_in'
  | 'slide_across'
  | 'spin_drop'
  | 'lower_third_rise'
  | 'static_center';

export interface LeoTextKeyframe {
  id: string;
  /** Normalized timeline position in [0, 1] */
  timeProgress: number;
  /** Horizontal canvas position percentage in [0, 100] */
  x: number;
  /** Vertical canvas position percentage in [0, 100] */
  y: number;
  /** Scale multiplier in [0.2, 4.0] */
  scale: number;
  /** Rotation angle in degrees [-360, 360] */
  rotation: number;
  /** Easing curve applied when interpolating toward this keyframe */
  easing: KeyframeEasingType;
}

export interface LeoAnimatedTextLayer {
  id: string;
  text: string;
  color: string;
  strokeColor: string;
  fontSize: number;
  visible: boolean;
  keyframes: LeoTextKeyframe[];
}

export interface InterpolatedTextTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  activeKeyframeId: string | null;
  prevKeyframeId: string | null;
  nextKeyframeId: string | null;
  localFactor: number;
}

const normZero = (v: number): number => (Object.is(v, -0) ? 0 : v);

/**
 * Evaluates a normalized [0, 1] progression factor with the specified easing curve.
 */
export function applyKeyframeEasing(
  t: number,
  easing: KeyframeEasingType = 'easeInOut'
): number {
  const clamped = clampNumber(t, 0, 1);
  switch (easing) {
    case 'linear':
      return normZero(clamped);
    case 'easeIn':
      return normZero(clamped * clamped);
    case 'easeOut':
      return normZero(1 - (1 - clamped) * (1 - clamped));
    case 'easeInOut':
    default:
      return normZero(
        clamped < 0.5
          ? 2 * clamped * clamped
          : 1 - Math.pow(-2 * clamped + 2, 2) / 2
      );
  }
}

/**
 * Returns a new array of keyframes sorted ascending by `timeProgress` (clamped to [0, 1]).
 */
export function sortKeyframesByTime(
  keyframes: LeoTextKeyframe[]
): LeoTextKeyframe[] {
  return [...keyframes]
    .map((kf) => ({
      ...kf,
      timeProgress: clampNumber(kf.timeProgress, 0, 1),
      x: clampNumber(kf.x, 0, 100),
      y: clampNumber(kf.y, 0, 100),
      scale: clampNumber(kf.scale, 0.2, 4.0),
      rotation: clampNumber(kf.rotation, -360, 360),
    }))
    .sort((a, b) => a.timeProgress - b.timeProgress);
}

/**
 * Interpolates a text layer's (x, y, scale, rotation) properties at a given
 * normalized timeline position `timeProgress` in [0, 1].
 */
export function interpolateLayerTransform(
  layer: LeoAnimatedTextLayer,
  timeProgress: number,
  snapTolerance = 0.015
): InterpolatedTextTransform {
  const t = clampNumber(timeProgress, 0, 1);
  const sorted = sortKeyframesByTime(layer.keyframes);

  if (sorted.length === 0) {
    return {
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      activeKeyframeId: null,
      prevKeyframeId: null,
      nextKeyframeId: null,
      localFactor: 0,
    };
  }

  // Check if playhead is snapped onto an existing keyframe
  const snapped = sorted.find(
    (kf) => Math.abs(kf.timeProgress - t) <= snapTolerance
  );

  const first = sorted[0];
  if (sorted.length === 1 || t <= first.timeProgress) {
    return {
      x: normZero(first.x),
      y: normZero(first.y),
      scale: normZero(first.scale),
      rotation: normZero(first.rotation),
      activeKeyframeId: snapped ? snapped.id : null,
      prevKeyframeId: first.id,
      nextKeyframeId: first.id,
      localFactor: 0,
    };
  }

  const last = sorted[sorted.length - 1];
  if (t >= last.timeProgress) {
    return {
      x: normZero(last.x),
      y: normZero(last.y),
      scale: normZero(last.scale),
      rotation: normZero(last.rotation),
      activeKeyframeId: snapped ? snapped.id : null,
      prevKeyframeId: last.id,
      nextKeyframeId: last.id,
      localFactor: 1,
    };
  }

  // Find bracketing keyframes [prev, next]
  let prev = first;
  let next = last;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].timeProgress && t <= sorted[i + 1].timeProgress) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }

  const span = next.timeProgress - prev.timeProgress;
  const rawFactor = span > 1e-6 ? (t - prev.timeProgress) / span : 0;
  const easedFactor = applyKeyframeEasing(rawFactor, next.easing);

  const lerp = (a: number, b: number, f: number): number =>
    normZero(Math.round((a + (b - a) * f) * 100) / 100);

  return {
    x: lerp(prev.x, next.x, easedFactor),
    y: lerp(prev.y, next.y, easedFactor),
    scale: lerp(prev.scale, next.scale, easedFactor),
    rotation: lerp(prev.rotation, next.rotation, easedFactor),
    activeKeyframeId: snapped ? snapped.id : null,
    prevKeyframeId: prev.id,
    nextKeyframeId: next.id,
    localFactor: easedFactor,
  };
}

/**
 * Inserts a new keyframe or updates an existing keyframe within `snapTolerance` of `timeProgress`.
 */
export function upsertLayerKeyframe(
  layer: LeoAnimatedTextLayer,
  input: Omit<LeoTextKeyframe, 'id'> & { id?: string },
  snapTolerance = 0.015
): LeoAnimatedTextLayer {
  const clampedTime = clampNumber(input.timeProgress, 0, 1);
  const clampedKf: LeoTextKeyframe = {
    id: input.id || createPrefixedId('kf'),
    timeProgress: Math.round(clampedTime * 1000) / 1000,
    x: clampNumber(input.x, 0, 100),
    y: clampNumber(input.y, 0, 100),
    scale: clampNumber(input.scale, 0.2, 4.0),
    rotation: clampNumber(input.rotation, -360, 360),
    easing: input.easing || 'easeInOut',
  };

  const existingIndex = layer.keyframes.findIndex(
    (kf) =>
      (input.id && kf.id === input.id) ||
      Math.abs(kf.timeProgress - clampedKf.timeProgress) <= snapTolerance
  );

  let updated: LeoTextKeyframe[];
  if (existingIndex >= 0) {
    updated = layer.keyframes.map((kf, idx) =>
      idx === existingIndex
        ? { ...clampedKf, id: kf.id }
        : kf
    );
  } else {
    updated = [...layer.keyframes, clampedKf];
  }

  return {
    ...layer,
    keyframes: sortKeyframesByTime(updated),
  };
}

/**
 * Deletes a keyframe by ID while ensuring at least 1 keyframe always remains on the layer.
 */
export function removeLayerKeyframe(
  layer: LeoAnimatedTextLayer,
  keyframeId: string
): LeoAnimatedTextLayer {
  if (layer.keyframes.length <= 1) {
    return layer;
  }
  const filtered = layer.keyframes.filter((kf) => kf.id !== keyframeId);
  return {
    ...layer,
    keyframes: sortKeyframesByTime(
      filtered.length > 0 ? filtered : [layer.keyframes[0]]
    ),
  };
}

/**
 * Applies a pre-authored keyframe motion preset (Position, Scale, Rotation over time) to a text layer.
 */
export function applyMotionPresetToLayer(
  layer: LeoAnimatedTextLayer,
  presetId: KeyframeMotionPresetId
): LeoAnimatedTextLayer {
  let keyframes: LeoTextKeyframe[];

  switch (presetId) {
    case 'cinematic_zoom_in':
      keyframes = [
        {
          id: createPrefixedId('kf'),
          timeProgress: 0,
          x: 50,
          y: 78,
          scale: 0.65,
          rotation: 0,
          easing: 'easeOut',
        },
        {
          id: createPrefixedId('kf'),
          timeProgress: 0.5,
          x: 50,
          y: 74,
          scale: 1.15,
          rotation: 0,
          easing: 'easeInOut',
        },
        {
          id: createPrefixedId('kf'),
          timeProgress: 1,
          x: 50,
          y: 72,
          scale: 1.45,
          rotation: 0,
          easing: 'easeOut',
        },
      ];
      break;

    case 'slide_across':
      keyframes = [
        {
          id: createPrefixedId('kf'),
          timeProgress: 0,
          x: 15,
          y: 22,
          scale: 0.9,
          rotation: -6,
          easing: 'easeOut',
        },
        {
          id: createPrefixedId('kf'),
          timeProgress: 0.5,
          x: 50,
          y: 22,
          scale: 1.1,
          rotation: 0,
          easing: 'easeInOut',
        },
        {
          id: createPrefixedId('kf'),
          timeProgress: 1,
          x: 85,
          y: 22,
          scale: 0.9,
          rotation: 6,
          easing: 'easeIn',
        },
      ];
      break;

    case 'spin_drop':
      keyframes = [
        {
          id: createPrefixedId('kf'),
          timeProgress: 0,
          x: 50,
          y: 18,
          scale: 0.4,
          rotation: -180,
          easing: 'easeOut',
        },
        {
          id: createPrefixedId('kf'),
          timeProgress: 0.55,
          x: 50,
          y: 52,
          scale: 1.25,
          rotation: 0,
          easing: 'easeInOut',
        },
        {
          id: createPrefixedId('kf'),
          timeProgress: 1,
          x: 50,
          y: 50,
          scale: 1.0,
          rotation: 12,
          easing: 'easeOut',
        },
      ];
      break;

    case 'lower_third_rise':
      keyframes = [
        {
          id: createPrefixedId('kf'),
          timeProgress: 0,
          x: 28,
          y: 92,
          scale: 0.75,
          rotation: 0,
          easing: 'easeOut',
        },
        {
          id: createPrefixedId('kf'),
          timeProgress: 0.35,
          x: 28,
          y: 80,
          scale: 1.0,
          rotation: 0,
          easing: 'easeInOut',
        },
        {
          id: createPrefixedId('kf'),
          timeProgress: 1,
          x: 32,
          y: 80,
          scale: 1.05,
          rotation: 0,
          easing: 'linear',
        },
      ];
      break;

    case 'static_center':
    default:
      keyframes = [
        {
          id: createPrefixedId('kf'),
          timeProgress: 0,
          x: 50,
          y: 50,
          scale: 1.0,
          rotation: 0,
          easing: 'linear',
        },
        {
          id: createPrefixedId('kf'),
          timeProgress: 1,
          x: 50,
          y: 50,
          scale: 1.0,
          rotation: 0,
          easing: 'linear',
        },
      ];
      break;
  }

  return {
    ...layer,
    keyframes: sortKeyframesByTime(keyframes),
  };
}

export const DEFAULT_LEO_ANIMATED_TEXT_LAYERS: LeoAnimatedTextLayer[] = [
  {
    id: 'leo_layer_title',
    text: 'NEON ODYSSEY: HYPER-REALITY',
    color: '#ffffff',
    strokeColor: '#000000',
    fontSize: 32,
    visible: true,
    keyframes: [
      {
        id: 'kf_init_0',
        timeProgress: 0,
        x: 50,
        y: 78,
        scale: 0.85,
        rotation: -3,
        easing: 'easeOut',
      },
      {
        id: 'kf_init_50',
        timeProgress: 0.5,
        x: 50,
        y: 72,
        scale: 1.15,
        rotation: 0,
        easing: 'easeInOut',
      },
      {
        id: 'kf_init_100',
        timeProgress: 1,
        x: 50,
        y: 68,
        scale: 1.35,
        rotation: 3,
        easing: 'easeOut',
      },
    ],
  },
  {
    id: 'leo_layer_subtitle',
    text: 'DIRECTED IN LEO 8K STUDIO',
    color: '#22d3ee',
    strokeColor: '#0f172a',
    fontSize: 18,
    visible: true,
    keyframes: [
      {
        id: 'kf_sub_0',
        timeProgress: 0,
        x: 25,
        y: 16,
        scale: 0.8,
        rotation: 0,
        easing: 'easeOut',
      },
      {
        id: 'kf_sub_100',
        timeProgress: 1,
        x: 75,
        y: 16,
        scale: 1.05,
        rotation: 0,
        easing: 'easeInOut',
      },
    ],
  },
];
