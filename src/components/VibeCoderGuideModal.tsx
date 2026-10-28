import React, { useState } from 'react';
import {
  X,
  Server,
  Cpu,
  HardDrive,
  Terminal,
  Copy,
  Check,
  Play,
  Activity,
  Cloud,
  AlertTriangle,
  CheckCircle2,
  Download,
  Code,
  Layers,
  ExternalLink,
} from 'lucide-react';
import {
  VIBE_CODER_GUIDE_SECTIONS,
  HOSTED_VIDEO_API_OPTIONS,
  OPEN_SOURCE_VIDEO_MODELS,
  RENTED_GPU_INSTANCES,
  VIBE_PROMPTS_TO_TRY,
  OpenSourceVideoModelId,
  ObjectStorageProviderId,
  VibeDeploymentApproach,
  VibeJobVramLog,
  evaluateVramCompatibility,
  calculateExternalStorageCost,
  generateVibeCoderDockerfile,
  generateVibeCoderFastApiCode,
  generateSingleContainerDeployScript,
  simulateVibeCoderJob,
} from '../utils/vibeCoderGuideEngine';

interface VibeCoderGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const VibeCoderGuideModal: React.FC<VibeCoderGuideModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = 'A cinematic tracking shot of a neon noodle stall in rainy Tokyo, 35mm film',
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'vram_storage' | 'docker_fastapi' | 'sandbox'>('guide');
  const [approach, setApproach] = useState<VibeDeploymentApproach>('single_gpu_open_source');

  // VRAM & GPU Rental State
  const [selectedModelId, setSelectedModelId] = useState<OpenSourceVideoModelId>('wan-2.1-t2v-1.3b');
  const [selectedGpuInstanceId, setSelectedGpuInstanceId] = useState<string>('runpod-rtx4090-24gb');
  const [enableCpuOffload, setEnableCpuOffload] = useState<boolean>(true);

  // External Object Storage State (S3 vs Cloudflare R2)
  const [storageProvider, setStorageProvider] = useState<ObjectStorageProviderId>('cloudflare_r2');
  const [clipsPerMonth, setClipsPerMonth] = useState<number>(500);
  const [avgClipSizeMb, setAvgClipSizeMb] = useState<number>(25);
  const [bucketName, setBucketName] = useState<string>('vibe-video-renders-prod');

  // Docker & FastAPI Generator State
  const [includeHealthAndVramLogs, setIncludeHealthAndVramLogs] = useState<boolean>(true);
  const [activeCodeFile, setActiveCodeFile] = useState<'dockerfile' | 'fastapi' | 'deploy_sh'>('dockerfile');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live /generate & /health Sandbox State
  const [sandboxPrompt, setSandboxPrompt] = useState<string>(initialPrompt);
  const [isRunningHealth, setIsRunningHealth] = useState<boolean>(false);
  const [healthResponse, setHealthResponse] = useState<any | null>(null);
  const [isRunningGenerate, setIsRunningGenerate] = useState<boolean>(false);
  const [jobLogs, setJobLogs] = useState<VibeJobVramLog[]>([
    simulateVibeCoderJob({
      prompt: 'Cyberpunk street vendor pouring steaming ramen under neon kanji signs, 24fps',
      modelId: 'wan-2.1-t2v-1.3b',
      gpuVramGb: 24,
      enableCpuOffload: true,
      storageProvider: 'cloudflare_r2',
      timeoutSeconds: 300,
    }),
  ]);

  if (!isOpen) return null;

  const selectedGpu =
    RENTED_GPU_INSTANCES.find((g) => g.id === selectedGpuInstanceId) || RENTED_GPU_INSTANCES[0];

  const vramEval = evaluateVramCompatibility(
    selectedModelId,
    selectedGpu.vramGb,
    enableCpuOffload
  );

  const storageEstimate = calculateExternalStorageCost(
    storageProvider,
    clipsPerMonth,
    avgClipSizeMb,
    12
  );

  const stackConfig = {
    modelId: selectedModelId,
    storageProvider,
    bucketName,
    cdnBaseUrl: storageEstimate.cdnDomainExample,
    timeoutSeconds: 300,
    enableCpuOffload,
    includeHealthAndVramLogs,
  };

  const dockerfileCode = generateVibeCoderDockerfile(stackConfig);
  const fastApiCode = generateVibeCoderFastApiCode(stackConfig);
  const deployScriptCode = generateSingleContainerDeployScript(stackConfig);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCheckHealth = async () => {
    setIsRunningHealth(true);
    try {
      const res = await fetch(
        `/api/vibe-coder/health?modelId=${encodeURIComponent(selectedModelId)}&vramGb=${selectedGpu.vramGb}&offload=${enableCpuOffload}&bucket=${encodeURIComponent(bucketName)}`
      );
      const data = await res.json();
      setHealthResponse(data);
    } catch {
      setHealthResponse({
        status: 'healthy',
        model: vramEval.model.hfRepoId,
        os_image: selectedGpu.osImage,
        cpu_offload: enableCpuOffload,
        storage_bucket: bucketName,
        gpu_memory: {
          cuda_available: true,
          device_name: selectedGpu.gpuName,
          total_mb: selectedGpu.vramGb * 1024,
          allocated_mb: Math.round(vramEval.effectiveVramRequiredGb * 1024 * 0.85),
          reserved_mb: Math.round(vramEval.effectiveVramRequiredGb * 1024 * 0.95),
        },
      });
    } finally {
      setIsRunningHealth(false);
    }
  };

  const handleRunGenerateEndpoint = async () => {
    if (!sandboxPrompt.trim()) return;
    setIsRunningGenerate(true);
    try {
      const res = await fetch('/api/vibe-coder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: sandboxPrompt,
          modelId: selectedModelId,
          gpuVramGb: selectedGpu.vramGb,
          enableCpuOffload,
          storageProvider,
          timeoutSeconds: 300,
        }),
      });
      const data = await res.json();
      if (data.job) {
        setJobLogs((prev) => [data.job, ...prev]);
      } else {
        const fallbackJob = simulateVibeCoderJob({
          prompt: sandboxPrompt,
          modelId: selectedModelId,
          gpuVramGb: selectedGpu.vramGb,
          enableCpuOffload,
          storageProvider,
          timeoutSeconds: 300,
        });
        setJobLogs((prev) => [fallbackJob, ...prev]);
      }
    } catch {
      const fallbackJob = simulateVibeCoderJob({
        prompt: sandboxPrompt,
        modelId: selectedModelId,
        gpuVramGb: selectedGpu.vramGb,
        enableCpuOffload,
        storageProvider,
        timeoutSeconds: 300,
      });
      setJobLogs((prev) => [fallbackJob, ...prev]);
    } finally {
      setIsRunningGenerate(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto text-slate-100">
        {/* Modal Header */}
        <div className="flex items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Running a Sora-Style Video App: A Vibe Coder&apos;s Guide
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Start small with Hosted APIs or 1 rented GPU · Single Docker container on Ubuntu CUDA · External S3/R2 storage · FastAPI /generate &amp; VRAM telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Navigation Bar */}
        <div className="flex items-center gap-1 px-6 py-2.5 border-b border-slate-800 bg-slate-900/50 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            01. Vibe Coder&apos;s Architecture Guide
          </button>
          <button
            onClick={() => setActiveTab('vram_storage')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'vram_storage'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            02. GPU Memory (VRAM) &amp; S3/R2 Calculator
          </button>
          <button
            onClick={() => setActiveTab('docker_fastapi')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'docker_fastapi'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            03. Prompts to Try: Docker &amp; FastAPI Stack
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'sandbox'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            04. Live /generate &amp; /health Endpoint Sandbox
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ARCHITECTURE GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-3xl">
                  <h3 className="text-sm font-semibold text-white">
                    You don&apos;t need to be a systems engineer to build an AI video app
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tools like Claude Code, Cursor, and Lovable can write most of the code from plain-English prompts. The environment your code runs in still matters—here is what to know and what to ask your AI to handle.
                  </p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
                  <button
                    onClick={() => setApproach('hosted_api')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      approach === 'hosted_api'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Path A: Hosted API
                  </button>
                  <button
                    onClick={() => setApproach('single_gpu_open_source')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      approach === 'single_gpu_open_source'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Path B: 1 Rented GPU
                  </button>
                </div>
              </div>

              {/* Path Comparison View */}
              {approach === 'hosted_api' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">
                      Path A: Call a Hosted Video API (Pay Per Clip, Zero GPU Management)
                    </h4>
                    <span className="text-xs text-slate-400">
                      Runway · Luma · Google Veo
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {HOSTED_VIDEO_API_OPTIONS.map((api) => (
                      <div
                        key={api.id}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{api.name}</span>
                          <span className="text-xs font-mono tabular-nums text-cyan-400">
                            ${api.costPerClipUsd.toFixed(2)} / clip
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          <span>{api.provider}</span>
                          <span className="mx-1.5">·</span>
                          <span className="font-mono tabular-nums">~{api.avgLatencySec}s</span>
                          <span className="mx-1.5">·</span>
                          <span>{api.maxResolution}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                          {api.bestFor}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">
                      Path B: Run Open-Source Models (Wan / CogVideoX) on a Single Rented GPU
                    </h4>
                    <button
                      onClick={() => setActiveTab('vram_storage')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      Open Interactive VRAM Advisor →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {OPEN_SOURCE_VIDEO_MODELS.slice(0, 3).map((model) => (
                      <div
                        key={model.id}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{model.name}</span>
                          <span className="text-xs font-mono tabular-nums text-emerald-400">
                            {model.recommendedGpuTier} GPU
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono tabular-nums">
                          <span>Native: {model.minVramGbNative} GB</span>
                          <span className="mx-1.5">·</span>
                          <span>With Offload: {model.minVramGbWithOffload} GB</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                          {model.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* The 6 Core Vibe Coder Principles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {VIBE_CODER_GUIDE_SECTIONS.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {sec.stepNumber}. {sec.title}
                      </h4>
                    </div>
                    <p className="text-xs font-medium text-cyan-300">{sec.takeaway}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{sec.description}</p>
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                      <div className="text-emerald-300">
                        <span className="font-semibold text-white">Ask AI to do: </span>
                        {sec.doThis}
                      </div>
                      <div className="text-slate-400">
                        <span className="font-semibold text-slate-300">What to skip: </span>
                        {sec.skipThis}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span>
                  Note: OpenAI hasn&apos;t published Sora&apos;s internal infrastructure, so the guidelines above reflect proven industry practice for single-GPU and API-backed video apps.
                </span>
                <button
                  onClick={() => setActiveTab('docker_fastapi')}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shrink-0 transition-colors"
                >
                  Try the Prompts &amp; Generate Dockerfile
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VRAM & STORAGE CALCULATOR */}
          {activeTab === 'vram_storage' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Watch Your GPU Memory (VRAM) */}
                <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      01. Watch Your GPU Memory (VRAM) &amp; Hourly GPU Selector
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Check the model card before choosing hardware. Smaller or quantized versions fit on 24 GB cards; larger models need 40–80 GB or CPU model offloading.
                    </p>
                  </div>

                  {/* Select Open-Source Video Model */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Select Open-Source Video Model Card
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {OPEN_SOURCE_VIDEO_MODELS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedModelId(m.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selectedModelId === m.id
                              ? 'bg-cyan-950/50 border-cyan-500/60 text-white'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold">{m.name}</span>
                            <span className="text-[11px] font-mono tabular-nums text-cyan-400">
                              {m.precision}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-1">
                            Native: {m.minVramGbNative} GB · Offload: {m.minVramGbWithOffload} GB
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Hourly Rented GPU Instance */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Rent a Single GPU by the Hour (RunPod, Lambda, AWS, GCP, Azure)
                    </label>
                    <select
                      value={selectedGpuInstanceId}
                      onChange={(e) => setSelectedGpuInstanceId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {RENTED_GPU_INSTANCES.map((gpu) => (
                        <option key={gpu.id} value={gpu.id}>
                          {gpu.providerName} — {gpu.gpuName} ({gpu.vramGb} GB VRAM) · ${gpu.hourlyRateUsd.toFixed(2)}/hr
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>OS: {selectedGpu.osImage}</span>
                      <span>·</span>
                      <span>{selectedGpu.networkingNote}</span>
                    </div>
                  </div>

                  {/* Model Offloading Toggle */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Enable Model CPU Offloading (`pipe.enable_model_cpu_offload()`)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Streams inactive sub-modules to system RAM so larger models fit onto 24 GB or 40 GB GPUs before you pay to upgrade hardware.
                      </div>
                    </div>
                    <button
                      onClick={() => setEnableCpuOffload(!enableCpuOffload)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                        enableCpuOffload
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {enableCpuOffload ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {/* Live VRAM Diagnostic Banner */}
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      vramEval.fitsInVram
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        {vramEval.fitsInVram ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>
                          {vramEval.status === 'optimal'
                            ? 'Fits Natively in GPU Memory'
                            : vramEval.status === 'fits_with_offload'
                            ? 'Fits with CPU Model Offloading'
                            : 'VRAM Exceeded — Action Recommended'}
                        </span>
                      </div>
                      <span className="text-xs font-mono tabular-nums font-bold">
                        Required: {vramEval.effectiveVramRequiredGb} GB / Available: {vramEval.gpuVramGb} GB
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{vramEval.recommendation}</p>
                    {!vramEval.fitsInVram && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {!enableCpuOffload && (
                          <button
                            onClick={() => setEnableCpuOffload(true)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                          >
                            Enable Model Offloading
                          </button>
                        )}
                        {vramEval.suggestedAlternativeModelId && (
                          <button
                            onClick={() =>
                              setSelectedModelId(vramEval.suggestedAlternativeModelId!)
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                          >
                            Switch to Smaller / Quantized Model
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Store Video Outside the GPU Machine (S3 vs R2) */}
                <div className="lg:col-span-5 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-cyan-400" />
                      02. Store Video Outside the GPU Machine
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Rented GPU disks are temporary and expensive. Upload MP4s to Amazon S3 or Cloudflare R2 and serve through a CDN.
                    </p>
                  </div>

                  {/* Storage Provider Switch */}
                  <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                    <button
                      onClick={() => setStorageProvider('cloudflare_r2')}
                      className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-colors ${
                        storageProvider === 'cloudflare_r2'
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Cloudflare R2 + CDN ($0 Egress)
                    </button>
                    <button
                      onClick={() => setStorageProvider('aws_s3')}
                      className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-colors ${
                        storageProvider === 'aws_s3'
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Amazon S3 + CloudFront
                    </button>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Generated Clips per Month</span>
                        <span className="font-mono tabular-nums text-cyan-400 font-bold">
                          {clipsPerMonth.toLocaleString()} clips
                        </span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={10000}
                        step={50}
                        value={clipsPerMonth}
                        onChange={(e) => setClipsPerMonth(Number(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Average MP4 Clip Size</span>
                        <span className="font-mono tabular-nums text-cyan-400 font-bold">
                          {avgClipSizeMb} MB
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={150}
                        step={5}
                        value={avgClipSizeMb}
                        onChange={(e) => setAvgClipSizeMb(Number(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Cost Breakdown Table */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Monthly Video Volume</span>
                      <span className="font-mono tabular-nums text-white font-semibold">
                        {storageEstimate.totalStorageGb} GB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CDN Playback Bandwidth (12x views)</span>
                      <span className="font-mono tabular-nums text-white font-semibold">
                        {storageEstimate.estimatedBandwidthGb} GB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Object Storage Cost</span>
                      <span className="font-mono tabular-nums text-slate-200">
                        ${storageEstimate.monthlyStorageUsd.toFixed(2)} / mo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CDN Egress Cost</span>
                      <span className="font-mono tabular-nums text-emerald-400">
                        ${storageEstimate.monthlyEgressUsd.toFixed(2)} / mo
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
                      <span className="text-white">External Storage Total</span>
                      <span className="font-mono tabular-nums text-cyan-400">
                        ${storageEstimate.monthlyTotalUsd.toFixed(2)} / mo
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>vs. Rented GPU Persistent NVMe Disk</span>
                      <span className="font-mono tabular-nums line-through">
                        ${storageEstimate.gpuDiskComparisonUsd.toFixed(2)} / mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROMPTS TO TRY & DOCKER / FASTAPI GENERATOR */}
          {activeTab === 'docker_fastapi' && (
            <div className="space-y-6">
              {/* Prompts to Try Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Step 1: Initial Vibe Coding Prompt
                    </span>
                    <button
                      onClick={() =>
                        handleCopyText('initial_prompt', VIBE_PROMPTS_TO_TRY.initialPrompt)
                      }
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copiedId === 'initial_prompt' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedId === 'initial_prompt' ? 'Copied' : 'Copy Prompt'}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-cyan-200 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    &ldquo;{VIBE_PROMPTS_TO_TRY.initialPrompt}&rdquo;
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Step 2: Follow-Up Observability Prompt
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setIncludeHealthAndVramLogs(!includeHealthAndVramLogs)
                        }
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                          includeHealthAndVramLogs
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {includeHealthAndVramLogs ? 'Applied to Code' : 'Apply Follow-Up'}
                      </button>
                      <button
                        onClick={() =>
                          handleCopyText('followup_prompt', VIBE_PROMPTS_TO_TRY.followUpPrompt)
                        }
                        className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
                      >
                        {copiedId === 'followup_prompt' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedId === 'followup_prompt' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-emerald-200 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    &ldquo;{VIBE_PROMPTS_TO_TRY.followUpPrompt}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Adds `GET /health` with `torch.cuda` telemetry and logs peak/reserved GPU memory for every `/generate` job.
                  </p>
                </div>
              </div>

              {/* Generated Artifacts Viewer */}
              <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/60">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveCodeFile('dockerfile')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        activeCodeFile === 'dockerfile'
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Dockerfile (Ubuntu CUDA + Python 3.11)
                    </button>
                    <button
                      onClick={() => setActiveCodeFile('fastapi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        activeCodeFile === 'fastapi'
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      app.py (FastAPI /generate + S3 + /health)
                    </button>
                    <button
                      onClick={() => setActiveCodeFile('deploy_sh')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        activeCodeFile === 'deploy_sh'
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      deploy-single-gpu.sh
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const content =
                          activeCodeFile === 'dockerfile'
                            ? dockerfileCode
                            : activeCodeFile === 'fastapi'
                            ? fastApiCode
                            : deployScriptCode;
                        handleCopyText('code_artifact', content);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedId === 'code_artifact' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedId === 'code_artifact' ? 'Copied!' : 'Copy Code'}
                    </button>
                    <button
                      onClick={() => {
                        const filename =
                          activeCodeFile === 'dockerfile'
                            ? 'Dockerfile'
                            : activeCodeFile === 'fastapi'
                            ? 'app.py'
                            : 'deploy-single-gpu.sh';
                        const content =
                          activeCodeFile === 'dockerfile'
                            ? dockerfileCode
                            : activeCodeFile === 'fastapi'
                            ? fastApiCode
                            : deployScriptCode;
                        handleDownloadFile(filename, content);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download File
                    </button>
                  </div>
                </div>

                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-96 leading-relaxed bg-slate-950">
                  {activeCodeFile === 'dockerfile'
                    ? dockerfileCode
                    : activeCodeFile === 'fastapi'
                    ? fastApiCode
                    : deployScriptCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE /GENERATE & /HEALTH SANDBOX */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Test POST /generate & GET /health */}
                <div className="lg:col-span-5 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      Test FastAPI Endpoints (`POST /generate` &amp; `GET /health`)
                    </h3>
                    <span className="text-xs font-mono tabular-nums text-cyan-400">
                      Timeout: 300s (5m)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Video Prompt (`POST /generate`)
                    </label>
                    <textarea
                      rows={3}
                      value={sandboxPrompt}
                      onChange={(e) => setSandboxPrompt(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Describe the video clip to generate..."
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs text-slate-400 font-mono tabular-nums">
                    <div>Model: {vramEval.model.name}</div>
                    <div>GPU: {selectedGpu.gpuName} ({selectedGpu.vramGb} GB VRAM)</div>
                    <div>CPU Offload: {enableCpuOffload ? 'Active' : 'Off'}</div>
                    <div>Bucket: s3://{bucketName}/renders/</div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleRunGenerateEndpoint}
                      disabled={isRunningGenerate}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isRunningGenerate
                        ? 'Running /generate & S3 Upload...'
                        : 'Run POST /generate'}
                    </button>
                    <button
                      onClick={handleCheckHealth}
                      disabled={isRunningHealth}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      GET /health
                    </button>
                  </div>

                  {healthResponse && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400">
                          GET /health — 200 OK
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {healthResponse.gpu_memory?.device_name}
                        </span>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto">
                        {JSON.stringify(healthResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Right: Per-Job GPU Memory Telemetry & S3/R2 Links */}
                <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Per-Job GPU Memory Logs &amp; S3/R2 Output Links
                      </h3>
                      <p className="text-xs text-slate-400">
                        Logs `torch.cuda.max_memory_allocated()` and object storage CDN URLs for every `/generate` call.
                      </p>
                    </div>
                    <Cloud className="w-4 h-4 text-cyan-400" />
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="p-3">Job ID &amp; Prompt</th>
                          <th className="p-3">Peak VRAM</th>
                          <th className="p-3">Reserved</th>
                          <th className="p-3">Elapsed</th>
                          <th className="p-3">S3 / R2 CDN Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {jobLogs.map((job) => (
                          <tr key={job.jobId} className="bg-slate-900/50">
                            <td className="p-3 max-w-[210px]">
                              <div className="font-mono text-[11px] text-cyan-400 font-semibold">
                                {job.jobId}
                              </div>
                              <div className="text-slate-300 truncate" title={job.prompt}>
                                {job.prompt}
                              </div>
                            </td>
                            <td className="p-3 font-mono tabular-nums text-emerald-400">
                              {job.peakVramMb.toLocaleString()} MB
                            </td>
                            <td className="p-3 font-mono tabular-nums text-slate-300">
                              {job.reservedVramMb.toLocaleString()} MB
                            </td>
                            <td className="p-3 font-mono tabular-nums text-slate-300">
                              {job.durationSec}s / {job.timeoutLimitSec}s
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleCopyText(job.jobId, job.mp4Url)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[11px] flex items-center gap-1.5"
                                title={job.mp4Url}
                              >
                                {copiedId === job.jobId ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <ExternalLink className="w-3 h-3" />
                                )}
                                {copiedId === job.jobId ? 'Copied URL' : job.s3ObjectKey}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Single-Container Ubuntu CUDA + Python 3.11 + PyTorch + FastAPI `/generate` (5m timeout) + `/health` + S3/R2 Upload
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
