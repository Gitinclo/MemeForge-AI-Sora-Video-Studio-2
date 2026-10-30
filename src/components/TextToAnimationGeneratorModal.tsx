import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Film,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  Layers,
  Users,
  FileCode,
  Copy,
  Check,
  Wand2,
  CheckCircle2,
  Mic,
  Upload,
  Music,
  RefreshCw,
  Trash2,
  RotateCcw,
  FileAudio,
  AlertCircle,
} from 'lucide-react';
import {
  DEFAULT_GLOBAL_VISUAL_ASSETS,
  GlobalVisualAssets,
  TEN_SHOT_ANIMATION_SCRIPT,
  AnimationShotSpec,
  compileExpandedT2VPrompt,
  evaluateAnimationScriptSummary,
  parseAnimationScriptText,
  RAW_USER_10_SHOT_SCRIPT_TEXT,
  AI_CHARACTER_VOICE_PRESETS,
  CharacterVoicePresetId,
  ShotVoiceoverClip,
  buildDefaultShotVoiceoverMappings,
  applyCharacterPresetToVoiceoverClips,
  applyVoiceLibraryPresetToClips,
  attachCustomVoiceAudioToClips,
  synthesizeCharacterVoiceWavDataUri,
  validateVoiceUploadFile,
  inferCharacterAndShotFromFileName,
  UploadedCharacterVoiceAsset,
  resetVoiceClipToAiPreset,
} from '../utils/textToAnimationEngine';
import { triggerBrowserDownload } from '../utils/sharedCoreEngine';

interface TextToAnimationGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPromptToLeoStudio?: (title: string, expandedPrompt: string, durationSec: number) => void;
}

export const TextToAnimationGeneratorModal: React.FC<TextToAnimationGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyPromptToLeoStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'player' | 'voiceover' | 'assets' | 'script_parser'>(
    'player'
  );
  const [assets, setAssets] = useState<GlobalVisualAssets>(DEFAULT_GLOBAL_VISUAL_ASSETS);
  const [shots, setShots] = useState<AnimationShotSpec[]>(TEN_SHOT_ANIMATION_SCRIPT);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [shotElapsedSec, setShotElapsedSec] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [rawScriptInput, setRawScriptInput] = useState<string>(RAW_USER_10_SHOT_SCRIPT_TEXT);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRecordingWebm, setIsRecordingWebm] = useState<boolean>(false);
  const [recordingProgressPct, setRecordingProgressPct] = useState<number>(0);

  // Character Voiceover State (Lin_Jie & Ji_Zhixiu)
  const [selectedCharacterPresets, setSelectedCharacterPresets] = useState<
    Record<'Character_A' | 'Character_B', CharacterVoicePresetId>
  >({
    Character_A: 'lin_charon_warm_mentor',
    Character_B: 'ji_kore_cold_vigilant',
  });
  const [voiceoverClips, setVoiceoverClips] = useState<ShotVoiceoverClip[]>(() =>
    buildDefaultShotVoiceoverMappings(TEN_SHOT_ANIMATION_SCRIPT)
  );
  const [activePlayingClipId, setActivePlayingClipId] = useState<string | null>(null);
  const [synthesizingClipId, setSynthesizingClipId] = useState<string | null>(null);
  const [characterFilter, setCharacterFilter] = useState<'all' | 'Character_A' | 'Character_B'>(
    'all'
  );

  // Custom Voice Upload (.mp3 / .wav Drag & Drop Role Mapper) & Voice Library State
  const [uploadedVoiceAssets, setUploadedVoiceAssets] = useState<UploadedCharacterVoiceAsset[]>([]);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [uploadRoleTarget, setUploadRoleTarget] = useState<'auto' | 'Character_A' | 'Character_B'>(
    'auto'
  );
  const [uploadScopeTarget, setUploadScopeTarget] = useState<string>('all_role_lines');
  const [selectedVoiceLibraryPresetId, setSelectedVoiceLibraryPresetId] =
    useState<CharacterVoicePresetId>('lin_charon_warm_mentor');
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeVoiceAudioRef = useRef<HTMLAudioElement | null>(null);

  const activeShot = shots[activeShotIndex] || shots[0];
  const auditSummary = useMemo(
    () => evaluateAnimationScriptSummary(shots, '1080p', 'fast'),
    [shots]
  );
  const expandedPrompt = useMemo(
    () => compileExpandedT2VPrompt(activeShot, assets),
    [activeShot, assets]
  );

  // Voiceover clips mapped to the currently playing shot
  const activeShotVoiceClips = useMemo(
    () => voiceoverClips.filter((c) => c.shotId === activeShot.shotId),
    [voiceoverClips, activeShot.shotId]
  );

  const filteredVoiceoverClips = useMemo(() => {
    if (characterFilter === 'all') return voiceoverClips;
    return voiceoverClips.filter((c) => c.characterToken === characterFilter);
  }, [voiceoverClips, characterFilter]);

  const playVoiceoverClipAudio = (clip: ShotVoiceoverClip) => {
    try {
      if (activeVoiceAudioRef.current) {
        activeVoiceAudioRef.current.pause();
        activeVoiceAudioRef.current = null;
      }
      const audio = new Audio(clip.audioDataUri);
      audio.volume = Math.max(0, Math.min(1, clip.volume));
      audio.playbackRate = Math.max(0.5, Math.min(2.0, clip.playbackRate));
      activeVoiceAudioRef.current = audio;
      setActivePlayingClipId(clip.clipId);
      audio.onended = () => {
        setActivePlayingClipId((prev) => (prev === clip.clipId ? null : prev));
      };
      audio.play().catch(() => {
        setActivePlayingClipId(null);
      });
    } catch {
      setActivePlayingClipId(null);
    }
  };

  // Trigger procedural Web Audio SFX + Mapped Character Voiceover Clip when active shot changes
  useEffect(() => {
    if (!isOpen || !soundEnabled || !isPlaying || activeTab !== 'player') return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (
          activeShot.choreographyPreset === 'doorway_rain_bell' ||
          activeShot.choreographyPreset === 'interior_pov_enter'
        ) {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.6);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.start(now);
          osc.stop(now + 0.65);
        } else if (
          activeShot.choreographyPreset === 'alley_blade_slash' ||
          activeShot.choreographyPreset === 'street_pov_retract_cane'
        ) {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1400, now);
          osc.frequency.exponentialRampToValueAtTime(3200, now + 0.22);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (activeShot.choreographyPreset === 'hunter_split_macro_trigger') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(65, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(260, now + 0.25);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.start(now);
          osc.stop(now + 0.28);
        }
      }

      // Play the mapped Character Voiceover clip (uploaded or AI-generated WAV) for this shot
      if (activeShotVoiceClips.length > 0) {
        playVoiceoverClipAudio(activeShotVoiceClips[0]);
      }
    } catch {
      // Ignore autoplay restrictions
    }
  }, [isOpen, soundEnabled, isPlaying, activeShotIndex, activeTab, activeShot, activeShotVoiceClips]);

  // Advance shot timer at 10Hz and auto-transition through all 10 shots
  useEffect(() => {
    if (!isOpen || !isPlaying || activeTab !== 'player') return;
    const interval = setInterval(() => {
      setShotElapsedSec((prev) => {
        const next = Number((prev + 0.1).toFixed(1));
        if (next >= (activeShot?.scriptDurationSec || 4)) {
          setActiveShotIndex((idx) => (idx + 1) % shots.length);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, activeTab, activeShot, shots.length]);

  // Bespoke 24 FPS 2.5D Anime Canvas Renderer for the 10-Shot Script
  useEffect(() => {
    if (!isOpen || activeTab !== 'player') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let frameTick = 0;

    const drawScene = () => {
      frameTick += 1;
      const w = canvas.width;
      const h = canvas.height;
      const duration = Math.max(1, activeShot.scriptDurationSec);
      const progress = Math.min(1, shotElapsedSec / duration);
      const preset = activeShot.choreographyPreset;
      const isEnvA = activeShot.referencedEnvironment === 'Environment_A';

      ctx.save();

      if (preset === 'doorway_rain_bell' || preset === 'shopkeeper_closeup_teacup') {
        const scale = 1 + progress * 0.08;
        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);
        ctx.translate(-w / 2, -h / 2);
      } else if (preset === 'alley_blade_slash') {
        const shakeX = Math.sin(frameTick * 0.9) * 5;
        const shakeY = Math.cos(frameTick * 1.1) * 4;
        ctx.translate(shakeX, shakeY);
      } else if (preset === 'alley_embers_ash') {
        const scale = 1.08 - progress * 0.07;
        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);
        ctx.translate(-w / 2, -h / 2);
      }

      // 1. Base Backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      if (isEnvA) {
        bgGrad.addColorStop(0, '#040711');
        bgGrad.addColorStop(0.55, '#0b1326');
        bgGrad.addColorStop(1, '#17153b');
      } else {
        bgGrad.addColorStop(0, '#080b12');
        bgGrad.addColorStop(0.5, '#191410');
        bgGrad.addColorStop(1, '#2b1e12');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Environment Architecture & Lighting
      if (isEnvA) {
        ctx.fillStyle = '#070b16';
        ctx.fillRect(0, 0, w * 0.24, h * 0.78);
        ctx.fillRect(w * 0.76, 0, w * 0.24, h * 0.78);

        ctx.fillStyle = '#090f1d';
        ctx.fillRect(0, h * 0.75, w, h * 0.25);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1.5;
        for (let p = 0; p < 4; p++) {
          const rx = w * (0.25 + p * 0.16);
          const ry = h * 0.86 + (p % 2) * 18;
          const rad = 16 + ((frameTick * 0.8 + p * 12) % 34);
          ctx.beginPath();
          ctx.ellipse(rx, ry, rad, rad * 0.28, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#14110f';
        for (let i = 0; i < 6; i++) {
          const sx = i * (w / 6);
          ctx.fillRect(sx + 8, 16, w / 6 - 16, h * 0.68);
          ctx.fillStyle = 'rgba(180, 83, 9, 0.28)';
          for (let r = 1; r <= 5; r++) {
            ctx.fillRect(sx + 14, r * 52, w / 6 - 28, 5);
          }
          ctx.fillStyle = '#14110f';
        }

        const lampX = preset === 'counter_twoshot_towel' ? w * 0.32 : w * 0.42;
        const lampY = h * 0.5;
        const lampGrad = ctx.createRadialGradient(lampX, lampY, 10, lampX, lampY, 290);
        lampGrad.addColorStop(0, 'rgba(251, 191, 36, 0.75)');
        lampGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.25)');
        lampGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = lampGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#261a12';
        ctx.fillRect(0, h * 0.68, w, h * 0.32);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.68);
        ctx.lineTo(w, h * 0.68);
        ctx.stroke();
      }

      // 3. Shot-Specific 2.5D Choreography
      if (preset === 'doorway_rain_bell') {
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 14;
        ctx.strokeRect(w * 0.28, h * 0.08, w * 0.44, h * 0.84);

        const bellAngle = Math.sin(frameTick * 0.18) * 10;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(w * 0.5 + bellAngle, h * 0.14, 14, 0, Math.PI * 2);
        ctx.fill();

        const lx = w * 0.5;
        const ly = h * 0.48;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(lx, ly, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(lx - 34, ly + 28, 68, 115);

        ctx.fillStyle = 'rgba(234, 179, 8, 0.18)';
        ctx.fillRect(w * 0.56, h * 0.18, w * 0.38, 34);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(w * 0.56, h * 0.18, w * 0.38, 34);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('TV AUDIO: METEOROLOGICAL YELLOW -> RED WARNING', w * 0.575, h * 0.22);
      } else if (preset === 'wooden_step_open_sign') {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(w * 0.25, h * 0.82);
        ctx.lineTo(w * 0.52, h * 0.68);
        ctx.lineTo(w * 0.52, h * 0.82);
        ctx.closePath();
        ctx.fill();

        const signX = w * 0.62;
        const signY = h * 0.36;
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(signX - 70, signY - 28, 140, 56);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.strokeRect(signX - 70, signY - 28, 140, 56);
        ctx.fillStyle = '#1c1917';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(progress < 0.3 ? 'CLOSED' : 'OPEN', signX, signY + 8);
        ctx.textAlign = 'left';
      } else if (
        preset === 'counter_lamp_two_teacups' ||
        preset === 'shopkeeper_closeup_teacup'
      ) {
        const lx = w * 0.38;
        const ly = h * 0.43;
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(lx, ly, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(lx - 42, ly + 34, 84, 95);

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(lx - 10, ly - 4, 6, 4);
        ctx.fillRect(lx + 8, ly - 4, 6, 4);

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(w * 0.62, h * 0.65, 58, 16);

        const slideOffset = progress * 48;
        const cup1X = w * 0.42;
        const cup2X = w * 0.5 + slideOffset;
        const cupY = h * 0.64;

        [cup1X, cup2X].forEach((cx, idx) => {
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(cx - 12, cupY, 24, 16);
          ctx.strokeStyle = 'rgba(248, 250, 252, 0.55)';
          ctx.lineWidth = 1.5;
          for (let s = 0; s < 3; s++) {
            const wave = Math.sin(frameTick * 0.08 + s + idx) * 6;
            ctx.beginPath();
            ctx.moveTo(cx - 6 + s * 6, cupY - 4);
            ctx.quadraticCurveTo(cx + wave, cupY - 22, cx - 3 + s * 6, cupY - 38);
            ctx.stroke();
          }
        });
      } else if (preset === 'alley_blade_slash') {
        const jx = w * 0.48;
        const jy = h * 0.48;
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(jx, jy, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(jx - 28, jy + 26, 56, 100);

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(jx, jy + 20, 165, -0.6 + progress * 1.2, 1.4 + progress * 1.2);
        ctx.stroke();

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(jx, jy + 20, 168, -0.5 + progress * 1.2, 1.3 + progress * 1.2);
        ctx.stroke();
      } else if (preset === 'alley_embers_ash') {
        for (let e = 0; e < 32; e++) {
          const ex = w * 0.2 + ((e * 43 + frameTick * 2.5) % (w * 0.6));
          const ey = h * 0.72 - ((e * 29 + frameTick * 3.2) % (h * 0.48));
          ctx.fillStyle = e % 2 === 0 ? 'rgba(244, 63, 94, 0.85)' : 'rgba(251, 146, 60, 0.75)';
          ctx.beginPath();
          ctx.arc(ex, ey, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        const jx = w * 0.5;
        const jy = h * 0.46;
        ctx.fillStyle = '#050811';
        ctx.beginPath();
        ctx.arc(jx, jy, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(jx - 30, jy + 28, 60, 110);
      } else if (preset === 'street_pov_retract_cane') {
        const winX = w * 0.62;
        const winY = h * 0.28;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
        ctx.fillRect(winX, winY, 190, 120);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(winX, winY, 190, 120);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('OPEN · BOOKSTORE', winX + 26, winY + 66);

        const bladeLength = Math.max(0, (1 - progress) * 180);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(w * 0.22, h * 0.88);
        ctx.lineTo(w * 0.36, h * 0.56);
        ctx.stroke();

        if (bladeLength > 5) {
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(w * 0.36, h * 0.56);
          ctx.lineTo(w * 0.36 + bladeLength * 0.45, h * 0.56 - bladeLength * 0.6);
          ctx.stroke();
        }
      } else if (preset === 'hunter_split_macro_trigger') {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h / 2 - 3);
        ctx.fillRect(0, h / 2 + 3, w, h / 2 - 3);

        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(0, h / 2 - 2, w, 4);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.32, h * 0.24);
        ctx.quadraticCurveTo(w * 0.4, h * 0.19, w * 0.46, h * 0.25);
        ctx.moveTo(w * 0.54, h * 0.25);
        ctx.quadraticCurveTo(w * 0.6, h * 0.19, w * 0.68, h * 0.24);
        ctx.stroke();
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(w * 0.4, h * 0.24, 6, 0, Math.PI * 2);
        ctx.arc(w * 0.6, h * 0.24, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(w * 0.35, h * 0.72, w * 0.3, 24);
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.72, 9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const lx = w * 0.28;
        const ly = h * 0.44;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(lx, ly, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(lx - 28, ly + 25, 56, 85);

        const jx = w * 0.72;
        const jy = h * 0.43;
        ctx.fillStyle = '#050811';
        ctx.beginPath();
        ctx.arc(jx, jy, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(jx - 26, jy + 24, 52, 90);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(jx - 32, jy + 34);
        ctx.lineTo(jx - 44, jy + 112);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(w * 0.52, h * 0.65, 44, 12);
      }

      // 4. Atmospheric Heavy Rain Curtain
      ctx.strokeStyle = isEnvA
        ? 'rgba(186, 230, 253, 0.45)'
        : 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = isEnvA ? 1.4 : 1;
      const dropCount = isEnvA ? 75 : 26;
      for (let r = 0; r < dropCount; r++) {
        const rx = (r * 37 + frameTick * 6) % w;
        const ry = (r * 53 + frameTick * 16) % h;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 7, ry + 22);
        ctx.stroke();
      }

      ctx.restore();
      animId = requestAnimationFrame(drawScene);
    };

    drawScene();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, activeShot, shotElapsedSec]);

  if (!isOpen) return null;

  const handleSelectCharacterPreset = (
    characterToken: 'Character_A' | 'Character_B',
    presetId: CharacterVoicePresetId
  ) => {
    setSelectedCharacterPresets((prev) => ({ ...prev, [characterToken]: presetId }));
    setVoiceoverClips((prev) =>
      applyCharacterPresetToVoiceoverClips(prev, characterToken, presetId, true)
    );
    const preset = AI_CHARACTER_VOICE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setUploadFeedback({
        type: 'success',
        message: `Voice Library applied: "${preset.label}" mapped to all ${preset.speakerHandle} (${characterToken}) lines.`,
      });
    }
  };

  const handleApplyVoiceLibraryToClipOrScope = (
    presetId: CharacterVoicePresetId,
    options: { targetClipId?: string; targetCharacterToken?: 'Character_A' | 'Character_B' } = {}
  ) => {
    const preset = AI_CHARACTER_VOICE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const effectiveClipId =
      options.targetClipId ||
      (uploadScopeTarget !== 'all_role_lines' ? uploadScopeTarget : undefined);
    const effectiveCharToken: 'Character_A' | 'Character_B' =
      options.targetCharacterToken ||
      (uploadRoleTarget !== 'auto' ? uploadRoleTarget : preset.characterToken);

    if (!effectiveClipId) {
      setSelectedCharacterPresets((prev) => ({ ...prev, [effectiveCharToken]: presetId }));
    }

    setVoiceoverClips((prev) =>
      applyVoiceLibraryPresetToClips(prev, presetId, {
        targetClipId: effectiveClipId,
        targetCharacterToken: effectiveClipId ? undefined : effectiveCharToken,
      })
    );

    const targetLabel = effectiveClipId
      ? `Clip ${effectiveClipId}`
      : `all ${effectiveCharToken === 'Character_A' ? 'Lin_Jie (Character_A)' : 'Ji_Zhixiu (Character_B)'} lines`;
    setUploadFeedback({
      type: 'success',
      message: `Selected from Voice Library: "${preset.label}" → mapped to ${targetLabel}.`,
    });
  };

  const handleAuditionVoiceLibraryPreset = (presetId: CharacterVoicePresetId) => {
    const preset = AI_CHARACTER_VOICE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const sampleText =
      preset.sampleLine ||
      (preset.characterToken === 'Character_A'
        ? 'Welcome to my bookstore. Have a cup of warm tea.'
        : 'Time, I need time. Is this bookstore a coincidence or a trap?');
    const wavDataUri = synthesizeCharacterVoiceWavDataUri(
      sampleText,
      preset.characterToken,
      preset.defaultPitch,
      2.4
    );
    playVoiceoverClipAudio({
      clipId: `audition_${preset.id}`,
      shotId: 'shot_01',
      shotNumber: 1,
      lineIndex: 1,
      characterToken: preset.characterToken,
      speakerHandle: preset.speakerHandle,
      dialogueText: sampleText,
      deliveryNote: preset.stylePrompt,
      sourceType: 'ai_preset',
      presetId: preset.id,
      geminiVoiceName: preset.geminiVoiceName,
      audioDataUri: wavDataUri,
      durationSec: 2.4,
      volume: 0.95,
      pitch: preset.defaultPitch,
      playbackRate: preset.defaultRate,
    });
  };

  const handleUploadVoiceFile = (
    file: File,
    options: { targetClipId?: string; targetCharacterToken?: 'Character_A' | 'Character_B' }
  ) => {
    const validation = validateVoiceUploadFile(file.name, file.type, file.size);
    if (!validation.valid || validation.normalizedFormat === 'UNKNOWN') {
      setUploadFeedback({
        type: 'error',
        message: validation.error || 'Unsupported file format. Please drop a .mp3 or .wav file.',
      });
      return;
    }

    const inferred = inferCharacterAndShotFromFileName(file.name);
    const resolvedCharacterToken: 'Character_A' | 'Character_B' =
      options.targetCharacterToken ||
      (options.targetClipId
        ? voiceoverClips.find((c) => c.clipId === options.targetClipId)?.characterToken
        : undefined) ||
      (uploadRoleTarget !== 'auto' ? uploadRoleTarget : undefined) ||
      inferred.characterToken ||
      'Character_A';

    const resolvedClipId =
      options.targetClipId ||
      (uploadScopeTarget !== 'all_role_lines' ? uploadScopeTarget : undefined) ||
      (inferred.shotId
        ? voiceoverClips.find(
            (c) =>
              c.shotId === inferred.shotId && c.characterToken === resolvedCharacterToken
          )?.clipId || voiceoverClips.find((c) => c.shotId === inferred.shotId)?.clipId
        : undefined);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      if (!dataUri) return;

      const newAsset: UploadedCharacterVoiceAsset = {
        id: `voice_asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        format: validation.normalizedFormat === 'MP3' ? 'MP3' : 'WAV',
        fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
        characterToken: resolvedCharacterToken,
        speakerHandle: resolvedCharacterToken === 'Character_A' ? 'Lin_Jie' : 'Ji_Zhixiu',
        targetScope: resolvedClipId || 'all_role_lines',
        audioDataUri: dataUri,
        uploadedAtUtc: new Date().toISOString(),
      };

      setUploadedVoiceAssets((prev) => [newAsset, ...prev]);
      setVoiceoverClips((prev) =>
        attachCustomVoiceAudioToClips(prev, {
          targetClipId: resolvedClipId,
          targetCharacterToken: resolvedClipId ? undefined : resolvedCharacterToken,
          audioDataUri: dataUri,
          uploadedFileName: file.name,
          sourceType: 'uploaded_file',
        })
      );

      const roleLabel =
        resolvedCharacterToken === 'Character_A'
          ? 'Character_A (Lin_Jie)'
          : 'Character_B (Ji_Zhixiu)';
      const targetDesc = resolvedClipId
        ? `Clip ${resolvedClipId}`
        : `all ${roleLabel} dialogue lines`;
      setUploadFeedback({
        type: 'success',
        message: `Mapped "${file.name}" (${validation.normalizedFormat}) → ${targetDesc}.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleProcessVoiceFileList = (
    fileList: FileList | File[],
    options: { targetClipId?: string; targetCharacterToken?: 'Character_A' | 'Character_B' } = {}
  ) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    files.forEach((file) => handleUploadVoiceFile(file, options));
  };

  const handleReassignUploadedAssetRole = (
    assetId: string,
    newCharacterToken: 'Character_A' | 'Character_B',
    newScope: 'all_role_lines' | string
  ) => {
    const asset = uploadedVoiceAssets.find((a) => a.id === assetId);
    if (!asset) return;

    setUploadedVoiceAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              characterToken: newCharacterToken,
              speakerHandle: newCharacterToken === 'Character_A' ? 'Lin_Jie' : 'Ji_Zhixiu',
              targetScope: newScope,
            }
          : a
      )
    );

    setVoiceoverClips((prev) =>
      attachCustomVoiceAudioToClips(prev, {
        targetClipId: newScope === 'all_role_lines' ? undefined : newScope,
        targetCharacterToken: newScope === 'all_role_lines' ? newCharacterToken : undefined,
        audioDataUri: asset.audioDataUri,
        uploadedFileName: asset.fileName,
        sourceType: 'uploaded_file',
      })
    );

    setUploadFeedback({
      type: 'success',
      message: `Remapped "${asset.fileName}" to ${
        newCharacterToken === 'Character_A' ? 'Lin_Jie (Character_A)' : 'Ji_Zhixiu (Character_B)'
      } (${newScope === 'all_role_lines' ? 'All Role Lines' : newScope}).`,
    });
  };

  const handleRemoveUploadedVoiceAsset = (assetId: string) => {
    const asset = uploadedVoiceAssets.find((a) => a.id === assetId);
    setUploadedVoiceAssets((prev) => prev.filter((a) => a.id !== assetId));
    if (asset) {
      setVoiceoverClips((prev) =>
        prev
          .filter((c) => c.uploadedFileName === asset.fileName)
          .reduce(
            (acc, c) =>
              resetVoiceClipToAiPreset(acc, {
                targetClipId: c.clipId,
                selectedPresets: selectedCharacterPresets,
              }),
            prev
          )
      );
      setUploadFeedback({
        type: 'success',
        message: `Removed "${asset.fileName}" and restored AI Voice preset.`,
      });
    }
  };

  const handleSynthesizeGeminiTtsForClip = async (clip: ShotVoiceoverClip) => {
    setSynthesizingClipId(clip.clipId);
    try {
      const preset = AI_CHARACTER_VOICE_PRESETS.find((p) => p.id === clip.presetId);
      const response = await fetch('/api/text-to-animation/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogueText: clip.dialogueText,
          characterToken: clip.characterToken,
          voiceName: clip.geminiVoiceName,
          stylePrompt: preset?.stylePrompt || clip.deliveryNote,
          pitch: clip.pitch,
          durationSec: clip.durationSec,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.audioDataUri) {
          const updatedClips = attachCustomVoiceAudioToClips(voiceoverClips, {
            targetClipId: clip.clipId,
            audioDataUri: data.audioDataUri,
            sourceType: 'gemini_tts',
          });
          setVoiceoverClips(updatedClips);
          const updatedClip = updatedClips.find((c) => c.clipId === clip.clipId);
          if (updatedClip) playVoiceoverClipAudio(updatedClip);
        }
      }
    } catch {
      const wavUri = synthesizeCharacterVoiceWavDataUri(
        clip.dialogueText,
        clip.characterToken,
        clip.pitch,
        clip.durationSec
      );
      setVoiceoverClips((prev) =>
        attachCustomVoiceAudioToClips(prev, {
          targetClipId: clip.clipId,
          audioDataUri: wavUri,
          sourceType: 'ai_preset',
        })
      );
    } finally {
      setSynthesizingClipId(null);
    }
  };

  const handleExportWebmVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecordingWebm) return;

    try {
      setIsRecordingWebm(true);
      setRecordingProgressPct(5);
      setActiveShotIndex(0);
      setShotElapsedSec(0);
      setIsPlaying(true);

      const stream = canvas.captureStream(24);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        triggerBrowserDownload(blob, 'nocturne_rainy_bookstore_10shots_24fps.webm');
        setIsRecordingWebm(false);
        setRecordingProgressPct(0);
      };

      recorder.start(200);

      let step = 0;
      const timer = setInterval(() => {
        step += 1;
        setRecordingProgressPct(Math.min(95, step * 16));
        if (step >= 6) {
          clearInterval(timer);
          if (recorder.state !== 'inactive') recorder.stop();
        }
      }, 1000);
    } catch {
      setIsRecordingWebm(false);
      setRecordingProgressPct(0);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const primaryActiveClip = activeShotVoiceClips[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Text-to-Animation Video Generator &amp; Character Voiceover Studio
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase">
                  3 Scenes · 10 Shots · 45s @ 24fps
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 uppercase">
                  Lin_Jie &amp; Ji_Zhixiu Voiceover Mapped
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Global Visual &amp; Asset Tokens + 10-Shot 24fps Anime Player + Upload or AI-Generate Character Voiceovers (Lin_Jie &amp; Ji_Zhixiu)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Close Text-to-Animation Generator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap gap-2">
          {[
            {
              id: 'player',
              label: '1. 24 FPS Animation Video Player & 10-Shot Sequencer',
              icon: Play,
            },
            {
              id: 'voiceover',
              label: '2. Character Voiceover Studio (Lin_Jie & Ji_Zhixiu)',
              icon: Mic,
            },
            {
              id: 'assets',
              label: '3. Global Visual & Asset Definitions',
              icon: Users,
            },
            {
              id: 'script_parser',
              label: '4. Live AI Script Parser & Cost Audit',
              icon: FileCode,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                  active
                    ? 'bg-slate-900 text-emerald-300 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'player' && (
            <div className="space-y-5">
              {/* Top Grid: 24 FPS Canvas Player + Active Shot Prompt & Voiceover Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left 7 Cols: Live 24fps 2.5D Anime Canvas Player */}
                <div className="lg:col-span-7 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col">
                  <div className="relative aspect-video bg-black">
                    <canvas
                      ref={canvasRef}
                      width={960}
                      height={540}
                      className="w-full h-full object-cover"
                    />

                    {/* Top Telemetry Overlay */}
                    <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-black/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                          {activeShot.sceneTitle} · SHOT{' '}
                          {String(activeShot.shotNumber).padStart(2, '0')}/10
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-amber-300 text-xs font-bold">
                          {activeShot.title} ({activeShot.scriptDurationSec}s)
                        </span>
                      </div>
                      {primaryActiveClip && (
                        <span className="px-2.5 py-1 rounded-lg bg-black/85 border border-purple-500/50 text-purple-200 text-[11px] font-mono flex items-center gap-1.5">
                          <Mic className="w-3 h-3 text-amber-400" />
                          <span>
                            {primaryActiveClip.speakerHandle}:{' '}
                            {primaryActiveClip.sourceType === 'uploaded_file'
                              ? `Uploaded (${primaryActiveClip.uploadedFileName || 'Custom'})`
                              : `AI Voice (${primaryActiveClip.geminiVoiceName})`}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Cinema Subtitle, Action & Audio SFX Bar */}
                    <div className="absolute bottom-3 inset-x-3 p-3 rounded-xl bg-black/85 border border-slate-800 backdrop-blur-md space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-cyan-300 font-mono">
                        <span>CAM: {activeShot.camera}</span>
                        <span>SFX: {activeShot.audioSfx.slice(0, 62)}</span>
                      </div>
                      <div className="text-xs text-slate-200 font-medium">
                        <strong className="text-emerald-400">Action:</strong> {activeShot.action}
                      </div>
                      {activeShotVoiceClips.length > 0 && (
                        <div className="pt-1 border-t border-slate-800/80 space-y-1">
                          {activeShotVoiceClips.map((vc) => (
                            <div
                              key={vc.clipId}
                              className="flex items-center justify-between gap-2 text-xs font-bold text-amber-300 italic"
                            >
                              <span>
                                [{vc.speakerHandle} · {vc.deliveryNote}]: &ldquo;{vc.dialogueText}
                                &rdquo;
                              </span>
                              <button
                                onClick={() => playVoiceoverClipAudio(vc)}
                                className="shrink-0 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-[10px] font-mono text-amber-200 not-italic flex items-center gap-1"
                                title="Replay Mapped Character Voice Clip"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>Play Voice</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transport & Export Controls */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveShotIndex((prev) => (prev - 1 + shots.length) % shots.length);
                          setShotElapsedSec(0);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                        title="Previous Shot"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setIsPlaying((prev) => !prev)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause Animation</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Play 10-Shot Animation</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setActiveShotIndex((prev) => (prev + 1) % shots.length);
                          setShotElapsedSec(0);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                        title="Next Shot"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setSoundEnabled((prev) => !prev)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                          soundEnabled
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title="Toggle Character Voiceover & Procedural Sound Effects"
                      >
                        {soundEnabled ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Voiceover + SFX ON</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>Muted</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveTab('voiceover')}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Mic className="w-3.5 h-3.5 text-purple-300" />
                        <span>Configure Character Voices</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportWebmVideo}
                        disabled={isRecordingWebm}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {isRecordingWebm
                            ? `Recording .WebM (${recordingProgressPct}%)...`
                            : 'Export .WebM Video'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right 5 Cols: Expanded T2V / I2V Master Prompt & Active Shot Voiceover Card */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>
                          Shot {String(activeShot.shotNumber).padStart(2, '0')} Master Prompt &amp; Voice
                        </span>
                      </h3>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        Global Tokens Injected
                      </span>
                    </div>

                    {/* Inline Active Shot Character Voiceover Quick-Control */}
                    {primaryActiveClip && (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-purple-500/30 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-black text-white">
                              {primaryActiveClip.speakerHandle} ({primaryActiveClip.characterToken})
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-[10px] font-mono text-purple-300">
                              {primaryActiveClip.sourceType === 'uploaded_file'
                                ? primaryActiveClip.uploadedFileName || 'Custom Upload'
                                : `AI Voice: ${primaryActiveClip.geminiVoiceName}`}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <select
                              value={primaryActiveClip.presetId}
                              onChange={(e) =>
                                handleApplyVoiceLibraryToClipOrScope(
                                  e.target.value as CharacterVoicePresetId,
                                  { targetClipId: primaryActiveClip.clipId }
                                )
                              }
                              aria-label="Active Shot Voice Library Dropdown"
                              className="px-2 py-1 rounded-lg bg-slate-950 border border-purple-500/40 text-[11px] font-bold text-purple-200 max-w-[185px]"
                              title="Voice Library: Pick a Pre-Generated AI Character Voice for This Shot"
                            >
                              <optgroup label="Lin_Jie (Character_A) AI Voices">
                                {AI_CHARACTER_VOICE_PRESETS.filter(
                                  (p) => p.characterToken === 'Character_A'
                                ).map((preset) => (
                                  <option key={preset.id} value={preset.id}>
                                    {preset.geminiVoiceName}: {preset.label.split('—')[1]?.trim() || preset.label}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Ji_Zhixiu (Character_B) AI Voices">
                                {AI_CHARACTER_VOICE_PRESETS.filter(
                                  (p) => p.characterToken === 'Character_B'
                                ).map((preset) => (
                                  <option key={preset.id} value={preset.id}>
                                    {preset.geminiVoiceName}: {preset.label.split('—')[1]?.trim() || preset.label}
                                  </option>
                                ))}
                              </optgroup>
                            </select>

                            <button
                              onClick={() => playVoiceoverClipAudio(primaryActiveClip)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                            <label className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                              <Upload className="w-3 h-3 text-cyan-400" />
                              <span>Upload .MP3/.WAV</span>
                              <input
                                type="file"
                                accept=".mp3,.wav,audio/mpeg,audio/wav"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleUploadVoiceFile(file, {
                                      targetClipId: primaryActiveClip.clipId,
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="text-[11px] text-amber-200/90 italic line-clamp-2">
                          &ldquo;{primaryActiveClip.dialogueText}&rdquo;
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 block">
                        Full Token-Expanded T2V Agent Prompt (Style + Character Sheet + Environment):
                      </label>
                      <textarea
                        readOnly
                        rows={4}
                        value={expandedPrompt}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-200 font-mono leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleCopy(`prompt_${activeShot.shotId}`, expandedPrompt)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        {copiedId === `prompt_${activeShot.shotId}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedId === `prompt_${activeShot.shotId}`
                            ? 'Copied Master Prompt!'
                            : 'Copy Master Prompt'}
                        </span>
                      </button>

                      {onApplyPromptToLeoStudio && (
                        <button
                          onClick={() => {
                            onApplyPromptToLeoStudio(
                              `Scene ${activeShot.sceneNumber} · Shot ${String(activeShot.shotNumber).padStart(2, '0')}: ${activeShot.title}`,
                              expandedPrompt,
                              activeShot.scriptDurationSec
                            );
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Send Shot to LEO Studio</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Summary Bar */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">
                        Total Script
                      </div>
                      <div className="text-sm font-black text-white font-mono">
                        {auditSummary.totalScriptDurationSec}s (1,080f)
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">
                        Omni Flash 720p
                      </div>
                      <div className="text-sm font-black text-emerald-400 font-mono">
                        ${auditSummary.estimatedOmniFlash720pNativeUsd.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">
                        Veo 3.1 Fast 1080p
                      </div>
                      <div className="text-sm font-black text-amber-300 font-mono">
                        ${auditSummary.estimatedVeoFast1080pUsd.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 10-Shot Interactive Storyboard Strip */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Sequential 10-Shot Animation Timeline (Click Any Shot to Jump)</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Scene 1 (12s) · Scene 2 (13s) · Scene 3 (20s) = 45s Total
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {shots.map((shot, idx) => {
                    const isCurrent = idx === activeShotIndex;
                    const shotClip = voiceoverClips.find((c) => c.shotId === shot.shotId);
                    return (
                      <button
                        key={shot.shotId}
                        onClick={() => {
                          setActiveShotIndex(idx);
                          setShotElapsedSec(0);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                          isCurrent
                            ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/10'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-mono font-black text-emerald-300">
                            SHOT {String(shot.shotNumber).padStart(2, '0')}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-amber-300">
                            {shot.scriptDurationSec}s
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white line-clamp-1">
                          {shot.title}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-2">
                          {shot.visualPrompt}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[9px] font-mono text-purple-300">
                          <span>{shotClip?.speakerHandle || 'Lin_Jie'}</span>
                          <span>
                            {shotClip?.sourceType === 'uploaded_file'
                              ? 'Custom Audio'
                              : `AI: ${shotClip?.geminiVoiceName || 'Charon'}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHARACTER VOICEOVER STUDIO (Lin_Jie & Ji_Zhixiu) */}
          {activeTab === 'voiceover' && (
            <div className="space-y-5">
              {/* Custom Voice Upload: Drag & Drop .MP3 / .WAV Role Mapper */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300">
                      <FileAudio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white">
                          Custom Voice Upload · Drag &amp; Drop .MP3 or .WAV to Character Roles
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold">
                          .MP3 / .WAV · Max 50 MB
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Drag and drop one or multiple <code className="text-cyan-300">.mp3</code> or{' '}
                        <code className="text-cyan-300">.wav</code> voice stems below, or drop directly onto{' '}
                        <strong className="text-amber-300">Lin_Jie</strong> /{' '}
                        <strong className="text-rose-300">Ji_Zhixiu</strong> role cards or any individual shot line.
                      </p>
                    </div>
                  </div>

                  {/* Role & Scope Target Selectors for Main Dropzone & Voice Library */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={uploadRoleTarget}
                      onChange={(e) =>
                        setUploadRoleTarget(
                          e.target.value as 'auto' | 'Character_A' | 'Character_B'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold"
                      title="Target Character Role for Voice Library or Dropped Files"
                    >
                      <option value="auto">Auto-Detect Role from Voice / Filename</option>
                      <option value="Character_A">Map to Character_A (Lin_Jie)</option>
                      <option value="Character_B">Map to Character_B (Ji_Zhixiu)</option>
                    </select>

                    <select
                      value={uploadScopeTarget}
                      onChange={(e) => setUploadScopeTarget(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold"
                      title="Target Shot Line or Entire Character Role"
                    >
                      <option value="all_role_lines">Apply to All Lines of Selected Role</option>
                      {voiceoverClips.map((vc) => (
                        <option key={vc.clipId} value={vc.clipId}>
                          Shot {String(vc.shotNumber).padStart(2, '0')} · {vc.speakerHandle} (Line{' '}
                          {vc.lineIndex})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pre-Generated AI Voice Library Dropdown Bar (No Manual Upload Required) */}
                <div className="p-3.5 rounded-2xl bg-purple-950/25 border border-purple-500/35 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-300" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        Voice Library · Pre-Generated AI Character Voices
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] font-mono text-purple-200 font-bold">
                        {AI_CHARACTER_VOICE_PRESETS.length} Pre-Generated Voices Ready
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Pick from pre-generated AI character voices (<strong className="text-amber-300">Lin_Jie</strong> &amp;{' '}
                      <strong className="text-rose-300">Ji_Zhixiu</strong>) and map directly to a role or shot without manual file uploads.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedVoiceLibraryPresetId}
                      onChange={(e) =>
                        setSelectedVoiceLibraryPresetId(e.target.value as CharacterVoicePresetId)
                      }
                      aria-label="Voice Library Pre-Generated AI Character Voices"
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-purple-500/50 text-xs text-white font-semibold min-w-[260px]"
                    >
                      <optgroup label="Character_A (Lin_Jie) — Pre-Generated AI Voices">
                        {AI_CHARACTER_VOICE_PRESETS.filter(
                          (p) => p.characterToken === 'Character_A'
                        ).map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            [Lin_Jie] {preset.label} ({preset.fundamentalHz}Hz)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Character_B (Ji_Zhixiu) — Pre-Generated AI Voices">
                        {AI_CHARACTER_VOICE_PRESETS.filter(
                          (p) => p.characterToken === 'Character_B'
                        ).map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            [Ji_Zhixiu] {preset.label} ({preset.fundamentalHz}Hz)
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    <button
                      onClick={() => handleAuditionVoiceLibraryPreset(selectedVoiceLibraryPresetId)}
                      className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                      title="Preview Selected Pre-Generated AI Voice from Library"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Preview Library Voice</span>
                    </button>

                    <button
                      onClick={() =>
                        handleApplyVoiceLibraryToClipOrScope(selectedVoiceLibraryPresetId)
                      }
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow"
                      title="Map Selected Pre-Generated AI Voice to Target Role or Shot"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Map Library Voice</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Drag & Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragOverTarget !== 'main_dropzone') {
                      setDragOverTarget('main_dropzone');
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverTarget((prev) => (prev === 'main_dropzone' ? null : prev));
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverTarget(null);
                    if (e.dataTransfer?.files?.length) {
                      handleProcessVoiceFileList(e.dataTransfer.files);
                    }
                  }}
                  className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    dragOverTarget === 'main_dropzone'
                      ? 'border-cyan-400 bg-cyan-500/15 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-700 bg-slate-900/70 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-white">
                        {dragOverTarget === 'main_dropzone'
                          ? 'Release to Map .MP3 / .WAV Voice Files to Character Role!'
                          : 'Drag & Drop .MP3 or .WAV Voice Files Here'}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Filenames like <code className="text-amber-300">lin_jie_shot01.mp3</code> or{' '}
                        <code className="text-rose-300">ji_zhixiu_shot05.wav</code> automatically map to the matching character &amp; shot!
                      </p>
                    </div>
                  </div>

                  <label className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0 shadow">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse .MP3 / .WAV Files</span>
                    <input
                      type="file"
                      accept=".mp3,.wav,audio/mpeg,audio/wav"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleProcessVoiceFileList(e.target.files);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Upload Feedback Banner */}
                {uploadFeedback && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
                      uploadFeedback.type === 'error'
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {uploadFeedback.type === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span>{uploadFeedback.message}</span>
                    </div>
                    <button
                      onClick={() => setUploadFeedback(null)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Uploaded Custom Voice Assets Library */}
                {uploadedVoiceAssets.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-cyan-300 uppercase tracking-wider">
                        Uploaded Custom Voice Library ({uploadedVoiceAssets.length} File
                        {uploadedVoiceAssets.length === 1 ? '' : 's'})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Reassign any uploaded .mp3/.wav file to Lin_Jie, Ji_Zhixiu, or a specific shot
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {uploadedVoiceAssets.map((asset) => (
                        <div
                          key={asset.id}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 uppercase">
                              .{asset.format.toLowerCase()}
                            </span>
                            <div className="truncate">
                              <div className="text-xs font-bold text-white truncate">
                                {asset.fileName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {asset.fileSizeKb} KB · Mapped to{' '}
                                <span
                                  className={
                                    asset.characterToken === 'Character_A'
                                      ? 'text-amber-300 font-bold'
                                      : 'text-rose-300 font-bold'
                                  }
                                >
                                  {asset.speakerHandle}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <select
                              value={asset.characterToken}
                              onChange={(e) =>
                                handleReassignUploadedAssetRole(
                                  asset.id,
                                  e.target.value as 'Character_A' | 'Character_B',
                                  'all_role_lines'
                                )
                              }
                              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-white font-semibold"
                              title="Reassign Character Role"
                            >
                              <option value="Character_A">Role: Lin_Jie (Character_A)</option>
                              <option value="Character_B">Role: Ji_Zhixiu (Character_B)</option>
                            </select>

                            <button
                              onClick={() => {
                                const audio = new Audio(asset.audioDataUri);
                                audio.play().catch(() => {});
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300"
                              title="Audition Uploaded Audio"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleRemoveUploadedVoiceAsset(asset.id)}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300"
                              title="Remove Uploaded Voice & Restore AI Preset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Character Casting & Role-Specific Drag-and-Drop Voice Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['Character_A', 'Character_B'] as const).map((charToken) => {
                  const charSheet = assets.characters[charToken];
                  const charPresets = AI_CHARACTER_VOICE_PRESETS.filter(
                    (p) => p.characterToken === charToken
                  );
                  const activePresetId = selectedCharacterPresets[charToken];
                  const activePreset =
                    charPresets.find((p) => p.id === activePresetId) || charPresets[0];
                  const charClips = voiceoverClips.filter((c) => c.characterToken === charToken);
                  const uploadedCountForRole = charClips.filter(
                    (c) => c.sourceType === 'uploaded_file'
                  ).length;
                  const isRoleDragOver = dragOverTarget === `role_${charToken}`;

                  return (
                    <div
                      key={charToken}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (dragOverTarget !== `role_${charToken}`) {
                          setDragOverTarget(`role_${charToken}`);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverTarget((prev) =>
                          prev === `role_${charToken}` ? null : prev
                        );
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverTarget(null);
                        if (e.dataTransfer?.files?.length) {
                          handleProcessVoiceFileList(e.dataTransfer.files, {
                            targetCharacterToken: charToken,
                          });
                        }
                      }}
                      className={`p-4 rounded-2xl bg-slate-950 border-2 transition-all space-y-3 ${
                        isRoleDragOver
                          ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-2 rounded-xl border ${
                              charToken === 'Character_A'
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                            }`}
                          >
                            <Mic className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white">
                              {charSheet.displayName}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              {charClips.length} Mapped Clips ·{' '}
                              {uploadedCountForRole > 0 ? (
                                <span className="text-cyan-300 font-bold">
                                  {uploadedCountForRole} Custom .MP3/.WAV Active
                                </span>
                              ) : (
                                'Drop .MP3 / .WAV on card to map role'
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Upload Global Character Voice Sample (.MP3 / .WAV) */}
                        <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload {charSheet.handle} (.MP3/.WAV)</span>
                          <input
                            type="file"
                            accept=".mp3,.wav,audio/mpeg,audio/wav"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUploadVoiceFile(file, { targetCharacterToken: charToken });
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Voice Library Dropdown for Character Role */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-purple-300 flex items-center justify-between">
                          <span>Voice Library · Pick Pre-Generated AI Character Voice:</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {charPresets.length} AI Voices Available
                          </span>
                        </label>
                        <select
                          value={activePresetId}
                          onChange={(e) =>
                            handleSelectCharacterPreset(
                              charToken,
                              e.target.value as CharacterVoicePresetId
                            )
                          }
                          aria-label={`${charSheet.handle} Voice Library Dropdown`}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-purple-500/40 text-xs text-white font-semibold"
                        >
                          {charPresets.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                              {preset.label} (Voice: {preset.geminiVoiceName} · {preset.fundamentalHz}Hz)
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400">
                          <strong className="text-slate-300">Timbre:</strong>{' '}
                          {activePreset.timbreDescription}
                        </p>
                      </div>

                      {/* Quick Sample Audition Button */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                        <span className="text-[11px] font-mono text-slate-400">
                          Style: &ldquo;{activePreset.stylePrompt.slice(0, 56)}...&rdquo;
                        </span>
                        {charClips[0] && (
                          <button
                            onClick={() => playVoiceoverClipAudio(charClips[0])}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Audition {charSheet.handle} Voice</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Filter & Per-Shot Voiceover Mapping Table */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      10-Shot Character Voiceover Timeline Mapping ({filteredVoiceoverClips.length}{' '}
                      Clips · Drag &amp; Drop .MP3/.WAV onto Any Row)
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'All Shots (12 Clips)' },
                        { id: 'Character_A', label: 'Lin_Jie Only (Character_A)' },
                        { id: 'Character_B', label: 'Ji_Zhixiu Only (Character_B)' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setCharacterFilter(f.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          characterFilter === f.id
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {filteredVoiceoverClips.map((clip) => {
                    const isPlayingClip = activePlayingClipId === clip.clipId;
                    const isSynthesizing = synthesizingClipId === clip.clipId;
                    const isLin = clip.characterToken === 'Character_A';
                    const isClipDragOver = dragOverTarget === `clip_${clip.clipId}`;

                    return (
                      <div
                        key={clip.clipId}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (dragOverTarget !== `clip_${clip.clipId}`) {
                            setDragOverTarget(`clip_${clip.clipId}`);
                          }
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverTarget((prev) =>
                            prev === `clip_${clip.clipId}` ? null : prev
                          );
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverTarget(null);
                          const file = e.dataTransfer?.files?.[0];
                          if (file) {
                            handleUploadVoiceFile(file, { targetClipId: clip.clipId });
                          }
                        }}
                        className={`p-3 rounded-xl bg-slate-900 border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                          isClipDragOver
                            ? 'border-cyan-400 bg-cyan-500/10'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-[11px] font-bold">
                              SHOT {String(clip.shotNumber).padStart(2, '0')} · Line {clip.lineIndex}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                isLin
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                              }`}
                            >
                              {clip.speakerHandle} ({clip.characterToken})
                            </span>
                            <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-[10px] font-mono text-purple-300">
                              {clip.sourceType === 'uploaded_file'
                                ? `Uploaded: ${clip.uploadedFileName || 'Custom Audio'}`
                                : clip.sourceType === 'gemini_tts'
                                ? `Gemini 3.8 TTS (${clip.geminiVoiceName})`
                                : `AI Preset (${clip.geminiVoiceName})`}
                            </span>
                            <span className="text-[11px] text-slate-400 italic">
                              Delivery: {clip.deliveryNote}
                            </span>
                          </div>

                          <input
                            type="text"
                            value={clip.dialogueText}
                            onChange={(e) => {
                              const nextText = e.target.value;
                              setVoiceoverClips((prev) =>
                                prev.map((c) =>
                                  c.clipId === clip.clipId
                                    ? {
                                        ...c,
                                        dialogueText: nextText,
                                        audioDataUri:
                                          c.sourceType === 'uploaded_file'
                                            ? c.audioDataUri
                                            : synthesizeCharacterVoiceWavDataUri(
                                                nextText,
                                                c.characterToken,
                                                c.pitch,
                                                c.durationSec
                                              ),
                                      }
                                    : c
                                )
                              );
                            }}
                            className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                          />
                        </div>

                        {/* Right Controls: Per-Shot Voice Library Dropdown, Play, Gemini AI TTS Synth, Upload .MP3/.WAV, Reset to AI, Download WAV */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <select
                            value={clip.presetId}
                            onChange={(e) =>
                              handleApplyVoiceLibraryToClipOrScope(
                                e.target.value as CharacterVoicePresetId,
                                { targetClipId: clip.clipId }
                              )
                            }
                            aria-label={`Shot ${clip.shotNumber} Line ${clip.lineIndex} Voice Library`}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-purple-500/40 text-[11px] text-purple-200 font-bold max-w-[195px]"
                            title="Voice Library: Pick Pre-Generated AI Voice for This Line"
                          >
                            <optgroup label="Lin_Jie (Character_A) Voice Library">
                              {AI_CHARACTER_VOICE_PRESETS.filter(
                                (p) => p.characterToken === 'Character_A'
                              ).map((preset) => (
                                <option key={preset.id} value={preset.id}>
                                  {preset.geminiVoiceName} — {preset.label.split('—')[1]?.trim() || preset.label}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Ji_Zhixiu (Character_B) Voice Library">
                              {AI_CHARACTER_VOICE_PRESETS.filter(
                                (p) => p.characterToken === 'Character_B'
                              ).map((preset) => (
                                <option key={preset.id} value={preset.id}>
                                  {preset.geminiVoiceName} — {preset.label.split('—')[1]?.trim() || preset.label}
                                </option>
                              ))}
                            </optgroup>
                          </select>

                          <button
                            onClick={() => playVoiceoverClipAudio(clip)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                              isPlayingClip
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{isPlayingClip ? 'Playing...' : 'Play Clip'}</span>
                          </button>

                          <button
                            onClick={() => handleSynthesizeGeminiTtsForClip(clip)}
                            disabled={isSynthesizing}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                            title="Generate AI Voice Clip via Gemini 3.8 TTS"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`}
                            />
                            <span>{isSynthesizing ? 'Generating...' : 'AI Synth'}</span>
                          </button>

                          <label className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>.MP3/.WAV</span>
                            <input
                              type="file"
                              accept=".mp3,.wav,audio/mpeg,audio/wav"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadVoiceFile(file, { targetClipId: clip.clipId });
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>

                          {clip.sourceType === 'uploaded_file' && (
                            <button
                              onClick={() =>
                                setVoiceoverClips((prev) =>
                                  resetVoiceClipToAiPreset(prev, {
                                    targetClipId: clip.clipId,
                                    selectedPresets: selectedCharacterPresets,
                                  })
                                )
                              }
                              className="p-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300"
                              title="Reset Clip to AI Voice Preset"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() =>
                              triggerBrowserDownload(
                                clip.audioDataUri,
                                `${clip.shotId}_${clip.speakerHandle.toLowerCase()}_line${clip.lineIndex}.wav`
                              )
                            }
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Download .WAV Voice Stem"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GLOBAL VISUAL & ASSET DEFINITIONS */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Global Art Style Token (Applied to All 10 Shots)
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {assets.frameRateFps} FPS · {assets.targetMasterResolution}
                  </span>
                </div>
                <input
                  type="text"
                  value={assets.globalArtStyle}
                  onChange={(e) =>
                    setAssets((prev) => ({ ...prev, globalArtStyle: e.target.value }))
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['Character_A', 'Character_B'] as const).map((charKey) => {
                  const char = assets.characters[charKey];
                  return (
                    <div
                      key={char.tokenId}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white">{char.displayName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold">
                          Token: {char.handle}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>
                          <strong className="text-slate-400">Appearance:</strong>{' '}
                          {char.appearancePrompt}
                        </div>
                        <div>
                          <strong className="text-slate-400">Wardrobe:</strong>{' '}
                          {char.wardrobePrompt}
                        </div>
                        <div>
                          <strong className="text-slate-400">Expression:</strong>{' '}
                          {char.expressionPrompt}
                        </div>
                        {char.signatureProp && (
                          <div>
                            <strong className="text-amber-300">Signature Prop:</strong>{' '}
                            {char.signatureProp}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['Environment_A', 'Environment_B'] as const).map((envKey) => {
                  const env = assets.environments[envKey];
                  return (
                    <div
                      key={env.tokenId}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white">{env.displayName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold">
                          Token: {env.handle}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>
                          <strong className="text-slate-400">Lighting &amp; Atmosphere:</strong>{' '}
                          {env.lightingAndAtmosphere}
                        </div>
                        <div>
                          <strong className="text-slate-400">Set Dressing:</strong>{' '}
                          {env.setDressingPrompt}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE AI SCRIPT PARSER & COST AUDIT */}
          {activeTab === 'script_parser' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>Paste or Edit AI Shot-by-Shot Script</span>
                  </h3>
                  <button
                    onClick={() => {
                      const parsed = parseAnimationScriptText(rawScriptInput);
                      setShots(parsed);
                      setVoiceoverClips(
                        buildDefaultShotVoiceoverMappings(parsed, selectedCharacterPresets)
                      );
                      setActiveShotIndex(0);
                      setShotElapsedSec(0);
                      setActiveTab('player');
                      setIsPlaying(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Parse Script &amp; Rebuild Voiceover Map</span>
                  </button>
                </div>
                <textarea
                  rows={14}
                  value={rawScriptInput}
                  onChange={(e) => setRawScriptInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono leading-relaxed"
                />
              </div>

              <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>T2V / I2V Script Feasibility &amp; Duration Audit</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Your 10-shot AI script works cleanly out of the box. Notice how shots with{' '}
                  <code className="text-amber-300">3s</code> or{' '}
                  <code className="text-amber-300">5s</code> durations are handled across providers:
                </p>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Parsed Shots / Scenes:</span>
                    <span className="font-mono font-bold text-white">
                      {auditSummary.shotCount} Shots across {auditSummary.sceneCount} Scenes
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Native Script Duration (24fps):</span>
                    <span className="font-mono font-bold text-emerald-300">
                      {auditSummary.totalScriptDurationSec}s ({auditSummary.totalFramesAt24Fps}{' '}
                      frames)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Veo 3.1 Normalized Duration ([4,6,8]s):</span>
                    <span className="font-mono font-bold text-amber-300">
                      {auditSummary.totalVeoNormalizedDurationSec}s
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">
                    Shots Auto-Normalized for Google Veo 3.1 (`[4, 6, 8]`s Rule):
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {auditSummary.durationNormalizedShots.map((n) => (
                      <div
                        key={n.shotId}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono"
                      >
                        <span className="text-white font-bold">{n.shotId.toUpperCase()}</span>
                        <span className="text-slate-400">
                          Script: {n.scriptDurationSec}s &rarr;{' '}
                          <strong className="text-amber-300">Veo 3.1: {n.veoDurationSec}s</strong>{' '}
                          (trim in FFmpeg)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
