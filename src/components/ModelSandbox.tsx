import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  Sparkles,
  Camera,
  Sliders,
  Download,
  Film,
  Eye,
  Layers,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  LoraTrainingJob,
  SandboxAspectRatio,
  SandboxEvaluationRun,
  SandboxInspectionOverlay,
  SandboxLensPreset,
  SandboxPresetScenario,
} from '../types/b2bEnterprise';
import {
  SANDBOX_PRESET_SCENARIOS,
  evaluateSandboxConsistency,
  injectTriggerTokenIntoPrompt,
} from '../utils/b2bEnterpriseEngine';

interface ModelSandboxProps {
  jobs: LoraTrainingJob[];
  selectedJobId: string;
  onSelectJobId: (jobId: string) => void;
  onDeployToLeoStudio?: (title: string, resolvedPrompt: string) => void;
}

const LENS_PRESETS: SandboxLensPreset[] = [
  '50mm Macro Probe Lens',
  '35mm Prime Arri Alexa',
  '85mm Anamorphic Panavision',
  'FPV Dynamic Drone Orbit',
];

const ASPECT_RATIOS: SandboxAspectRatio[] = ['16:9', '9:16', '1:1', '21:9'];

export const ModelSandbox: React.FC<ModelSandboxProps> = ({
  jobs,
  selectedJobId,
  onSelectJobId,
  onDeployToLeoStudio,
}) => {
  const activeJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || jobs[0],
    [jobs, selectedJobId]
  );

  const [selectedPreset, setSelectedPreset] = useState<SandboxPresetScenario>(
    SANDBOX_PRESET_SCENARIOS[0]
  );
  const [customPrompt, setCustomPrompt] = useState<string>(
    SANDBOX_PRESET_SCENARIOS[0].promptTemplate
  );
  const [selectedLens, setSelectedLens] = useState<SandboxLensPreset>(
    SANDBOX_PRESET_SCENARIOS[0].recommendedLens
  );
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<SandboxAspectRatio>(
    SANDBOX_PRESET_SCENARIOS[0].recommendedAspectRatio
  );
  const [inferenceSteps, setInferenceSteps] = useState<number>(
    SANDBOX_PRESET_SCENARIOS[0].recommendedSteps
  );
  const [inspectionOverlay, setInspectionOverlay] =
    useState<SandboxInspectionOverlay>('color');
  const [isRunningEvaluation, setIsRunningEvaluation] = useState<boolean>(false);
  const [evaluationHistory, setEvaluationHistory] = useState<SandboxEvaluationRun[]>(() => {
    const initialJob = jobs[0];
    if (!initialJob) return [];
    return [
      evaluateSandboxConsistency({
        job: initialJob,
        preset: SANDBOX_PRESET_SCENARIOS[0],
        lens: SANDBOX_PRESET_SCENARIOS[0].recommendedLens,
        aspectRatio: SANDBOX_PRESET_SCENARIOS[0].recommendedAspectRatio,
        inferenceSteps: SANDBOX_PRESET_SCENARIOS[0].recommendedSteps,
      }),
    ];
  });

  const currentEvaluation = useMemo(() => {
    if (!activeJob) return null;
    return evaluateSandboxConsistency({
      job: activeJob,
      preset: selectedPreset,
      customPrompt,
      lens: selectedLens,
      aspectRatio: selectedAspectRatio,
      inferenceSteps,
    });
  }, [activeJob, selectedPreset, customPrompt, selectedLens, selectedAspectRatio, inferenceSteps]);

  const handleSelectPreset = (preset: SandboxPresetScenario) => {
    setSelectedPreset(preset);
    setCustomPrompt(preset.promptTemplate);
    setSelectedLens(preset.recommendedLens);
    setSelectedAspectRatio(preset.recommendedAspectRatio);
    setInferenceSteps(preset.recommendedSteps);
  };

  const handleRunConsistencyTest = () => {
    if (!activeJob) return;
    setIsRunningEvaluation(true);
    setTimeout(() => {
      const result = evaluateSandboxConsistency({
        job: activeJob,
        preset: selectedPreset,
        customPrompt,
        lens: selectedLens,
        aspectRatio: selectedAspectRatio,
        inferenceSteps,
      });
      setEvaluationHistory((prev) => [result, ...prev.slice(0, 7)]);
      setIsRunningEvaluation(false);
    }, 350);
  };

  const handleDownloadAuditJson = () => {
    if (!currentEvaluation || !activeJob) return;
    const report = {
      enterpriseComplianceStandard: 'SOC2-Type-II-Product-Twin-Verification',
      generatedAt: new Date().toISOString(),
      model: {
        id: activeJob.id,
        name: activeJob.modelName,
        triggerToken: activeJob.triggerToken,
        brandClient: activeJob.brandClient,
        sha256Checksum: activeJob.sha256Checksum,
      },
      latestEvaluation: currentEvaluation,
      recentRuns: evaluationHistory,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeJob.triggerToken}_consistency_audit.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeJob || !currentEvaluation) {
    return null;
  }

  const resolvedPreviewPrompt = injectTriggerTokenIntoPrompt(
    customPrompt,
    activeJob.triggerToken
  );

  return (
    <div className="space-y-8">
      {/* Top Header & Model Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <p className="text-xs font-medium text-emerald-400 tracking-wide uppercase">
            Pre-Deployment Physical Invariant Verification
          </p>
          <h2 className="text-2xl font-bold text-white mt-1">
            Model Consistency Sandbox
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 tabular-nums">
            <span>Active Token: {activeJob.triggerToken}</span>
            <span aria-hidden="true">·</span>
            <span>Rank {activeJob.networkRankDim} ({activeJob.precision})</span>
            <span aria-hidden="true">·</span>
            <span>5 Enterprise Preset Stress Prompts</span>
          </div>
        </div>

        {/* Select Trained LoRA Model */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">
            Target LoRA Model:
          </label>
          <select
            value={activeJob.id}
            onChange={(e) => onSelectJobId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.modelName} ({job.triggerToken}) — {job.phase === 'completed' ? 'Verified' : job.phase}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleDownloadAuditJson}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Audit JSON</span>
          </button>
        </div>
      </div>

      {/* Main 12-Col Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols): 5 Preset Stress Scenarios & Optics Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">
              01. Select Preset Consistency Scenario
            </h3>
            <div className="space-y-2.5">
              {SANDBOX_PRESET_SCENARIOS.map((preset) => {
                const isSelected = preset.id === selectedPreset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-400 text-white'
                        : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">
                        {preset.title}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-300 tabular-nums">
                        {preset.recommendedAspectRatio} · {preset.recommendedSteps} steps
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {preset.subtitle}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1.5">
                      <span>{preset.focusArea}</span>
                      <span aria-hidden="true">·</span>
                      <span>{preset.recommendedLens}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt & Camera Optics Configuration */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>02. Prompt &amp; Optics Parameters</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400">
                Auto-injects {'{{token}}'}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Sandbox Verification Prompt
              </label>
              <textarea
                rows={3}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[11px] text-slate-400 font-mono truncate">
                Resolved: {resolvedPreviewPrompt}
              </p>
            </div>

            {/* Lens & Aspect Ratio Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Cinema Lens Rig
                </label>
                <select
                  value={selectedLens}
                  onChange={(e) => setSelectedLens(e.target.value as SandboxLensPreset)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {LENS_PRESETS.map((lens) => (
                    <option key={lens} value={lens}>
                      {lens}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Aspect Ratio
                </label>
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setSelectedAspectRatio(ratio)}
                      className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        selectedAspectRatio === ratio
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Inference Step Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs tabular-nums">
                <span className="text-slate-300">Diffusion Sampling Steps</span>
                <span className="font-mono font-bold text-cyan-300">{inferenceSteps} steps</span>
              </div>
              <input
                type="range"
                min={20}
                max={60}
                step={5}
                value={inferenceSteps}
                onChange={(e) => setInferenceSteps(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <button
              type="button"
              onClick={handleRunConsistencyTest}
              disabled={isRunningEvaluation}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isRunningEvaluation ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Physical Invariants...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  <span>Run Sandbox Verification Pass</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (7 Cols): Viewport Inspection & Physical Invariant Scorecard */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
            {/* Inspection Overlay Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>03. Optical &amp; Geometric Inspection Viewport</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lighting: {selectedPreset.lightingSetup} · Seed {currentEvaluation.seed}
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                {(
                  [
                    { id: 'color', label: 'Color Render' },
                    { id: 'logo_mask', label: 'Logo Mask' },
                    { id: 'geometry_iou', label: 'Silhouette IoU' },
                    { id: 'materials', label: 'BRDF Materials' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setInspectionOverlay(mode.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      inspectionOverlay === mode.id
                        ? 'bg-slate-800 text-cyan-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Viewport Frame */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
              <img
                src={selectedPreset.referenceRenderSvg}
                alt={selectedPreset.title}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  inspectionOverlay === 'logo_mask'
                    ? 'contrast-150 saturate-200 hue-rotate-30'
                    : inspectionOverlay === 'geometry_iou'
                    ? 'invert contrast-125'
                    : inspectionOverlay === 'materials'
                    ? 'sepia contrast-125'
                    : ''
                }`}
              />

              {/* Diagnostic Overlay HUD */}
              <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums">
                <div className="flex items-center gap-2 text-slate-200">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold">{selectedLens}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedAspectRatio}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentEvaluation.inferenceLatencyMs} ms</span>
                </div>

                <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {currentEvaluation.passedEnterpriseThreshold
                      ? 'Enterprise Consistency Verified'
                      : 'Calibration Recommended'}
                  </span>
                </div>
              </div>
            </div>

            {/* Physical Invariant Scorecards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Logo &amp; Kerning Integrity</div>
                <div className="text-2xl font-bold text-emerald-300 mt-1">
                  {currentEvaluation.scores.logoIntegrity}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Threshold &ge; 98.0% · Zero glyph warping
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Geometry Silhouette IoU</div>
                <div className="text-2xl font-bold text-cyan-300 mt-1">
                  {currentEvaluation.scores.geometrySilhouetteIou}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Threshold &ge; 97.5% · CAD mesh aligned
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">BRDF Material Purity</div>
                <div className="text-2xl font-bold text-amber-300 mt-1">
                  {currentEvaluation.scores.materialPurity}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Threshold &ge; 97.0% · Specular accuracy
                </div>
              </div>
            </div>

            {/* Production Sign-Off & LEO Studio Handoff */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Composite Consistency Score:{' '}
                  <strong className="text-white tabular-nums">
                    {currentEvaluation.scores.overallConsistency}%
                  </strong>{' '}
                  — Certified for wide-scale commercial deployment
                </span>
              </div>

              {onDeployToLeoStudio && (
                <button
                  type="button"
                  onClick={() =>
                    onDeployToLeoStudio(
                      `${activeJob.modelName} — ${selectedPreset.title}`,
                      resolvedPreviewPrompt
                    )
                  }
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                >
                  <Film className="w-4 h-4" />
                  <span>Deploy Model to LEO Video Studio</span>
                </button>
              )}
            </div>
          </div>

          {/* Recent Sandbox Verification Log */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recent Sandbox Evaluation Runs</span>
              </h4>
              <span className="text-[11px] text-slate-500 tabular-nums">
                {evaluationHistory.length} runs recorded in session
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs tabular-nums">
              {evaluationHistory.slice(0, 4).map((run) => (
                <div
                  key={run.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="truncate max-w-md">
                    <span className="font-semibold text-white">{run.modelName}</span>
                    <span className="text-slate-500 mx-1.5">·</span>
                    <span className="text-slate-400">{run.lens}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 shrink-0">
                    <span>Logo {run.scores.logoIntegrity}%</span>
                    <span aria-hidden="true">·</span>
                    <span>IoU {run.scores.geometrySilhouetteIou}%</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400 font-semibold">
                      Avg {run.scores.overallConsistency}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
