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
  Clock,
  Camera,
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
  const [activeTab, setActiveTab] = useState<'player' | 'assets' | 'script_parser'>('player');
  const [assets, setAssets] = useState<GlobalVisualAssets>(DEFAULT_GLOBAL_VISUAL_ASSETS);
  const [shots, setShots] = useState<AnimationShotSpec[]>(TEN_SHOT_ANIMATION_SCRIPT);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [shotElapsedSec, setShotElapsedSec] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [rawScriptInput, setRawScriptInput] = useState<string>(RAW_USER_10_SHOT_SCRIPT_TEXT);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRecordingWebm, setIsRecordingWebm] = useState<boolean>(false);
  const [recordingProgressPct, setRecordingProgressPct] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const activeShot = shots[activeShotIndex] || shots[0];
  const auditSummary = useMemo(() => evaluateAnimationScriptSummary(shots, '1080p', 'fast'), [shots]);
  const expandedPrompt = useMemo(
    () => compileExpandedT2VPrompt(activeShot, assets),
    [activeShot, assets]
  );

  // Trigger procedural Web Audio cue & optional SpeechSynthesis when active shot changes
  useEffect(() => {
    if (!isOpen || !soundEnabled || !isPlaying || activeTab !== 'player') return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

        // Distinct procedural sound cue per shot choreography
        if (
          activeShot.choreographyPreset === 'doorway_rain_bell' ||
          activeShot.choreographyPreset === 'interior_pov_enter'
        ) {
          // Bronze bell chime
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.6);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.start(now);
          osc.stop(now + 0.65);
        } else if (
          activeShot.choreographyPreset === 'alley_blade_slash' ||
          activeShot.choreographyPreset === 'street_pov_retract_cane'
        ) {
          // Metallic Shing! blade cue
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1400, now);
          osc.frequency.exponentialRampToValueAtTime(3200, now + 0.22);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (activeShot.choreographyPreset === 'hunter_split_macro_trigger') {
          // Tense sub-bass drone + trigger click
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(65, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
        } else {
          // Warm porcelain clink / wooden thud
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(260, now + 0.25);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.start(now);
          osc.stop(now + 0.28);
        }
      }

      // Speak first dialogue line if browser SpeechSynthesis is available
      if ('speechSynthesis' in window && activeShot.dialogues.length > 0) {
        window.speechSynthesis.cancel();
        const firstLine = activeShot.dialogues[0];
        const utter = new SpeechSynthesisUtterance(firstLine.text);
        utter.rate = firstLine.speaker.includes('Ji_Zhixiu') ? 1.05 : 0.95;
        utter.pitch = firstLine.speaker.includes('Ji_Zhixiu') ? 1.15 : 0.88;
        utter.volume = 0.65;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      // Ignore audio autoplay restrictions
    }
  }, [isOpen, soundEnabled, isPlaying, activeShotIndex, activeTab, activeShot]);

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

      // Camera motion transform (push-in, dolly back, pan, or handheld shake)
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

      // 1. Base Backdrop (Environment_A Storm Street/Alley vs Environment_B Bookstore Interior)
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
        // Gothic-modern alley brick silhouettes & wet asphalt puddles
        ctx.fillStyle = '#070b16';
        ctx.fillRect(0, 0, w * 0.24, h * 0.78);
        ctx.fillRect(w * 0.76, 0, w * 0.24, h * 0.78);

        // Wet street pavement
        ctx.fillStyle = '#090f1d';
        ctx.fillRect(0, h * 0.75, w, h * 0.25);

        // Puddle ripples
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
        // Environment_B: Towering bookshelves + stacked books on floor
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

        // Warm yellow desk lamp radial chiaroscuro cone
        const lampX = preset === 'counter_twoshot_towel' ? w * 0.32 : w * 0.42;
        const lampY = h * 0.5;
        const lampGrad = ctx.createRadialGradient(lampX, lampY, 10, lampX, lampY, 290);
        lampGrad.addColorStop(0, 'rgba(251, 191, 36, 0.75)');
        lampGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.25)');
        lampGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = lampGrad;
        ctx.fillRect(0, 0, w, h);

        // Wooden Counter
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
        // Shot 01: Doorway frame, bronze bell, Lin_Jie frowning at rain splashes
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 14;
        ctx.strokeRect(w * 0.28, h * 0.08, w * 0.44, h * 0.84);

        // Swaying bronze bell at top of doorframe
        const bellAngle = Math.sin(frameTick * 0.18) * 10;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(w * 0.5 + bellAngle, h * 0.14, 14, 0, Math.PI * 2);
        ctx.fill();

        // Lin_Jie silhouette in black button-down shirt
        const lx = w * 0.5;
        const ly = h * 0.48;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(lx, ly, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(lx - 34, ly + 28, 68, 115);

        // Meteorological Centre Yellow Warning TV broadcast banner
        ctx.fillStyle = 'rgba(234, 179, 8, 0.18)';
        ctx.fillRect(w * 0.56, h * 0.18, w * 0.38, 34);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(w * 0.56, h * 0.18, w * 0.38, 34);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('TV AUDIO: METEOROLOGICAL YELLOW -> RED WARNING', w * 0.575, h * 0.22);
      } else if (preset === 'wooden_step_open_sign') {
        // Shot 02: Wooden ramp over triangular support frame + flipping OPEN sign
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(w * 0.25, h * 0.82);
        ctx.lineTo(w * 0.52, h * 0.68);
        ctx.lineTo(w * 0.52, h * 0.82);
        ctx.closePath();
        ctx.fill();

        // Hanging sign flipping to OPEN
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
        // Shot 03 & Shot 08: Lin_Jie behind counter, warm lamp, folded towel, two steaming teacups
        const lx = w * 0.38;
        const ly = h * 0.43;
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(lx, ly, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(lx - 42, ly + 34, 84, 95);

        // Warm golden lamp reflection in dark pupils
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(lx - 10, ly - 4, 6, 4);
        ctx.fillRect(lx + 8, ly - 4, 6, 4);

        // Folded clean white towel on counter
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(w * 0.62, h * 0.65, 58, 16);

        // Two steaming porcelain teacups (one sliding toward customer edge)
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
        // Shot 04: Ji_Zhixiu spinning in dark alley + gleaming silver blade slash arc
        const jx = w * 0.48;
        const jy = h * 0.48;
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(jx, jy, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(jx - 28, jy + 26, 56, 100);

        // High-velocity silver-crimson blade slash arc
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
        // Shot 05: Ten corpses dissolving into glowing embers/ash in background + rising steam
        for (let e = 0; e < 32; e++) {
          const ex = w * 0.2 + ((e * 43 + frameTick * 2.5) % (w * 0.6));
          const ey = h * 0.72 - ((e * 29 + frameTick * 3.2) % (h * 0.48));
          ctx.fillStyle = e % 2 === 0 ? 'rgba(244, 63, 94, 0.85)' : 'rgba(251, 146, 60, 0.75)';
          ctx.beginPath();
          ctx.arc(ex, ey, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Ji_Zhixiu walking toward foreground clutching ribs
        const jx = w * 0.5;
        const jy = h * 0.46;
        ctx.fillStyle = '#050811';
        ctx.beginPath();
        ctx.arc(jx, jy, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(jx - 30, jy + 28, 60, 110);
      } else if (preset === 'street_pov_retract_cane') {
        // Shot 06: Over-the-shoulder POV — glowing bookstore window across street + retracting blade
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

        // Foreground retracting silver blade -> sleek black metal cane
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
        // Shot 09: Split-screen macro sequence (Top: narrowed eyes; Bottom: thumb on cane trigger)
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h / 2 - 3);
        ctx.fillRect(0, h / 2 + 3, w, h / 2 - 3);

        // Split divider line
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(0, h / 2 - 2, w, 4);

        // Top panel: Ji_Zhixiu narrowed vigilant eyes
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

        // Bottom panel: Black metal cane handle & hidden trigger button
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(w * 0.35, h * 0.72, w * 0.3, 24);
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.72, 9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Shot 07 & Shot 10: Two-shot across the counter divide (Lin_Jie in warm light, Ji_Zhixiu in shadow)
        // Left: Lin_Jie
        const lx = w * 0.28;
        const ly = h * 0.44;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(lx, ly, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(lx - 28, ly + 25, 56, 85);

        // Right: Ji_Zhixiu with black cane
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

        // Clean folded white towel on counter between them
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(w * 0.52, h * 0.65, 44, 12);
      }

      // 4. Atmospheric Heavy Rain Curtain (24fps diagonal streaks)
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

      // Record a 6-second 24fps showcase reel across the active sequence for fast browser download
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
                  Text-to-Animation Video Generator (T2V / I2V 10-Shot Test Studio)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase">
                  3 Scenes · 10 Shots · 45s @ 24fps (1,080 Frames)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 uppercase">
                  Dark Urban Fantasy Anime · 8K Spec
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Global Visual &amp; Asset Token Sheet (Lin_Jie, Ji_Zhixiu, Environment_A, Environment_B) + Sequential 10-Shot 24fps Animation Player &amp; .WebM Exporter
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
              id: 'assets',
              label: '2. Global Visual & Asset Definitions (Character & Environment Sheets)',
              icon: Users,
            },
            {
              id: 'script_parser',
              label: '3. Live AI Script Parser & Veo 3.1 / Omni Flash Cost Audit',
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
              {/* Top Grid: 24 FPS Canvas Player + Active Shot Prompt & Token Inspector */}
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
                          {activeShot.sceneTitle} · SHOT {String(activeShot.shotNumber).padStart(2, '0')}/10
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-amber-300 text-xs font-bold">
                          {activeShot.title} ({activeShot.scriptDurationSec}s)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-1 rounded-lg bg-black/80 border border-purple-500/40 text-purple-300 text-[11px] font-mono">
                          {activeShot.referencedEnvironment} ·{' '}
                          {activeShot.referencedCharacters.join(' + ')}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Cinema Subtitle, Action & Audio SFX Bar */}
                    <div className="absolute bottom-3 inset-x-3 p-3 rounded-xl bg-black/85 border border-slate-800 backdrop-blur-md space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-cyan-300 font-mono">
                        <span>CAM: {activeShot.camera}</span>
                        <span>SFX: {activeShot.audioSfx.slice(0, 68)}</span>
                      </div>
                      <div className="text-xs text-slate-200 font-medium">
                        <strong className="text-emerald-400">Action:</strong> {activeShot.action}
                      </div>
                      {activeShot.dialogues.length > 0 && (
                        <div className="pt-1 border-t border-slate-800/80 space-y-1">
                          {activeShot.dialogues.map((d, idx) => (
                            <div
                              key={idx}
                              className="text-xs font-bold text-amber-300 italic"
                            >
                              [{d.speaker}
                              {d.delivery ? ` · ${d.delivery}` : ''}]: &ldquo;{d.text}&rdquo;
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
                        title="Toggle Procedural Sound Effects & Voice Synthesis"
                      >
                        {soundEnabled ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Audio + Voice ON</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>Unmute SFX &amp; Voice</span>
                          </>
                        )}
                      </button>

                      <span className="text-xs font-mono text-slate-400">
                        {shotElapsedSec.toFixed(1)}s / {activeShot.scriptDurationSec}.0s
                      </span>
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

                {/* Right 5 Cols: Expanded T2V / I2V Master Prompt Inspector */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Compiled T2V / I2V Master Prompt (Shot {String(activeShot.shotNumber).padStart(2, '0')})</span>
                      </h3>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        Global Tokens Injected
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <div>
                        <span className="text-slate-400 font-semibold">Visual Prompt: </span>
                        {activeShot.visualPrompt}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono text-amber-300">
                          Script: {activeShot.scriptDurationSec}s ({activeShot.scriptDurationSec * 24} frames)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                          Veo 3.1 Normalized: {activeShot.veoNormalizedDurationSec}s
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 block">
                        Full Token-Expanded T2V Agent Prompt (Style + Character Sheet + Environment):
                      </label>
                      <textarea
                        readOnly
                        rows={5}
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
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total Script</div>
                      <div className="text-sm font-black text-white font-mono">
                        {auditSummary.totalScriptDurationSec}s (1,080f)
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Omni Flash 720p</div>
                      <div className="text-sm font-black text-emerald-400 font-mono">
                        ${auditSummary.estimatedOmniFlash720pNativeUsd.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Veo 3.1 Fast 1080p</div>
                      <div className="text-sm font-black text-amber-300 font-mono">
                        ${auditSummary.estimatedVeoFast1080pUsd.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 10-Shot Interactive Storyboard Strip Grouped by Scene 1, Scene 2, Scene 3 */}
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
                        <div className="text-xs font-bold text-white line-clamp-1">{shot.title}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-2">
                          {shot.visualPrompt}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[9px] font-mono text-slate-400">
                          <span>Scene {shot.sceneNumber}</span>
                          <span>{shot.referencedEnvironment}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="space-y-4">
              {/* Global Art Style Banner */}
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

              {/* Character Sheets */}
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

              {/* Environment Sheets */}
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
                      setActiveShotIndex(0);
                      setShotElapsedSec(0);
                      setActiveTab('player');
                      setIsPlaying(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Parse &amp; Load into 24fps Player</span>
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
                      {auditSummary.totalScriptDurationSec}s ({auditSummary.totalFramesAt24Fps} frames)
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
                          <strong className="text-amber-300">Veo 3.1: {n.veoDurationSec}s</strong> (trim in FFmpeg)
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
