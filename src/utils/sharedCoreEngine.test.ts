import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampNumber,
  encodeSvgDataUri,
  formatByteSize,
  createPrefixedId,
  readStorageJson,
  writeStorageJson,
  MEMEFORGE_AUTOSAVE_INTERVAL_MS,
  ORIGINAL_AISTUDIO_APPLET_ID,
  ORIGINAL_AISTUDIO_APPLET_URL,
  extractAiStudioAppletId,
  buildAiStudioAppletUrl,
} from './sharedCoreEngine';

test('clampNumber clamps within inclusive bounds and handles NaN', () => {
  assert.equal(clampNumber(50, 0, 100), 50);
  assert.equal(clampNumber(-10, 0, 100), 0);
  assert.equal(clampNumber(250, 0, 100), 100);
  assert.equal(clampNumber(Number.NaN, 5, 20), 5);
  assert.equal(clampNumber(Number.NaN, 5, 20, 12), 12);
});

test('encodeSvgDataUri produces valid UTF-8 SVG data URI', () => {
  const uri = encodeSvgDataUri('  <svg width="10" height="10"></svg>  ');
  assert.equal(uri.startsWith('data:image/svg+xml;utf8,'), true);
  assert.equal(decodeURIComponent(uri.replace('data:image/svg+xml;utf8,', '')), '<svg width="10" height="10"></svg>');
});

test('formatByteSize formats bytes across B, KB, MB, GB, and TB scales', () => {
  assert.equal(formatByteSize(0), '0 B');
  assert.equal(formatByteSize(-500), '0 B');
  assert.equal(formatByteSize(512), '512 B');
  assert.equal(formatByteSize(2048), '2 KB');
  assert.equal(formatByteSize(5 * 1024 * 1024), '5.0 MB');
  assert.equal(formatByteSize(2.5 * 1024 ** 3), '2.50 GB');
  assert.equal(formatByteSize(1.25 * 1024 ** 4), '1.25 TB');
});

test('createPrefixedId generates sanitized prefix with timestamp and 3-digit suffix', () => {
  const id = createPrefixedId('eval job!', 1700000000000);
  assert.match(id, /^evaljob-1700000000000-\d{3}$/);
});

test('readStorageJson and writeStorageJson safely handle non-browser Node environments', () => {
  const fallback = { ok: true };
  assert.deepEqual(readStorageJson('test_key', fallback), fallback);
  assert.equal(writeStorageJson('test_key', fallback), false);
  assert.equal(MEMEFORGE_AUTOSAVE_INTERVAL_MS, 30000);
});

test('extractAiStudioAppletId and buildAiStudioAppletUrl resolve original applet URL accurately', () => {
  assert.equal(
     extractAiStudioAppletId('https://ai.studio/apps/4d0cb3f2-610b-4819-909e-06de8300dcfb?fullscreenApplet=true'),
    ORIGINAL_AISTUDIO_APPLET_ID
  );
  assert.equal(extractAiStudioAppletId('invalid-input'), null);
  assert.equal(buildAiStudioAppletUrl(ORIGINAL_AISTUDIO_APPLET_ID, true), ORIGINAL_AISTUDIO_APPLET_URL);
  assert.equal(
    buildAiStudioAppletUrl(ORIGINAL_AISTUDIO_APPLET_URL, false),
    'https://ai.studio/apps/4d0cb3f2-610b-4819-909e-06de8300dcfb'
  );
});
