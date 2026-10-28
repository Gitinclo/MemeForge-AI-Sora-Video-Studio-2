import {
  MemeTransitionConfig,
  MemeTransitionType,
  SlideDirection,
  TransitionEasing,
} from '../types/meme';

export interface TransitionPresetMeta {
  id: MemeTransitionType;
  label: string;
  description: string;
  badge: string;
}

export const MEME_TRANSITION_PRESETS: TransitionPresetMeta[] = [
  {
    id: 'none',
    label: 'Instant',
    description: 'Immediate cut between meme templates with no transition animation',
    badge: 'CUT',
  },
  {
    id: 'fade',
    label: 'Fade',
    description: 'Smooth alpha cross-fade blending outgoing and incoming meme backgrounds',
    badge: 'ALPHA',
  },
  {
    id: 'slide',
    label: 'Slide',
    description: 'Directional push transition sliding the new template across the viewport',
    badge: 'MOTION',
  },
  {
    id: 'dissolve',
    label: 'Dissolve',
    description: 'Procedural mosaic matrix dissolve between meme backgrounds',
    badge: 'MATRIX',
  },
];

export const DEFAULT_MEME_TRANSITION_CONFIG: MemeTransitionConfig = {
  type: 'fade',
  durationMs: 650,
  easing: 'easeInOutCubic',
  slideDirection: 'left',
  dissolveGridSize: 16,
};

/**
 * Clamps normalized transition progress to [0, 1].
 */
export function clampTransitionProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 1;
  return Math.max(0, Math.min(1, progress));
}

/**
 * Applies a mathematical easing curve to a normalized [0, 1] progress value.
 */
export function applyTransitionEasing(
  progress: number,
  easing: TransitionEasing = 'easeInOutCubic'
): number {
  const t = clampTransitionProgress(progress);
  switch (easing) {
    case 'linear':
      return t;
    case 'easeOutQuart':
      return 1 - Math.pow(1 - t, 4);
    case 'easeInOutCubic':
    default:
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

/**
 * Computes object-fit: cover drawing coordinates for an image inside a target canvas.
 */
export function computeCoverDrawRect(
  imgWidth: number,
  imgHeight: number,
  canvasWidth: number,
  canvasHeight: number
): { drawX: number; drawY: number; drawW: number; drawH: number } {
  const safeImgW = Math.max(1, imgWidth);
  const safeImgH = Math.max(1, imgHeight);
  const safeCanvasW = Math.max(1, canvasWidth);
  const safeCanvasH = Math.max(1, canvasHeight);

  const imgAspect = safeImgW / safeImgH;
  const canvasAspect = safeCanvasW / safeCanvasH;

  let drawW = safeCanvasW;
  let drawH = safeCanvasH;
  let drawX = 0;
  let drawY = 0;

  if (imgAspect > canvasAspect) {
    drawH = safeCanvasH;
    drawW = safeCanvasH * imgAspect;
    drawX = (safeCanvasW - drawW) / 2;
  } else {
    drawW = safeCanvasW;
    drawH = safeCanvasW / imgAspect;
    drawY = (safeCanvasH - drawH) / 2;
  }

  return { drawX, drawY, drawW, drawH };
}

/**
 * Computes cross-fade alpha weights for outgoing and incoming images.
 */
export function computeFadeWeights(
  progress: number,
  easing: TransitionEasing = 'easeInOutCubic'
): { outgoingAlpha: number; incomingAlpha: number } {
  const eased = applyTransitionEasing(progress, easing);
  return {
    outgoingAlpha: Number((1 - eased).toFixed(4)),
    incomingAlpha: Number(eased.toFixed(4)),
  };
}

/**
 * Computes pixel translation offsets for a directional slide transition.
 */
export function computeSlideOffsets(
  progress: number,
  canvasWidth: number,
  canvasHeight: number,
  direction: SlideDirection = 'left',
  easing: TransitionEasing = 'easeInOutCubic'
): {
  outgoingOffsetX: number;
  outgoingOffsetY: number;
  incomingOffsetX: number;
  incomingOffsetY: number;
} {
  const eased = applyTransitionEasing(progress, easing);
  const norm = (v: number) => (Object.is(v, -0) ? 0 : v);

  switch (direction) {
    case 'right':
      return {
        outgoingOffsetX: norm(eased * canvasWidth),
        outgoingOffsetY: 0,
        incomingOffsetX: norm((eased - 1) * canvasWidth),
        incomingOffsetY: 0,
      };
    case 'up':
      return {
        outgoingOffsetX: 0,
        outgoingOffsetY: norm(-eased * canvasHeight),
        incomingOffsetX: 0,
        incomingOffsetY: norm((1 - eased) * canvasHeight),
      };
    case 'down':
      return {
        outgoingOffsetX: 0,
        outgoingOffsetY: norm(eased * canvasHeight),
        incomingOffsetX: 0,
        incomingOffsetY: norm((eased - 1) * canvasHeight),
      };
    case 'left':
    default:
      return {
        outgoingOffsetX: norm(-eased * canvasWidth),
        outgoingOffsetY: 0,
        incomingOffsetX: norm((1 - eased) * canvasWidth),
        incomingOffsetY: 0,
      };
  }
}

/**
 * Deterministic spatial hash in [0, 1) for a dissolve grid cell (row, col).
 * Ensures smooth, flicker-free procedural dissolve across frames.
 */
export function getDissolveCellThreshold(
  row: number,
  col: number,
  totalRows: number,
  totalCols: number
): number {
  const safeRows = Math.max(1, totalRows);
  const safeCols = Math.max(1, totalCols);
  const cellIndex = row * safeCols + col;
  // Golden-ratio Weyl sequence mixed with spatial coordinates for uniform 2D dispersion
  const hash = Math.sin(cellIndex * 12.9898 + row * 78.233 + col * 37.719) * 43758.5453;
  const fractional = hash - Math.floor(hash);
  // Normalize cleanly inside (0, 1) so progress=0 shows 0% incoming and progress=1 shows 100% incoming
  const totalCells = safeRows * safeCols;
  return Math.min(0.9999, Math.max(0.0001, (fractional * (totalCells - 1) + 0.5) / totalCells));
}

/**
 * Determines whether a given dissolve cell should reveal the incoming image at the current progress.
 */
export function shouldRevealDissolveCell(
  row: number,
  col: number,
  totalRows: number,
  totalCols: number,
  progress: number,
  easing: TransitionEasing = 'easeInOutCubic'
): boolean {
  const eased = applyTransitionEasing(progress, easing);
  if (eased <= 0) return false;
  if (eased >= 1) return true;
  const threshold = getDissolveCellThreshold(row, col, totalRows, totalCols);
  return eased >= threshold;
}

function drawCoverImageOrFallback(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  canvasWidth: number,
  canvasHeight: number,
  offsetX = 0,
  offsetY = 0,
  fallbackColors: [string, string] = ['#1e293b', '#0f172a']
): void {
  if (image && image.width > 0 && image.height > 0) {
    const { drawX, drawY, drawW, drawH } = computeCoverDrawRect(
      image.width,
      image.height,
      canvasWidth,
      canvasHeight
    );
    ctx.drawImage(image, drawX + offsetX, drawY + offsetY, drawW, drawH);
  } else {
    const grad = ctx.createLinearGradient(
      offsetX,
      offsetY,
      offsetX + canvasWidth,
      offsetY + canvasHeight
    );
    grad.addColorStop(0, fallbackColors[0]);
    grad.addColorStop(1, fallbackColors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(offsetX, offsetY, canvasWidth, canvasHeight);
  }
}

/**
 * Renders the background image transition frame onto a 2D canvas context.
 * Supports 'none', 'fade', 'slide', and 'dissolve' transitions.
 */
export function renderCanvasTransitionBackground(
  ctx: CanvasRenderingContext2D,
  params: {
    outgoingImage: HTMLImageElement | null;
    incomingImage: HTMLImageElement | null;
    canvasWidth: number;
    canvasHeight: number;
    progress: number;
    config: MemeTransitionConfig;
  }
): void {
  const {
    outgoingImage,
    incomingImage,
    canvasWidth,
    canvasHeight,
    progress,
    config,
  } = params;

  const clamped = clampTransitionProgress(progress);

  // Fast path: no active transition or transition completed
  if (config.type === 'none' || clamped >= 1) {
    drawCoverImageOrFallback(ctx, incomingImage, canvasWidth, canvasHeight);
    return;
  }

  if (config.type === 'fade') {
    const { outgoingAlpha, incomingAlpha } = computeFadeWeights(clamped, config.easing);

    ctx.save();
    ctx.globalAlpha = outgoingAlpha;
    drawCoverImageOrFallback(
      ctx,
      outgoingImage,
      canvasWidth,
      canvasHeight,
      0,
      0,
      ['#312e81', '#0f172a']
    );
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = incomingAlpha;
    drawCoverImageOrFallback(ctx, incomingImage, canvasWidth, canvasHeight);
    ctx.restore();
    return;
  }

  if (config.type === 'slide') {
    const {
      outgoingOffsetX,
      outgoingOffsetY,
      incomingOffsetX,
      incomingOffsetY,
    } = computeSlideOffsets(
      clamped,
      canvasWidth,
      canvasHeight,
      config.slideDirection,
      config.easing
    );

    // Draw outgoing image sliding out
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      Math.max(0, outgoingOffsetX),
      Math.max(0, outgoingOffsetY),
      canvasWidth - Math.abs(outgoingOffsetX),
      canvasHeight - Math.abs(outgoingOffsetY)
    );
    ctx.clip();
    drawCoverImageOrFallback(
      ctx,
      outgoingImage,
      canvasWidth,
      canvasHeight,
      outgoingOffsetX,
      outgoingOffsetY,
      ['#312e81', '#0f172a']
    );
    ctx.restore();

    // Draw incoming image sliding in
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      Math.max(0, incomingOffsetX),
      Math.max(0, incomingOffsetY),
      canvasWidth - Math.abs(incomingOffsetX),
      canvasHeight - Math.abs(incomingOffsetY)
    );
    ctx.clip();
    drawCoverImageOrFallback(
      ctx,
      incomingImage,
      canvasWidth,
      canvasHeight,
      incomingOffsetX,
      incomingOffsetY
    );
    ctx.restore();
    return;
  }

  if (config.type === 'dissolve') {
    const gridSize = Math.max(4, Math.min(48, config.dissolveGridSize || 16));
    const cellW = canvasWidth / gridSize;
    const cellH = canvasHeight / gridSize;

    // 1. Draw full outgoing image as base layer
    drawCoverImageOrFallback(
      ctx,
      outgoingImage,
      canvasWidth,
      canvasHeight,
      0,
      0,
      ['#312e81', '#0f172a']
    );

    // 2. Build composite clipping path for all revealed incoming dissolve cells
    ctx.save();
    ctx.beginPath();
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (
          shouldRevealDissolveCell(
            row,
            col,
            gridSize,
            gridSize,
            clamped,
            config.easing
          )
        ) {
          // +0.6px overlap prevents subpixel hairlines between adjacent revealed tiles
          ctx.rect(col * cellW, row * cellH, cellW + 0.6, cellH + 0.6);
        }
      }
    }
    ctx.clip();
    drawCoverImageOrFallback(ctx, incomingImage, canvasWidth, canvasHeight);
    ctx.restore();
  }
}
