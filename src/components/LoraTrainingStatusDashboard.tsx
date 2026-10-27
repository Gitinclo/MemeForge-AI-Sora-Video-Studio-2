import React from 'react';
import {
  Activity,
  Cpu,
  Clock,
  Play,
  Pause,
  Square,
  CheckCircle2,
  FlaskConical,
  Plus,
  HardDrive,
  Zap,
  Thermometer,
} from 'lucide-react';
import {
  GpuClusterNodeMetrics,
  LoraTrainingJob,
  LoraTrainingPhase,
} from '../types/b2bEnterprise';
import {
  formatDurationEta,
  getTrainingPhaseOrder,
} from '../utils/b2bEnterpriseEngine';

interface LoraTrainingStatusDashboardProps {
  jobs: LoraTrainingJob[];
  gpuNodes: GpuClusterNodeMetrics[];
  onTogglePauseJob: (jobId: string) => void;
  onAbortJob: (jobId: string) => void;
  onFastForwardJob: (jobId: string) => void;
  onOpenInSandbox: (job: LoraTrainingJob) => void;
  onOpenNewModelBuilder: () => void;
}

const PHASE_LABELS: Record<LoraTrainingPhase, string> = {
  validating_dataset: '01. Validating Dataset',
  extracting_latents: '02. Extracting Latents',
  training_lora: '03. Training LoRA Weights',
  compiling_safetensors: '04. Compiling Safetensors',
  completed: '05. Ready for Production',
  paused: 'Paused by Operator',
  failed: 'Aborted',
};

export const LoraTrainingStatusDashboard: React.FC<LoraTrainingStatusDashboardProps> = ({
  jobs,
  gpuNodes,
  onTogglePauseJob,
  onAbortJob,
  onFastForwardJob,
  onOpenInSandbox,
  onOpenNewModelBuilder,
}) => {
  const orderedPhases = getTrainingPhaseOrder();
  const activeCount = jobs.filter(
    (j) => j.phase !== 'completed' && j.phase !== 'paused' && j.phase !== 'failed'
  ).length;
  const completedCount = jobs.filter((j) => j.phase === 'completed').length;
  const avgUtilization = Math.round(
    gpuNodes.reduce((acc, n) => acc + n.utilizationPercent, 0) / Math.max(1, gpuNodes.length)
  );
  const totalVramUsed = gpuNodes
    .reduce((acc, n) => acc + n.vramUsedGb, 0)
    .toFixed(1);
  const totalVramCapacity = gpuNodes.reduce((acc, n) => acc + n.vramTotalGb, 0);

  return (
    <div className="space-y-8">
      {/* Top Summary Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <p className="text-xs font-medium text-cyan-400 tracking-wide uppercase">
            Real-Time Cluster Telemetry &amp; Weight Convergence
          </p>
          <h2 className="text-2xl font-bold text-white mt-1">
            LoRA Training Status Dashboard
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 tabular-nums">
            <span>{activeCount} active training jobs</span>
            <span aria-hidden="true">·</span>
            <span>{completedCount} verified models</span>
            <span aria-hidden="true">·</span>
            <span>Mean GPU load {avgUtilization}%</span>
            <span aria-hidden="true">·</span>
            <span>VRAM allocated {totalVramUsed} / {totalVramCapacity} GB</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenNewModelBuilder}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Train New Product LoRA (10–20 Images)</span>
          </button>
        </div>
      </div>

      {/* Active & Completed LoRA Jobs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            01. Active &amp; Completed LoRA Pipelines
          </h3>
          <span className="text-xs text-slate-400 tabular-nums">
            Auto-syncing step telemetry every 1.5s
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => {
            const progressPct = Math.min(
              100,
              Math.round((job.currentStep / Math.max(1, job.totalSteps)) * 100)
            );
            const isCompleted = job.phase === 'completed';
            const isPaused = job.phase === 'paused';
            const isFailed = job.phase === 'failed';

            return (
              <div
                key={job.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={job.previewImageUrl}
                      alt={job.modelName}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="font-medium text-slate-300">{job.brandClient}</span>
                        <span aria-hidden="true">·</span>
                        <span>{job.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-cyan-300">
                          Token: {job.triggerToken}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        {job.modelName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 tabular-nums">
                        <span>{job.datasetImageCount} calibration images</span>
                        <span aria-hidden="true">·</span>
                        <span>Rank {job.networkRankDim} / Alpha {job.networkAlpha}</span>
                        <span aria-hidden="true">·</span>
                        <span>Precision {job.precision}</span>
                        <span aria-hidden="true">·</span>
                        <span>{job.safetensorsSizeMb} MB safetensors</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!isCompleted && !isFailed && (
                      <>
                        <button
                          type="button"
                          onClick={() => onTogglePauseJob(job.id)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Resume Job</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-3.5 h-3.5 text-amber-400" />
                              <span>Pause</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onFastForwardJob(job.id)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Boost +250 Steps</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onAbortJob(job.id)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>Abort</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenInSandbox(job)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>
                        {isCompleted ? 'Verify in Model Sandbox' : 'Test Checkpoint in Sandbox'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Phase Progression Stepper & Progress Bar */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                    <div className="flex items-center gap-2 font-semibold text-slate-200">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Activity className="w-4 h-4 text-cyan-400" />
                      )}
                      <span>{PHASE_LABELS[job.phase]}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300">
                      <span>
                        Step {job.currentStep.toLocaleString()} / {job.totalSteps.toLocaleString()} ({progressPct}%)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-amber-300">
                        Loss: {job.currentLoss.toFixed(4)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 text-cyan-300">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDurationEta(job.estimatedSecondsRemaining)}
                      </span>
                    </div>
                  </div>

                  {/* Smooth Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : isPaused
                          ? 'bg-amber-500'
                          : isFailed
                          ? 'bg-rose-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* 5-Stage Pipeline Track */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {orderedPhases.map((phaseKey) => {
                      const currentIdx = orderedPhases.indexOf(
                        job.phase === 'paused' || job.phase === 'failed'
                          ? 'training_lora'
                          : job.phase
                      );
                      const targetIdx = orderedPhases.indexOf(phaseKey);
                      const isDone = targetIdx < currentIdx || job.phase === 'completed';
                      const isCurrent = targetIdx === currentIdx && job.phase !== 'completed';

                      return (
                        <div
                          key={phaseKey}
                          className={`text-[11px] py-1.5 px-2.5 rounded-lg border transition-colors ${
                            isDone
                              ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                              : isCurrent
                              ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 font-semibold'
                              : 'bg-slate-950/50 border-slate-800/80 text-slate-500'
                          }`}
                        >
                          {PHASE_LABELS[phaseKey]}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Loss Convergence Sparkline & Assigned Nodes */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
                  <div className="flex flex-wrap items-center gap-2 tabular-nums">
                    <span>Assigned Cluster Nodes: {job.assignedNodeIds.join(', ')}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Target Invariants: Logo {job.invariantTargets.logoIntegrityTarget}% / Silhouette IoU {job.invariantTargets.geometrySilhouetteIouTarget}%
                    </span>
                  </div>

                  {/* Mini SVG Loss Sparkline */}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">Convergence Curve:</span>
                    <div className="flex items-end gap-0.5 h-6">
                      {job.lossHistory.slice(-16).map((pt) => {
                        const heightPct = Math.min(100, Math.max(18, Math.round(pt.loss * 210)));
                        return (
                          <div
                            key={pt.step}
                            title={`Step ${pt.step}: Loss ${pt.loss}`}
                            className="w-1.5 bg-cyan-400/70 rounded-t-xs"
                            style={{ height: `${heightPct}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dedicated GPU Cluster Telemetry Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            02. Dedicated GPU Cluster Telemetry (NVIDIA H100 SXM5 &amp; B200 Blackwell)
          </h3>
          <span className="text-xs text-slate-400 tabular-nums">
            NVLink 4.0 / 5.0 High-Bandwidth Interconnect
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {gpuNodes.map((node) => {
            const vramPct = Math.round((node.vramUsedGb / node.vramTotalGb) * 100);
            return (
              <div
                key={node.nodeId}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 tabular-nums"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono text-cyan-300 font-semibold">
                      {node.nodeId}
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {node.architecture}
                    </div>
                  </div>
                  <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Compute Utilization */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Compute Utilization</span>
                    <span className="font-semibold text-emerald-300">
                      {node.utilizationPercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${node.utilizationPercent}%` }}
                    />
                  </div>
                </div>

                {/* VRAM Allocation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <HardDrive className="w-3 h-3" /> VRAM Allocated
                    </span>
                    <span className="font-semibold text-cyan-300">
                      {node.vramUsedGb} / {node.vramTotalGb} GB ({vramPct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-500"
                      style={{ width: `${vramPct}%` }}
                    />
                  </div>
                </div>

                {/* Hardware Telemetry Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>NVLink {node.nvlinkBandwidthGbps} GB/s</span>
                  <span aria-hidden="true">·</span>
                  <span>{node.powerDrawWatts}W / {node.powerCapWatts}W</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-0.5 text-amber-300">
                    <Thermometer className="w-3 h-3" />
                    {node.junctionTempCelsius}°C
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
