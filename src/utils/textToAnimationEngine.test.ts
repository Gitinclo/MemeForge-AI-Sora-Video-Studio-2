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
  AI_CHARACTER_VOICE_PRESETS,
  synthesizeCharacterVoiceWavDataUri,
  buildDefaultShotVoiceoverMappings,
  applyCharacterPresetToVoiceoverClips,
  applyVoiceLibraryPresetToClips,
  attachCustomVoiceAudioToClips,
  validateVoiceUploadFile,
  inferCharacterAndShotFromFileName,
  resetVoiceClipToAiPreset,
} from './textToAnimationEngine';

describe('textToAnimationEngine (Global Visual Assets, 10-Shot Script & Custom Voice Upload)', () => {
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

  it('validates the 10-shot sequential script totals 45s native (1080 frames @ 24fps) and 50s Veo-normalized', () => {
    assert.equal(TEN_SHOT_ANIMATION_SCRIPT.length, 10);
    const summary = evaluateAnimationScriptSummary(TEN_SHOT_ANIMATION_SCRIPT, '1080p', 'fast');
    assert.equal(summary.shotCount, 10);
    assert.equal(summary.sceneCount, 3);
    assert.equal(summary.totalScriptDurationSec, 45);
    assert.equal(summary.totalFramesAt24Fps, 1080);
    assert.equal(summary.totalVeoNormalizedDurationSec, 50);
    assert.equal(summary.durationNormalizedShots.length, 5);
    assert.equal(summary.estimatedVeoFast1080pUsd, 6.0);
    assert.equal(summary.estimatedOmniFlash720pNativeUsd, 4.5);
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

  it('builds 10-shot Character Voiceover mappings for Lin_Jie and Ji_Zhixiu and supports AI preset switching & custom uploads', () => {
    assert.equal(AI_CHARACTER_VOICE_PRESETS.length, 8);
    const wavUri = synthesizeCharacterVoiceWavDataUri('Such a heavy downpour.', 'Character_A', 0.92, 1.5);
    assert.ok(wavUri.startsWith('data:audio/wav;base64,'));

    const mappings = buildDefaultShotVoiceoverMappings(TEN_SHOT_ANIMATION_SCRIPT);
    assert.equal(mappings.length, 12);
    assert.equal(mappings[0].speakerHandle, 'Lin_Jie');
    assert.equal(mappings[0].geminiVoiceName, 'Charon');

    const shot05Clip = mappings.find((c) => c.shotId === 'shot_05');
    assert.ok(shot05Clip);
    assert.equal(shot05Clip.speakerHandle, 'Ji_Zhixiu');
    assert.equal(shot05Clip.geminiVoiceName, 'Kore');

    const switched = applyCharacterPresetToVoiceoverClips(
      mappings,
      'Character_A',
      'lin_fenrir_mysterious_sage'
    );
    assert.equal(switched[0].geminiVoiceName, 'Fenrir');

    const withUpload = attachCustomVoiceAudioToClips(switched, {
      targetClipId: shot05Clip.clipId,
      audioDataUri: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      uploadedFileName: 'ji_zhixiu_take1.wav',
      sourceType: 'uploaded_file',
    });
    const updatedShot05 = withUpload.find((c) => c.clipId === shot05Clip.clipId)!;
    assert.equal(updatedShot05.sourceType, 'uploaded_file');
    assert.equal(updatedShot05.uploadedFileName, 'ji_zhixiu_take1.wav');

    // Reset back to AI preset
    const restored = resetVoiceClipToAiPreset(withUpload, {
      targetClipId: shot05Clip.clipId,
      selectedPresets: {
        Character_A: 'lin_fenrir_mysterious_sage',
        Character_B: 'ji_kore_cold_vigilant',
      },
    });
    const restoredShot05 = restored.find((c) => c.clipId === shot05Clip.clipId)!;
    assert.equal(restoredShot05.sourceType, 'ai_preset');
    assert.equal(restoredShot05.uploadedFileName, undefined);
  });

  it('validates .mp3 and .wav custom voice uploads and auto-infers character roles from filenames', () => {
    const mp3Check = validateVoiceUploadFile('lin_jie_greeting.mp3', 'audio/mpeg', 204800);
    assert.equal(mp3Check.valid, true);
    assert.equal(mp3Check.normalizedFormat, 'MP3');

    const wavCheck = validateVoiceUploadFile('ji_zhixiu_shot05.wav', 'audio/wav', 512000);
    assert.equal(wavCheck.valid, true);
    assert.equal(wavCheck.normalizedFormat, 'WAV');

    const badFormatCheck = validateVoiceUploadFile('script_notes.txt', 'text/plain', 1024);
    assert.equal(badFormatCheck.valid, false);
    assert.ok(badFormatCheck.error?.includes('Only .mp3 and .wav'));

    const inferredJi = inferCharacterAndShotFromFileName('ji_zhixiu_shot05_whisper.wav');
    assert.equal(inferredJi.characterToken, 'Character_B');
    assert.equal(inferredJi.speakerHandle, 'Ji_Zhixiu');
    assert.equal(inferredJi.shotId, 'shot_05');
    assert.equal(inferredJi.confidence, 'filename_match');

    const inferredLin = inferCharacterAndShotFromFileName('shopkeeper_lin_jie_s08.mp3');
    assert.equal(inferredLin.characterToken, 'Character_A');
    assert.equal(inferredLin.speakerHandle, 'Lin_Jie');
    assert.equal(inferredLin.shotId, 'shot_08');
  });

  it('applies pre-generated AI character voices from the Voice Library dropdown to a role or single clip', () => {
    const mappings = buildDefaultShotVoiceoverMappings(TEN_SHOT_ANIMATION_SCRIPT);
    const shot09Clip = mappings.find((c) => c.shotId === 'shot_09')!;

    // Apply 'ji_kore_blade_interrogation' to Shot 09 clip only
    const singleUpdated = applyVoiceLibraryPresetToClips(
      mappings,
      'ji_kore_blade_interrogation',
      { targetClipId: shot09Clip.clipId }
    );
    const updatedShot09 = singleUpdated.find((c) => c.clipId === shot09Clip.clipId)!;
    assert.equal(updatedShot09.presetId, 'ji_kore_blade_interrogation');
    assert.equal(updatedShot09.sourceType, 'ai_preset');

    // Apply 'lin_charon_ominous_calm' across all Character_A (Lin_Jie) lines
    const roleUpdated = applyVoiceLibraryPresetToClips(
      singleUpdated,
      'lin_charon_ominous_calm',
      { targetCharacterToken: 'Character_A' }
    );
    const linClips = roleUpdated.filter((c) => c.characterToken === 'Character_A');
    assert.ok(linClips.every((c) => c.presetId === 'lin_charon_ominous_calm'));
  });
});
