/**
 * Shared Core Engine Utilities
 * Standardized pure helper functions, storage persistence adapters,
 * numeric clampers, and URI/file formatters shared across all MemeForge AI
 * Studio engines (Enterprise B2B, Audio, Cinema VFX, LEO 8K, PPP, YouTube).
 */

export const MEMEFORGE_SUBSCRIPTION_STORAGE_KEY = 'memeforge_subscription';
export const MEMEFORGE_AUTOSAVE_STORAGE_KEY = 'memeforge_autosave_layout';
export const MEMEFORGE_AUTOSAVE_INTERVAL_MS = 30_000;

/**
 * Clamps a numeric value within an inclusive [min, max] range.
 * Returns fallback (defaults to min) if value is NaN or non-finite.
 */
export function clampNumber(
  value: number,
  min: number,
  max: number,
  fallback: number = min
): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

/**
 * Encodes an raw SVG markup string into a UTF-8 data URI that never 404s.
 */
export function encodeSvgDataUri(svgMarkup: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup.trim())}`;
}

/**
 * Formats a byte count into a human-readable unit string (B, KB, MB, GB, TB).
 */
export function formatByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  if (bytes >= 1024 ** 4) {
    return `${(bytes / 1024 ** 4).toFixed(2)} TB`;
  }
  if (bytes >= 1024 ** 3) {
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }
  if (bytes >= 1024 ** 2) {
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${Math.round(bytes)} B`;
}

/**
 * Generates a prefixed identifier suitable for client-side jobs, layers, and snapshots.
 */
export function createPrefixedId(prefix: string, seedTimestamp: number = Date.now()): string {
  const cleanPrefix = prefix.trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'id';
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${cleanPrefix}-${seedTimestamp}-${randomSuffix}`;
}

/**
 * Safely reads and parses a JSON value from localStorage with fallback support.
 */
export function readStorageJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely serializes and writes a JSON value to localStorage.
 */
export function writeStorageJson<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Triggers a browser file download from either a Blob or a Data/Object URL.
 */
export function triggerBrowserDownload(
  source: Blob | string,
  fileName: string,
  revokeDelayMs: number = 1500
): void {
  if (typeof document === 'undefined') return;

  const isBlob = typeof source !== 'string';
  const url = isBlob ? URL.createObjectURL(source) : source;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (isBlob) {
    setTimeout(() => URL.revokeObjectURL(url), revokeDelayMs);
  }
}
