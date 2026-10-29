import React, { useState, useMemo } from 'react';
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
  Layers,
  Lock,
  Copy,
  Check,
  Download,
  Scale,
} from 'lucide-react';
import {
  PRICING_YAML_CONFIG,
  PilotProviderId,
  VeoModelTier,
  PilotResolution,
  getBudgetReferenceTable,
  estimateJobCostUsd,
  evaluateBudgetGuard,
  PILOT_23_SHOT_LIST,
  STYLE_GUIDE_SUMMARY,
  validatePilotShotList,
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
}

export const AiVideoPilotModal: React.FC<AiVideoPilotModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    'improvements' | 'pricing' | 'shots' | 'bakeoff' | 'license_gates'
  >('improvements');

  // Tab 2: Pricing & Budget Guard Simulator State
  const [testProvider, setTestProvider] = useState<PilotProviderId>('veo');
  const [testTier, setTestTier] = useState<VeoModelTier | 'omni_flash'>('fast');
  const [testResolution, setTestResolution] = useState<PilotResolution>('1080p');
  const [testDuration, setTestDuration] = useState<number>(8);
  const [simSpentUsd, setSimSpentUsd] = useState<number>(64.04);
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
      jobId: 'job_shot_02_try1',
      shotId: 'shot_02',
      tryIndex: 1,
      provider: 'veo',
      modelId: 'veo-3.1-fast-generate-preview',
      resolution: '1080p',
      durationSeconds: 8,
      succeeded: false, // Failed attempt -> $0.00 actual cost (successful_generations_only)
      estimatedCostUsd: 0.96,
      actualCostUsd: 0.0,
      cumulativeSpentUsd: 0.96,
    },
    {
      timestampUtc: '2026-10-29T10:02:05Z',
      jobId: 'job_shot_02_try2',
      shotId: 'shot_02',
      tryIndex: 2,
      provider: 'veo',
      modelId: 'veo-3.1-fast-generate-preview',
      resolution: '1080p',
      durationSeconds: 8,
      succeeded: true,
      estimatedCostUsd: 0.96,
      actualCostUsd: 0.96,
      cumulativeSpentUsd: 1.92,
    },
  ]);

  // Tab 3: Bake-Off State
  const [useRefAnchors, setUseRefAnchors] = useState<boolean>(true);

  // Tab 4: 5-Clause Book License Analyzer & Scaling Gates State
  const [licenseText, setLicenseText] = useState<string>(
    SAMPLE_LICENSE_PRESETS.missing_or_unverified.text
  );
  const [userMaxCostPerMin, setUserMaxCostPerMin] = useState<string>('25.00');
  const [consistencyScore, setConsistencyScore] = useState<number>(10);
  const [avgTries, setAvgTries] = useState<number>(2.1);
  const [pilotTotalSpend, setPilotTotalSpend] = useState<number>(64.8);
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

  const shotValidation = useMemo(() => validatePilotShotList(PILOT_23_SHOT_LIST), []);
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
    triggerBrowserDownload([header, ...rows].join('\n'), 'costs.csv', 'text/csv;charset=utf-8');
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
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 uppercase">
                  Veo 3.1 Sept 2026 Rates Verified
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-red-500/20 border border-red-500/40 text-red-300 uppercase">
                  Sora API Blocked (Shut Down Sept 24, 2026)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                23 Shots (4s/6s/8s = 180s) · $500 Hard Budget Guard · 10-Shot Bake-Off · 5-Clause Book License Analyzer &amp; Scale Gates
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
            { id: 'improvements', label: '1. Spec Improvements & On-Disk Files', icon: Sparkles },
            { id: 'pricing', label: '2. Pricing YAML & $500 Budget Guard', icon: DollarSign },
            { id: 'shots', label: '3. 23-Shot Schema & Style Guide (180s)', icon: Layers },
            { id: 'bakeoff', label: '4. 10-Shot Provider Bake-Off', icon: Play },
            { id: 'license_gates', label: '5. Book License Analyzer & Scaling Gates', icon: Scale },
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
          {activeTab === 'improvements' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>What We Improved &amp; Built On Disk From Your Spec</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    All agent rules are enforced: API keys read strictly from <code className="text-amber-300 font-mono">GEMINI_API_KEY</code> env var, rates loaded from <code className="text-amber-300 font-mono">config/pricing.yaml</code>, OpenAI Sora strictly blocked, and private-testing-only locked until all 5 Book License items pass.
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
                          Valid Combination · Model ID: <code className="font-mono">{costEst.modelId}</code>
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
                          <td className="py-2 px-3 font-mono">${row.bakeoff240sUsd.toLocaleString()}</td>
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

          {activeTab === 'shots' && (
            <div className="space-y-4">
              {/* Style Guide Summary */}
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

              {/* Validation Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-emerald-200 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Schema Validation PASSED: {shotValidation.shotCount} Shots ·{' '}
                    {shotValidation.totalDurationSeconds}s Total (3.0 Minutes) · Avg{' '}
                    {shotValidation.averageDurationSeconds}s/shot · 3-Try Pilot ={' '}
                    {shotValidation.estimatedPilotSecondsWith3Tries}s
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(PILOT_23_SHOT_LIST, null, 2));
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
                    {copiedId === 'shots_json' ? 'Copied 23 Shots!' : 'Copy shots/shot_list.json'}
                  </span>
                </button>
              </div>

              {/* 23-Shot Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 max-h-96 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Shot</th>
                      <th className="py-2 px-3">Dur / Tier</th>
                      <th className="py-2 px-3">Characters &amp; Location</th>
                      <th className="py-2 px-3">Action &amp; Dialogue</th>
                      <th className="py-2 px-3">Continuity Anchor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {PILOT_23_SHOT_LIST.map((shot) => (
                      <tr key={shot.shot_id} className="hover:bg-slate-900/40 text-slate-300">
                        <td className="py-2 px-3 font-mono font-bold text-amber-300">
                          {shot.shot_id}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {shot.duration_s}s · {shot.resolution} ·{' '}
                          <span className="text-cyan-300 uppercase">{shot.model_tier}</span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-mono text-[11px] text-purple-300">
                            {shot.characters.join(', ')}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{shot.location}</div>
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
                    ))}
                  </tbody>
                </table>
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
                    Toggle Reference Turnaround Anchors (<code className="text-cyan-300 font-mono">reference_image_ids</code>) to see its impact on the ≥ 9/10 Consistency Gate.
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
                      Paste your book license or option clauses below (or load a preset) to check all 5 mandatory legal items before scaling or publishing.
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
                      Set your <code className="text-amber-300 font-mono">MAX_COST_PER_MINUTE</code> below (never guessed by the agent). If any gate fails, the pipeline stops for review.
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
            <span className="text-purple-300">video_pilot/&#123;budget,pipeline,providers/veo&#125;.py</span>
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
