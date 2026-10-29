import React, { useState, useEffect } from 'react';
import {
  Activity,
  FlaskConical,
  Plus,
  Building2,
  ShieldCheck,
  Cpu,
  Film,
  Sparkles,
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
import { LoraFlowSpatialMlopsPanel } from './LoraFlowSpatialMlopsPanel';

interface EnterpriseB2BTabProps {
  onDeployToLeoStudio?: (title: string, prompt: string) => void;
  initialSubtab?: 'loraflow_mlops' | 'training_dashboard' | 'model_sandbox';
  initialMlopsSection?:
    | 'loss_samples'
    | 'sora2_animation'
    | 'hf_github_storage'
    | 'cloud_bottlenecks'
    | 'security_rbac_audit';
}

export const EnterpriseB2BTab: React.FC<EnterpriseB2BTabProps> = ({
  onDeployToLeoStudio,
  initialSubtab = 'loraflow_mlops',
  initialMlopsSection = 'loss_samples',
}) => {
  const [activeSubtab, setActiveSubtab] = useState<
    'loraflow_mlops' | 'training_dashboard' | 'model_sandbox'
  >(initialSubtab);
  const [mlopsSection, setMlopsSection] = useState<
    'loss_samples' | 'sora2_animation' | 'hf_github_storage' | 'cloud_bottlenecks' | 'security_rbac_audit'
  >(initialMlopsSection);
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
              <span>LoRAFlow Spatial MLOps &amp; Sora 2 Enterprise Suite</span>
              <span aria-hidden="true">·</span>
              <span>Hugging Face &amp; GitHub VCS</span>
              <span aria-hidden="true">·</span>
              <span>RBAC, MFA &amp; AES-256-GCM Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              LoRAFlow Spatial MLOps &amp; Sora 2 Text-to-Animation Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Monitor real-time loss curves, synthesize live sample images, export encrypted checkpoints, connect Hugging Face datasets &amp; GitHub repositories, enforce RBAC/MFA compliance audit trails, and generate Sora 2 text-to-animation videos.
            </p>
          </div>

          {/* Hero Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsBuilderModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>New 10–20 Image LoRA Run</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubtab('loraflow_mlops');
                setMlopsSection('sora2_animation');
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Film className="w-4 h-4" />
              <span>Sora 2 Text-to-Animation Video</span>
            </button>
          </div>
        </div>

        {/* Interactive Segmented Subtab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSubtab('loraflow_mlops')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeSubtab === 'loraflow_mlops'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>LoRAFlow MLOps &amp; Sora 2 Animation</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubtab('training_dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeSubtab === 'training_dashboard'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Cluster Pipeline Status ({jobs.length} Runs)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubtab('model_sandbox')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
            <span>SOC 2 Type II · RBAC &amp; MFA Enforced · Encrypted Cloud Backups</span>
          </div>
        </div>
      </div>

      {/* Subtab Content */}
      {activeSubtab === 'loraflow_mlops' ? (
        <LoraFlowSpatialMlopsPanel
          key={mlopsSection}
          jobs={jobs}
          initialSection={mlopsSection}
          onDeployToLeoStudio={onDeployToLeoStudio}
          onOpenNewModelBuilder={() => setIsBuilderModalOpen(true)}
        />
      ) : activeSubtab === 'training_dashboard' ? (
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
