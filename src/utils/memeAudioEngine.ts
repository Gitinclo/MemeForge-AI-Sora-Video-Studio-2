import { MemeAudioEffect, MemeAudioConfig, SoundboardTriggerCue } from '../types/meme';
import { clampNumber, triggerBrowserDownload } from './sharedCoreEngine';

export type { MemeAudioEffect, MemeAudioConfig, SoundboardTriggerCue };

export const MEME_AUDIO_EFFECTS: MemeAudioEffect[] = [
  {
    id: 'airhorn',
    name: 'MLG Airhorn',
    category: 'Gaming',
    emoji: '📯',
    durationSec: 2.4,
    description: 'Iconic MLG triple airhorn blast for peak hype & triumph',
    type: 'builtin',
    tags: ['hype', 'mlg', 'loud', 'victory', 'airhorn'],
  },
  {
    id: 'sad_violin',
    name: 'Sad Violin',
    category: 'Dramatic',
    emoji: '🎻',
    durationSec: 4.0,
    description: 'Heartbreaking classical violin lament for tragic fails & Ls',
    type: 'builtin',
    tags: ['sad', 'crying', 'fail', 'loss', 'melodramatic'],
  },
  {
    id: 'laugh_track',
    name: 'Sitcom Laugh Track',
    category: 'Funny',
    emoji: '😂',
    durationSec: 3.2,
    description: 'Classic studio audience burst of hearty laughter',
    type: 'builtin',
    tags: ['comedy', 'audience', 'joke', 'laughter', 'funny'],
  },
  {
    id: 'vine_boom',
    name: 'Vine Boom',
    category: 'Dramatic',
    emoji: '💥',
    durationSec: 1.6,
    description: 'Earth-shattering sub-bass punch for shocking meme moments',
    type: 'builtin',
    tags: ['shock', 'impact', 'bass', 'vine', 'sus'],
  },
  {
    id: 'bruh',
    name: 'Bruh Sound Effect',
    category: 'Reactions',
    emoji: '🗿',
    durationSec: 1.4,
    description: 'Deep resonant deadpan "Bruh" vocal drop',
    type: 'builtin',
    tags: ['bruh', 'deadpan', 'disbelief', 'awkward', 'reaction'],
  },
  {
    id: 'titanic_flute',
    name: 'Titanic Recorder (Off-Key)',
    category: 'Funny',
    emoji: '🪈',
    durationSec: 3.8,
    description: 'Hilariously screechy and out-of-tune My Heart Will Go On recorder',
    type: 'builtin',
    tags: ['terrible', 'flute', 'titanic', 'hilarious', 'parody'],
  },
  {
    id: 'emotional_damage',
    name: 'Emotional Damage!',
    category: 'Reactions',
    emoji: '⚡',
    durationSec: 2.0,
    description: 'Dramatic Asian Dad quote impact with gong & punch',
    type: 'builtin',
    tags: ['damage', 'burn', 'roast', 'quote', 'savage'],
  },
  {
    id: 'windows_error',
    name: 'Windows Error Chime',
    category: 'Classic',
    emoji: '🔔',
    durationSec: 1.2,
    description: 'Retro system critical error stop chord from the XP era',
    type: 'builtin',
    tags: ['retro', 'error', 'crash', 'tech', 'xp'],
  },
  {
    id: 'metal_pipe',
    name: 'Metal Pipe Falling',
    category: 'Funny',
    emoji: '🔨',
    durationSec: 2.2,
    description: 'Unnecessarily loud resonant hollow metal pipe hitting the ground',
    type: 'builtin',
    tags: ['clatter', 'echo', 'loud', 'pipe', 'chaotic'],
  },
  {
    id: 'curb_enthusiasm',
    name: 'Curb Your Meme (Frolic)',
    category: 'Classic',
    emoji: '🎷',
    durationSec: 4.2,
    description: 'Bouncy tuba and clarinet staccato intro for instant awkward irony',
    type: 'builtin',
    tags: ['awkward', 'frolic', 'credits', 'irony', 'curb'],
  },
  {
    id: 'gigachad',
    name: 'Giga Chad Phonk Bass',
    category: 'Gaming',
    emoji: '🎶',
    durationSec: 3.5,
    description: 'Heavy distorted 808 cowbell phonk groove for pure sigma energy',
    type: 'builtin',
    tags: ['sigma', 'gigachad', 'phonk', 'bass', 'chad'],
  },
  {
    id: 'dun_dun_dun',
    name: 'Dramatic Dun Dun Dun!',
    category: 'Dramatic',
    emoji: '😱',
    durationSec: 2.5,
    description: 'Three dramatic orchestral brass hits building up suspense',
    type: 'builtin',
    tags: ['suspense', 'gasp', 'mystery', 'reveal', 'shock'],
  },
  {
    id: 'record_scratch',
    name: 'Record Scratch',
    category: 'Classic',
    emoji: '💿',
    durationSec: 1.0,
    description: 'Vinyl DJ stop scratch: "Yep, that is me. You are probably wondering..."',
    type: 'builtin',
    tags: ['scratch', 'freeze', 'stop', 'retro', 'pause'],
  },
  {
    id: 'roblox_oof',
    name: 'Roblox "Oof"',
    category: 'Gaming',
    emoji: '📢',
    durationSec: 0.8,
    description: 'The legendary retro video game character impact sound',
    type: 'builtin',
    tags: ['gaming', 'oof', 'roblox', 'classic', 'death'],
  },
];

// Helper to encode raw PCM float audio channels into standard RIFF WAV format
export function encodeWAV(
  channels: Float32Array[],
  sampleRate: number = 44100
): ArrayBuffer {
  const numChannels = channels.length;
  const numSamples = channels[0].length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length: 36 + SubChunk2Size
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate
  view.setUint32(28, byteRate, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM interleaved samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channels[ch][i];
      // Hard clipping limiter
      sample = clampNumber(sample, -1, 1, 0);
      // Convert to 16-bit signed integer (-32768 to 32767)
      const int16 = sample < 0 ? sample * 32768 : sample * 32767;
      view.setInt16(offset, Math.floor(int16), true);
      offset += 2;
    }
  }

  return buffer;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Pure synthetic PCM generator for iconic sounds (works in browser & Node.js for tests)
export function generateSyntheticPCM(
  effectId: string,
  sampleRate: number = 44100
): { left: Float32Array; right: Float32Array; duration: number } {
  const effect = MEME_AUDIO_EFFECTS.find((e) => e.id === effectId) || MEME_AUDIO_EFFECTS[0];
  const duration = effect.durationSec;
  const numSamples = Math.floor(sampleRate * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const t = (i: number) => i / sampleRate;

  switch (effectId) {
    case 'airhorn': {
      // MLG Airhorn: Triple blast pattern (blasts at 0.0s, 0.35s, 0.7s, sustained blast at 1.05s)
      const blastStarts = [0.0, 0.35, 0.7, 1.05];
      const blastLengths = [0.25, 0.25, 0.25, 1.1];
      // Characteristic chord frequencies: detuned brass saw cluster around 466Hz (Bb4), 587Hz (D5), 700Hz (F5)
      const baseFreqs = [466.16, 470.0, 587.33, 698.46, 932.33];

      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        let sample = 0;
        for (let b = 0; b < blastStarts.length; b++) {
          const start = blastStarts[b];
          const len = blastLengths[b];
          if (time >= start && time < start + len) {
            const relTime = time - start;
            // Attack / Decay envelope
            const env = Math.min(1, relTime / 0.02) * Math.pow(1 - relTime / len, 0.5);
            // Vibrato & detuned saws
            const lfo = Math.sin(2 * Math.PI * 12 * relTime) * 8;
            for (const f of baseFreqs) {
              const freq = f + lfo;
              // Sawtooth approximation with odd/even harmonics
              sample += (Math.sin(2 * Math.PI * freq * time) +
                         0.6 * Math.sin(2 * Math.PI * 2 * freq * time) +
                         0.3 * Math.sin(2 * Math.PI * 3 * freq * time)) * env * 0.16;
            }
          }
        }
        left[i] = sample;
        right[i] = sample;
      }
      break;
    }

    case 'sad_violin': {
      // Sad violin slow melancholy motif (C minor lament: C5 -> Bb4 -> Ab4 -> G4 with vibrato & bow scratch)
      const notes = [
        { start: 0.0, end: 1.0, freq: 523.25 }, // C5
        { start: 1.0, end: 1.9, freq: 466.16 }, // Bb4
        { start: 1.9, end: 2.8, freq: 415.30 }, // Ab4
        { start: 2.8, end: 3.9, freq: 392.00 }, // G4
      ];

      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        let sample = 0;
        for (const n of notes) {
          if (time >= n.start && time < n.end) {
            const rel = time - n.start;
            const dur = n.end - n.start;
            // Slow bow attack and gentle release
            const env = Math.sin((Math.PI * rel) / dur) * (1 - 0.15 * Math.sin(2 * Math.PI * 2 * rel));
            // Warm string vibrato starting after initial attack
            const vibratoDepth = Math.min(1, rel / 0.4) * 6;
            const vibrato = Math.sin(2 * Math.PI * 5.5 * rel) * vibratoDepth;
            const f = n.freq + vibrato;
            // String harmonic synthesis (rich saw-like harmonics with warm roll-off)
            sample += (
              Math.sin(2 * Math.PI * f * time) * 0.4 +
              Math.sin(2 * Math.PI * 2 * f * time) * 0.25 +
              Math.sin(2 * Math.PI * 3 * f * time) * 0.15 +
              Math.sin(2 * Math.PI * 4 * f * time) * 0.08
            ) * env;
          }
        }
        left[i] = sample * 0.8;
        right[i] = sample * 0.8;
      }
      break;
    }

    case 'vine_boom': {
      // Vine Boom: Sub-bass 808 drop with heavy punch + filtered noise impact
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        // Exponential pitch drop from 180Hz down to 32Hz
        const freq = 32 + 150 * Math.exp(-time * 10);
        const sub = Math.sin(2 * Math.PI * freq * time);
        // Bass distortion
        const distorted = Math.tanh(sub * 2.5);
        // Exponential amplitude decay
        const amp = Math.exp(-time * 2.2);
        // Initial impact crack noise in first 50ms
        const noise = (Math.random() * 2 - 1) * Math.exp(-time * 40) * 0.4;
        const total = (distorted * 0.8 + noise) * amp;
        left[i] = total;
        right[i] = total;
      }
      break;
    }

    case 'bruh': {
      // Bruh: Formant vocal synthesis simulating "B-r-u-h" pitch drop (140Hz -> 85Hz)
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        const pitch = 85 + 65 * Math.exp(-time * 3);
        const env = Math.min(1, time / 0.08) * Math.exp(-time * 2.0);
        // Vocal vocal-tract harmonics (fundamental + F1 ~ 500Hz + F2 ~ 1000Hz)
        const fundamental = Math.sin(2 * Math.PI * pitch * time);
        const f1 = Math.sin(2 * Math.PI * 500 * time) * 0.5;
        const f2 = Math.sin(2 * Math.PI * 1050 * time) * 0.3;
        const sample = (fundamental * 0.6 + f1 + f2) * env * 0.7;
        left[i] = sample;
        right[i] = sample;
      }
      break;
    }

    case 'laugh_track': {
      // Sitcom Laugh Track: Multiple overlapping giggles & hearty laugh pulses
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        let sample = 0;
        // 5 overlapping laugh burst cycles (ha-ha-ha-ha)
        const haPulse = Math.sin(2 * Math.PI * 4.5 * time);
        const burstEnv = Math.max(0, haPulse) * Math.exp(-time * 0.6);
        // Vocal pitches: 260Hz, 320Hz, 390Hz (mixed voices in audience)
        sample += Math.sin(2 * Math.PI * 260 * time) * burstEnv * 0.25;
        sample += Math.sin(2 * Math.PI * 340 * time + 0.4) * burstEnv * 0.25;
        sample += Math.sin(2 * Math.PI * 410 * time + 1.1) * burstEnv * 0.2;
        // Ambient room rustle
        const roomNoise = (Math.random() * 2 - 1) * 0.05 * Math.min(1, time / 0.2) * Math.exp(-time * 0.5);
        left[i] = (sample + roomNoise) * 0.9;
        right[i] = (sample + roomNoise) * 0.9;
      }
      break;
    }

    case 'titanic_flute': {
      // Shitty Titanic recorder: Out-of-tune squeaks with random microtonal pitch drift & screech
      const notes = [
        { start: 0.0, end: 0.9, freq: 587.33 }, // D5
        { start: 0.9, end: 1.8, freq: 659.25 }, // E5
        { start: 1.8, end: 2.7, freq: 739.99 }, // F#5
        { start: 2.7, end: 3.7, freq: 659.25 }, // E5
      ];
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        let sample = 0;
        for (const n of notes) {
          if (time >= n.start && time < n.end) {
            const rel = time - n.start;
            const dur = n.end - n.start;
            // Shaky breath & unstable pitch
            const breath = 1 + 0.15 * Math.sin(2 * Math.PI * 7 * rel);
            // Hilarious screeching overblow harmonic on attack
            const overblow = rel < 0.15 ? 0.6 * Math.sin(2 * Math.PI * n.freq * 2.8 * time) : 0;
            const detune = Math.sin(2 * Math.PI * 2.3 * rel) * 22; // Out of tune!
            const f = n.freq + detune;
            const env = Math.min(1, rel / 0.05) * (1 - rel / dur);
            sample = (Math.sin(2 * Math.PI * f * time) * 0.6 + overblow) * env * breath * 0.6;
          }
        }
        left[i] = sample;
        right[i] = sample;
      }
      break;
    }

    case 'windows_error': {
      // Windows Error: Classic retro OS chord (C5 + E5 + G5 with percussive attack)
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        const env = Math.exp(-time * 4.5);
        const tone1 = Math.sin(2 * Math.PI * 523.25 * time);
        const tone2 = Math.sin(2 * Math.PI * 659.25 * time);
        const tone3 = Math.sin(2 * Math.PI * 783.99 * time);
        const sample = (tone1 * 0.4 + tone2 * 0.3 + tone3 * 0.3) * env * 0.8;
        left[i] = sample;
        right[i] = sample;
      }
      break;
    }

    case 'metal_pipe': {
      // Metal Pipe Falling: Inharmonic metallic modal resonators ringing with high frequencies
      const modalFreqs = [740, 1180, 1620, 2450, 3100, 4200];
      const decays = [4.0, 3.5, 3.0, 2.5, 2.0, 1.8];
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        let sample = 0;
        for (let m = 0; m < modalFreqs.length; m++) {
          const f = modalFreqs[m];
          const d = decays[m];
          sample += Math.sin(2 * Math.PI * f * time) * Math.exp(-time * d) * (0.35 / (m + 1));
        }
        // Impact click at start
        const impact = (Math.random() * 2 - 1) * Math.exp(-time * 120) * 0.6;
        left[i] = (sample + impact) * 0.9;
        right[i] = (sample + impact) * 0.9;
      }
      break;
    }

    case 'emotional_damage': {
      // Emotional damage: Gong crash + heavy low-end kung-fu hit
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        // Low punch
        const punch = Math.sin(2 * Math.PI * (120 * Math.exp(-time * 15)) * time) * Math.exp(-time * 6);
        // Shimmering gong resonances
        const gong1 = Math.sin(2 * Math.PI * 330 * time) * Math.exp(-time * 2.0);
        const gong2 = Math.sin(2 * Math.PI * 580 * time) * Math.exp(-time * 2.5);
        const sample = (punch * 0.6 + gong1 * 0.3 + gong2 * 0.25) * 0.85;
        left[i] = sample;
        right[i] = sample;
      }
      break;
    }

    case 'curb_enthusiasm': {
      // Frolic motif snippet: Eb - F - G - Eb bouncy pizzicato / tuba
      const notes = [
        { start: 0.0, end: 0.5, freq: 311.13 }, // Eb4
        { start: 0.5, end: 1.0, freq: 349.23 }, // F4
        { start: 1.0, end: 1.6, freq: 392.00 }, // G4
        { start: 1.6, end: 2.4, freq: 311.13 }, // Eb4
        { start: 2.4, end: 3.2, freq: 261.63 }, // C4
        { start: 3.2, end: 4.1, freq: 392.00 }, // G4
      ];
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        let sample = 0;
        for (const n of notes) {
          if (time >= n.start && time < n.end) {
            const rel = time - n.start;
            // Plucky acoustic envelope
            const env = Math.exp(-rel * 5.0);
            const tubaSub = Math.sin(2 * Math.PI * (n.freq / 2) * time) * 0.4;
            const clarTone = Math.sin(2 * Math.PI * n.freq * time) * 0.5;
            sample = (tubaSub + clarTone) * env;
          }
        }
        left[i] = sample * 0.8;
        right[i] = sample * 0.8;
      }
      break;
    }

    case 'gigachad': {
      // Giga Chad Phonk Bass: Aggressive 808 sub + metallic Phonk Cowbell rhythm
      const cowbellHits = [0.0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8];
      const cowbellPitches = [800, 800, 950, 800, 1050, 950, 800, 700];
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        // Distorted 808 bass underneath
        const bass = Math.tanh(Math.sin(2 * Math.PI * 55 * time) * 3) * 0.4;
        // Phonk cowbell hits
        let bell = 0;
        for (let h = 0; h < cowbellHits.length; h++) {
          const hit = cowbellHits[h];
          if (time >= hit && time < hit + 0.35) {
            const rel = time - hit;
            const env = Math.exp(-rel * 14);
            const f = cowbellPitches[h];
            bell += (Math.sin(2 * Math.PI * f * time) + 0.5 * Math.sin(2 * Math.PI * (f * 1.5) * time)) * env * 0.4;
          }
        }
        left[i] = (bass + bell) * 0.85;
        right[i] = (bass + bell) * 0.85;
      }
      break;
    }

    case 'dun_dun_dun': {
      // Dun Dun Dun: 3 brass suspense stabs (1: 0.0s, 2: 0.5s, 3: 1.1s sustained)
      const stabs = [
        { start: 0.0, len: 0.4, freq: 220 }, // A3
        { start: 0.5, len: 0.4, freq: 207.65 }, // G#3
        { start: 1.0, len: 1.4, freq: 196 }, // G3
      ];
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        let sample = 0;
        for (const s of stabs) {
          if (time >= s.start && time < s.start + s.len) {
            const rel = time - s.start;
            const env = Math.min(1, rel / 0.03) * Math.pow(1 - rel / s.len, 0.6);
            sample += (
              Math.sin(2 * Math.PI * s.freq * time) * 0.5 +
              Math.sin(2 * Math.PI * 2 * s.freq * time) * 0.3 +
              Math.sin(2 * Math.PI * 3 * s.freq * time) * 0.2
            ) * env;
          }
        }
        left[i] = sample * 0.85;
        right[i] = sample * 0.85;
      }
      break;
    }

    case 'record_scratch': {
      // Record scratch: Filtered noise + sweeping down pitch
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        const pitch = 1200 * Math.exp(-time * 10);
        const env = Math.exp(-time * 3.5);
        const noise = (Math.random() * 2 - 1) * 0.6;
        const tone = Math.sin(2 * Math.PI * pitch * time) * 0.4;
        left[i] = (noise + tone) * env * 0.8;
        right[i] = (noise + tone) * env * 0.8;
      }
      break;
    }

    case 'roblox_oof': {
      // Roblox Oof: Rapid pitch drop from 280Hz down to 140Hz with sharp envelope
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        const f = 140 + 140 * Math.exp(-time * 12);
        const env = Math.min(1, time / 0.02) * Math.exp(-time * 8);
        const sample = Math.sin(2 * Math.PI * f * time) * env * 0.9;
        left[i] = sample;
        right[i] = sample;
      }
      break;
    }

    default: {
      // Generic pleasant confirmation chime
      for (let i = 0; i < numSamples; i++) {
        const time = t(i);
        const env = Math.exp(-time * 3);
        const sample = Math.sin(2 * Math.PI * 587.33 * time) * env * 0.5;
        left[i] = sample;
        right[i] = sample;
      }
    }
  }

  return { left, right, duration };
}

// Global active audio source & Web Audio API AnalyserNode tracker for play/stop + real-time frequency visualization
let activeAudioContext: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeGainNode: GainNode | null = null;
let activeAnalyserNode: AnalyserNode | null = null;
let activeAudioElement: HTMLAudioElement | null = null;
let activeFreqDataBuffer: Uint8Array<ArrayBuffer> | null = null;
let activeTimeDomainBuffer: Uint8Array<ArrayBuffer> | null = null;

type PlaybackStateListener = (isPlaying: boolean) => void;
const playbackStateListeners = new Set<PlaybackStateListener>();

function notifyPlaybackState(isPlaying: boolean): void {
  playbackStateListeners.forEach((listener) => {
    try {
      listener(isPlaying);
    } catch {
      // ignore listener errors
    }
  });
}

export function subscribeMemeAudioPlayback(listener: PlaybackStateListener): () => void {
  playbackStateListeners.add(listener);
  return () => {
    playbackStateListeners.delete(listener);
  };
}

export type AudioVisualizerMode = 'spectrum_bars' | 'wave_overlay' | 'dual';

export interface AudioFrequencySnapshot {
  frequencyBars: number[]; // Normalized [0..1] spectrum bar magnitudes
  waveformSamples: number[]; // Normalized [-1..1] time-domain wave samples
  rmsLevel: number; // Root-mean-square energy [0..1]
  peakNormalized: number; // Peak frequency bin magnitude [0..1]
  dominantBinIndex: number;
  dominantFrequencyHz: number;
  isLiveWebAudio: boolean;
}

/**
 * Pure deterministic converter from Web Audio API `AnalyserNode` byte buffers
 * (`getByteFrequencyData` & `getByteTimeDomainData`) into normalized spectrum bars,
 * oscilloscope waveform samples, RMS level, and dominant frequency in Hz.
 */
export function computeFrequencySnapshotFromBuffers(
  freqBytes: Uint8Array,
  timeDomainBytes: Uint8Array,
  barCount = 36,
  sampleRate = 44100,
  isLiveWebAudio = true
): AudioFrequencySnapshot {
  const safeBarCount = Math.max(8, Math.min(128, barCount));
  const binCount = Math.max(1, freqBytes.length);
  const frequencyBars: number[] = [];

  let peakVal = 0;
  let dominantBinIndex = 0;
  for (let i = 0; i < binCount; i++) {
    const val = freqBytes[i] || 0;
    if (val > peakVal) {
      peakVal = val;
      dominantBinIndex = i;
    }
  }

  // Group lower-to-mid frequency bins (where musical & vocal meme energy lives) across safeBarCount bars
  const usableBins = Math.max(safeBarCount, Math.floor(binCount * 0.78));
  for (let b = 0; b < safeBarCount; b++) {
    const startIdx = Math.floor((b / safeBarCount) * usableBins);
    const endIdx = Math.max(startIdx + 1, Math.floor(((b + 1) / safeBarCount) * usableBins));
    let sum = 0;
    let count = 0;
    for (let k = startIdx; k < Math.min(binCount, endIdx); k++) {
      sum += freqBytes[k] || 0;
      count++;
    }
    const avgByte = count > 0 ? sum / count : 0;
    frequencyBars.push(Number(clampNumber(avgByte / 255, 0, 1, 0).toFixed(4)));
  }

  // Extract 64 waveform samples normalized to [-1..1] and compute RMS
  const waveSampleCount = 64;
  const waveformSamples: number[] = [];
  let sumSquares = 0;
  const timeLen = Math.max(1, timeDomainBytes.length);

  for (let i = 0; i < waveSampleCount; i++) {
    const idx = Math.min(timeLen - 1, Math.floor((i / waveSampleCount) * timeLen));
    const byteVal = timeDomainBytes[idx] !== undefined ? timeDomainBytes[idx] : 128;
    const normalized = clampNumber((byteVal - 128) / 128, -1, 1, 0);
    waveformSamples.push(Number(normalized.toFixed(4)));
    sumSquares += normalized * normalized;
  }

  const rmsLevel = Number(
    clampNumber(Math.sqrt(sumSquares / waveSampleCount), 0, 1, 0).toFixed(4)
  );
  const peakNormalized = Number(clampNumber(peakVal / 255, 0, 1, 0).toFixed(4));
  const fftSize = binCount * 2;
  const dominantFrequencyHz =
    peakVal > 4 ? Math.round((dominantBinIndex * sampleRate) / fftSize) : 0;

  return {
    frequencyBars,
    waveformSamples,
    rmsLevel,
    peakNormalized,
    dominantBinIndex,
    dominantFrequencyHz,
    isLiveWebAudio,
  };
}

/**
 * Queries the active Web Audio API `AnalyserNode` in real time during audio playback.
 * Falls back to a smooth harmonic spectrum if the analyser is warming up or in a non-DOM environment.
 */
export function getLiveAudioFrequencySnapshot(
  barCount = 36,
  fallbackTimeMs = 0
): AudioFrequencySnapshot {
  if (activeAnalyserNode && activeAudioContext && activeAudioContext.state === 'running') {
    const binCount = activeAnalyserNode.frequencyBinCount;
    if (!activeFreqDataBuffer || activeFreqDataBuffer.length !== binCount) {
      activeFreqDataBuffer = new Uint8Array(binCount);
    }
    if (!activeTimeDomainBuffer || activeTimeDomainBuffer.length !== binCount) {
      activeTimeDomainBuffer = new Uint8Array(binCount);
    }

    activeAnalyserNode.getByteFrequencyData(activeFreqDataBuffer);
    activeAnalyserNode.getByteTimeDomainData(activeTimeDomainBuffer);

    // Check if the analyser has non-zero energy
    let totalEnergy = 0;
    for (let i = 0; i < binCount; i++) {
      totalEnergy += activeFreqDataBuffer[i];
    }

    if (totalEnergy > 0) {
      return computeFrequencySnapshotFromBuffers(
        activeFreqDataBuffer,
        activeTimeDomainBuffer,
        barCount,
        activeAudioContext.sampleRate,
        true
      );
    }
  }

  // Smooth harmonic fallback when audio element is warming up
  const t = (fallbackTimeMs || Date.now()) / 1000;
  const syntheticFreq = new Uint8Array(128);
  const syntheticTime = new Uint8Array(128);
  for (let i = 0; i < 128; i++) {
    const norm = i / 128;
    const envelope = Math.exp(-norm * 2.4);
    const wave =
      0.55 +
      0.35 * Math.sin(t * 9.5 - i * 0.22) +
      0.2 * Math.cos(t * 14.2 + i * 0.15);
    syntheticFreq[i] = Math.max(8, Math.min(250, Math.round(wave * envelope * 235)));
    const osc =
      Math.sin(t * 18 + (i / 128) * Math.PI * 6) * 0.45 +
      Math.sin(t * 31 + (i / 128) * Math.PI * 12) * 0.22;
    syntheticTime[i] = Math.max(0, Math.min(255, Math.round(128 + osc * 96)));
  }

  return computeFrequencySnapshotFromBuffers(syntheticFreq, syntheticTime, barCount, 44100, false);
}

/**
 * Renders the real-time Web Audio API frequency spectrum bar & oscilloscope wave overlay
 * onto a 2D canvas context (`MemeCanvas` visualizer layer).
 */
export function renderAudioVisualizerOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  snapshot: AudioFrequencySnapshot,
  mode: AudioVisualizerMode = 'dual'
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const visualizerHeight = Math.round(height * 0.26);
  const bottomY = height;
  const topY = height - visualizerHeight;

  // 1. Translucent backdrop glow at the bottom of the MemeCanvas
  const bgGrad = ctx.createLinearGradient(0, topY - 16, 0, bottomY);
  bgGrad.addColorStop(0, 'rgba(2, 6, 23, 0)');
  bgGrad.addColorStop(0.35, 'rgba(2, 6, 23, 0.55)');
  bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.85)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, topY - 16, width, visualizerHeight + 16);

  // 2. Spectrum Bars Layer ('spectrum_bars' or 'dual')
  if (mode === 'spectrum_bars' || mode === 'dual') {
    const bars = snapshot.frequencyBars;
    const numBars = bars.length;
    const horizontalPad = Math.round(width * 0.03);
    const usableWidth = width - horizontalPad * 2;
    const slotWidth = usableWidth / Math.max(1, numBars);
    const barWidth = Math.max(3, slotWidth * 0.72);

    const barGrad = ctx.createLinearGradient(0, bottomY, 0, topY);
    barGrad.addColorStop(0, 'rgba(16, 185, 129, 0.92)'); // Emerald
    barGrad.addColorStop(0.45, 'rgba(6, 182, 212, 0.92)'); // Cyan
    barGrad.addColorStop(0.8, 'rgba(245, 158, 11, 0.95)'); // Amber
    barGrad.addColorStop(1, 'rgba(244, 63, 94, 0.98)'); // Rose peak

    ctx.fillStyle = barGrad;

    for (let i = 0; i < numBars; i++) {
      const mag = clampNumber(bars[i], 0.04, 1, 0.04);
      const barH = Math.max(4, mag * (visualizerHeight * 0.84));
      const x = horizontalPad + i * slotWidth + (slotWidth - barWidth) / 2;
      const y = bottomY - barH - 6;

      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, barWidth, barH, [4, 4, 1, 1]);
      } else {
        ctx.rect(x, y, barWidth, barH);
      }
      ctx.fill();

      // Peak floating cap
      const capY = Math.max(topY + 2, y - 4);
      ctx.fillStyle = 'rgba(253, 224, 71, 0.95)';
      ctx.fillRect(x, capY, barWidth, 2.5);
      ctx.fillStyle = barGrad;
    }
  }

  // 3. Oscilloscope Time-Domain Wave Overlay ('wave_overlay' or 'dual')
  if (mode === 'wave_overlay' || mode === 'dual') {
    const samples = snapshot.waveformSamples;
    const numSamples = samples.length;
    if (numSamples > 1) {
      const horizontalPad = Math.round(width * 0.03);
      const usableWidth = width - horizontalPad * 2;
      const waveCenterY =
        mode === 'dual'
          ? bottomY - visualizerHeight * 0.56
          : bottomY - visualizerHeight * 0.48;
      const waveAmplitude = visualizerHeight * (mode === 'dual' ? 0.36 : 0.44);

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < numSamples; i++) {
        const x = horizontalPad + (i / (numSamples - 1)) * usableWidth;
        const y = waveCenterY + samples[i] * waveAmplitude;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = mode === 'dual' ? '#fde047' : '#22d3ee';
      ctx.lineWidth = 3;
      ctx.shadowColor = mode === 'dual' ? 'rgba(250, 204, 21, 0.85)' : 'rgba(34, 211, 238, 0.85)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
}

// Convert PCM Float32Arrays to Web Audio AudioBuffer
export function createAudioBufferFromPCM(
  ctx: AudioContext,
  pcm: { left: Float32Array; right: Float32Array }
): AudioBuffer {
  const buffer = ctx.createBuffer(2, pcm.left.length, ctx.sampleRate);
  buffer.getChannelData(0).set(pcm.left);
  buffer.getChannelData(1).set(pcm.right);
  return buffer;
}

/**
 * Converts a 0-indexed frame number at a given FPS into a timestamp in seconds.
 */
export function frameToTimestampSec(frameNumber: number, fps = 30): number {
  const safeFps = clampNumber(fps, 1, 240, 30);
  const safeFrame = Math.max(0, Math.round(frameNumber));
  return Number((safeFrame / safeFps).toFixed(4));
}

/**
 * Converts a timestamp in seconds into the nearest 0-indexed frame number at a given FPS.
 */
export function timestampSecToFrame(timestampSec: number, fps = 30): number {
  const safeFps = clampNumber(fps, 1, 240, 30);
  const safeSec = Math.max(0, timestampSec);
  return Math.round(safeSec * safeFps);
}

/**
 * Creates a normalized `SoundboardTriggerCue` mapped to a specific frame timestamp.
 */
export function createSoundboardTriggerCue(
  effectId: string,
  frameNumber: number,
  fps = 30,
  options?: { volume?: number; playbackRate?: number; id?: string }
): SoundboardTriggerCue {
  const effect = MEME_AUDIO_EFFECTS.find((e) => e.id === effectId) || MEME_AUDIO_EFFECTS[0];
  const safeFps = clampNumber(fps, 1, 240, 30);
  const safeFrame = Math.max(0, Math.round(frameNumber));
  const timestampSec = frameToTimestampSec(safeFrame, safeFps);

  return {
    id:
      options?.id ||
      `sb_${effect.id}_f${safeFrame}_${Math.random().toString(36).slice(2, 7)}`,
    effectId: effect.id,
    name: effect.name,
    emoji: effect.emoji,
    frameNumber: safeFrame,
    fps: safeFps,
    timestampSec,
    volume: clampNumber(options?.volume ?? 1.0, 0, 1, 1.0),
    playbackRate: clampNumber(options?.playbackRate ?? 1.0, 0.5, 2.0, 1.0),
  };
}

/**
 * Returns a copy of soundboard triggers sorted chronologically by `timestampSec` (then `frameNumber`).
 */
export function sortSoundboardTriggers(
  triggers: SoundboardTriggerCue[] = []
): SoundboardTriggerCue[] {
  return [...triggers].sort((a, b) => {
    if (a.timestampSec !== b.timestampSec) {
      return a.timestampSec - b.timestampSec;
    }
    return a.frameNumber - b.frameNumber;
  });
}

/**
 * Computes the effective FPS, total video export duration, total frame count,
 * and sorted soundboard trigger cues for a `MemeAudioConfig`.
 */
export function computeVideoExportTimelineInfo(config: MemeAudioConfig): {
  fps: number;
  totalDurationSec: number;
  totalFrames: number;
  sortedTriggers: SoundboardTriggerCue[];
} {
  const fps = clampNumber(config.exportFps ?? 30, 12, 120, 30);
  const baseEffect = MEME_AUDIO_EFFECTS.find((e) => e.id === config.selectedEffectId);
  const baseEffectDur = baseEffect
    ? (config.delaySec || 0) + baseEffect.durationSec / clampNumber(config.playbackRate || 1, 0.5, 2, 1)
    : 0;

  const sortedTriggers = sortSoundboardTriggers(config.soundboardTriggers || []);
  let maxTriggerEndSec = 0;
  for (const cue of sortedTriggers) {
    const cueEffect = MEME_AUDIO_EFFECTS.find((e) => e.id === cue.effectId);
    const cueDur = (cueEffect?.durationSec ?? 1.8) / clampNumber(cue.playbackRate || 1, 0.5, 2, 1);
    const endSec = cue.timestampSec + cueDur;
    if (endSec > maxTriggerEndSec) {
      maxTriggerEndSec = endSec;
    }
  }

  const configuredMinDur = clampNumber(config.exportDurationSec ?? 4.0, 2.0, 30.0, 4.0);
  const totalDurationSec = Number(
    Math.max(2.0, configuredMinDur, baseEffectDur, maxTriggerEndSec).toFixed(2)
  );
  const totalFrames = Math.max(1, Math.ceil(totalDurationSec * fps));

  return {
    fps,
    totalDurationSec,
    totalFrames,
    sortedTriggers,
  };
}

/**
 * Synthesizes and mixes the base audio effect (if selected) plus all frame-accurate
 * `soundboardTriggers` into a single stereo PCM buffer.
 */
export function mixSoundboardTriggersIntoPCM(
  config: MemeAudioConfig,
  sampleRate = 44100
): { left: Float32Array; right: Float32Array; duration: number } {
  const { totalDurationSec, sortedTriggers } = computeVideoExportTimelineInfo(config);
  const totalSamples = Math.max(1, Math.floor(totalDurationSec * sampleRate));
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  // 1. Mix primary selectedEffectId if present
  if (config.selectedEffectId) {
    const basePcm = generateSyntheticPCM(config.selectedEffectId, sampleRate);
    const baseRate = clampNumber(config.playbackRate ?? 1.0, 0.5, 2.0, 1.0);
    const baseVol = clampNumber(config.volume ?? 1.0, 0, 1, 1.0);
    const delaySamples = Math.max(0, Math.floor((config.delaySec ?? 0) * sampleRate));
    const resampledLen = Math.floor(basePcm.left.length / baseRate);

    for (let i = 0; i < resampledLen; i++) {
      const targetIdx = delaySamples + i;
      if (targetIdx >= totalSamples) {
        if (config.loop) {
          // handled below if looping
          break;
        }
        break;
      }
      const srcIdx = Math.min(basePcm.left.length - 1, Math.floor(i * baseRate));
      left[targetIdx] += basePcm.left[srcIdx] * baseVol;
      right[targetIdx] += basePcm.right[srcIdx] * baseVol;
    }
  }

  // 2. Mix each SoundboardTriggerCue at its exact frame timestamp
  const pcmCache = new Map<string, { left: Float32Array; right: Float32Array; duration: number }>();

  for (const cue of sortedTriggers) {
    let cuePcm = pcmCache.get(cue.effectId);
    if (!cuePcm) {
      cuePcm = generateSyntheticPCM(cue.effectId, sampleRate);
      pcmCache.set(cue.effectId, cuePcm);
    }

    const rate = clampNumber(cue.playbackRate || 1.0, 0.5, 2.0, 1.0);
    const vol = clampNumber(cue.volume ?? 1.0, 0, 1, 1.0);
    const startSample = Math.max(0, Math.floor(cue.timestampSec * sampleRate));
    const resampledLen = Math.floor(cuePcm.left.length / rate);

    for (let i = 0; i < resampledLen; i++) {
      const outIdx = startSample + i;
      if (outIdx >= totalSamples) break;
      const srcIdx = Math.min(cuePcm.left.length - 1, Math.floor(i * rate));
      left[outIdx] += cuePcm.left[srcIdx] * vol;
      right[outIdx] += cuePcm.right[srcIdx] * vol;
    }
  }

  // 3. Soft clip / clamp mixed stereo signal to [-1, 1]
  for (let i = 0; i < totalSamples; i++) {
    left[i] = Math.max(-1, Math.min(1, left[i]));
    right[i] = Math.max(-1, Math.min(1, right[i]));
  }

  return {
    left,
    right,
    duration: totalDurationSec,
  };
}

/**
 * Fires a single Soundboard pad immediately through the Web Audio API `AnalyserNode`
 * so the `MemeCanvas` real-time frequency visualizer reacts on every quick-fire pad tap.
 */
export async function playQuickSoundboardEffect(
  effectId: string,
  volume = 1.0,
  playbackRate = 1.0,
  onEnded?: () => void
): Promise<void> {
  return playMemeAudio(
    {
      selectedEffectId: effectId,
      volume,
      playbackRate,
      loop: false,
      delaySec: 0,
    },
    onEnded
  );
}

// Play sound in browser using Web Audio API with real-time AnalyserNode or custom URL
export async function playMemeAudio(
  config: MemeAudioConfig,
  onEnded?: () => void
): Promise<void> {
  stopMemeAudio();

  const volume = config.volume ?? 1.0;
  const rate = config.playbackRate ?? 1.0;
  const isLoop = config.loop ?? false;
  const hasSoundboardCues = Boolean(
    config.soundboardTriggers && config.soundboardTriggers.length > 0
  );

  const AudioCtx =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      : null;

  // If custom uploaded audio and no soundboard triggers
  if (config.customAudioUrl && !hasSoundboardCues) {
    const audio = new Audio(config.customAudioUrl);
    audio.crossOrigin = 'anonymous';
    audio.volume = clampNumber(volume, 0, 1, 1);
    audio.playbackRate = clampNumber(rate, 0.25, 4, 1);
    audio.loop = isLoop;

    if (AudioCtx) {
      try {
        if (!activeAudioContext || activeAudioContext.state === 'closed') {
          activeAudioContext = new AudioCtx();
        }
        if (activeAudioContext.state === 'suspended') {
          await activeAudioContext.resume();
        }
        const mediaSource = activeAudioContext.createMediaElementSource(audio);
        const analyser = activeAudioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.78;
        mediaSource.connect(analyser);
        analyser.connect(activeAudioContext.destination);
        activeAnalyserNode = analyser;
      } catch {
        // Fallback if MediaElementSource cannot attach
      }
    }

    audio.onended = () => {
      notifyPlaybackState(false);
      onEnded?.();
    };
    activeAudioElement = audio;
    notifyPlaybackState(true);
    await audio.play();
    return;
  }

  if (!config.selectedEffectId && !hasSoundboardCues) {
    notifyPlaybackState(false);
    onEnded?.();
    return;
  }

  // Built-in synthetic audio OR multi-trigger Soundboard sequence wired through Web Audio API AnalyserNode
  try {
    if (!AudioCtx) {
      onEnded?.();
      return;
    }
    if (!activeAudioContext || activeAudioContext.state === 'closed') {
      activeAudioContext = new AudioCtx();
    }
    if (activeAudioContext.state === 'suspended') {
      await activeAudioContext.resume();
    }

    const pcm = hasSoundboardCues
      ? mixSoundboardTriggersIntoPCM(config, activeAudioContext.sampleRate)
      : generateSyntheticPCM(config.selectedEffectId!, activeAudioContext.sampleRate);
    const audioBuffer = createAudioBufferFromPCM(activeAudioContext, pcm);

    const source = activeAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = hasSoundboardCues ? 1.0 : rate;
    source.loop = isLoop;

    const gain = activeAudioContext.createGain();
    gain.gain.value = hasSoundboardCues ? 1.0 : volume;

    const analyser = activeAudioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.78;

    source.connect(gain);
    gain.connect(analyser);
    analyser.connect(activeAudioContext.destination);

    source.onended = () => {
      notifyPlaybackState(false);
      onEnded?.();
    };

    activeSourceNode = source;
    activeGainNode = gain;
    activeAnalyserNode = analyser;

    notifyPlaybackState(true);
    source.start(0);
  } catch (err) {
    console.warn('Web Audio playback error:', err);
    notifyPlaybackState(false);
    onEnded?.();
  }
}

// Stop currently playing meme audio
export function stopMemeAudio(): void {
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {
      // ignore if already stopped
    }
    activeSourceNode = null;
  }
  if (activeGainNode) {
    try {
      activeGainNode.disconnect();
    } catch {
      // ignore
    }
    activeGainNode = null;
  }
  if (activeAnalyserNode) {
    try {
      activeAnalyserNode.disconnect();
    } catch {
      // ignore
    }
    activeAnalyserNode = null;
  }
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }
  notifyPlaybackState(false);
}

// Generate WAV Blob for attached sound effect or mixed Soundboard trigger timeline
export function getMemeAudioWavBlob(config: MemeAudioConfig): Blob {
  const hasSoundboardCues = Boolean(
    config.soundboardTriggers && config.soundboardTriggers.length > 0
  );
  if (!config.selectedEffectId && !hasSoundboardCues) {
    throw new Error('No audio effect or soundboard trigger selected');
  }
  const sampleRate = 44100;
  const pcm = hasSoundboardCues
    ? mixSoundboardTriggersIntoPCM(config, sampleRate)
    : generateSyntheticPCM(config.selectedEffectId!, sampleRate);
  const wavBuffer = encodeWAV([pcm.left, pcm.right], sampleRate);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

// Download Meme Audio Track as .WAV file
export function downloadMemeAudioTrack(
  config: MemeAudioConfig,
  fileName = 'meme_sound.wav'
): void {
  const blob = getMemeAudioWavBlob(config);
  triggerBrowserDownload(blob, fileName, 1000);
}

// Export Video Meme (.webm or .mp4) with embedded Audio Track & Frame-Accurate Soundboard Triggers
export async function exportMemeVideoWithAudio(
  canvas: HTMLCanvasElement,
  config: MemeAudioConfig,
  onProgress?: (percent: number, status: string) => void
): Promise<Blob> {
  const { fps, totalDurationSec, totalFrames, sortedTriggers } =
    computeVideoExportTimelineInfo(config);
  const durationSec = totalDurationSec;

  // 1. Prepare Audio Context & Destination Stream
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  const audioDestination = ctx.createMediaStreamDestination();

  // 2. Load primary audio & frame-scheduled Soundboard triggers into stream
  let primarySourceNode: AudioBufferSourceNode | null = null;
  const scheduledTriggerNodes: Array<{
    node: AudioBufferSourceNode;
    cue: SoundboardTriggerCue;
  }> = [];
  let customAudioEl: HTMLAudioElement | null = null;

  if (config.customAudioUrl) {
    customAudioEl = new Audio(config.customAudioUrl);
    customAudioEl.crossOrigin = 'anonymous';
    const mediaSource = ctx.createMediaElementSource(customAudioEl);
    const gain = ctx.createGain();
    gain.gain.value = config.volume ?? 1.0;
    mediaSource.connect(gain);
    gain.connect(audioDestination);
  } else if (config.selectedEffectId) {
    const pcm = generateSyntheticPCM(config.selectedEffectId, ctx.sampleRate);
    const audioBuffer = createAudioBufferFromPCM(ctx, pcm);
    const bufferSource = ctx.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.playbackRate.value = config.playbackRate || 1.0;
    bufferSource.loop = config.loop ?? false;
    const gain = ctx.createGain();
    gain.gain.value = config.volume ?? 1.0;
    bufferSource.connect(gain);
    gain.connect(audioDestination);
    primarySourceNode = bufferSource;
  }

  // Schedule each SoundboardTriggerCue at its exact frame timestamp
  if (sortedTriggers.length > 0) {
    const bufferCache = new Map<string, AudioBuffer>();
    for (const cue of sortedTriggers) {
      let buf = bufferCache.get(cue.effectId);
      if (!buf) {
        const pcm = generateSyntheticPCM(cue.effectId, ctx.sampleRate);
        buf = createAudioBufferFromPCM(ctx, pcm);
        bufferCache.set(cue.effectId, buf);
      }
      const triggerSource = ctx.createBufferSource();
      triggerSource.buffer = buf;
      triggerSource.playbackRate.value = clampNumber(cue.playbackRate || 1.0, 0.5, 2.0, 1.0);
      const triggerGain = ctx.createGain();
      triggerGain.gain.value = clampNumber(cue.volume ?? 1.0, 0, 1, 1.0);
      triggerSource.connect(triggerGain);
      triggerGain.connect(audioDestination);
      scheduledTriggerNodes.push({ node: triggerSource, cue });
    }
  }

  // 3. Capture Canvas Stream at configured FPS
  const canvasStream = canvas.captureStream
    ? canvas.captureStream(fps)
    : (canvas as any).mozCaptureStream(fps);

  // 4. Combine Video + Audio tracks into combined stream
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioDestination.stream.getAudioTracks(),
  ]);

  // Select supported MIME type
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '';
      }
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    try {
      const recorder = mimeType
        ? new MediaRecorder(combinedStream, { mimeType })
        : new MediaRecorder(combinedStream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        try {
          ctx.close();
        } catch {
          // ignore
        }
        const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
        resolve(blob);
      };

      recorder.onerror = (err) => {
        reject(err);
      };

      // Start recording
      recorder.start(100);

      // Start primary audio + schedule all Soundboard triggers relative to ctx.currentTime
      const baseAudioTime = ctx.currentTime;
      if (primarySourceNode) {
        const delayOffset = Math.max(0, config.delaySec || 0);
        primarySourceNode.start(baseAudioTime + delayOffset);
      } else if (customAudioEl) {
        customAudioEl.play().catch(console.warn);
      }

      for (const { node, cue } of scheduledTriggerNodes) {
        node.start(baseAudioTime + Math.max(0, cue.timestampSec));
      }

      // Progress countdown with live frame number & active Soundboard trigger status
      const startTime = Date.now();
      const totalMs = durationSec * 1000;
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const elapsedSec = elapsed / 1000;
        const currentFrame = Math.min(totalFrames, Math.floor(elapsedSec * fps));
        const progress = Math.min(99, Math.round((elapsed / totalMs) * 100));

        // Find most recently triggered cue
        const activeCue = [...sortedTriggers]
          .reverse()
          .find((c) => elapsedSec >= c.timestampSec && elapsedSec <= c.timestampSec + 1.5);

        const cueBadge = activeCue
          ? ` · Triggered ${activeCue.emoji} ${activeCue.name} @ F${activeCue.frameNumber}`
          : '';

        onProgress?.(
          progress,
          `Recording Frame ${currentFrame}/${totalFrames} (${elapsedSec.toFixed(1)}s / ${durationSec.toFixed(1)}s @ ${fps}fps)${cueBadge}`
        );
      }, 100);

      // Stop after duration
      setTimeout(() => {
        clearInterval(interval);
        onProgress?.(100, 'Finalizing video file...');
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, totalMs);
    } catch (err) {
      reject(err);
    }
  });
}
