/**
 * Target Environment: Linux Host for a Text-to-Video AI Model (Diffusion Transformer / DiT)
 *
 * Implements the complete Linux host & multi-node GPU cluster architecture for large
 * text-to-video Diffusion Transformer (DiT) models running across thousands of GPUs
 * (NVIDIA H100 / B200 or AMD MI300X) acting as a single machine:
 *
 * 1. GPU Cluster Orchestration: Kubernetes + Slurm or Ray, NVIDIA drivers (vGPU / bare-metal) or AMD ROCm
 * 2. High-Speed Networking: RDMA over InfiniBand or RoCE + SR-IOV + GPUDirect RDMA (zero CPU bounce)
 * 3. Fast Storage: Parallel file systems (Lustre, IBM Spectrum Scale / GPFS, WekaFS) + GPUDirect Storage (GDS)
 * 4. Memory Management: HugePages (2 MB or 1 GB pages instead of 4 KB) + strict zero-swap (swapoff -a, vm.swappiness=0)
 * 5. Minimal Footprint & Recommended OS: Immutable minimal Linux (Bottlerocket, RHEL CoreOS, Alpine) or
 *    HPC-tuned Ubuntu Server / RHEL / NVIDIA Base Command OS — zero GUI, zero unnecessary daemons.
 */

import { clampNumber } from './sharedCoreEngine';

export type LinuxDistroId =
  | 'nvidia_base_command_os'
  | 'ubuntu_server_hpc'
  | 'rhel_hpc'
  | 'bottlerocket'
  | 'rhel_coreos'
  | 'alpine_minimal';

export type GpuHardwareId =
  | 'nvidia_b200_sxm'
  | 'nvidia_h100_sxm'
  | 'nvidia_h100_vgpu'
  | 'amd_mi300x_rocm';

export type ClusterOrchestratorId = 'kubernetes_slurm' | 'kubernetes_ray';

export type RdmaFabricId = 'infiniband_ndr_400g' | 'rocev2_400g';

export type ParallelFilesystemId = 'lustre' | 'spectrum_scale_gpfs' | 'wekafs';

export type HugePageSizeOption = '1GB' | '2MB';

export interface LinuxHostDistroSpec {
  id: LinuxDistroId;
  name: string;
  category: 'hpc_tuned_distro' | 'immutable_minimal_distro';
  kernelProfile: string;
  immutableRootFs: boolean;
  guiExcluded: boolean;
  defaultSwapDisabled: boolean;
  preTunedMultiNodeGpu: boolean;
  footprintRamMb: number;
  recommendedFor: string;
  summary: string;
}

export interface GpuHardwareStackSpec {
  id: GpuHardwareId;
  vendor: 'NVIDIA' | 'AMD';
  modelName: string;
  hbmPerGpuGb: number;
  gpusPerNode: number;
  driverOrComputeStack: string;
  accessMode: 'bare_metal_pass_through' | 'vgpu_virtualized' | 'rocm_compute_stack';
  supportsGpuDirectStorage: boolean;
  supportsGpuDirectRdma: boolean;
  intraNodeInterconnect: string;
  architectureNote: string;
}

export interface ParallelFilesystemSpec {
  id: ParallelFilesystemId;
  name: string;
  mountPoint: string;
  fsType: string;
  kernelClientModule: string;
  sustainedReadBandwidthGbPerSec: number;
  supportsGpuDirectStorage: boolean;
  mountOptions: string;
  videoDatasetAdvantage: string;
}

export interface LinuxDitClusterConfig {
  clusterName: string;
  distroId: LinuxDistroId;
  gpuHardwareId: GpuHardwareId;
  totalGpus: number;
  orchestratorId: ClusterOrchestratorId;
  rdmaFabricId: RdmaFabricId;
  enableSriov: boolean;
  sriovVfsPerNic: number;
  parallelFsId: ParallelFilesystemId;
  enableGpuDirectStorage: boolean;
  hugePageSize: HugePageSizeOption;
  ditModelParametersBillions: number;
  systemRamPerNodeGb: number;
  disableSwap: boolean;
  excludeGuiAndDaemons: boolean;
}

export interface HugePagesCalculation {
  pageSize: HugePageSizeOption;
  pageSizeBytes: number;
  standardPageSizeBytes: 4096;
  modelWeightsSizeGb: number;
  recommendedHugePagesPoolGb: number;
  numberOfPagesPerNode: number;
  standard4kPagesEquivalent: number;
  tlbEntriesReductionFactor: number;
  kernelBootArgs: string;
  sysctlDirective: string;
}

export interface ClusterReadinessAuditItem {
  id: string;
  pillar:
    | 'GPU Orchestration'
    | 'High-Speed Networking'
    | 'Fast Storage'
    | 'Memory Management'
    | 'Minimal Footprint & OS';
  title: string;
  passed: boolean;
  detail: string;
  remediation?: string;
}

export interface ClusterPerformanceSimulation {
  totalNodes: number;
  totalGpus: number;
  aggregateHbmTb: number;
  interNodeRdmaBandwidthGbps: number;
  rdmaOneWayLatencyUs: number;
  gdsDatasetThroughputGbPerSec: number;
  cpuStorageBypassActive: boolean;
  hostOsOverheadPercent: number;
  effectiveGpuComputeUtilizationPercent: number;
  allAuditChecksPassed: boolean;
  auditItems: ClusterReadinessAuditItem[];
}

export interface TechnicalClarificationNote {
  id: string;
  topic: string;
  clarification: string;
}

export interface PopularOperatingSystemItem {
  id: string;
  name: string;
  vendorOrCommunity: string;
  segment: 'Mobile' | 'Desktop & Laptop' | 'Server & Cloud' | 'Cross-Segment' | 'Specialized';
  marketShareNote: string;
  summary: string;
}

export interface ServerOperatingSystemRankItem {
  rank: number;
  os: string;
  family: string;
  bestFor: string;
  license: string;
  isFreeLicense: boolean;
  aiVideoSuitability: 'Primary AI GPU Host' | 'Container Base' | 'Streaming / Edge Storage' | 'Corporate Infrastructure';
}

export const LINUX_HOST_DISTRO_CATALOG: LinuxHostDistroSpec[] = [
  {
    id: 'nvidia_base_command_os',
    name: 'NVIDIA Base Command OS (DGX)',
    category: 'hpc_tuned_distro',
    kernelProfile: 'Linux 6.8+ HPC Low-Latency Monolithic Kernel (DGX Tuned)',
    immutableRootFs: false,
    guiExcluded: true,
    defaultSwapDisabled: true,
    preTunedMultiNodeGpu: true,
    footprintRamMb: 420,
    recommendedFor: 'Turnkey NVIDIA DGX H100 / B200 SuperPODs running multi-node DiT training',
    summary:
      'Purpose-built Linux distribution for NVIDIA DGX systems, pre-tuned out of the box for multi-node NVLink, InfiniBand RDMA, GPUDirect Storage (cuFile), and Slurm/Kubernetes orchestration.',
  },
  {
    id: 'ubuntu_server_hpc',
    name: 'Ubuntu Server 24.04 LTS (HPC Kernel)',
    category: 'hpc_tuned_distro',
    kernelProfile: 'Linux 6.8-nvidia-lowlatency (Monolithic HPC Tuned)',
    immutableRootFs: false,
    guiExcluded: true,
    defaultSwapDisabled: true,
    preTunedMultiNodeGpu: true,
    footprintRamMb: 380,
    recommendedFor: 'Large H100 / B200 or AMD MI300X clusters requiring broad MOFED / ROCm & Lustre/WekaFS package support',
    summary:
      'Headless Ubuntu Server with an HPC-tuned kernel, zero desktop packages, preloaded NVIDIA MOFED / GPUDirect modules, and 1 GB HugePages configured at boot.',
  },
  {
    id: 'rhel_hpc',
    name: 'Red Hat Enterprise Linux (RHEL 9 HPC)',
    category: 'hpc_tuned_distro',
    kernelProfile: 'Linux 5.14+ rt/hpc tuned-adm profile=hpc-compute',
    immutableRootFs: false,
    guiExcluded: true,
    defaultSwapDisabled: true,
    preTunedMultiNodeGpu: true,
    footprintRamMb: 410,
    recommendedFor: 'Enterprise GPU clusters using IBM Spectrum Scale (GPFS), Lustre, and Slurm/Kubernetes',
    summary:
      'Enterprise Linux tuned with tuned-adm hpc-compute profile, isolating housekeeping interrupts from GPU/RDMA NUMA cores.',
  },
  {
    id: 'bottlerocket',
    name: 'Bottlerocket OS (NVIDIA AI Variant)',
    category: 'immutable_minimal_distro',
    kernelProfile: 'Linux 6.1+ Minimal Monolithic Kernel (dm-verity read-only rootfs)',
    immutableRootFs: true,
    guiExcluded: true,
    defaultSwapDisabled: true,
    preTunedMultiNodeGpu: false,
    footprintRamMb: 190,
    recommendedFor: 'Immutable Kubernetes GPU worker nodes with minimal background daemon overhead',
    summary:
      'Minimal, container-specific Linux distribution with an immutable root filesystem, no package manager or SSH shell bloat, dedicating 99.7% of host cycles to AI containers.',
  },
  {
    id: 'rhel_coreos',
    name: 'RHEL CoreOS (RHCOS)',
    category: 'immutable_minimal_distro',
    kernelProfile: 'Linux 5.14+ ostree Immutable Monolithic Kernel',
    immutableRootFs: true,
    guiExcluded: true,
    defaultSwapDisabled: true,
    preTunedMultiNodeGpu: false,
    footprintRamMb: 240,
    recommendedFor: 'Immutable Kubernetes + SR-IOV + NVIDIA GPU Operator clusters',
    summary:
      'Immutable minimal Linux host managed declaratively via MachineConfig, stripping out GUIs and non-essential services.',
  },
  {
    id: 'alpine_minimal',
    name: 'Alpine Linux (Minimal HPC Container Host)',
    category: 'immutable_minimal_distro',
    kernelProfile: 'Linux 6.6+ Minimal Monolithic Kernel (RAM-disk boot)',
    immutableRootFs: true,
    guiExcluded: true,
    defaultSwapDisabled: true,
    preTunedMultiNodeGpu: false,
    footprintRamMb: 110,
    recommendedFor: 'Ultra-lean diskless RAM-boot compute sleds where every megabyte of RAM is reserved',
    summary:
      'Ultra-compact Linux host image stripped of all non-essential daemons, unused drivers, and GUI libraries.',
  },
];

export const GPU_HARDWARE_STACK_CATALOG: GpuHardwareStackSpec[] = [
  {
    id: 'nvidia_b200_sxm',
    vendor: 'NVIDIA',
    modelName: 'NVIDIA Blackwell B200 SXM (8x GPU / Node)',
    hbmPerGpuGb: 192,
    gpusPerNode: 8,
    driverOrComputeStack: 'NVIDIA Data Center Driver 560+ / CUDA 12.6 + nvidia-peermem + nvidia-fs',
    accessMode: 'bare_metal_pass_through',
    supportsGpuDirectStorage: true,
    supportsGpuDirectRdma: true,
    intraNodeInterconnect: 'NVLink 5 (1.8 TB/s bidirectional per GPU)',
    architectureNote:
      'Direct bare-metal VFIO/device-plugin pass-through for maximum FP4/FP8/BF16 DiT spacetime attention throughput.',
  },
  {
    id: 'nvidia_h100_sxm',
    vendor: 'NVIDIA',
    modelName: 'NVIDIA Hopper H100 SXM5 (8x GPU / Node)',
    hbmPerGpuGb: 80,
    gpusPerNode: 8,
    driverOrComputeStack: 'NVIDIA Data Center Driver 550+ / CUDA 12.4 + nvidia-peermem + nvidia-fs',
    accessMode: 'bare_metal_pass_through',
    supportsGpuDirectStorage: true,
    supportsGpuDirectRdma: true,
    intraNodeInterconnect: 'NVLink 4 (900 GB/s bidirectional per GPU)',
    architectureNote:
      'Workhorse multi-node DiT training and inference hardware with full GPUDirect RDMA and GPUDirect Storage support.',
  },
  {
    id: 'nvidia_h100_vgpu',
    vendor: 'NVIDIA',
    modelName: 'NVIDIA H100 (NVIDIA vGPU / MIG Virtualized)',
    hbmPerGpuGb: 80,
    gpusPerNode: 8,
    driverOrComputeStack: 'NVIDIA vGPU Host Driver + Guest Grid/DataCenter Driver + SR-IOV VF',
    accessMode: 'vgpu_virtualized',
    supportsGpuDirectStorage: true,
    supportsGpuDirectRdma: true,
    intraNodeInterconnect: 'NVLink 4 + PCIe Gen5 SR-IOV Virtual Functions',
    architectureNote:
      'Uses NVIDIA vGPU (virtualized GPU) with hardware SR-IOV so virtualized Kubernetes worker VMs get near-native low-latency GPU access.',
  },
  {
    id: 'amd_mi300x_rocm',
    vendor: 'AMD',
    modelName: 'AMD Instinct MI300X (8x GPU / Node)',
    hbmPerGpuGb: 192,
    gpusPerNode: 8,
    driverOrComputeStack: 'AMD ROCm 6.2+ Compute Stack (amdgpu kernel driver + RCCL + HIP)',
    accessMode: 'rocm_compute_stack',
    supportsGpuDirectStorage: true,
    supportsGpuDirectRdma: true,
    intraNodeInterconnect: 'AMD Infinity Fabric (896 GB/s per GPU)',
    architectureNote:
      'AMD ROCm is AMD’s open GPU compute stack (analogous to NVIDIA CUDA), providing low-latency kernel-mode driver (amdgpu) and RCCL collective communication over RoCEv2/InfiniBand.',
  },
];

export const PARALLEL_FILESYSTEM_CATALOG: ParallelFilesystemSpec[] = [
  {
    id: 'lustre',
    name: 'Lustre Parallel File System',
    mountPoint: '/mnt/lustre/dit_video_datasets',
    fsType: 'lustre',
    kernelClientModule: 'lustre',
    sustainedReadBandwidthGbPerSec: 180,
    supportsGpuDirectStorage: true,
    mountOptions: 'defaults,_netdev,flock,lazystatfs,noatime',
    videoDatasetAdvantage:
      'Stripes multi-petabyte 4K/60fps video tar/WebDataset shards across hundreds of Object Storage Targets (OSTs) with direct cuFile/GDS DMA into GPU HBM.',
  },
  {
    id: 'spectrum_scale_gpfs',
    name: 'IBM Spectrum Scale (GPFS)',
    mountPoint: '/gpfs/dit_video_datasets',
    fsType: 'gpfs',
    kernelClientModule: 'mmfs26',
    sustainedReadBandwidthGbPerSec: 195,
    supportsGpuDirectStorage: true,
    mountOptions: 'dev=dit_fs,auto,noatime',
    videoDatasetAdvantage:
      'Enterprise POSIX parallel filesystem with native NVIDIA GPUDirect Storage (GDS) RDMA reads directly from NVMe storage nodes into GPU memory.',
  },
  {
    id: 'wekafs',
    name: 'WekaFS (WEKA Data Platform)',
    mountPoint: '/mnt/wekafs/dit_video_datasets',
    fsType: 'wekafs',
    kernelClientModule: 'wekafsio',
    sustainedReadBandwidthGbPerSec: 220,
    supportsGpuDirectStorage: true,
    mountOptions: 'net=ib0,num_cores=4,readcache,noatime',
    videoDatasetAdvantage:
      'Zero-copy NVMe-oF & GPUDirect Storage parallel client engineered for high-IOPS small metadata + massive 4K/120fps latent video tensor streaming.',
  },
];

export const POPULAR_OPERATING_SYSTEMS_CATALOG: PopularOperatingSystemItem[] = [
  {
    id: 'android',
    name: 'Android (Google)',
    vendorOrCommunity: 'Google / Open Handset Alliance',
    segment: 'Mobile',
    marketShareNote: '~40% to 72% global mobile share (varies by source)',
    summary: 'The leading mobile operating system worldwide across smartphones and tablets.',
  },
  {
    id: 'windows',
    name: 'Windows (Microsoft)',
    vendorOrCommunity: 'Microsoft',
    segment: 'Desktop & Laptop',
    marketShareNote: 'Majority of global desktop & laptop share (Windows 11 & Windows 10)',
    summary: 'The dominant desktop and laptop operating system.',
  },
  {
    id: 'ios',
    name: 'iOS (Apple)',
    vendorOrCommunity: 'Apple',
    segment: 'Mobile',
    marketShareNote: '~19% to 28% of global mobile traffic',
    summary: "Apple's mobile operating system for iPhone.",
  },
  {
    id: 'macos',
    name: 'macOS (Apple)',
    vendorOrCommunity: 'Apple',
    segment: 'Desktop & Laptop',
    marketShareNote: '~10% to 15% of global desktop share',
    summary: "Apple's desktop operating system for Mac workstations and laptops.",
  },
  {
    id: 'linux',
    name: 'Linux',
    vendorOrCommunity: 'Open-Source Community / Linux Foundation',
    segment: 'Server & Cloud',
    marketShareNote: 'Dominates servers, cloud infrastructure, and supercomputers',
    summary: 'An open-source operating system family that dominates servers, cloud infrastructure, AI GPU clusters, and supercomputers, and is also used on desktops.',
  },
  {
    id: 'chromeos',
    name: 'ChromeOS (Google)',
    vendorOrCommunity: 'Google',
    segment: 'Desktop & Laptop',
    marketShareNote: 'Strong footprint in education and budget laptops',
    summary: 'A lightweight, cloud-first operating system common in schools and budget laptops.',
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu',
    vendorOrCommunity: 'Canonical',
    segment: 'Cross-Segment',
    marketShareNote: '#1 Linux distribution across cloud VMs and AI developer workstations',
    summary: 'A beginner-friendly and widely supported Linux distribution for both desktops and servers.',
  },
  {
    id: 'rhel',
    name: 'Red Hat Enterprise Linux (RHEL)',
    vendorOrCommunity: 'Red Hat (IBM)',
    segment: 'Server & Cloud',
    marketShareNote: 'Leading commercial enterprise Linux platform',
    summary: 'A commercial Linux platform built for enterprises, hybrid clouds, and regulated industries.',
  },
  {
    id: 'debian',
    name: 'Debian',
    vendorOrCommunity: 'Debian Project',
    segment: 'Server & Cloud',
    marketShareNote: 'Upstream foundation for Ubuntu and many container images',
    summary: 'A stable, community-driven Linux distribution that serves as the base for Ubuntu and many container images.',
  },
  {
    id: 'other_os',
    name: 'Other (iPadOS, watchOS, HarmonyOS, FreeBSD)',
    vendorOrCommunity: 'Apple / Huawei / FreeBSD Project',
    segment: 'Specialized',
    marketShareNote: 'Tablets, wearables, regional ecosystems, and high-throughput networking',
    summary: 'Includes iPadOS (tablets), watchOS (Apple Watch), HarmonyOS (Huawei), and FreeBSD (a Unix-like OS used for high-performance server networking and video streaming).',
  },
];

export const SERVER_OS_RANKING_TABLE: ServerOperatingSystemRankItem[] = [
  {
    rank: 1,
    os: 'Ubuntu Server',
    family: 'Linux (Debian-based)',
    bestFor: 'Cloud VMs, containers, general web servers, AI/ML GPU nodes',
    license: 'Free, open source',
    isFreeLicense: true,
    aiVideoSuitability: 'Primary AI GPU Host',
  },
  {
    rank: 2,
    os: 'Windows Server',
    family: 'Microsoft',
    bestFor: 'Corporate data centers, Active Directory, SQL Server, Hyper-V',
    license: 'Commercial (per-core)',
    isFreeLicense: false,
    aiVideoSuitability: 'Corporate Infrastructure',
  },
  {
    rank: 3,
    os: 'RHEL (Red Hat Enterprise Linux)',
    family: 'Linux',
    bestFor: 'Regulated enterprises, hybrid cloud, mission-critical systems',
    license: 'Paid subscription',
    isFreeLicense: false,
    aiVideoSuitability: 'Primary AI GPU Host',
  },
  {
    rank: 4,
    os: 'Debian',
    family: 'Linux',
    bestFor: 'Stable web hosting, base container images',
    license: 'Free, community-driven',
    isFreeLicense: true,
    aiVideoSuitability: 'Container Base',
  },
  {
    rank: 5,
    os: 'Rocky Linux, AlmaLinux',
    family: 'Linux (RHEL-compatible)',
    bestFor: 'Free alternatives for RHEL-style workloads',
    license: 'Free',
    isFreeLicense: true,
    aiVideoSuitability: 'Primary AI GPU Host',
  },
  {
    rank: 6,
    os: 'Amazon Linux',
    family: 'Linux',
    bestFor: 'AWS EC2 workloads',
    license: 'Free, optimized for AWS',
    isFreeLicense: true,
    aiVideoSuitability: 'Primary AI GPU Host',
  },
  {
    rank: 7,
    os: 'Oracle Linux',
    family: 'Linux (RHEL-compatible)',
    bestFor: 'Databases and HPC, with live kernel patching (Ksplice)',
    license: 'Free to use, paid support available',
    isFreeLicense: true,
    aiVideoSuitability: 'Primary AI GPU Host',
  },
  {
    rank: 8,
    os: 'SUSE Linux Enterprise Server (SLES)',
    family: 'Linux',
    bestFor: 'SAP workloads, European enterprises',
    license: 'Paid subscription',
    isFreeLicense: false,
    aiVideoSuitability: 'Corporate Infrastructure',
  },
  {
    rank: 9,
    os: 'Alpine Linux',
    family: 'Linux',
    bestFor: 'Minimal containers (base image under 10 MB)',
    license: 'Free, open source',
    isFreeLicense: true,
    aiVideoSuitability: 'Container Base',
  },
  {
    rank: 10,
    os: 'FreeBSD',
    family: 'Unix-like (not Linux)',
    bestFor: 'High-performance networking and storage, such as video streaming at scale',
    license: 'Free, open source',
    isFreeLicense: true,
    aiVideoSuitability: 'Streaming / Edge Storage',
  },
];

export const CENTOS_STATUS_NOTE =
  'Note on CentOS: The classic CentOS Linux release (a downstream RHEL clone) was discontinued in 2021. CentOS Stream now serves as the upstream development branch of RHEL, while Rocky Linux and AlmaLinux are the main free RHEL-compatible production options.';

export const TECHNICAL_CLARIFICATION_NOTES: TechnicalClarificationNote[] = [
  {
    id: 'linux_monolithic_minimal',
    topic: 'Minimal, Container-Optimized Linux vs. Kernel Architecture',
    clarification:
      'Linux uses a monolithic kernel. Immutable, stripped-down distributions such as Alpine Linux (base image under 10 MB), Red Hat Enterprise Linux CoreOS, or AWS Bottlerocket remove GUIs and unnecessary background services so resources go to the containers running AI pipelines.',
  },
  {
    id: 'rocm_vs_vgpu',
    topic: 'Kernel-Level GPU Drivers: NVIDIA vGPU & AMD ROCm',
    clarification:
      'Low-latency hardware access relies on kernel-level GPU drivers and stacks: NVIDIA Data Center / vGPU drivers (for bare-metal or virtualized GPUs) or AMD ROCm (AMD’s GPU compute stack and amdgpu kernel driver).',
  },
  {
    id: 'common_os_choices_and_sora_caveat',
    topic: 'Common OS Choices & Production Stack Caveat',
    clarification:
      'Linux (such as Ubuntu Server, RHEL with HPC-tuned kernels, or NVIDIA Base Command OS for DGX systems) is the overwhelmingly common choice for large GPU clusters—though calling it the "only viable option" is stronger than public evidence strictly proves. Caveat: These are general requirements of large GPU clusters and do not confirm OpenAI’s actual production stack for Sora.',
  },
  {
    id: 'centos_stream_transition',
    topic: 'CentOS Discontinuation & RHEL-Compatible Replacements',
    clarification: CENTOS_STATUS_NOTE,
  },
];

/**
 * Filters the Ranked Server Operating Systems table by search query and license type.
 */
export function filterServerOsRankings(
  query = '',
  licenseFilter: 'all' | 'free' | 'commercial' = 'all'
): ServerOperatingSystemRankItem[] {
  const q = query.trim().toLowerCase();
  return SERVER_OS_RANKING_TABLE.filter((item) => {
    if (licenseFilter === 'free' && !item.isFreeLicense) return false;
    if (licenseFilter === 'commercial' && item.isFreeLicense) return false;
    if (!q) return true;
    return (
      item.os.toLowerCase().includes(q) ||
      item.family.toLowerCase().includes(q) ||
      item.bestFor.toLowerCase().includes(q) ||
      item.license.toLowerCase().includes(q)
    );
  });
}

export const DEFAULT_LINUX_DIT_CLUSTER_CONFIG: LinuxDitClusterConfig = {
  clusterName: 'dit-video-prod-cluster',
  distroId: 'nvidia_base_command_os',
  gpuHardwareId: 'nvidia_b200_sxm',
  totalGpus: 2048,
  orchestratorId: 'kubernetes_slurm',
  rdmaFabricId: 'infiniband_ndr_400g',
  enableSriov: true,
  sriovVfsPerNic: 8,
  parallelFsId: 'wekafs',
  enableGpuDirectStorage: true,
  hugePageSize: '1GB',
  ditModelParametersBillions: 32,
  systemRamPerNodeGb: 2048,
  disableSwap: true,
  excludeGuiAndDaemons: true,
};

/**
 * Calculates HugePages allocation (2 MB or 1 GB pages instead of 4 KB)
 * to eliminate TLB address-translation overhead when loading multi-hundred-GB DiT weights.
 */
export function calculateHugePagesSpec(
  ditModelParametersBillions: number,
  systemRamPerNodeGb: number,
  pageSize: HugePageSizeOption
): HugePagesCalculation {
  const safeParamsB = clampNumber(ditModelParametersBillions, 1, 500);
  const safeRamGb = clampNumber(systemRamPerNodeGb, 128, 8192);

  // BF16 weights + FP32 master weights / optimizer states / pinned DMA staging buffers per node
  const modelWeightsSizeGb = Math.round(safeParamsB * 2 * 10) / 10;
  // Allocate enough HugePages for pinned host staging + GDS/RDMA bounce-free registration (capped to 65% of host RAM)
  const rawPoolGb = Math.max(64, Math.ceil(modelWeightsSizeGb * 4.5));
  const recommendedHugePagesPoolGb = Math.min(Math.floor(safeRamGb * 0.65), rawPoolGb);

  const pageSizeBytes = pageSize === '1GB' ? 1024 * 1024 * 1024 : 2 * 1024 * 1024;
  const standardPageSizeBytes = 4096;

  const numberOfPagesPerNode =
    pageSize === '1GB'
      ? recommendedHugePagesPoolGb
      : recommendedHugePagesPoolGb * 512;

  const standard4kPagesEquivalent = recommendedHugePagesPoolGb * 262144;
  const tlbEntriesReductionFactor = pageSize === '1GB' ? 262144 : 512;

  const kernelBootArgs =
    pageSize === '1GB'
      ? `default_hugepagesz=1G hugepagesz=1G hugepages=${numberOfPagesPerNode} transparent_hugepage=never`
      : `default_hugepagesz=2M hugepagesz=2M hugepages=${numberOfPagesPerNode} transparent_hugepage=madvise`;

  const sysctlDirective =
    pageSize === '1GB'
      ? `vm.nr_hugepages = ${numberOfPagesPerNode} # 1GB HugePages (${recommendedHugePagesPoolGb} GB pinned pool)`
      : `vm.nr_hugepages = ${numberOfPagesPerNode} # 2MB HugePages (${recommendedHugePagesPoolGb} GB pinned pool)`;

  return {
    pageSize,
    pageSizeBytes,
    standardPageSizeBytes,
    modelWeightsSizeGb,
    recommendedHugePagesPoolGb,
    numberOfPagesPerNode,
    standard4kPagesEquivalent,
    tlbEntriesReductionFactor,
    kernelBootArgs,
    sysctlDirective,
  };
}

/**
 * Evaluates a Linux DiT cluster configuration against the 5 mandatory HPC/AI requirements
 * and returns performance metrics + readiness audit checks.
 */
export function evaluateLinuxDitCluster(
  config: LinuxDitClusterConfig
): ClusterPerformanceSimulation {
  const distro =
    LINUX_HOST_DISTRO_CATALOG.find((d) => d.id === config.distroId) ||
    LINUX_HOST_DISTRO_CATALOG[0];
  const gpuSpec =
    GPU_HARDWARE_STACK_CATALOG.find((g) => g.id === config.gpuHardwareId) ||
    GPU_HARDWARE_STACK_CATALOG[0];
  const parallelFs =
    PARALLEL_FILESYSTEM_CATALOG.find((f) => f.id === config.parallelFsId) ||
    PARALLEL_FILESYSTEM_CATALOG[0];

  const safeGpus = Math.max(8, Math.round(config.totalGpus / 8) * 8);
  const totalNodes = Math.max(1, Math.ceil(safeGpus / gpuSpec.gpusPerNode));
  const aggregateHbmTb =
    Math.round(((safeGpus * gpuSpec.hbmPerGpuGb) / 1024) * 100) / 100;

  // 8 NICs per node * 400Gbps (InfiniBand NDR or RoCEv2)
  const baseFabricGbps = config.rdmaFabricId === 'infiniband_ndr_400g' ? 3200 : 3040;
  const sriovMultiplier = config.enableSriov ? 1.0 : 0.78;
  const interNodeRdmaBandwidthGbps = Math.round(baseFabricGbps * sriovMultiplier);

  const rdmaOneWayLatencyUs =
    config.rdmaFabricId === 'infiniband_ndr_400g'
      ? config.enableSriov
        ? 1.1
        : 1.9
      : config.enableSriov
      ? 1.7
      : 2.8;

  const gdsMultiplier = config.enableGpuDirectStorage ? 1.0 : 0.38;
  const gdsDatasetThroughputGbPerSec =
    Math.round(parallelFs.sustainedReadBandwidthGbPerSec * gdsMultiplier * 10) / 10;

  const hostOsOverheadPercent =
    (config.excludeGuiAndDaemons ? 0.3 : 4.8) + (config.disableSwap ? 0 : 6.5);

  const effectiveGpuComputeUtilizationPercent = clampNumber(
    Math.round(
      (98.4 -
        hostOsOverheadPercent -
        (config.enableSriov ? 0 : 4.2) -
        (config.enableGpuDirectStorage ? 0 : 9.5)) *
        10
    ) / 10,
    50,
    99.2
  );

  const hugePages = calculateHugePagesSpec(
    config.ditModelParametersBillions,
    config.systemRamPerNodeGb,
    config.hugePageSize
  );

  const auditItems: ClusterReadinessAuditItem[] = [
    {
      id: 'audit_orchestration',
      pillar: 'GPU Orchestration',
      title: 'Kubernetes + Multi-Node Scheduler (Slurm / Ray) & GPU Driver Stack',
      passed:
        config.orchestratorId === 'kubernetes_slurm' ||
        config.orchestratorId === 'kubernetes_ray',
      detail: `${
        config.orchestratorId === 'kubernetes_slurm'
          ? 'Kubernetes + Slurm (Pyxis/Enroot) gang scheduling'
          : 'Kubernetes + KubeRay distributed DiT runtime'
      } across ${totalNodes} nodes (${safeGpus}x ${gpuSpec.modelName}) via ${
        gpuSpec.driverOrComputeStack
      }.`,
    },
    {
      id: 'audit_networking',
      pillar: 'High-Speed Networking',
      title: 'GPUDirect RDMA (InfiniBand / RoCE) + SR-IOV Near-Native NIC Access',
      passed: config.enableSriov && gpuSpec.supportsGpuDirectRdma,
      detail: config.enableSriov
        ? `GPUDirect RDMA over ${
            config.rdmaFabricId === 'infiniband_ndr_400g'
              ? 'InfiniBand NDR 400G'
              : 'RoCEv2 400G'
          } with SR-IOV (${config.sriovVfsPerNic} VFs/NIC, ${rdmaOneWayLatencyUs} µs latency, CPU bypassed).`
        : 'SR-IOV is disabled — containers experience virtual bridge overhead on collective AllReduce.',
      remediation: config.enableSriov
        ? undefined
        : 'Enable SR-IOV so containers and VMs reach RDMA network cards at near-native line rate.',
    },
    {
      id: 'audit_storage',
      pillar: 'Fast Storage',
      title: 'Parallel File System (Lustre / GPFS / WekaFS) + GPUDirect Storage (GDS)',
      passed: config.enableGpuDirectStorage && parallelFs.supportsGpuDirectStorage,
      detail: config.enableGpuDirectStorage
        ? `${parallelFs.name} mounted at ${parallelFs.mountPoint} with GPUDirect Storage (nvidia-fs / cuFile) delivering ${gdsDatasetThroughputGbPerSec} GB/s straight from NVMe to GPU HBM.`
        : `${parallelFs.name} mounted without GPUDirect Storage — 4K video tensors bounce through CPU and system RAM.`,
      remediation: config.enableGpuDirectStorage
        ? undefined
        : 'Enable GPUDirect Storage (GDS) to DMA 4K/high-FPS video datasets straight from NVMe to GPU memory.',
    },
    {
      id: 'audit_memory',
      pillar: 'Memory Management',
      title: 'HugePages (2 MB / 1 GB) & Strict Zero-Swap Enforcement',
      passed: config.disableSwap && hugePages.numberOfPagesPerNode > 0,
      detail: config.disableSwap
        ? `${hugePages.pageSize} HugePages (${hugePages.numberOfPagesPerNode} pages = ${hugePages.recommendedHugePagesPoolGb} GB pinned, ${hugePages.tlbEntriesReductionFactor}x fewer TLB entries) with swap disabled (swapoff -a, vm.swappiness=0).`
        : 'Swap is enabled — disk paging will stall multi-node synchronous DiT video generation steps.',
      remediation: config.disableSwap
        ? undefined
        : 'Disable swap immediately (swapoff -a && sysctl vm.swappiness=0) to prevent catastrophic generation stalls.',
    },
    {
      id: 'audit_minimal_os',
      pillar: 'Minimal Footprint & OS',
      title: 'Headless Linux Host (No GUI, No Bloat Daemons, Linux-Only Target)',
      passed: config.excludeGuiAndDaemons && distro.guiExcluded,
      detail: config.excludeGuiAndDaemons
        ? `${distro.name} (${distro.kernelProfile}) running headless multi-user.target (${distro.footprintRamMb} MB host footprint) with X11/Wayland/desktop services purged.`
        : 'Desktop GUI or non-essential host daemons are active and stealing CPU/GPU interrupt cycles.',
      remediation: config.excludeGuiAndDaemons
        ? undefined
        : 'Exclude GUIs (systemctl set-default multi-user.target) and strip unused daemons and drivers.',
    },
  ];

  return {
    totalNodes,
    totalGpus: safeGpus,
    aggregateHbmTb,
    interNodeRdmaBandwidthGbps,
    rdmaOneWayLatencyUs,
    gdsDatasetThroughputGbPerSec,
    cpuStorageBypassActive: config.enableGpuDirectStorage,
    hostOsOverheadPercent,
    effectiveGpuComputeUtilizationPercent,
    allAuditChecksPassed: auditItems.every((item) => item.passed),
    auditItems,
  };
}

/**
 * Generates the Linux-only host provisioning & kernel tuning script:
 * - Enforces headless multi-user.target (no GUI/desktop environment)
 * - Disables swap permanently (swapoff -a, /etc/fstab, vm.swappiness=0)
 * - Configures 2MB or 1GB HugePages
 * - Configures SR-IOV Virtual Functions + RDMA (InfiniBand or RoCEv2) + GPUDirect RDMA
 * - Configures GPUDirect Storage (nvidia-fs / cuFile) and mounts Lustre, GPFS, or WekaFS
 */
export function generateLinuxHostBootstrapScript(
  config: LinuxDitClusterConfig
): string {
  const distro =
    LINUX_HOST_DISTRO_CATALOG.find((d) => d.id === config.distroId) ||
    LINUX_HOST_DISTRO_CATALOG[0];
  const gpuSpec =
    GPU_HARDWARE_STACK_CATALOG.find((g) => g.id === config.gpuHardwareId) ||
    GPU_HARDWARE_STACK_CATALOG[0];
  const parallelFs =
    PARALLEL_FILESYSTEM_CATALOG.find((f) => f.id === config.parallelFsId) ||
    PARALLEL_FILESYSTEM_CATALOG[0];
  const hugePages = calculateHugePagesSpec(
    config.ditModelParametersBillions,
    config.systemRamPerNodeGb,
    config.hugePageSize
  );

  const isAmd = gpuSpec.vendor === 'AMD';
  const rdmaComment =
    config.rdmaFabricId === 'infiniband_ndr_400g'
      ? 'InfiniBand NDR 400Gb/s (ib_umad, rdma_ucm, mlx5_ib)'
      : 'RoCEv2 400Gb/s (mlx5_core, rdma_cm, lossless PFC/ECN)';

  return `#!/usr/bin/env bash
# ==============================================================================
# LINUX HOST PROVISIONING FOR TEXT-TO-VIDEO DIFFUSION TRANSFORMER (DiT) CLUSTER
# Target OS: ${distro.name} (Linux Only — Monolithic Minimal/HPC Profile)
# Hardware: ${gpuSpec.modelName} (${config.totalGpus} GPUs total)
# Network : ${rdmaComment} + SR-IOV (${config.sriovVfsPerNic} VFs/NIC)
# Storage : ${parallelFs.name} (${parallelFs.mountPoint}) + GPUDirect Storage
# Memory  : ${hugePages.pageSize} HugePages (${hugePages.recommendedHugePagesPoolGb} GB/node) | Swap: DISABLED
# ==============================================================================
set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "ERROR: This workload requires a dedicated Linux host. Non-Linux OS detected." >&2
  exit 1
fi

echo "[1/6] Enforcing Minimal Footprint: Stripping GUI & Unnecessary Daemons..."
systemctl set-default multi-user.target
systemctl disable --now bluetooth.service cups.service avahi-daemon.service ModemManager.service 2>/dev/null || true

echo "[2/6] Disabling Swap Completely to Prevent DiT Generation Stalls..."
swapoff -a
sed -i '/\\bswap\\b/d' /etc/fstab

echo "[3/6] Configuring HugePages (${hugePages.pageSize}) & HPC Kernel Sysctl..."
cat << 'EOF' > /etc/sysctl.d/99-dit-video-hpc.conf
# Prevent swapping to disk
vm.swappiness = 0
vm.overcommit_memory = 1
vm.zone_reclaim_mode = 0

# HugePages (${hugePages.pageSize}) to cut TLB address-translation overhead for ${config.ditModelParametersBillions}B DiT weights
${hugePages.sysctlDirective}

# High-speed RDMA & socket buffer tuning
net.core.rmem_max = 268435456
net.core.wmem_max = 268435456
net.core.optmem_max = 67108864
net.core.netdev_max_backlog = 250000
kernel.numa_balancing = 0
EOF
sysctl --system

# Kernel boot parameters for persistent ${hugePages.pageSize} HugePages & IOMMU pass-through
# GRUB_CMDLINE_LINUX="${hugePages.kernelBootArgs} iommu=pt intel_iommu=on amd_iommu=on"
mkdir -p /mnt/hugepages
if ! grep -q "/mnt/hugepages" /etc/fstab; then
  echo "hugetlbfs /mnt/hugepages hugetlbfs pagesize=${hugePages.pageSize},mode=1777 0 0" >> /etc/fstab
fi
mount -a || true

echo "[4/6] Loading GPU Drivers (${isAmd ? 'AMD ROCm amdgpu' : 'NVIDIA Data Center / vGPU'}), RDMA & GPUDirectStorage..."
${
  isAmd
    ? `modprobe amdgpu
modprobe rdma_ucm
modprobe mlx5_ib`
    : `modprobe nvidia
modprobe nvidia-uvm
modprobe nvidia-modeset
# GPUDirect RDMA peer memory module (GPU-to-GPU across nodes bypassing CPU)
modprobe nvidia-peermem
# GPUDirect Storage module (NVMe / Parallel FS straight to GPU HBM bypassing CPU & RAM)
modprobe nvidia-fs`
}
modprobe ib_umad
modprobe rdma_cm
modprobe mlx5_core
modprobe mlx5_ib

echo "[5/6] Provisioning SR-IOV Virtual Functions (${config.sriovVfsPerNic} VFs per RDMA NIC)..."
for nic_sriov in /sys/class/infiniband/mlx5_*/device/sriov_numvfs; do
  if [[ -f "\${nic_sriov}" ]]; then
    echo 0 > "\${nic_sriov}" || true
    echo ${config.sriovVfsPerNic} > "\${nic_sriov}"
  fi
done

echo "[6/6] Mounting Parallel File System (${parallelFs.name}) with GPUDirect Storage..."
modprobe ${parallelFs.kernelClientModule} || true
mkdir -p ${parallelFs.mountPoint}
if ! grep -q "${parallelFs.mountPoint}" /etc/fstab; then
  echo "storage-mds-vip:/dit_video_datasets ${parallelFs.mountPoint} ${parallelFs.fsType} ${parallelFs.mountOptions} 0 0" >> /etc/fstab
fi
mount ${parallelFs.mountPoint} || true

# Configure NVIDIA cuFile / GPUDirect Storage (/etc/cufile.json) for zero-bounce NVMe->GPU DMA
cat << 'EOF' > /etc/cufile.json
{
  "execution": {
    "max_io_threads": 16,
    "parallel_io": true,
    "allow_compat_mode": false
  },
  "properties": {
    "rdma_dev_addr_list": ["10.200.0.1", "10.200.0.2"],
    "use_poll_mode": true,
    "gds_rdma_write_support": true
  },
  "fs": {
    "${parallelFs.fsType}": {
      "rdma_write_support": true,
      "mount_table": ["${parallelFs.mountPoint}"]
    }
  }
}
EOF

echo "Linux DiT Host Ready: Swap=0 | HugePages=${hugePages.pageSize} | RDMA+SR-IOV=Active | GDS=${parallelFs.mountPoint}"
`;
}

/**
 * Generates the Kubernetes Workload & SR-IOV Network Manifest for running
 * multi-node DiT video containers with RDMA, SR-IOV, HugePages, GPUDirect Storage,
 * and a parallel file system mount (Lustre / GPFS / WekaFS).
 */
export function generateKubernetesDitManifest(
  config: LinuxDitClusterConfig
): string {
  const gpuSpec =
    GPU_HARDWARE_STACK_CATALOG.find((g) => g.id === config.gpuHardwareId) ||
    GPU_HARDWARE_STACK_CATALOG[0];
  const parallelFs =
    PARALLEL_FILESYSTEM_CATALOG.find((f) => f.id === config.parallelFsId) ||
    PARALLEL_FILESYSTEM_CATALOG[0];
  const hugePages = calculateHugePagesSpec(
    config.ditModelParametersBillions,
    config.systemRamPerNodeGb,
    config.hugePageSize
  );

  const isAmd = gpuSpec.vendor === 'AMD';
  const gpuResourceKey = isAmd ? 'amd.com/gpu' : 'nvidia.com/gpu';
  const hugePageResourceKey =
    config.hugePageSize === '1GB' ? 'hugepages-1Gi' : 'hugepages-2Mi';
  const totalNodes = Math.max(1, Math.ceil(config.totalGpus / gpuSpec.gpusPerNode));

  return `# ==============================================================================
# KUBERNETES MANIFEST: MULTI-NODE TEXT-TO-VIDEO DiT WORKLOAD
# Cluster: ${config.clusterName} (${totalNodes} Nodes / ${config.totalGpus} GPUs)
# Features: SR-IOV RDMA (${config.rdmaFabricId}) + GPUDirect Storage + ${hugePages.pageSize} HugePages
# Parallel File System: ${parallelFs.name} (${parallelFs.mountPoint})
# ==============================================================================
apiVersion: sriovnetwork.openshift.io/v1
kind: SriovNetworkNodePolicy
metadata:
  name: dit-rdma-sriov-policy
  namespace: kube-system
spec:
  resourceName: rdma_sriov_nic
  nodeSelector:
    node-role.kubernetes.io/gpu-worker: "true"
  numVfs: ${config.sriovVfsPerNic}
  nicSelector:
    vendor: "15b3" # Mellanox / NVIDIA ConnectX-7 / BlueField-3
  deviceType: netdevice
  isRdma: true
  linkType: ${config.rdmaFabricId === 'infiniband_ndr_400g' ? 'IB' : 'ETH'}
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-parallel-fs-${parallelFs.id}
spec:
  capacity:
    storage: 5Pi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: parallel-fs-${parallelFs.id}
  mountOptions:
    - ${parallelFs.mountOptions.split(',')[0]}
    - noatime
  hostPath:
    path: ${parallelFs.mountPoint}
    type: DirectoryOrCreate
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-dit-video-dataset
  namespace: dit-training
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: parallel-fs-${parallelFs.id}
  resources:
    requests:
      storage: 5Pi
---
apiVersion: batch/v1
kind: Job
metadata:
  name: dit-text-to-video-cluster-job
  namespace: dit-training
spec:
  parallelism: ${totalNodes}
  completions: ${totalNodes}
  completionMode: Indexed
  template:
    metadata:
      annotations:
        k8s.v1.cni.cncf.io/networks: sriov-rdma-net
    spec:
      hostIPC: true
      restartPolicy: OnFailure
      containers:
        - name: dit-video-worker
          image: nvcr.io/nvidia/pytorch:24.09-py3
          securityContext:
            capabilities:
              add:
                - IPC_LOCK # Required for GPUDirect RDMA & HugePages pinning
          env:
            - name: NCCL_IB_DISABLE
              value: "0"
            - name: NCCL_NET_GDR_LEVEL
              value: "5" # Full GPUDirect RDMA over PCIe/NVLink switch
            - name: NCCL_CROSS_NIC
              value: "1"
            - name: CUFILE_ENV_PATH_JSON
              value: "/etc/cufile.json"
            - name: DATASET_ROOT
              value: "${parallelFs.mountPoint}"
          resources:
            requests:
              cpu: "64"
              memory: "${Math.min(config.systemRamPerNodeGb - 128, 1024)}Gi"
              ${gpuResourceKey}: "${gpuSpec.gpusPerNode}"
              openshift.io/rdma_sriov_nic: "${gpuSpec.gpusPerNode}"
              ${hugePageResourceKey}: "${hugePages.recommendedHugePagesPoolGb}Gi"
            limits:
              cpu: "64"
              memory: "${Math.min(config.systemRamPerNodeGb - 128, 1024)}Gi"
              ${gpuResourceKey}: "${gpuSpec.gpusPerNode}"
              openshift.io/rdma_sriov_nic: "${gpuSpec.gpusPerNode}"
              ${hugePageResourceKey}: "${hugePages.recommendedHugePagesPoolGb}Gi"
          volumeMounts:
            - name: parallel-fs-dataset
              mountPath: ${parallelFs.mountPoint}
            - name: hugepages-vol
              mountPath: /dev/hugepages
            - name: dshm
              mountPath: /dev/shm
            - name: cufile-config
              mountPath: /etc/cufile.json
              subPath: cufile.json
              readOnly: true
      volumes:
        - name: parallel-fs-dataset
          persistentVolumeClaim:
            claimName: pvc-dit-video-dataset
        - name: hugepages-vol
          emptyDir:
            medium: HugePages-${config.hugePageSize === '1GB' ? '1Gi' : '2Mi'}
        - name: dshm
          emptyDir:
            medium: Memory
            sizeLimit: 128Gi
        - name: cufile-config
          hostPath:
            path: /etc/cufile.json
`;
}

/**
 * Generates the Multi-Node Slurm (sbatch) or Ray distributed scheduler configuration
 * to split Diffusion Transformer (DiT) work across thousands of GPUs.
 */
export function generateMultiNodeSchedulerScript(
  config: LinuxDitClusterConfig
): string {
  const gpuSpec =
    GPU_HARDWARE_STACK_CATALOG.find((g) => g.id === config.gpuHardwareId) ||
    GPU_HARDWARE_STACK_CATALOG[0];
  const parallelFs =
    PARALLEL_FILESYSTEM_CATALOG.find((f) => f.id === config.parallelFsId) ||
    PARALLEL_FILESYSTEM_CATALOG[0];
  const totalNodes = Math.max(1, Math.ceil(config.totalGpus / gpuSpec.gpusPerNode));

  if (config.orchestratorId === 'kubernetes_slurm') {
    return `#!/usr/bin/env bash
# ==============================================================================
# SLURM MULTI-NODE JOB SCRIPT (sbatch): TEXT-TO-VIDEO DiT MODEL
# Cluster: ${config.clusterName} | Nodes: ${totalNodes} | Total GPUs: ${config.totalGpus}
# Parallel FS: ${parallelFs.mountPoint} (${parallelFs.name}) + GPUDirect Storage
# ==============================================================================
#SBATCH --job-name=dit-t2v-${config.ditModelParametersBillions}b
#SBATCH --nodes=${totalNodes}
#SBATCH --ntasks-per-node=${gpuSpec.gpusPerNode}
#SBATCH --gpus-per-node=${gpuSpec.gpusPerNode}
#SBATCH --cpus-per-task=12
#SBATCH --mem=0                 # Reserve all node memory (HugePages + zero-swap)
#SBATCH --exclusive             # Dedicated node allocation: zero background noise
#SBATCH --partition=gpu-dit-hpc
#SBATCH --output=${parallelFs.mountPoint}/logs/dit_%j.out

set -euo pipefail

# Verify zero swap & HugePages on every allocated Linux node
srun --ntasks=${totalNodes} --ntasks-per-node=1 bash -c '
  if [[ "$(swapon --show | wc -l)" -gt 0 ]]; then
    echo "FATAL: Swap is active on $(hostname). Aborting to prevent DiT stalls." >&2
    exit 1
  fi
'

export MASTER_ADDR=$(scontrol show hostnames "\$SLURM_JOB_NODELIST" | head -n 1)
export MASTER_PORT=29500

# Enable GPUDirect RDMA (${config.rdmaFabricId}) & GPUDirect Storage (cuFile)
export NCCL_IB_DISABLE=0
export NCCL_NET_GDR_LEVEL=5
export NCCL_IB_HCA=mlx5
export CUFILE_ENV_PATH_JSON=/etc/cufile.json

srun --container-image=nvcr.io/nvidia/pytorch:24.09-py3 \\
     --container-mounts=${parallelFs.mountPoint}:${parallelFs.mountPoint},/dev/hugepages:/dev/hugepages,/etc/cufile.json:/etc/cufile.json \\
     torchrun \\
       --nnodes=${totalNodes} \\
       --nproc_per_node=${gpuSpec.gpusPerNode} \\
       --rdzv_id="\$SLURM_JOB_ID" \\
       --rdzv_backend=c10d \\
       --rdzv_endpoint="\$MASTER_ADDR:\$MASTER_PORT" \\
       train_dit_video.py \\
         --model-params-b ${config.ditModelParametersBillions} \\
         --dataset-path "${parallelFs.mountPoint}/4k_60fps_shards" \\
         --use-gpudirect-storage \\
         --use-hugepages-${config.hugePageSize.toLowerCase()}
`;
  }

  return `# ==============================================================================
# RAY DISTRIBUTED CLUSTER (KubeRay + Ray Train/Serve): TEXT-TO-VIDEO DiT MODEL
# Cluster: ${config.clusterName} | Workers: ${totalNodes} Nodes (${config.totalGpus} GPUs)
# Parallel FS: ${parallelFs.mountPoint} (${parallelFs.name}) + GPUDirect Storage
# ==============================================================================
import os
import ray
from ray.train.torch import TorchTrainer
from ray.train import ScalingConfig

# Enforce Linux-only host + GPUDirect RDMA & GPUDirect Storage environment
RUNTIME_ENV = {
    "env_vars": {
        "NCCL_IB_DISABLE": "0",
        "NCCL_NET_GDR_LEVEL": "5",
        "NCCL_IB_HCA": "mlx5",
        "CUFILE_ENV_PATH_JSON": "/etc/cufile.json",
        "DIT_DATASET_MOUNT": "${parallelFs.mountPoint}",
        "DIT_HUGEPAGE_SIZE": "${config.hugePageSize}",
    }
}

def dit_worker_loop(config: dict):
    import torch
    import torch.distributed as dist

    assert os.uname().sysname == "Linux", "Linux host required for DiT cluster"
    # Verify GPUDirect Storage mount from ${parallelFs.name}
    dataset_root = config["dataset_root"]
    assert os.path.exists(dataset_root), f"Parallel FS missing at {dataset_root}"

    rank = dist.get_rank()
    world_size = dist.get_world_size()
    if rank == 0:
        print(
            f"[DiT Cluster] Initialized {world_size} GPUs across ${totalNodes} Linux nodes "
            f"with GPUDirect RDMA + GDS at {dataset_root}"
        )

if __name__ == "__main__":
    ray.init(address="auto", runtime_env=RUNTIME_ENV)
    trainer = TorchTrainer(
        train_loop_per_worker=dit_worker_loop,
        train_loop_config={
            "dataset_root": "${parallelFs.mountPoint}/4k_60fps_shards",
            "model_params_b": ${config.ditModelParametersBillions},
        },
        scaling_config=ScalingConfig(
            num_workers=${config.totalGpus},
            use_gpu=True,
            resources_per_worker={"CPU": 8, "GPU": 1},
        ),
    )
    trainer.fit()
`;
}
