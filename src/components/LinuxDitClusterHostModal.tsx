import React, { useState } from 'react';
import {
  X,
  Server,
  Cpu,
  HardDrive,
  Network,
  Terminal,
  Copy,
  Check,
  Download,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Layers,
  Activity,
} from 'lucide-react';
import {
  LINUX_HOST_DISTRO_CATALOG,
  GPU_HARDWARE_STACK_CATALOG,
  PARALLEL_FILESYSTEM_CATALOG,
  TECHNICAL_CLARIFICATION_NOTES,
  DEFAULT_LINUX_DIT_CLUSTER_CONFIG,
  LinuxDitClusterConfig,
  LinuxDistroId,
  GpuHardwareId,
  ClusterOrchestratorId,
  RdmaFabricId,
  ParallelFilesystemId,
  HugePageSizeOption,
  calculateHugePagesSpec,
  evaluateLinuxDitCluster,
  generateLinuxHostBootstrapScript,
  generateKubernetesDitManifest,
  generateMultiNodeSchedulerScript,
} from '../utils/linuxDitClusterEngine';

interface LinuxDitClusterHostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinuxDitClusterHostModal: React.FC<LinuxDitClusterHostModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [config, setConfig] = useState<LinuxDitClusterConfig>(
    DEFAULT_LINUX_DIT_CLUSTER_CONFIG
  );
  const [activeTab, setActiveTab] = useState<
    'architecture' | 'storage_memory' | 'manifests'
  >('architecture');
  const [activeArtifact, setActiveArtifact] = useState<
    'host_bootstrap' | 'k8s_sriov_gds' | 'slurm_ray_job'
  >('host_bootstrap');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedDistro =
    LINUX_HOST_DISTRO_CATALOG.find((d) => d.id === config.distroId) ||
    LINUX_HOST_DISTRO_CATALOG[0];
  const selectedGpu =
    GPU_HARDWARE_STACK_CATALOG.find((g) => g.id === config.gpuHardwareId) ||
    GPU_HARDWARE_STACK_CATALOG[0];
  const selectedFs =
    PARALLEL_FILESYSTEM_CATALOG.find((f) => f.id === config.parallelFsId) ||
    PARALLEL_FILESYSTEM_CATALOG[0];

  const hugePagesSpec = calculateHugePagesSpec(
    config.ditModelParametersBillions,
    config.systemRamPerNodeGb,
    config.hugePageSize
  );
  const evaluation = evaluateLinuxDitCluster(config);

  const hostBootstrapCode = generateLinuxHostBootstrapScript(config);
  const k8sManifestCode = generateKubernetesDitManifest(config);
  const schedulerCode = generateMultiNodeSchedulerScript(config);

  const currentCode =
    activeArtifact === 'host_bootstrap'
      ? hostBootstrapCode
      : activeArtifact === 'k8s_sriov_gds'
      ? k8sManifestCode
      : schedulerCode;

  const currentFilename =
    activeArtifact === 'host_bootstrap'
      ? 'provision-linux-dit-host.sh'
      : activeArtifact === 'k8s_sriov_gds'
      ? 'k8s-dit-sriov-gds-cluster.yaml'
      : config.orchestratorId === 'kubernetes_slurm'
      ? 'submit-dit-multinode.sbatch'
      : 'ray-dit-cluster-job.py';

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80 flex items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Target Environment: Linux Host for a Text-to-Video AI Model (DiT Cluster)
              </h2>
              <span className="text-xs font-mono text-emerald-400 border-l border-slate-700 pl-2">
                {evaluation.totalNodes} Nodes · {evaluation.totalGpus} GPUs · {evaluation.aggregateHbmTb} TB HBM
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-thousand-GPU Diffusion Transformer (DiT) Linux host coordinator: Kubernetes + Slurm/Ray, InfiniBand/RoCE RDMA + SR-IOV, Lustre/GPFS/WekaFS + GPUDirect Storage, HugePages, and zero-swap minimal Linux.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
            title="Close Linux Host DiT Workbench"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs + Live Cluster Telemetry Summary */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>1. OS, GPU &amp; RDMA Fabric</span>
            </button>

            <button
              onClick={() => setActiveTab('storage_memory')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'storage_memory'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>2. Parallel Storage (GDS), HugePages &amp; Audit</span>
            </button>

            <button
              onClick={() => setActiveTab('manifests')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'manifests'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>3. Linux Host Scripts, K8s SR-IOV &amp; Slurm/Ray</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500">RDMA: </span>
              <span className="text-cyan-300 font-bold">
                {evaluation.interNodeRdmaBandwidthGbps} Gbps ({evaluation.rdmaOneWayLatencyUs} µs)
              </span>
            </div>
            <div>
              <span className="text-slate-500">GDS Read: </span>
              <span className="text-emerald-400 font-bold">
                {evaluation.gdsDatasetThroughputGbPerSec} GB/s
              </span>
            </div>
            <div>
              <span className="text-slate-500">GPU Util: </span>
              <span className="text-amber-300 font-bold">
                {evaluation.effectiveGpuComputeUtilizationPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              {/* Top Configuration Controls Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Pillar 5 & Recommended OS Selector */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Linux Host Distribution
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedDistro.footprintRamMb} MB RAM
                    </span>
                  </div>

                  <select
                    value={config.distroId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        distroId: e.target.value as LinuxDistroId,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <optgroup label="Recommended HPC-Tuned Linux">
                      {LINUX_HOST_DISTRO_CATALOG.filter(
                        (d) => d.category === 'hpc_tuned_distro'
                      ).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Immutable Minimal Linux (Zero Bloat)">
                      {LINUX_HOST_DISTRO_CATALOG.filter(
                        (d) => d.category === 'immutable_minimal_distro'
                      ).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div className="font-mono text-cyan-300">{selectedDistro.kernelProfile}</div>
                    <p className="text-slate-400 leading-relaxed">{selectedDistro.summary}</p>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-200 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.excludeGuiAndDaemons}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          excludeGuiAndDaemons: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                    />
                    <span>Exclude GUIs &amp; unnecessary daemons (multi-user.target)</span>
                  </label>
                </div>

                {/* Pillar 1: GPU Hardware, Drivers & Cluster Orchestrator */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      1. GPU Cluster Orchestration
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedGpu.vendor} · {selectedGpu.hbmPerGpuGb} GB/GPU
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] text-slate-400">
                      GPU Hardware &amp; Low-Latency Driver / Compute Stack
                    </label>
                    <select
                      value={config.gpuHardwareId}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          gpuHardwareId: e.target.value as GpuHardwareId,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      {GPU_HARDWARE_STACK_CATALOG.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.modelName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Cluster Size (GPUs)
                      </label>
                      <select
                        value={config.totalGpus}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            totalGpus: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      >
                        {[256, 512, 1024, 2048, 4096, 8192].map((count) => (
                          <option key={count} value={count}>
                            {count.toLocaleString()} GPUs ({count / 8} Nodes)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Multi-Node Scheduler
                      </label>
                      <select
                        value={config.orchestratorId}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            orchestratorId: e.target.value as ClusterOrchestratorId,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      >
                        <option value="kubernetes_slurm">Kubernetes + Slurm</option>
                        <option value="kubernetes_ray">Kubernetes + Ray</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-200">Driver Stack:</strong>{' '}
                    {selectedGpu.driverOrComputeStack}. {selectedGpu.architectureNote}
                  </p>
                </div>

                {/* Pillar 2: High-Speed Networking (RDMA + SR-IOV) */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      2. High-Speed Networking
                    </span>
                    <span className="text-[11px] font-mono text-cyan-300">
                      GPUDirect RDMA
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] text-slate-400">
                      Inter-Node RDMA Fabric (Zero CPU Bounce)
                    </label>
                    <select
                      value={config.rdmaFabricId}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          rdmaFabricId: e.target.value as RdmaFabricId,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="infiniband_ndr_400g">
                        RDMA over InfiniBand (NVIDIA Quantum-2 NDR 400Gb/s)
                      </option>
                      <option value="rocev2_400g">
                        RoCEv2 (RDMA over Converged Ethernet 400Gb/s Lossless)
                      </option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableSriov}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            enableSriov: e.target.checked,
                          }))
                        }
                        className="rounded border-slate-700 bg-slate-950 text-cyan-500"
                      />
                      <span>Enable SR-IOV Near-Native NIC Access</span>
                    </label>

                    <select
                      value={config.sriovVfsPerNic}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          sriovVfsPerNic: Number(e.target.value),
                        }))
                      }
                      disabled={!config.enableSriov}
                      className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-cyan-300 font-mono"
                    >
                      {[4, 8, 16].map((vfs) => (
                        <option key={vfs} value={vfs}>
                          {vfs} VFs/NIC
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    GPUs on different servers read and write each other&apos;s HBM directly via{' '}
                    <code className="text-cyan-300 font-mono">nvidia-peermem</code> /{' '}
                    <code className="text-cyan-300 font-mono">mlx5_ib</code> without going through the CPU.
                  </p>
                </div>
              </div>

              {/* Technical Clarifications & Architecture Notes */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Architectural Clarifications &amp; Provenance</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {TECHNICAL_CLARIFICATION_NOTES.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800/90 space-y-1"
                    >
                      <div className="text-xs font-semibold text-white">{note.topic}</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {note.clarification}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'storage_memory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pillar 3: Fast Parallel Storage + GPUDirect Storage */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      3. Fast Storage &amp; GPUDirect Storage (GDS)
                    </span>
                    <span className="text-xs font-mono text-emerald-300">
                      {evaluation.gdsDatasetThroughputGbPerSec} GB/s Sustained
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] text-slate-400">
                      Parallel File System Client (Never Local Disk Alone)
                    </label>
                    <select
                      value={config.parallelFsId}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          parallelFsId: e.target.value as ParallelFilesystemId,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      {PARALLEL_FILESYSTEM_CATALOG.map((fs) => (
                        <option key={fs.id} value={fs.id}>
                          {fs.name} ({fs.mountPoint}) — {fs.sustainedReadBandwidthGbPerSec} GB/s
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={config.enableGpuDirectStorage}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          enableGpuDirectStorage: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                    />
                    <span>
                      Enable GPUDirect Storage (<code className="font-mono text-emerald-300">nvidia-fs</code> / <code className="font-mono text-emerald-300">cuFile</code> DMA straight from NVMe to GPU HBM)
                    </span>
                  </label>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="font-mono text-emerald-400">
                      Mount: {selectedFs.mountPoint} ({selectedFs.fsType})
                    </div>
                    <p className="text-slate-400">{selectedFs.videoDatasetAdvantage}</p>
                  </div>
                </div>

                {/* Pillar 4: Memory Management (HugePages + Zero Swap) */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      4. Memory Management (HugePages &amp; Zero Swap)
                    </span>
                    <span className="text-xs font-mono text-amber-300">
                      {hugePagesSpec.tlbEntriesReductionFactor.toLocaleString()}x Fewer TLB Lookups
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        HugePage Size
                      </label>
                      <select
                        value={config.hugePageSize}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            hugePageSize: e.target.value as HugePageSizeOption,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      >
                        <option value="1GB">1 GB Pages</option>
                        <option value="2MB">2 MB Pages</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        DiT Model Size
                      </label>
                      <select
                        value={config.ditModelParametersBillions}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            ditModelParametersBillions: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      >
                        {[14, 32, 70, 140].map((b) => (
                          <option key={b} value={b}>
                            {b}B Params
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Node System RAM
                      </label>
                      <select
                        value={config.systemRamPerNodeGb}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            systemRamPerNodeGb: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      >
                        {[1024, 2048, 4096].map((ram) => (
                          <option key={ram} value={ram}>
                            {ram} GB / Node
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={config.disableSwap}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          disableSwap: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-700 bg-slate-950 text-amber-500"
                    />
                    <span>
                      Prevent swapping to disk (<code className="font-mono text-amber-300">swapoff -a</code>, <code className="font-mono text-amber-300">vm.swappiness=0</code>)
                    </span>
                  </label>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                    <div>
                      Pool: {hugePagesSpec.recommendedHugePagesPoolGb} GB ({hugePagesSpec.numberOfPagesPerNode.toLocaleString()} × {hugePagesSpec.pageSize} pages vs {hugePagesSpec.standard4kPagesEquivalent.toLocaleString()} × 4KB pages)
                    </div>
                    <div className="text-cyan-300 truncate">{hugePagesSpec.kernelBootArgs}</div>
                  </div>
                </div>
              </div>

              {/* 5-Pillar Readiness Audit Table */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>5-Pillar Linux DiT Host Readiness Audit</span>
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      evaluation.allAuditChecksPassed ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {evaluation.allAuditChecksPassed
                      ? 'ALL 5 MANDATORY HPC CHECKS PASSED'
                      : 'ACTION REQUIRED ON HOST CONFIG'}
                  </span>
                </div>

                <div className="divide-y divide-slate-800">
                  {evaluation.auditItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          {item.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <span className="font-bold text-slate-200">{item.pillar}:</span>
                          <span className="text-slate-300">{item.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 pl-6">{item.detail}</p>
                        {item.remediation && (
                          <p className="text-[11px] text-amber-300 pl-6">
                            Fix: {item.remediation}
                          </p>
                        )}
                      </div>
                      <span
                        className={`font-mono text-[11px] shrink-0 ${
                          item.passed ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {item.passed ? 'PASS' : 'WARN'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manifests' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setActiveArtifact('host_bootstrap')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeArtifact === 'host_bootstrap'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    1. Linux Host Bootstrap &amp; Kernel Tuning (.sh)
                  </button>

                  <button
                    onClick={() => setActiveArtifact('k8s_sriov_gds')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeArtifact === 'k8s_sriov_gds'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    2. Kubernetes + SR-IOV + GDS + HugePages (.yaml)
                  </button>

                  <button
                    onClick={() => setActiveArtifact('slurm_ray_job')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeArtifact === 'slurm_ray_job'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    3. Multi-Node{' '}
                    {config.orchestratorId === 'kubernetes_slurm'
                      ? 'Slurm Job (sbatch)'
                      : 'Ray Distributed Trainer (.py)'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(activeArtifact, currentCode)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === activeArtifact ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === activeArtifact ? 'Copied!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={() => handleDownload(currentFilename, currentCode)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {currentFilename}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[52vh]">
                <pre className="leading-relaxed">{currentCode}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 font-mono">
            Linux-Only Target · {selectedDistro.name} · {selectedFs.name} ({selectedFs.mountPoint}) · HugePages={config.hugePageSize} · Swap=0
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
