import React, { useState } from 'react';
import {
  X,
  Code,
  Cpu,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Terminal,
  Layers,
  Zap,
  ShieldCheck,
  Activity,
  GitBranch,
  FileCode,
  Sliders,
} from 'lucide-react';
import {
  TINY_DIT_CONFIG,
  PRODUCTION_OPTIMIZED_DIT_CONFIG,
  DitConfigInput,
  DitQuantizationMode,
  SpatialCompressionRatio,
  PyTorchDitSpecFileId,
  DIT_BUILD_ORDER_STEPS,
  PYTORCH_DIT_SPEC_FILES,
  calculateDitInferenceSpec,
  runDitAcceptanceTestSuite,
  getPyTorchDitSpecFileById,
} from '../utils/pytorchDitBuildSpecEngine';
import { triggerBrowserDownload } from '../utils/sharedCoreEngine';

interface PyTorchDitBuildSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PyTorchDitBuildSpecModal: React.FC<PyTorchDitBuildSpecModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'acceptance' | 'modules'>('simulator');
  const [config, setConfig] = useState<DitConfigInput>(TINY_DIT_CONFIG);
  const [selectedFileId, setSelectedFileId] = useState<PyTorchDitSpecFileId>('vae.py');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const report = calculateDitInferenceSpec(config);
  const acceptanceTests = runDitAcceptanceTestSuite(config);
  const activeFile = getPyTorchDitSpecFileById(selectedFileId);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerBrowserDownload(blob, filename.replace('/', '_'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-6xl w-full overflow-hidden shadow-2xl my-4 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Build Spec: Text-to-Video Diffusion Transformer (Optimized Inference)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-md">
                  PyTorch 2.x + Triton • CLAUDE.md / AGENTS.md
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Causal 3D VAE • 1×2×2 Patch Tokenizer • Spatial/Temporal DiT + adaLN • SDPA/FlashAttention • T5-XXL • Per-Channel FP8 (E4M3)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Close PyTorch DiT Build Spec"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'simulator'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            1. Latent &amp; Attention Simulator ([B, T, H, W, C])
          </button>
          <button
            onClick={() => setActiveTab('acceptance')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'acceptance'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            2. Acceptance Tests &amp; 7-Step Build Order
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'modules'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            3. PyTorch 2.x Modules (vae.py, dit.py, pipeline.py, bench.py)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'simulator' && (
            <div className="space-y-5">
              {/* Preset Switcher Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Build Order Configuration Presets:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setConfig(TINY_DIT_CONFIG)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      config.frames === 8 && config.height === 64
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    Step 1 Tiny Config (8f @ 64×64 • BF16)
                  </button>
                  <button
                    onClick={() => setConfig(PRODUCTION_OPTIMIZED_DIT_CONFIG)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      config.frames === 32 && config.height === 512
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    Step 5 Optimized Config (32f @ 512×512 • FP8 E4M3 + 2:4 Sparse)
                  </button>
                </div>
              </div>

              {/* Interactive Controls + Live Tensor Pipeline */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Config Controls (5 cols) */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" />
                    Inference Hyperparameters
                  </h4>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Frames (T)
                      </label>
                      <select
                        value={config.frames}
                        onChange={(e) => setConfig({ ...config, frames: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      >
                        <option value={8}>8 frames</option>
                        <option value={16}>16 frames</option>
                        <option value={32}>32 frames</option>
                        <option value={64}>64 frames</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Height / Width
                      </label>
                      <select
                        value={config.height}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setConfig({ ...config, height: v, width: v });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      >
                        <option value={64}>64×64 (Tiny)</option>
                        <option value={128}>128×128</option>
                        <option value={256}>256×256</option>
                        <option value={512}>512×512</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        VAE Spatial Ratio
                      </label>
                      <select
                        value={config.spatialCompression}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            spatialCompression: Number(e.target.value) as SpatialCompressionRatio,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      >
                        <option value={8}>8x Spatial (Default)</option>
                        <option value={16}>16x Spatial (Optional)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Quantization
                      </label>
                      <select
                        value={config.quantization}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            quantization: e.target.value as DitQuantizationMode,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      >
                        <option value="BF16">BF16 Baseline</option>
                        <option value="FP8_E4M3">FP8 (E4M3)</option>
                        <option value="INT8">INT8 Fallback</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Denoise Steps
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={config.steps}
                        onChange={(e) =>
                          setConfig({ ...config, steps: Math.max(1, Number(e.target.value) || 10) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        GPUs (Step 7)
                      </label>
                      <select
                        value={config.gpuCount}
                        onChange={(e) => setConfig({ ...config, gpuCount: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      >
                        <option value={1}>1 GPU (Start Small)</option>
                        <option value={2}>2 GPUs (Seq Parallel)</option>
                        <option value={4}>4 GPUs (SP + TP)</option>
                        <option value={8}>8 GPUs (Full Node)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-1 space-y-2">
                    <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <span>Fuse RMSNorm, SwiGLU &amp; Residual (`torch.compile` / Triton)</span>
                      <input
                        type="checkbox"
                        checked={config.useFusedTritonKernels}
                        onChange={(e) =>
                          setConfig({ ...config, useFusedTritonKernels: e.target.checked })
                        }
                        className="rounded accent-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <span>Enable 2:4 Structured Sparsity (After Dense Baseline)</span>
                      <input
                        type="checkbox"
                        checked={config.use2to4Sparsity}
                        onChange={(e) =>
                          setConfig({ ...config, use2to4Sparsity: e.target.checked })
                        }
                        className="rounded accent-indigo-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Right Column: Live Tensor Shape & Complexity Output (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Shape Progression Cards */}
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        Canonical Tensor Shape Trace (`[B, T, H, W, C]` Rule)
                      </h4>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        decode(encode(x)).shape == x.shape ✓
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          1. Input / Decoded Video
                        </div>
                        <div className="text-sm font-mono font-black text-white mt-1">
                          [{report.inputVideoShapeBTHWC.join(', ')}]
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          Conv3d: [{report.inputVideoShapeBCTHW.join(', ')}]
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/30">
                        <div className="text-[10px] font-bold uppercase text-indigo-300">
                          2. Causal 3D VAE Latent
                        </div>
                        <div className="text-sm font-mono font-black text-indigo-200 mt-1">
                          [{report.latentShapeBTHWC.join(', ')}]
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          8x Temporal • {config.spatialCompression}x Spatial
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/30">
                        <div className="text-[10px] font-bold uppercase text-purple-300">
                          3. Patch Tokens (1×2×2)
                        </div>
                        <div className="text-sm font-mono font-black text-purple-200 mt-1">
                          [{config.batchSize}, {report.totalPatchTokens}, {config.hiddenDim}]
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Grid (T_p,H_p,W_p): [{report.patchGridTHW.join('×')}]
                        </div>
                      </div>
                    </div>

                    {/* Attention Factorization Savings */}
                    <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-indigo-200">
                          Alternating Spatial ({report.spatialTokensPerFrame} tok/frame) + Temporal ({report.temporalTokensPerLocation} frames/loc) Attention
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          Factorized pairs/head: {report.factorizedAttentionPairsPerHead.toLocaleString()} vs Forbidden Full N×N: {report.fullAttentionPairsPerHead.toLocaleString()}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-black">
                        {report.attentionMemorySavingsRatio}x Fewer Attention Ops
                      </span>
                    </div>
                  </div>

                  {/* Mixed-Precision BF16 Guardrails & Telemetry */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        Modules Strictly Preserved in BF16
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-300 font-mono">
                        {report.bf16ProtectedModules.map((mod) => (
                          <li key={mod} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {mod}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <Activity className="w-4 h-4" />
                        Simulated `bench.py` Output
                      </div>
                      <div className="grid grid-cols-3 gap-2 my-2">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Latency</div>
                          <div className="text-xs font-mono font-black text-white">
                            {report.estimatedLatencyMs} ms
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Throughput</div>
                          <div className="text-xs font-mono font-black text-cyan-300">
                            {report.estimatedTokensPerSec.toLocaleString()} tok/s
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Peak VRAM</div>
                          <div className="text-xs font-mono font-black text-amber-300">
                            {report.estimatedPeakVramMb} MB
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Text Encoder: {config.textEncoder}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'acceptance' && (
            <div className="space-y-5">
              {/* 5 Acceptance Tests */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Automated Acceptance Test Suite (`tests/thresholds.py` &amp; `bench.py`)
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {acceptanceTests.map((test) => (
                    <div
                      key={test.id}
                      className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                            PASS
                          </span>
                          <span className="text-xs font-bold text-white">{test.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{test.details}</p>
                      </div>
                      <div className="sm:text-right shrink-0 font-mono">
                        <div className="text-xs font-bold text-cyan-300">{test.measuredValue}</div>
                        <div className="text-[10px] text-slate-500">Spec: {test.thresholdSpec}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Step Build Order with Commit Rules */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4" />
                  7-Step Build Order (Commit After Each Step Passes Tests)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DIT_BUILD_ORDER_STEPS.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-white">{step.title}</span>
                        <div className="flex gap-1">
                          {step.targetFiles.map((f) => (
                            <button
                              key={f}
                              onClick={() => {
                                setSelectedFileId(f);
                                setActiveTab('modules');
                              }}
                              className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-mono"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">{step.summary}</p>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1">
                        <div className="text-cyan-400">$ {step.verificationCommand}</div>
                        <div className="text-emerald-400">$ git commit -m &quot;{step.commitMessage}&quot;</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left File Selector (4 cols) */}
              <div className="lg:col-span-4 space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-slate-400 px-1 mb-2">
                  Select Spec or Python 3.11+ Module
                </div>
                {PYTORCH_DIT_SPEC_FILES.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      selectedFileId === file.id
                        ? 'bg-indigo-600/20 border-indigo-400 text-white'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono font-bold">{file.id}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{file.title}</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-300">
                      {file.category}
                    </span>
                  </button>
                ))}
              </div>

              {/* Right Code Viewer (8 cols) */}
              <div className="lg:col-span-8 space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-white font-mono">{activeFile.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{activeFile.summary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(activeFile.id, activeFile.code)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        {copiedId === activeFile.id ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedId === activeFile.id ? 'Copied!' : `Copy ${activeFile.id}`}
                      </button>
                      <button
                        onClick={() => handleDownloadFile(activeFile.id, activeFile.code)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>
                  </div>

                  {/* Documented Shapes Banner */}
                  <div className="flex flex-wrap gap-1.5">
                    {activeFile.tensorShapesDocumented.map((shapeDoc) => (
                      <span
                        key={shapeDoc}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300"
                      >
                        {shapeDoc}
                      </span>
                    ))}
                  </div>

                  <pre className="p-4 rounded-xl bg-black/90 border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
                    {activeFile.code}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Saved in repo root as <strong className="text-white">/CLAUDE.md</strong> &amp;{' '}
              <strong className="text-white">/AGENTS.md</strong> • Scope: Software Only (Python 3.11+, PyTorch 2.x, Triton)
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Close Spec Workbench
          </button>
        </div>
      </div>
    </div>
  );
};
