import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LINUX_HOST_DISTRO_CATALOG,
  GPU_HARDWARE_STACK_CATALOG,
  PARALLEL_FILESYSTEM_CATALOG,
  TECHNICAL_CLARIFICATION_NOTES,
  DEFAULT_LINUX_DIT_CLUSTER_CONFIG,
  calculateHugePagesSpec,
  evaluateLinuxDitCluster,
  generateLinuxHostBootstrapScript,
  generateKubernetesDitManifest,
  generateMultiNodeSchedulerScript,
} from './linuxDitClusterEngine';

describe('linuxDitClusterEngine — Target Environment: Linux Host for Text-to-Video DiT Model', () => {
  it('catalogs HPC-tuned and minimal immutable Linux distributions without GUI or swap', () => {
    const distroIds = LINUX_HOST_DISTRO_CATALOG.map((d) => d.id);
    assert.ok(distroIds.includes('nvidia_base_command_os'));
    assert.ok(distroIds.includes('ubuntu_server_hpc'));
    assert.ok(distroIds.includes('rhel_hpc'));
    assert.ok(distroIds.includes('bottlerocket'));
    assert.ok(distroIds.includes('rhel_coreos'));
    assert.ok(distroIds.includes('alpine_minimal'));

    for (const distro of LINUX_HOST_DISTRO_CATALOG) {
      assert.strictEqual(distro.guiExcluded, true);
      assert.strictEqual(distro.defaultSwapDisabled, true);
    }
  });

  it('supports NVIDIA drivers (bare-metal & vGPU) and AMD ROCm compute stack', () => {
    const b200 = GPU_HARDWARE_STACK_CATALOG.find((g) => g.id === 'nvidia_b200_sxm');
    const vgpu = GPU_HARDWARE_STACK_CATALOG.find((g) => g.id === 'nvidia_h100_vgpu');
    const rocm = GPU_HARDWARE_STACK_CATALOG.find((g) => g.id === 'amd_mi300x_rocm');

    assert.ok(b200);
    assert.ok(vgpu);
    assert.ok(rocm);
    assert.strictEqual(vgpu.accessMode, 'vgpu_virtualized');
    assert.strictEqual(rocm.vendor, 'AMD');
    assert.strictEqual(rocm.accessMode, 'rocm_compute_stack');
    assert.ok(rocm.driverOrComputeStack.includes('ROCm'));
  });

  it('includes Lustre, IBM Spectrum Scale (GPFS), and WekaFS parallel file systems with GPUDirect Storage', () => {
    const fsIds = PARALLEL_FILESYSTEM_CATALOG.map((f) => f.id);
    assert.deepStrictEqual(fsIds, ['lustre', 'spectrum_scale_gpfs', 'wekafs']);
    for (const fs of PARALLEL_FILESYSTEM_CATALOG) {
      assert.strictEqual(fs.supportsGpuDirectStorage, true);
    }
  });

  it('calculates 1GB and 2MB HugePages to cut TLB address-translation overhead', () => {
    const hp1G = calculateHugePagesSpec(32, 2048, '1GB');
    assert.strictEqual(hp1G.pageSize, '1GB');
    assert.strictEqual(hp1G.tlbEntriesReductionFactor, 262144);
    assert.ok(hp1G.numberOfPagesPerNode >= 64);
    assert.ok(hp1G.kernelBootArgs.includes('hugepagesz=1G'));

    const hp2M = calculateHugePagesSpec(32, 2048, '2MB');
    assert.strictEqual(hp2M.pageSize, '2MB');
    assert.strictEqual(hp2M.tlbEntriesReductionFactor, 512);
    assert.strictEqual(hp2M.numberOfPagesPerNode, hp1G.recommendedHugePagesPoolGb * 512);
    assert.ok(hp2M.kernelBootArgs.includes('hugepagesz=2M'));
  });

  it('evaluates cluster readiness across all 5 pillars and flags swap or disabled GDS/SR-IOV', () => {
    const optimal = evaluateLinuxDitCluster(DEFAULT_LINUX_DIT_CLUSTER_CONFIG);
    assert.strictEqual(optimal.allAuditChecksPassed, true);
    assert.strictEqual(optimal.auditItems.length, 5);
    assert.strictEqual(optimal.cpuStorageBypassActive, true);

    const misconfigured = evaluateLinuxDitCluster({
      ...DEFAULT_LINUX_DIT_CLUSTER_CONFIG,
      disableSwap: false,
      enableGpuDirectStorage: false,
      enableSriov: false,
    });
    assert.strictEqual(misconfigured.allAuditChecksPassed, false);
    const swapAudit = misconfigured.auditItems.find((i) => i.id === 'audit_memory');
    assert.strictEqual(swapAudit?.passed, false);
    assert.ok(swapAudit?.remediation?.includes('swapoff -a'));
  });

  it('generates Linux-only host bootstrap script with HugePages, RDMA, SR-IOV, GDS, and zero swap/GUI', () => {
    const script = generateLinuxHostBootstrapScript(DEFAULT_LINUX_DIT_CLUSTER_CONFIG);
    assert.ok(script.includes('uname -s'));
    assert.ok(script.includes('systemctl set-default multi-user.target'));
    assert.ok(script.includes('swapoff -a'));
    assert.ok(script.includes('vm.swappiness = 0'));
    assert.ok(script.includes('nvidia-peermem'));
    assert.ok(script.includes('nvidia-fs'));
    assert.ok(script.includes('sriov_numvfs'));
    assert.ok(script.includes('/etc/cufile.json'));
    assert.ok(script.includes('/mnt/wekafs/dit_video_datasets'));
  });

  it('generates Kubernetes manifests with SR-IOV RDMA, HugePages, and Parallel FS mounts', () => {
    const k8sYaml = generateKubernetesDitManifest({
      ...DEFAULT_LINUX_DIT_CLUSTER_CONFIG,
      parallelFsId: 'lustre',
      hugePageSize: '1GB',
    });
    assert.ok(k8sYaml.includes('kind: SriovNetworkNodePolicy'));
    assert.ok(k8sYaml.includes('hugepages-1Gi'));
    assert.ok(k8sYaml.includes('/mnt/lustre/dit_video_datasets'));
    assert.ok(k8sYaml.includes('NCCL_NET_GDR_LEVEL'));
    assert.ok(k8sYaml.includes('/etc/cufile.json'));
  });

  it('generates multi-node Slurm (sbatch) and Ray distributed orchestration scripts', () => {
    const slurmScript = generateMultiNodeSchedulerScript({
      ...DEFAULT_LINUX_DIT_CLUSTER_CONFIG,
      orchestratorId: 'kubernetes_slurm',
    });
    assert.ok(slurmScript.includes('#SBATCH --nodes='));
    assert.ok(slurmScript.includes('--use-gpudirect-storage'));

    const rayScript = generateMultiNodeSchedulerScript({
      ...DEFAULT_LINUX_DIT_CLUSTER_CONFIG,
      orchestratorId: 'kubernetes_ray',
    });
    assert.ok(rayScript.includes('from ray.train.torch import TorchTrainer'));
    assert.ok(rayScript.includes('CUFILE_ENV_PATH_JSON'));
  });

  it('documents technical clarifications on monolithic minimal Linux, ROCm vs vGPU, and Sora provenance', () => {
    assert.strictEqual(TECHNICAL_CLARIFICATION_NOTES.length, 3);
    assert.ok(
      TECHNICAL_CLARIFICATION_NOTES.some((n) =>
        n.clarification.includes('monolithic kernel')
      )
    );
    assert.ok(
      TECHNICAL_CLARIFICATION_NOTES.some((n) =>
        n.clarification.includes('AMD ROCm')
      )
    );
    assert.ok(
      TECHNICAL_CLARIFICATION_NOTES.some((n) =>
        n.clarification.includes('OpenAI has not publicly documented')
      )
    );
  });
});
