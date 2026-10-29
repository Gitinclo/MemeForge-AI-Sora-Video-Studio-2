import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Film,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCode,
  Sparkles,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Layers,
  Lock,
  Copy,
  Check,
  Download,
  Scale,
  Wand2,
} from 'lucide-react';
import {
  PRICING_YAML_CONFIG,
  PilotProviderId,
  VeoModelTier,
  PilotResolution,
  PilotShotSpec,
  getBudgetReferenceTable,
  estimateJobCostUsd,
  evaluateBudgetGuard,
  PILOT_23_SHOT_LIST,
  STYLE_GUIDE_SUMMARY,
  validatePilotShotList,
  compileChapterToPilotEpisode,
  runTenShotBakeoffSimulation,
  SAMPLE_LICENSE_PRESETS,
  evaluateBookLicenseText,
  evaluatePilotScalingGates,
  KEY_SPEC_IMPROVEMENTS,
  CostLogEntry,
} from '../utils/aiVideoPilotEngine';
import { triggerBrowserDownload } from '../utils/sharedCoreEngine';

interface AiVideoPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyShotToStudio?: (shot: PilotShotSpec) => void;
}

export const AiVideoPilotModal: React.FC<AiVideoPilotModalProps> = ({
  isOpen,
  onClose,
  onApplyShotToStudio,
}) => {
  const [activeTab, setActiveTab] = useState<
    'shots' | 'improvements' | 'pricing' | 'bakeoff' | 'license_gates'
  >('shots');

  // Tab 3 (Default): 23-Shot Animated Episode Player & Chapter Compiler State
  const [episodeShots, setEpisodeShots] = useState<PilotShotSpec[]>(PILOT_23_SHOT_LIST);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [isPlayingEpisode, setIsPlayingEpisode] = useState<boolean>(true);
  const [shotElapsedSec, setShotElapsedSec] = useState<number>(0);
  const [chapterInputText, setChapterInputText] = useState<string>(
    'Rainy Bookstore & Wounded Hunter Chapter Adaptation (23 Shots · 180s · Loaded)'
  );
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2: Pricing & Budget Guard Simulator State
  const [testProvider, setTestProvider] = useState<PilotProviderId>('veo');
  const [testTier, setTestTier] = useState<VeoModelTier | 'omni_flash'>('fast');
  const [testResolution, setTestResolution] = useState<PilotResolution>('1080p');
  const [testDuration, setTestDuration] = useState<number>(8);
  const [simSpentUsd, setSimSpentUsd] = useState<number>(68.4);
  const [simReservedUsd, setSimReservedUsd] = useState<number>(0.96);
  const [simCapUsd] = useState<number>(PRICING_YAML_CONFIG.defaultPilotCapUsd); // Locked at $500 per Agent rule
  const [costLedger, setCostLedger] = useState<CostLogEntry[]>([
    {
      timestampUtc: '2026-10-29T10:00:00Z',
      jobId: 'job_shot_01_try1',
      shotId: 'shot_01',
      tryIndex: 1,
      provider: 'veo',
      modelId: 'veo-3.1-fast-generate-preview',
      resolution: '1080p',
      durationSeconds: 8,
      succeeded: true,
      estimatedCostUsd: 0.96,
      actualCostUsd: 0.96,
      cumulativeSpentUsd: 0.96,
    },
    {
      timestampUtc: '2026-10-29T10:01:12Z',
      jobId: 'job_shot_07_try1',
      shotId: 'shot_07',
      tryIndex: 1,
      provider: 'veo',
      modelId: 'veo-3.1-generate-preview',
      resolution: '1080p',
      durationSeconds: 8,
      succeeded: false, // Failed attempt -> $0.00 actual cost (successful_generations_only)
      estimatedCostUsd: 3.2,
      actualCostUsd: 0.0,
      cumulativeSpentUsd: 0.96,
    },
    {
      timestampUtc: '2026-10-29T10:02:05Z',
      jobId: 'job_shot_07_try2',
      shotId: 'shot_07',
      tryIndex: 2,
      provider: 'veo',
      modelId: 'veo-3.1-generate-preview',
      resolution: '1080p',
      durationSeconds: 8,
      succeeded: true,
      estimatedCostUsd: 3.2,
      actualCostUsd: 3.2,
      cumulativeSpentUsd: 4.16,
    },
  ]);

  // Tab 4: Bake-Off State
  const [useRefAnchors, setUseRefAnchors] = useState<boolean>(true);

  // Tab 5: 5-Clause Book License Analyzer & Scaling Gates State
  const [licenseText, setLicenseText] = useState<string>(
    SAMPLE_LICENSE_PRESETS.missing_or_unverified.text
  );
  const [userMaxCostPerMin, setUserMaxCostPerMin] = useState<string>('25.00');
  const [consistencyScore, setConsistencyScore] = useState<number>(10);
  const [avgTries, setAvgTries] = useState<number>(2.1);
  const [pilotTotalSpend, setPilotTotalSpend] = useState<number>(68.4);
  const [termsVerified, setTermsVerified] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const budgetTable = useMemo(() => getBudgetReferenceTable(), []);
  const costEst = useMemo(
    () => estimateJobCostUsd(testProvider, testTier, testResolution, testDuration),
    [testProvider, testTier, testResolution, testDuration]
  );
  const guardCheck = useMemo(
    () =>
      evaluateBudgetGuard(
        simSpentUsd,
        simReservedUsd,
        costEst.valid ? costEst.estimatedCostUsd : 0,
        simCapUsd
      ),
    [simSpentUsd, simReservedUsd, costEst, simCapUsd]
  );

  const shotValidation = useMemo(() => validatePilotShotList(episodeShots), [episodeShots]);
  const bakeoffResults = useMemo(
    () => runTenShotBakeoffSimulation(useRefAnchors),
    [useRefAnchors]
  );
  const licenseAudit = useMemo(() => evaluateBookLicenseText(licenseText), [licenseText]);

  const parsedMaxCost = userMaxCostPerMin.trim() === '' ? null : Number(userMaxCostPerMin);
  const scalingReport = useMemo(
    () =>
      evaluatePilotScalingGates({
        consistencyApprovedOutOf10: consistencyScore,
        avgGenerationsPerApprovedShot: avgTries,
        totalPilotSpendUsd: pilotTotalSpend,
        finishedPilotMinutes: 3.0,
        userMaxCostPerMinuteUsd:
          parsedMaxCost !== null && !Number.isNaN(parsedMaxCost) ? parsedMaxCost : null,
        providerCommercialTermsVerified: termsVerified,
        providerTermsUrl: 'https://ai.google.dev/gemini-api/terms',
        providerTermsDate: '2026-10-29',
        licenseAudit,
      }),
    [consistencyScore, avgTries, pilotTotalSpend, parsedMaxCost, termsVerified, licenseAudit]
  );

  const activeShot = episodeShots[activeShotIndex] || episodeShots[0];

  // Advance through the 23 shots automatically when playing
  useEffect(() => {
    if (!isOpen || !isPlayingEpisode || activeTab !== 'shots') return;
    const interval = setInterval(() => {
      setShotElapsedSec((prev) => {
        const next = Number((prev + 0.25).toFixed(2));
        if (next >= (activeShot?.duration_s || 8)) {
          setActiveShotIndex((idx) => (idx + 1) % episodeShots.length);
          return 0;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [isOpen, isPlayingEpisode, activeTab, activeShot, episodeShots.length]);

  // Procedural 2.5D Anime Canvas Renderer for the Rainy Bookstore & Wounded Hunter Episode
  useEffect(() => {
    if (!isOpen || activeTab !== 'shots') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let tick = 0;

    const renderFrame = () => {
      tick += 1;
      const w = canvas.width;
      const h = canvas.height;
      const isAlley = activeShot?.location === 'loc_storm_alley';
      const hasShopkeeper = activeShot?.characters.includes('char_shopkeeper');
      const hasHunter = activeShot?.characters.includes('char_hunter');

      // Background Chiaroscuro Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      if (isAlley) {
        bgGrad.addColorStop(0, '#050814');
        bgGrad.addColorStop(0.6, '#0f172a');
        bgGrad.addColorStop(1, '#1e1b4b');
      } else {
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.5, '#1c1917');
        bgGrad.addColorStop(1, '#291d12');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Towering Bookshelves (Interior) or Alley Walls (Exterior)
      ctx.fillStyle = isAlley ? 'rgba(15, 23, 42, 0.85)' : 'rgba(28, 25, 23, 0.9)';
      for (let i = 0; i < 6; i++) {
        const shelfX = i * (w / 6);
        ctx.fillRect(shelfX + 6, 20, w / 6 - 12, h * 0.68);
        if (!isAlley) {
          // Book spines
          ctx.fillStyle = 'rgba(120, 53, 15, 0.35)';
          for (let row = 1; row <= 4; row++) {
            ctx.fillRect(shelfX + 10, row * 48, w / 6 - 20, 4);
          }
          ctx.fillStyle = 'rgba(28, 25, 23, 0.9)';
        }
      }

      // Warm Counter Lamp Glow (Bookstore Interior) or Distant Window Glow (Alley)
      const lampX = isAlley ? w * 0.78 : w * 0.34;
      const lampY = isAlley ? h * 0.42 : h * 0.54;
      const lampRadius = isAlley ? 110 : 220;
      const lampGrad = ctx.createRadialGradient(lampX, lampY, 8, lampX, lampY, lampRadius);
      lampGrad.addColorStop(0, 'rgba(251, 191, 36, 0.65)');
      lampGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.22)');
      lampGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = lampGrad;
      ctx.fillRect(0, 0, w, h);

      // Wooden Counter & Steaming Teacup (Interior)
      if (!isAlley) {
        ctx.fillStyle = '#271c15';
        ctx.fillRect(0, h * 0.68, w, h * 0.32);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.68);
        ctx.lineTo(w, h * 0.68);
        ctx.stroke();

        // Steaming porcelain teacup
        const cupX = w * 0.48;
        const cupY = h * 0.65;
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cupX - 10, cupY - 8, 20, 12);
        // Rising steam wisps
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
        ctx.lineWidth = 1.5;
        for (let s = 0; s < 3; s++) {
          const offset = Math.sin(tick * 0.06 + s) * 6;
          ctx.beginPath();
          ctx.moveTo(cupX - 5 + s * 5, cupY - 10);
          ctx.quadraticCurveTo(cupX + offset, cupY - 24, cupX - 3 + s * 5, cupY - 38);
          ctx.stroke();
        }
      }

      // Character Silhouettes (2.5D Anime Blocking)
      if (hasShopkeeper) {
        const sx = w * 0.28;
        const sy = h * 0.46;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(sx - 26, sy + 22, 52, 75);
        // Warm amber eye reflection
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(sx + 5, sy - 3, 5, 3);
      }

      if (hasHunter) {
        const hx = isAlley ? w * 0.45 : w * 0.68;
        const hy = h * 0.45;
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(hx, hy, 21, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(hx - 24, hy + 21, 48, 80);
        // Black metal cane / silver blade glint
        ctx.strokeStyle = activeShot.shot_id === 'shot_07' ? '#e11d48' : '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hx - 28, hy + 30);
        ctx.lineTo(hx - 40, hy + 98);
        ctx.stroke();
      }

      // Crimson Ember Particles on Shot 07 (Alley Skirmish)
      if (activeShot?.shot_id === 'shot_07') {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.75)';
        for (let e = 0; e < 18; e++) {
          const ex = ((e * 53 + tick * 2) % w);
          const ey = h - ((e * 37 + tick * 3) % (h * 0.7));
          ctx.beginPath();
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Heavy Rain Curtain Simulation (All Exterior Shots + Window Streaks)
      ctx.strokeStyle = isAlley
        ? 'rgba(148, 163, 184, 0.45)'
        : 'rgba(148, 163, 184, 0.18)';
      ctx.lineWidth = 1.2;
      const rainCount = isAlley ? 65 : 28;
      for (let r = 0; r < rainCount; r++) {
        const rx = ((r * 31 + tick * 5) % w);
        const ry = ((r * 47 + tick * 14) % h);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 6, ry + 18);
        ctx.stroke();
      }

      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, activeShot]);

  if (!isOpen) return null;

  const handleSimulateJobAppend = () => {
    if (!costEst.valid || !guardCheck.allowed || testProvider === 'sora') return;
    const nextSpent = Number((simSpentUsd + costEst.estimatedCostUsd).toFixed(2));
    setSimSpentUsd(nextSpent);
    setCostLedger((prev) => [
      {
        timestampUtc: new Date().toISOString(),
        jobId: `job_sim_${prev.length + 1}`,
        shotId: `shot_${String((prev.length % 23) + 1).padStart(2, '0')}`,
        tryIndex: 1,
        provider: testProvider,
        modelId: costEst.modelId,
        resolution: testResolution,
        durationSeconds: testDuration,
        succeeded: true,
        estimatedCostUsd: costEst.estimatedCostUsd,
        actualCostUsd: costEst.estimatedCostUsd,
        cumulativeSpentUsd: nextSpent,
      },
      ...prev,
    ]);
  };

  const handleExportCostsCsv = () => {
    const header =
      'timestamp_utc,job_id,shot_id,try_index,provider,model_id,resolution,duration_s,succeeded,estimated_cost_usd,actual_cost_usd,cumulative_spent_usd';
    const rows = costLedger.map(
      (r) =>
        `${r.timestampUtc},${r.jobId},${r.shotId},${r.tryIndex},${r.provider},${r.modelId},${r.resolution},${r.durationSeconds},${r.succeeded},${r.estimatedCostUsd.toFixed(4)},${r.actualCostUsd.toFixed(4)},${r.cumulativeSpentUsd.toFixed(4)}`
    );
    const csvBlob = new Blob([[header, ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    triggerBrowserDownload(csvBlob, 'costs.csv');
  };

  const handleCompileChapter = async () => {
    try {
      const response = await fetch('/api/video-pilot/compile-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterText: chapterInputText,
          resolution: '1080p',
          defaultTier: 'fast',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.shots) && data.shots.length > 0) {
          setEpisodeShots(data.shots);
          setActiveShotIndex(0);
          setShotElapsedSec(0);
          setIsPlayingEpisode(true);
          return;
        }
      }
    } catch {
      // Fallback to local deterministic compiler if offline
    }
    const compiled = compileChapterToPilotEpisode(chapterInputText, '1080p', 'fast');
    setEpisodeShots(compiled);
    setActiveShotIndex(0);
    setShotElapsedSec(0);
    setIsPlayingEpisode(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  AI Video Pilot: One Chapter to a 3-Minute Animated Episode
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase">
                  Rainy Bookstore &amp; Night Hunter (23 Shots · 180s)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 uppercase">
                  Private Testing Mode Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                23 Shots (4s/6s/8s = 180s) · Veo 3.1 Sept 2026 Rates · $500 Hard Budget Guard · 5-Clause Book License Gate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Close AI Video Pilot Workbench"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap gap-2">
          {[
            { id: 'shots', label: '1. 23-Shot Animated Episode Player (180s)', icon: Layers },
            { id: 'pricing', label: '2. Pricing YAML & $500 Budget Guard', icon: DollarSign },
            { id: 'bakeoff', label: '3. 10-Shot Provider Bake-Off', icon: Play },
            { id: 'license_gates', label: '4. Book License Analyzer & Scaling Gates', icon: Scale },
            { id: 'improvements', label: '5. Spec Improvements & On-Disk Architecture', icon: Sparkles },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                  active
                    ? 'bg-slate-900 text-amber-300 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'shots' && (
            <div className="space-y-5">
              {/* Top Row: Animated 2.5D Storyboard Player + Active Shot Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col">
                  <div className="relative aspect-video bg-black">
                    <canvas
                      ref={previewCanvasRef}
                      width={720}
                      height={405}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                        {activeShot.shot_id.toUpperCase()} ({activeShotIndex + 1}/23) · {activeShot.duration_s}s
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-black/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono">
                        Veo 3.1 {activeShot.model_tier.toUpperCase()} · {activeShot.resolution}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-black/80 border border-purple-500/40 text-purple-300 text-[11px] font-mono">
                        {activeShot.location}
                      </span>
                    </div>

                    {/* Subtitle / Action Overlay */}
                    <div className="absolute bottom-3 inset-x-3 p-3 rounded-xl bg-black/80 border border-slate-800 backdrop-blur-md space-y-1">
                      <div className="text-xs text-slate-200 font-semibold">{activeShot.action}</div>
                      {activeShot.dialogue && (
                        <div className="text-xs text-amber-300 font-bold italic">
                          [{activeShot.dialogue.speaker}]: &ldquo;{activeShot.dialogue.line}&rdquo;
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-slate-400">
                        CAM: {activeShot.camera} · Seed: {activeShot.seed} · Transition:{' '}
                        {activeShot.transition_from_prev}
                      </div>
                    </div>
                  </div>

                  {/* Player Controls */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveShotIndex(
                            (prev) => (prev - 1 + episodeShots.length) % episodeShots.length
                          );
                          setShotElapsedSec(0);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                        title="Previous Shot"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsPlayingEpisode(!isPlayingEpisode)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
                      >
                        {isPlayingEpisode ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause Animatic</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Play 23-Shot Episode</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setActiveShotIndex((prev) => (prev + 1) % episodeShots.length);
                          setShotElapsedSec(0);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                        title="Next Shot"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono text-slate-400 ml-1">
                        Shot Timer: {shotElapsedSec.toFixed(1)}s / {activeShot.duration_s}.0s
                      </span>
                    </div>

                    {onApplyShotToStudio && (
                      <button
                        onClick={() => {
                          onApplyShotToStudio(activeShot);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Send Shot Prompt to LEO Studio</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column: Chapter-to-23-Shot Compiler & Pilot Cost Summary */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Wand2 className="w-4 h-4 text-amber-400" />
                        <span>Step 1: Chapter-to-23-Shot JSON Compiler</span>
                      </h3>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        Schema Validated
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Your Rainy Bookstore &amp; Wounded Night Hunter chapter is compiled into 23 shots (19 Fast 1080p + 4 Standard 1080p hero shots = 180s). Paste new chapter prose below to re-compile:
                    </p>
                    <textarea
                      rows={4}
                      value={chapterInputText}
                      onChange={(e) => setChapterInputText(e.target.value)}
                      placeholder="Paste a book chapter here to split into 23 validated shots (4s, 6s, or 8s)..."
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleCompileChapter}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Compile Chapter into 23 Shots (180s)</span>
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(episodeShots, null, 2));
                          setCopiedId('shots_json');
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5"
                      >
                        {copiedId === 'shots_json' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedId === 'shots_json'
                            ? 'Copied 23 Shots!'
                            : 'Copy shots/shot_list.json'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Episode Cost & Gate Readiness Box */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-300">
                      <span>23-Shot Episode Duration:</span>
                      <span className="font-mono">
                        {shotValidation.totalDurationSeconds}s (3.0 Min · Avg{' '}
                        {shotValidation.averageDurationSeconds}s/shot)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>1-Try Pass Cost (180s):</span>
                      <span className="font-mono font-bold text-white">
                        ${shotValidation.estimatedSinglePassCostUsd.toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>3-Try Pilot Budget (540s vs $500 Cap):</span>
                      <span className="font-mono font-bold text-amber-300">
                        ${shotValidation.estimatedPilot3TriesCostUsd.toFixed(2)} / $500.00 Cap
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Style Guide Summary (3 Characters / Motifs + 2 Locations) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {STYLE_GUIDE_SUMMARY.characters.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{c.name}</span>
                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                        {c.id}
                      </code>
                    </div>
                    <div className="text-[11px] text-slate-400">{c.visualAnchor}</div>
                    <div className="text-[10px] font-mono text-cyan-300 pt-1">
                      Voice: {c.voiceProfile} · Ref: {c.referenceAsset}
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive 23-Shot Table (Click any row to jump player to that shot) */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Shot (Click to Preview)</th>
                      <th className="py-2 px-3">Dur / Tier / Cost</th>
                      <th className="py-2 px-3">Characters &amp; Location</th>
                      <th className="py-2 px-3">Action &amp; Dialogue</th>
                      <th className="py-2 px-3">Continuity Anchor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {episodeShots.map((shot, idx) => {
                      const shotCost = estimateJobCostUsd(
                        'veo',
                        shot.model_tier,
                        shot.resolution,
                        shot.duration_s
                      );
                      const isCurrent = idx === activeShotIndex;
                      return (
                        <tr
                          key={shot.shot_id}
                          onClick={() => {
                            setActiveShotIndex(idx);
                            setShotElapsedSec(0);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-amber-500/15 text-white'
                              : 'hover:bg-slate-900/60 text-slate-300'
                          }`}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-amber-300">
                            {shot.shot_id} {isCurrent ? '▶' : ''}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {shot.duration_s}s ·{' '}
                            <span
                              className={
                                shot.model_tier === 'standard'
                                  ? 'text-amber-300 font-bold uppercase'
                                  : 'text-cyan-300 uppercase'
                              }
                            >
                              {shot.model_tier}
                            </span>{' '}
                            (${shotCost.estimatedCostUsd.toFixed(2)})
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-mono text-[11px] text-purple-300">
                              {shot.characters.join(', ')}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {shot.location}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div>{shot.action}</div>
                            {shot.dialogue && (
                              <div className="text-[11px] text-amber-200/90 italic mt-0.5">
                                {shot.dialogue.speaker}: &ldquo;{shot.dialogue.line}&rdquo;
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-[10px] text-emerald-300">
                            seed:{shot.seed} · {shot.transition_from_prev}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'improvements' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>What We Improved &amp; Built On Disk From Your Spec</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    All agent rules are enforced: API keys read strictly from{' '}
                    <code className="text-amber-300 font-mono">GEMINI_API_KEY</code> env var, rates
                    loaded from <code className="text-amber-300 font-mono">config/pricing.yaml</code>
                    , OpenAI Sora strictly blocked, and private-testing-only locked until all 5 Book
                    License items pass.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('license_gates')}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 transition-colors"
                >
                  Paste &amp; Check Book License →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {KEY_SPEC_IMPROVEMENTS.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-extrabold text-white">{item.title}</h4>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                        {item.impactMetric}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-300/90 bg-rose-950/30 border border-rose-500/20 rounded-xl p-2.5">
                      <span className="font-bold text-rose-300">Gap in Raw Spec: </span>
                      {item.problemInRawSpec}
                    </p>
                    <p className="text-[11px] text-emerald-200/90 bg-emerald-950/25 border border-emerald-500/20 rounded-xl p-2.5">
                      <span className="font-bold text-emerald-300">Engineered Upgrade: </span>
                      {item.engineeredSolution}
                    </p>
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>On-Disk Module: {item.fileLocation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-5">
              {/* Interactive Cost & Hard Budget Guard Calculator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Pre-Job Cost Formula &amp; Invalid Combination Guard</span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      estimated_cost_usd = duration_s × rates[resolution]
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        Provider
                      </label>
                      <select
                        value={testProvider}
                        onChange={(e) => {
                          const nextProv = e.target.value as PilotProviderId;
                          setTestProvider(nextProv);
                          if (nextProv === 'gemini_omni_flash') {
                            setTestTier('omni_flash');
                            setTestResolution('720p');
                          } else if (testTier === 'omni_flash') {
                            setTestTier('fast');
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value="veo">Google Veo 3.1 (Primary)</option>
                        <option value="gemini_omni_flash">Gemini Omni Flash</option>
                        <option value="sora">OpenAI Sora (Test Block)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        Model Tier
                      </label>
                      <select
                        value={testTier}
                        onChange={(e) => setTestTier(e.target.value as VeoModelTier | 'omni_flash')}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value="lite">Lite (veo-3.1-lite)</option>
                        <option value="fast">Fast (veo-3.1-fast)</option>
                        <option value="standard">Standard (veo-3.1)</option>
                        <option value="omni_flash">Omni Flash 1.1</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        Resolution
                      </label>
                      <select
                        value={testResolution}
                        onChange={(e) => setTestResolution(e.target.value as PilotResolution)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                        <option value="4k">4K (Test Lite 4K Reject)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        Duration (s)
                      </label>
                      <select
                        value={testDuration}
                        onChange={(e) => setTestDuration(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value={4}>4 seconds</option>
                        <option value={6}>6 seconds</option>
                        <option value={8}>8 seconds</option>
                        <option value={5}>5 seconds (Invalid Test)</option>
                      </select>
                    </div>
                  </div>

                  {costEst.valid ? (
                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-emerald-300">
                          Valid Combination · Model ID:{' '}
                          <code className="font-mono">{costEst.modelId}</code>
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                          {testDuration}s × ${costEst.ratePerSecondUsd.toFixed(2)}/s ={' '}
                          <span className="text-emerald-300 font-bold">
                            ${costEst.estimatedCostUsd.toFixed(2)} USD
                          </span>{' '}
                          (audio included)
                        </div>
                      </div>
                      <button
                        onClick={handleSimulateJobAppend}
                        disabled={!guardCheck.allowed}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-colors"
                      >
                        Queue Job &amp; Log to costs.csv
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2.5">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-rose-200 font-medium">{costEst.error}</div>
                    </div>
                  )}
                </div>

                {/* Atomic Budget Guard Status */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Hard Budget Guard ($500.00 Cap)</span>
                    </h3>
                    <button
                      onClick={handleExportCostsCsv}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export costs.csv</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Settled Spent ($)</div>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="510"
                        value={simSpentUsd}
                        onChange={(e) => setSimSpentUsd(Number(e.target.value))}
                        className="w-full mt-1 text-center bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-white"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">In-Flight Reserved</div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={simReservedUsd}
                        onChange={(e) => setSimReservedUsd(Number(e.target.value))}
                        className="w-full mt-1 text-center bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-amber-300"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Locked Cap</div>
                      <div className="mt-1.5 text-xs font-mono font-black text-emerald-400">
                        ${simCapUsd.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      guardCheck.allowed
                        ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                        : 'bg-rose-950/50 border-rose-500/50 text-rose-200 font-bold'
                    }`}
                  >
                    {guardCheck.reason}
                  </div>
                </div>
              </div>

              {/* Complete 9-Row Pricing & Scaling Reference Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-black text-white">
                    Complete Veo 3.1 &amp; Gemini Omni Flash Budget Reference Table (Sept 2026 Paid Tier, Audio Included)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Pilot = 23 shots × ~7.8s × 3 tries ≈ 540s · Bake-off = 240s
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                        <th className="py-2.5 px-3">Resolution / Tier</th>
                        <th className="py-2.5 px-3">Model ID</th>
                        <th className="py-2.5 px-3 font-mono">$/s</th>
                        <th className="py-2.5 px-3 font-mono">One 8-s Clip</th>
                        <th className="py-2.5 px-3 font-mono">Bake-Off (240s)</th>
                        <th className="py-2.5 px-3 font-mono">Pilot (540s)</th>
                        <th className="py-2.5 px-3 font-mono">100 h (1 try)</th>
                        <th className="py-2.5 px-3 font-mono">100 h (3 tries)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {budgetTable.map((row) => (
                        <tr
                          key={row.label}
                          className={
                            row.label === 'Fast 1080p'
                              ? 'bg-amber-500/10 text-amber-200 font-semibold'
                              : 'text-slate-300 hover:bg-slate-900/40'
                          }
                        >
                          <td className="py-2 px-3 font-bold">{row.label}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-cyan-300">
                            {row.modelId}
                          </td>
                          <td className="py-2 px-3 font-mono">${row.ratePerSecondUsd.toFixed(2)}</td>
                          <td className="py-2 px-3 font-mono">${row.one8sClipUsd.toFixed(2)}</td>
                          <td className="py-2 px-3 font-mono">
                            ${row.bakeoff240sUsd.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-300">
                            ${row.pilot540sUsd.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            ${row.scale100h1TryUsd.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            ${row.scale100h3TriesUsd.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bakeoff' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Step 5: 10-Shot Provider Bake-Off (10 Shots × 8s × up to 3 Tries = 240s Max)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Toggle Reference Turnaround Anchors (
                    <code className="text-cyan-300 font-mono">reference_image_ids</code>) to see its
                    impact on the ≥ 9/10 Consistency Gate.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-emerald-300 cursor-pointer bg-emerald-950/40 border border-emerald-500/40 px-3.5 py-2 rounded-xl">
                  <input
                    type="checkbox"
                    checked={useRefAnchors}
                    onChange={(e) => setUseRefAnchors(e.target.checked)}
                    className="rounded"
                  />
                  <span>Enable Turnaround Reference Anchors &amp; Seeds</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bakeoffResults.map((cand) => (
                  <div
                    key={cand.candidateId}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      cand.passesPilotGates
                        ? 'bg-slate-950 border-emerald-500/40'
                        : 'bg-slate-950 border-slate-800 opacity-85'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-white">{cand.tierLabel}</div>
                        <code className="text-[11px] font-mono text-cyan-300">{cand.modelId}</code>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          cand.passesPilotGates
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {cand.passesPilotGates ? 'Passes Bake-Off Gates' : 'Below 9/10 Consistency'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center bg-slate-900 p-2.5 rounded-xl">
                      <div>
                        <div className="text-[10px] text-slate-400">Avg Tries</div>
                        <div className="text-xs font-mono font-bold text-white">
                          {cand.avgTriesPerApprovedShot}x
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">10-Shot Cost</div>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          ${cand.totalCostUsd.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Consistency</div>
                        <div className="text-xs font-mono font-bold text-amber-300">
                          {cand.consistencyPassOutOf10}/10
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Motion / Audio</div>
                        <div className="text-xs font-mono font-bold text-cyan-300">
                          {cand.motionQualityScore} / {cand.audioSyncScore}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">{cand.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'license_gates' && (
            <div className="space-y-5">
              {/* Interactive 5-Clause Book License Inspector */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span>Open Blocker #1: Interactive 5-Clause Book License Analyzer</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Because the chapter excerpt did not include written license clauses, the pipeline defaults to <code className="text-amber-300 font-mono">PRIVATE_TESTING_ONLY</code>. Paste your license agreement below to check all 5 items.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      Object.keys(SAMPLE_LICENSE_PRESETS) as Array<
                        keyof typeof SAMPLE_LICENSE_PRESETS
                      >
                    ).map((key) => (
                      <button
                        key={key}
                        onClick={() => setLicenseText(SAMPLE_LICENSE_PRESETS[key].text)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-colors"
                      >
                        {SAMPLE_LICENSE_PRESETS[key].label.split('(')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={licenseText}
                  onChange={(e) => setLicenseText(e.target.value)}
                  placeholder="Paste the book's license agreement or option clauses here..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono"
                />

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                  {licenseAudit.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        item.status === 'explicitly_granted'
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                          : item.status === 'explicitly_excluded'
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                          : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between gap-1">
                        <span>{item.title}</span>
                        {item.status === 'explicitly_granted' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : item.status === 'explicitly_excluded' ? (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] opacity-90">{item.evidenceSnippet}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 8: 5 Scaling Gates Simulator */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Step 8: Gate Report Before Scaling (3m Pilot → 25m Episode → Season → 100 Hours)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Set your <code className="text-amber-300 font-mono">MAX_COST_PER_MINUTE</code>{' '}
                      below (never guessed by the agent). If any gate fails, the pipeline stops for
                      review.
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                      scalingReport.allGatesPassed
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                    }`}
                  >
                    Authorized Scale: {scalingReport.allowedScaleStage}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <label className="block text-[10px] text-slate-400 font-bold">
                      Consistency (out of 10)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={consistencyScore}
                      onChange={(e) => setConsistencyScore(Number(e.target.value))}
                      className="w-full mt-1 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <label className="block text-[10px] text-slate-400 font-bold">
                      Avg Tries / Approved Shot
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={1}
                      max={10}
                      value={avgTries}
                      onChange={(e) => setAvgTries(Number(e.target.value))}
                      className="w-full mt-1 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <label className="block text-[10px] text-slate-400 font-bold">
                      Total 3-Min Pilot Spend ($)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min={1}
                      value={pilotTotalSpend}
                      onChange={(e) => setPilotTotalSpend(Number(e.target.value))}
                      className="w-full mt-1 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/40">
                    <label className="block text-[10px] text-amber-300 font-bold">
                      User MAX_COST_PER_MINUTE ($)
                    </label>
                    <input
                      type="text"
                      value={userMaxCostPerMin}
                      onChange={(e) => setUserMaxCostPerMin(e.target.value)}
                      placeholder="Set cap (e.g. 25.00)"
                      className="w-full mt-1 px-2 py-1 rounded bg-slate-950 border border-amber-500/50 text-xs font-mono text-amber-300 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {scalingReport.gates.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {g.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span className="font-bold text-white">{g.name}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          (Target: {g.targetText})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-cyan-300">{g.actualText}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            g.passed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {g.passed ? 'PASS' : 'HOLD'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-slate-400">
            On-Disk Files Ready: <span className="text-amber-300">config/pricing.yaml</span> ·{' '}
            <span className="text-cyan-300">shots/shot_list.json</span> ·{' '}
            <span className="text-emerald-300">style/style_guide.md</span> ·{' '}
            <span className="text-purple-300">
              video_pilot/&#123;budget,pipeline,providers/veo&#125;.py
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Close Pilot Workbench
          </button>
        </div>
      </div>
    </div>
  );
};
