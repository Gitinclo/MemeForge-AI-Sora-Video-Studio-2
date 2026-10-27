import React, { useState, useEffect } from 'react';
import {
  Activity,
  FlaskConical,
  Plus,
  Building2,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import {
  GpuClusterNodeMetrics,
  LoraTrainingJob,
} from '../types/b2bEnterprise';
import {
  INITIAL_GPU_CLUSTER_NODES,
  INITIAL_LORA_JOBS,
  advanceTrainingJobTick,
  perturbGpuClusterTelemetry,
} from '../utils/b2bEnterpriseEngine';
import { LoraTrainingStatusDashboard } from './LoraTrainingStatusDashboard';
import { ModelSandbox } from './ModelSandbox';
import { EnterpriseProductModelBuilderModal } from './EnterpriseProductModelBuilderModal';

interface EnterpriseB2BTabProps {
  onDeployToLeoStudio?: (title: string, prompt: string) => void;
}

export const EnterpriseB2BTab: React.FC<EnterpriseB2BTabProps> = ({
  onDeployToLeoStudio,
}) => {
  const [activeSubtab, setActiveSubtab] = useState<'training_dashboard' | 'model_sandbox'>(
    'training_dashboard'
  );
  const [jobs, setJobs] = useState<LoraTrainingJob[]>(INITIAL_LORA_JOBS);
  const [gpuNodes, setGpuNodes] = useState<GpuClusterNodeMetrics[]>(
    INITIAL_GPU_CLUSTER_NODES
  );
  const [selectedSandboxJobId, setSelectedSandboxJobId] = useState<string>(
    INITIAL_LORA_JOBS[0].id
  );
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState<boolean>(false);

  // Real-time training progression & GPU cluster telemetry ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs((prevJobs) => {
        const nextJobs = prevJobs.map((job) => advanceTrainingJobTick(job, 25));
        setGpuNodes((prevNodes) => perturbGpuClusterTelemetry(prevNodes, nextJobs));
        return nextJobs;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleTogglePauseJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        if (j.phase === 'paused') {
          return { ...j, phase: 'training_lora' };
        }
        return { ...j, phase: 'paused' };
      })
    );
  };

  const handleAbortJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, phase: 'failed', estimatedSecondsRemaining: 0 } : j
      )
    );
  };

  const handleFastForwardJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? advanceTrainingJobTick(j, 250) : j))
    );
  };

  const handleOpenInSandbox = (job: LoraTrainingJob) => {
    setSelectedSandboxJobId(job.id);
    setActiveSubtab('model_sandbox');
  };

  const handleLaunchNewJob = (
    newJob: LoraTrainingJob,
    openInSandboxImmediately = false
  ) => {
    setJobs((prev) => [newJob, ...prev]);
    if (openInSandboxImmediately) {
      setSelectedSandboxJobId(newJob.id);
      setActiveSubtab('model_sandbox');
    } else {
      setActiveSubtab('training_dashboard');
    }
  };

  return (
    <div className="space-y-8">
      {/* Enterprise Hero Header & Navigation Subtabs */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-400 font-medium">
              <Building2 className="w-4 h-4" />
              <span>Enterprise B2B Custom LoRA Suite</span>
              <span aria-hidden="true">·</span>
              <span>Dedicated H100 &amp; B200 Cluster</span>
              <span aria-hidden="true">·</span>
              <span>SOC 2 Type II Isolated Weights</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Product Twin LoRA Training &amp; Consistency Sandbox
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Monitor real-time LoRA weight convergence and GPU cluster telemetry, then verify your trained product digital twins across 5 preset lighting and motion stress tests before deploying at scale.
            </p>
          </div>

          {/* Hero Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsBuilderModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>New 10–20 Image LoRA Job</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSubtab(
                  activeSubtab === 'training_dashboard'
                    ? 'model_sandbox'
                    : 'training_dashboard'
                )
              }
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              {activeSubtab === 'training_dashboard' ? (
                <>
                  <FlaskConical className="w-4 h-4" />
                  <span>Open Model Consistency Sandbox</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>View Live Training Dashboard</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Segmented Subtab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSubtab('training_dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                activeSubtab === 'training_dashboard'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>LoRA Training Status Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubtab('model_sandbox')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                activeSubtab === 'model_sandbox'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Model Consistency Sandbox</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero cross-tenant weight leakage · Deterministic seed verification</span>
          </div>
        </div>
      </div>

      {/* Subtab Content */}
      {activeSubtab === 'training_dashboard' ? (
        <LoraTrainingStatusDashboard
          jobs={jobs}
          gpuNodes={gpuNodes}
          onTogglePauseJob={handleTogglePauseJob}
          onAbortJob={handleAbortJob}
          onFastForwardJob={handleFastForwardJob}
          onOpenInSandbox={handleOpenInSandbox}
          onOpenNewModelBuilder={() => setIsBuilderModalOpen(true)}
        />
      ) : (
        <ModelSandbox
          jobs={jobs}
          selectedJobId={selectedSandboxJobId}
          onSelectJobId={setSelectedSandboxJobId}
          onDeployToLeoStudio={onDeployToLeoStudio}
        />
      )}

      {/* 10-20 Image LoRA Builder Modal */}
      <EnterpriseProductModelBuilderModal
        isOpen={isBuilderModalOpen}
        onClose={() => setIsBuilderModalOpen(false)}
        onLaunchJob={handleLaunchNewJob}
      />
    </div>
  );
};
