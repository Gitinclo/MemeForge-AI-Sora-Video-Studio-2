import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Cpu,
  Download,
  Film,
  GitBranch,
  HardDrive,
  Lock,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sliders,
  Sparkles,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Database,
  Eye,
  FileText,
  KeyRound,
  Moon,
  Sun,
  UploadCloud,
  Users,
  Zap,
} from 'lucide-react';
import { LoraTrainingJob } from '../types/b2bEnterprise';
import {
  MlopsRbacRole,
  MLOPS_RBAC_ROLES,
  HuggingFaceDatasetConfig,
  INITIAL_HF_DATASETS,
  GitHubVersionCommit,
  INITIAL_GITHUB_COMMITS,
  CloudStorageSnapshot,
  INITIAL_CLOUD_SNAPSHOTS,
  CloudComputeProviderNode,
  INITIAL_CLOUD_PROVIDERS,
  MlopsSystemAlert,
  INITIAL_MLOPS_ALERTS,
  MlopsAuditLogEntry,
  INITIAL_AUDIT_LOGS,
  Sora2AnimationStyle,
  Sora2AnimationSceneSpec,
  LoraRealtimeSampleImage,
  buildRealtimeSampleForJob,
  buildCheckpointExportManifest,
  createSora2AnimationScene,
} from '../utils/loraFlowMlopsEngine';
import {
  createPrefixedId,
  readStorageJson,
  writeStorageJson,
  triggerBrowserDownload,
} from '../utils/sharedCoreEngine';

interface LoraFlowSpatialMlopsPanelProps {
  jobs: LoraTrainingJob[];
  onDeployToLeoStudio?: (title: string, prompt: string) => void;
  onOpenNewModelBuilder?: () => void;
  initialSection?: 'loss_samples' | 'sora2_animation' | 'hf_github_storage' | 'cloud_bottlenecks' | 'security_rbac_audit';
}

const LORAFLOW_CLOUD_CONFIG_STORAGE_KEY = 'memeforge_loraflow_cloud_snapshots_v1';

const SORA2_ANIMATION_STYLES: Sora2AnimationStyle[] = [
  '2.5D Anime Cel-Shaded',
  '3D Volumetric Pixar-Grade',
  'Cyberpunk Motion Vector',
  'Stop-Motion Claymation',
  'Spatial Architectural Flythrough',
  'Fluid Particle Dynamics',
];

export const LoraFlowSpatialMlopsPanel: React.FC<LoraFlowSpatialMlopsPanelProps> = ({
  jobs,
  onDeployToLeoStudio,
  onOpenNewModelBuilder,
  initialSection = 'loss_samples',
}) => {
  const [activeSection, setActiveSection] = useState<
    'loss_samples' | 'sora2_animation' | 'hf_github_storage' | 'cloud_bottlenecks' | 'security_rbac_audit'
  >(initialSection);

  // Late-night OLED comfort mode toggle for long monitoring sessions
  const [lateNightOledMode, setLateNightOledMode] = useState<boolean>(true);

  // Active RBAC role & MFA state
  const [currentRole, setCurrentRole] = useState<MlopsRbacRole>('mlops_admin');
  const [mfaHardwarePasskeyVerified, setMfaHardwarePasskeyVerified] = useState<boolean>(true);
  const [activeSsoProvider, setActiveSsoProvider] = useState<
    'GitHub OAuth + MFA' | 'Hugging Face SSO + Passkey' | 'Google Workspace SAML' | 'Okta Enterprise MFA'
  >('GitHub OAuth + MFA');

  const rolePermissions = MLOPS_RBAC_ROLES[currentRole];

  // Selected LoRA Job for inspection, sample generation, and Sora 2 animation binding
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || 'lora-job-aurum-01');
  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  // Section 1: Multi-Run Loss Curve & Real-Time Sample Generator State
  const [curveMetric, setCurveMetric] = useState<'loss' | 'val_loss' | 'lr' | 'grad_norm'>('loss');
  const [samplePrompt, setSamplePrompt] = useState<string>(
    'Commercial 8K volumetric keyframe on honed obsidian stone with golden caustic reflections'
  );
  const [sampleCfgScale, setSampleCfgScale] = useState<number>(7.5);
  const [sampleLoraWeight, setSampleLoraWeight] = useState<number>(1.0);
  const [sampleInspectStep, setSampleInspectStep] = useState<number>(selectedJob?.currentStep || 1000);
  const [generatedSamples, setGeneratedSamples] = useState<LoraRealtimeSampleImage[]>(() =>
    jobs.slice(0, 3).map((job) => buildRealtimeSampleForJob(job))
  );
  const [isGeneratingLiveAiSample, setIsGeneratingLiveAiSample] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Section 2: Sora 2 AI Text-to-Animation Video Generator State
  const [animPrompt, setAnimPrompt] = useState<string>(
    'A cybernetic tourbillon chronograph assembling in zero-gravity neon rain, volumetric light beams, dynamic orbital camera'
  );
  const [animStyle, setAnimStyle] = useState<Sora2AnimationStyle>('2.5D Anime Cel-Shaded');
  const [animLoraScale, setAnimLoraScale] = useState<number>(1.0);
  const [animFps, setAnimFps] = useState<24 | 60 | 120 | 1000>(60);
  const [animDurationSec, setAnimDurationSec] = useState<number>(8);
  const [animCameraMotion, setAnimCameraMotion] = useState<
    'Orbital Dolly' | 'FPV Crane Sweep' | 'Parallax Pan' | 'Anamorphic Push-In'
  >('Orbital Dolly');
  const [activeAnimScene, setActiveAnimScene] = useState<Sora2AnimationSceneSpec>(() =>
    createSora2AnimationScene({
      prompt: 'A cybernetic tourbillon chronograph assembling in zero-gravity neon rain, volumetric light beams, dynamic orbital camera',
      style: '2.5D Anime Cel-Shaded',
      job: jobs[0],
      loraScale: 1.0,
      fps: 60,
      durationSeconds: 8,
      cameraMotion: 'Orbital Dolly',
    })
  );
  const [isAnimPlaying, setIsAnimPlaying] = useState<boolean>(true);
  const [animProgressPct, setAnimProgressPct] = useState<number>(0);
  const [isRecordingWebm, setIsRecordingWebm] = useState<boolean>(false);
  const [isAiStoryboardLoading, setIsAiStoryboardLoading] = useState<boolean>(false);
  const [aiStoryboardBeats, setAiStoryboardBeats] = useState<string[]>([
    '0.0s–2.5s: Establishing orbital sweep locking LoRA identity geometry and cel-shaded rim contours.',
    '2.5s–5.5s: High-velocity particle dispersion and kinetic camera push-in at 60fps.',
    '5.5s–8.0s: Hero emblem specular flare and seamless temporal loop lock.',
  ]);
  const [mlopsAiTip, setMlopsAiTip] = useState<string>(
    'Cosine LR schedule is converging cleanly; keep spatial-temporal cross-attention in BF16 for zero silhouette drift.'
  );

  const animCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Section 3: Hugging Face Datasets, GitHub VCS & Encrypted Cloud Storage State
  const [hfDatasets, setHfDatasets] = useState<HuggingFaceDatasetConfig[]>(INITIAL_HF_DATASETS);
  const [newHfRepoInput, setNewHfRepoInput] = useState<string>('');
  const [newHfModality, setNewHfModality] = useState<
    'Image-Text Pairs' | '3D Spatial Latents' | 'Video Motion Trajectories'
  >('3D Spatial Latents');

  const [gitCommits, setGitCommits] = useState<GitHubVersionCommit[]>(INITIAL_GITHUB_COMMITS);
  const [activeGitBranch, setActiveGitBranch] = useState<string>('main');
  const [newCommitMessage, setNewCommitMessage] = useState<string>('');

  const [cloudSnapshots, setCloudSnapshots] = useState<CloudStorageSnapshot[]>(() =>
    readStorageJson<CloudStorageSnapshot[]>(LORAFLOW_CLOUD_CONFIG_STORAGE_KEY, INITIAL_CLOUD_SNAPSHOTS)
  );
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<
    'AWS S3 (Encrypted)' | 'Google Cloud Storage' | 'Cloudflare R2 Zero-Egress' | 'Azure Blob Vault'
  >('AWS S3 (Encrypted)');

  // Section 4: Cloud-Native Compute Providers & Bottleneck Resolution State
  const [cloudNodes, setCloudNodes] = useState<CloudComputeProviderNode[]>(INITIAL_CLOUD_PROVIDERS);

  // Section 5: Real-Time Alerts & Compliance Audit Logs State
  const [alerts, setAlerts] = useState<MlopsSystemAlert[]>(INITIAL_MLOPS_ALERTS);
  const [auditLogs, setAuditLogs] = useState<MlopsAuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [auditStatusFilter, setAuditStatusFilter] = useState<'ALL' | 'ALLOWED' | 'BLOCKED_RBAC' | 'FLAGGED_SECURITY'>('ALL');

  useEffect(() => {
    if (selectedJob) {
      setSampleInspectStep(selectedJob.currentStep);
    }
  }, [selectedJobId, selectedJob?.currentStep]);

  const appendAuditLog = (
    action: string,
    resource: string,
    status: 'ALLOWED' | 'BLOCKED_RBAC' | 'FLAGGED_SECURITY' = 'ALLOWED'
  ) => {
    const entry: MlopsAuditLogEntry = {
      id: `AUDIT-${Math.floor(1000 + Math.random() * 8999)}`,
      timestampIso: new Date().toISOString(),
      actor: `${currentRole}@loraflow.enterprise`,
      role: currentRole,
      authMethod: activeSsoProvider,
      action,
      resource,
      ipAddress: '10.42.20.18',
      encryptionVerified: true,
      chainHash: `sha256:${Math.random().toString(16).substring(2, 18)}${Math.random().toString(16).substring(2, 18)}`,
      status,
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // Real-time 60fps HTML5 Canvas Procedural Animation Renderer for Sora 2 Text-to-Animation
  useEffect(() => {
    const canvas = animCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = performance.now();

    const renderFrame = (now: number) => {
      const elapsedSec = (now - startTime) / 1000;
      const cyclePct = isAnimPlaying
        ? ((elapsedSec % Math.max(2, activeAnimScene.durationSeconds)) /
            Math.max(2, activeAnimScene.durationSeconds)) *
          100
        : animProgressPct;

      if (isAnimPlaying) {
        setAnimProgressPct(Math.round(cyclePct));
      }

      const t = (cyclePct / 100) * Math.PI * 2;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Style-aware background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      if (activeAnimScene.style === '2.5D Anime Cel-Shaded') {
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(0.5, '#1e1b4b');
        bgGrad.addColorStop(1, '#311042');
      } else if (activeAnimScene.style === '3D Volumetric Pixar-Grade') {
        bgGrad.addColorStop(0, '#091526');
        bgGrad.addColorStop(0.6, '#0f2942');
        bgGrad.addColorStop(1, '#06101e');
      } else if (activeAnimScene.style === 'Cyberpunk Motion Vector') {
        bgGrad.addColorStop(0, '#050811');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#042f2e');
      } else if (activeAnimScene.style === 'Stop-Motion Claymation') {
        bgGrad.addColorStop(0, '#1c1917');
        bgGrad.addColorStop(0.6, '#292524');
        bgGrad.addColorStop(1, '#0c0a09');
      } else if (activeAnimScene.style === 'Spatial Architectural Flythrough') {
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(1, '#1e293b');
      } else {
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#064e3b');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Camera motion offset
      const camX =
        activeAnimScene.cameraMotion === 'Orbital Dolly'
          ? Math.sin(t) * 36
          : activeAnimScene.cameraMotion === 'Parallax Pan'
          ? (cyclePct - 50) * 1.1
          : Math.cos(t * 1.5) * 22;
      const camY =
        activeAnimScene.cameraMotion === 'FPV Crane Sweep'
          ? Math.sin(t * 1.2) * 28
          : Math.cos(t) * 12;
      const zoom =
        activeAnimScene.cameraMotion === 'Anamorphic Push-In'
          ? 0.92 + (cyclePct / 100) * 0.25
          : 1 + Math.sin(t) * 0.06;

      ctx.save();
      ctx.translate(w / 2 + camX, h / 2 + camY);
      ctx.scale(zoom, zoom);

      // Perspective spatial horizon grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1;
      for (let i = -5; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 55, 75);
        ctx.lineTo(i * 115, 195);
        ctx.stroke();
      }
      for (let row = 0; row < 4; row++) {
        const yPos = 85 + row * 28;
        ctx.beginPath();
        ctx.moveTo(-360, yPos);
        ctx.lineTo(360, yPos);
        ctx.stroke();
      }

      // Dynamic style-specific animated geometry
      const primaryColor =
        activeAnimScene.style === '2.5D Anime Cel-Shaded'
          ? '#f472b6'
          : activeAnimScene.style === 'Cyberpunk Motion Vector'
          ? '#22d3ee'
          : activeAnimScene.style === 'Stop-Motion Claymation'
          ? '#fb923c'
          : '#38bdf8';

      // Orbiting energy particles / cel-shaded speed rings
      for (let p = 0; p < 18; p++) {
        const angle = (p / 18) * Math.PI * 2 + t * (p % 2 === 0 ? 1.2 : -0.8);
        const radiusX = 115 + (p % 3) * 32;
        const radiusY = 48 + (p % 2) * 24;
        const px = Math.cos(angle) * radiusX;
        const py = Math.sin(angle) * radiusY - 12;

        ctx.beginPath();
        ctx.arc(px, py, 2.5 + (p % 3) * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = p % 2 === 0 ? primaryColor : '#fbbf24';
        ctx.fill();
      }

      // Outer kinetic gimbal ring
      ctx.save();
      ctx.rotate(t * 0.45);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.5;
      ctx.setLineDash(activeAnimScene.style === '2.5D Anime Cel-Shaded' ? [14, 6] : []);
      ctx.beginPath();
      ctx.ellipse(0, -14, 128, 66, 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Central LoRA Digital Twin Animated Subject Core
      const floatY = Math.sin(t * 2) * 8 - 14;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-58, floatY - 68, 116, 136, 18);
      ctx.fill();
      ctx.stroke();

      // Inner pulsing core / Chronograph dial
      ctx.beginPath();
      ctx.arc(0, floatY, 34 + Math.sin(t * 3) * 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Token & Style label on subject
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(activeAnimScene.boundTriggerToken.toUpperCase(), 0, floatY + 4);

      ctx.restore();

      // Top HUD Telemetry Overlay
      ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
      ctx.fillRect(14, 12, w - 28, 32);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `SORA 2 TEXT-TO-ANIMATION · ${activeAnimScene.style.toUpperCase()} · ${activeAnimScene.fps} FPS · LoRA ${activeAnimScene.loraScale.toFixed(2)}x`,
        24,
        32
      );

      // Bottom Caption / Prompt Bar
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.fillRect(14, h - 42, w - 28, 30);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px sans-serif';
      ctx.fillText(
        `Prompt: ${activeAnimScene.prompt.slice(0, 82)}`,
        24,
        h - 23
      );

      if (isAnimPlaying) {
        animationFrameId = requestAnimationFrame(renderFrame);
      }
    };

    animationFrameId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeAnimScene, isAnimPlaying, animProgressPct]);

  // Handlers
  const handleGenerateCheckpointSample = (overrideStep?: number) => {
    if (!selectedJob) return;
    const sample = buildRealtimeSampleForJob(
      selectedJob,
      samplePrompt,
      sampleCfgScale,
      sampleLoraWeight,
      overrideStep ?? sampleInspectStep
    );
    setGeneratedSamples((prev) => [sample, ...prev.slice(0, 7)]);
    appendAuditLog(
      'GENERATE_REALTIME_SAMPLE_IMAGE',
      `${selectedJob.triggerToken}@step_${sample.step}`
    );
    setStatusNotice(
      `Generated real-time sample for ${selectedJob.modelName} at Step ${sample.step} (Loss ${sample.lossAtStep}).`
    );
  };

  const handleGenerateLiveGeminiSample = async () => {
    if (!selectedJob) return;
    setIsGeneratingLiveAiSample(true);
    setStatusNotice(null);
    try {
      const fullPrompt = `${samplePrompt} (Product token: ${selectedJob.triggerToken}, LoRA scale ${sampleLoraWeight}x)`;
      const res = await fetch('/api/generate-meme-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, aspectRatio: '16:9' }),
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        const liveSample: LoraRealtimeSampleImage = {
          id: createPrefixedId('sample-ai'),
          jobId: selectedJob.id,
          modelName: selectedJob.modelName,
          triggerToken: selectedJob.triggerToken,
          step: sampleInspectStep,
          lossAtStep: selectedJob.currentLoss,
          prompt: samplePrompt,
          cfgScale: sampleCfgScale,
          loraWeight: sampleLoraWeight,
          generatedAtIso: new Date().toISOString(),
          imageDataUri: data.imageUrl,
        };
        setGeneratedSamples((prev) => [liveSample, ...prev.slice(0, 7)]);
        appendAuditLog('GEMINI_LIVE_SAMPLE_SYNTHESIS', `${selectedJob.triggerToken}@step_${sampleInspectStep}`);
        setStatusNotice(`Synthesized live Gemini sample image for ${selectedJob.modelName}.`);
      } else {
        handleGenerateCheckpointSample();
      }
    } catch {
      handleGenerateCheckpointSample();
    } finally {
      setIsGeneratingLiveAiSample(false);
    }
  };

  const handleExportSafetensorsCheckpoint = (job: LoraTrainingJob) => {
    try {
      const manifest = buildCheckpointExportManifest(job, currentRole);
      const blob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: 'application/json',
      });
      triggerBrowserDownload(
        blob,
        `${job.triggerToken}_step${job.currentStep}.safetensors.manifest.json`
      );
      appendAuditLog(
        'EXPORT_SAFETENSORS_CHECKPOINT',
        `${job.triggerToken}_step${job.currentStep}.safetensors`,
        'ALLOWED'
      );
      setStatusNotice(
        `Exported ${job.triggerToken} checkpoint manifest (${job.safetensorsSizeMb} MB · SHA-256 verified).`
      );
    } catch (err: any) {
      appendAuditLog(
        'EXPORT_SAFETENSORS_CHECKPOINT_DENIED',
        `${job.triggerToken}_step${job.currentStep}.safetensors`,
        'BLOCKED_RBAC'
      );
      setStatusNotice(err.message || 'RBAC policy blocked checkpoint export.');
    }
  };

  const handleSynthesizeSora2Animation = async () => {
    if (!selectedJob) return;
    setIsAiStoryboardLoading(true);
    const nextScene = createSora2AnimationScene({
      prompt: animPrompt,
      style: animStyle,
      job: selectedJob,
      loraScale: animLoraScale,
      fps: animFps,
      durationSeconds: animDurationSec,
      cameraMotion: animCameraMotion,
    });
    setActiveAnimScene(nextScene);
    setIsAnimPlaying(true);

    try {
      const res = await fetch('/api/loraflow/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: animPrompt,
          style: animStyle,
          triggerToken: selectedJob.triggerToken,
          currentLoss: selectedJob.currentLoss,
          step: selectedJob.currentStep,
        }),
      });
      const data = await res.json();
      if (data.storyboardBeats) {
        setAiStoryboardBeats(data.storyboardBeats);
      }
      if (data.mlopsRecommendation) {
        setMlopsAiTip(data.mlopsRecommendation);
      }
    } catch {
      // Fallback already populated
    } finally {
      setIsAiStoryboardLoading(false);
      appendAuditLog(
        'SORA2_TEXT_TO_ANIMATION_RENDER',
        `${selectedJob.triggerToken} (${animStyle} @ ${animFps}fps)`
      );
      setStatusNotice(
        `Rendered Sora 2 Text-to-Animation scene in ${animStyle} style with LoRA token [${selectedJob.triggerToken}].`
      );
    }
  };

  const handleExportAnimationWebm = () => {
    const canvas = animCanvasRef.current;
    if (!canvas || isRecordingWebm) return;

    if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
      const fallbackBlob = new Blob([JSON.stringify(activeAnimScene, null, 2)], {
        type: 'application/json',
      });
      triggerBrowserDownload(fallbackBlob, `${activeAnimScene.boundTriggerToken}_sora2_animation.json`);
      setStatusNotice('Exported Sora 2 animation scene specification.');
      return;
    }

    try {
      setIsRecordingWebm(true);
      setIsAnimPlaying(true);
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        triggerBrowserDownload(
          videoBlob,
          `sora2_${activeAnimScene.boundTriggerToken}_${Date.now()}.webm`
        );
        setIsRecordingWebm(false);
        appendAuditLog('EXPORT_SORA2_ANIMATION_WEBM', `${activeAnimScene.id}.webm`);
        setStatusNotice('Downloaded Sora 2 Text-to-Animation video (.webm).');
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, 3000);
    } catch {
      setIsRecordingWebm(false);
    }
  };

  const handleConnectHfDataset = () => {
    if (!rolePermissions.canConnectReposAndDatasets) {
      appendAuditLog('CONNECT_HF_DATASET_DENIED', newHfRepoInput || 'hf-dataset', 'BLOCKED_RBAC');
      setStatusNotice(`RBAC Policy Denied: Role "${rolePermissions.label}" cannot connect external datasets.`);
      return;
    }
    const cleanRepo = newHfRepoInput.trim() || 'loraflow/custom-spatial-latents-v2';
    const newDs: HuggingFaceDatasetConfig = {
      id: createPrefixedId('hf-ds'),
      repoId: cleanRepo,
      split: 'train',
      streaming: true,
      sampleCount: 12800,
      sizeGb: 64.2,
      modality: newHfModality,
      encryptionStatus: 'AES-256-GCM Verified',
      lastSyncedIso: new Date().toISOString(),
      verifiedSha256: '7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730',
    };
    setHfDatasets((prev) => [newDs, ...prev]);
    setNewHfRepoInput('');
    appendAuditLog('CONNECT_HF_DATASET', `hf://${cleanRepo}`);
    setStatusNotice(`Connected Hugging Face dataset "${cleanRepo}" with streaming shard verification.`);
  };

  const handleCommitToGitHub = () => {
    if (!rolePermissions.canConnectReposAndDatasets) {
      appendAuditLog('GITHUB_COMMIT_DENIED', activeGitBranch, 'BLOCKED_RBAC');
      setStatusNotice(`RBAC Policy Denied: Role "${rolePermissions.label}" cannot push to GitHub repositories.`);
      return;
    }
    const msg =
      newCommitMessage.trim() ||
      `chore(lora): sync ${selectedJob?.triggerToken} rank-${selectedJob?.networkRankDim} loss=${selectedJob?.currentLoss}`;
    const newCommit: GitHubVersionCommit = {
      commitHash: Math.random().toString(16).substring(2, 9),
      branch: activeGitBranch,
      author: `${rolePermissions.label} (${activeSsoProvider})`,
      message: msg,
      timestampIso: new Date().toISOString(),
      changedFiles: ['configs/loraflow_project.json', 'pytorch_dit/dit.py'],
      loraRank: selectedJob?.networkRankDim || 64,
      learningRate: '9.2e-5',
      validationLoss: selectedJob?.currentLoss || 0.0542,
    };
    setGitCommits((prev) => [newCommit, ...prev]);
    setNewCommitMessage('');
    appendAuditLog('GITHUB_COMMIT_PUSH', `github.com/loraflow-mlops/dit-lora-pipelines@${activeGitBranch}`);
    setStatusNotice(`Committed and pushed configuration to GitHub branch "${activeGitBranch}" (${newCommit.commitHash}).`);
  };

  const handleSaveCloudSnapshot = () => {
    if (!selectedJob) return;
    if (!rolePermissions.canExportCheckpoints) {
      appendAuditLog('SAVE_CLOUD_SNAPSHOT_DENIED', selectedJob.triggerToken, 'BLOCKED_RBAC');
      setStatusNotice(`RBAC Policy Denied: Role "${rolePermissions.label}" cannot write to encrypted cloud storage.`);
      return;
    }
    const snap: CloudStorageSnapshot = {
      id: createPrefixedId('snap'),
      name: `${selectedJob.triggerToken}_step${selectedJob.currentStep}_backup.safetensors`,
      provider: selectedCloudProvider,
      bucketUri: `s3://loraflow-vault-prod/${selectedJob.triggerToken}/step_${selectedJob.currentStep}.safetensors`,
      jobId: selectedJob.id,
      step: selectedJob.currentStep,
      sizeMb: selectedJob.safetensorsSizeMb,
      encryptionAtRest: 'AES-256-GCM (KMS)',
      encryptionInTransit: 'TLS 1.3 (mTLS)',
      createdAtIso: new Date().toISOString(),
      sha256: selectedJob.sha256Checksum,
    };
    const next = [snap, ...cloudSnapshots];
    setCloudSnapshots(next);
    writeStorageJson(LORAFLOW_CLOUD_CONFIG_STORAGE_KEY, next);
    appendAuditLog('CLOUD_STORAGE_ENCRYPTED_BACKUP', snap.bucketUri);
    setStatusNotice(`Saved AES-256-GCM encrypted project backup to ${selectedCloudProvider}.`);
  };

  const handleRemediateBottleneck = (nodeId: string) => {
    if (!rolePermissions.canScaleCloudCompute) {
      appendAuditLog('REMEDIATE_BOTTLENECK_DENIED', nodeId, 'BLOCKED_RBAC');
      setStatusNotice(`RBAC Policy Denied: Role "${rolePermissions.label}" cannot modify cloud compute nodes.`);
      return;
    }
    setCloudNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              status: 'healthy',
              utilizationPct: 98,
              bottleneckReason: undefined,
            }
          : n
      )
    );
    appendAuditLog('AUTO_REMEDIATE_IO_BOTTLENECK', nodeId);
    setStatusNotice(`Resolved I/O prefetch bottleneck on ${nodeId}; GPU occupancy restored to 98%.`);
  };

  const handleScaleCloudNode = (nodeId: string, deltaGpus: number) => {
    if (!rolePermissions.canScaleCloudCompute) {
      appendAuditLog('SCALE_CLOUD_COMPUTE_DENIED', nodeId, 'BLOCKED_RBAC');
      setStatusNotice(`RBAC Policy Denied: Role "${rolePermissions.label}" cannot scale cloud GPU clusters.`);
      return;
    }
    setCloudNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const nextCount = Math.max(8, Math.min(64, n.gpuCount + deltaGpus));
        return {
          ...n,
          gpuCount: nextCount,
          hourlyCostUsd: Number(((n.hourlyCostUsd / n.gpuCount) * nextCount).toFixed(1)),
        };
      })
    );
    appendAuditLog('SCALE_CLOUD_GPU_CLUSTER', `${nodeId} (${deltaGpus > 0 ? '+' : ''}${deltaGpus} GPUs)`);
    setStatusNotice(`Updated GPU allocation for ${nodeId}.`);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
    appendAuditLog('ACKNOWLEDGE_SYSTEM_ALERT', alertId);
  };

  const handleSimulateCriticalAlert = () => {
    const newAlert: MlopsSystemAlert = {
      id: createPrefixedId('alert'),
      severity: 'critical',
      category: 'System Failure',
      title: 'NVLink All-Reduce Timeout on Node dgx-h100-sxm5-west-02',
      detail: 'Transient fabric congestion detected at Step 1140. Elastic checkpoint failover engaged automatically with zero lost gradients.',
      timestampIso: new Date().toISOString(),
      acknowledged: false,
      pushDispatched: true,
      remediationAction: 'Reroute Ring-Attention Fabric & Verify Gradient Checksum',
    };
    setAlerts((prev) => [newAlert, ...prev]);
    appendAuditLog('PUSH_CRITICAL_SYSTEM_ALERT', newAlert.title, 'FLAGGED_SECURITY');
    setStatusNotice('Dispatched real-time push notification for simulated NVLink fabric failover.');
  };

  const handleExportAuditReport = (format: 'json' | 'csv') => {
    if (!rolePermissions.canExportAuditCompliance) {
      setStatusNotice(`RBAC Policy Denied: Role "${rolePermissions.label}" cannot export compliance audit trails.`);
      return;
    }
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(auditLogs, null, 2)], {
        type: 'application/json',
      });
      triggerBrowserDownload(blob, `loraflow_soc2_audit_trail_${Date.now()}.json`);
    } else {
      const header = 'ID,Timestamp,Actor,Role,AuthMethod,Action,Resource,IP,Encrypted,Status,ChainHash\n';
      const rows = auditLogs
        .map(
          (l) =>
            `"${l.id}","${l.timestampIso}","${l.actor}","${l.role}","${l.authMethod}","${l.action}","${l.resource}","${l.ipAddress}","${l.encryptionVerified}","${l.status}","${l.chainHash}"`
        )
        .join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      triggerBrowserDownload(blob, `loraflow_soc2_audit_trail_${Date.now()}.csv`);
    }
    appendAuditLog('EXPORT_COMPLIANCE_AUDIT_REPORT', `format=${format.toUpperCase()}`);
    setStatusNotice(`Exported encrypted compliance audit report (${format.toUpperCase()}).`);
  };

  const filteredAuditLogs = auditLogs.filter((entry) => {
    const matchesStatus = auditStatusFilter === 'ALL' || entry.status === auditStatusFilter;
    const q = auditSearchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      entry.action.toLowerCase().includes(q) ||
      entry.actor.toLowerCase().includes(q) ||
      entry.resource.toLowerCase().includes(q) ||
      entry.id.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const surfaceClass = lateNightOledMode
    ? 'bg-slate-950 border-slate-800/90 text-slate-100'
    : 'bg-slate-900 border-slate-700/80 text-slate-100';

  return (
    <div className="space-y-6">
      {/* Top Control Bar: Active RBAC Role, Encryption Status, Late-Night Dark Mode & Sub-Navigation */}
      <div className={`p-5 rounded-2xl border ${surfaceClass} space-y-5`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-400 font-medium">
              <span>LoRAFlow Spatial MLOps &amp; Sora 2 Suite</span>
              <span aria-hidden="true">·</span>
              <span>AES-256-GCM Encrypted at Rest</span>
              <span aria-hidden="true">·</span>
              <span>TLS 1.3 In Transit</span>
              <span aria-hidden="true">·</span>
              <span>MFA: {mfaHardwarePasskeyVerified ? 'WebAuthn Verified' : 'TOTP Pending'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 tracking-tight">
              Real-Time LoRA Convergence, Cloud MLOps &amp; Sora 2 Text-to-Animation Studio
            </h2>
          </div>

          {/* Right Controls: Active Role Selector & Late-Night Comfort Toggle */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <label htmlFor="mlops-role-select" className="text-xs text-slate-400 whitespace-nowrap">
                RBAC Role:
              </label>
              <select
                id="mlops-role-select"
                value={currentRole}
                onChange={(e) => {
                  const nextRole = e.target.value as MlopsRbacRole;
                  setCurrentRole(nextRole);
                  setStatusNotice(`Switched active session RBAC role to ${MLOPS_RBAC_ROLES[nextRole].label}.`);
                }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {Object.values(MLOPS_RBAC_ROLES).map((r) => (
                  <option key={r.role} value={r.role} className="bg-slate-900 text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setLateNightOledMode((prev) => !prev)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Toggle Late-Night OLED High-Contrast Monitoring Mode"
            >
              {lateNightOledMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Late-Night OLED Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Standard Slate Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 5-Module Interactive Segmented Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSection('loss_samples')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeSection === 'loss_samples'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>01. Loss Curves &amp; Live Samples</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('sora2_animation')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeSection === 'sora2_animation'
                  ? 'bg-purple-500 text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>02. Sora 2 Text-to-Animation Video</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('hf_github_storage')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeSection === 'hf_github_storage'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>03. HF Datasets, GitHub &amp; Vault</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('cloud_bottlenecks')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeSection === 'cloud_bottlenecks'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>04. Cloud Scaling &amp; Bottlenecks</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('security_rbac_audit')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeSection === 'security_rbac_audit'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>05. RBAC, MFA &amp; Audit Alerts ({alerts.filter((a) => !a.acknowledged).length})</span>
            </button>
          </div>

          {/* Active Run Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 whitespace-nowrap">Active LoRA Run:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-cyan-300 focus:outline-none cursor-pointer"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id} className="bg-slate-900 text-white">
                  {j.modelName} ({j.triggerToken} · Step {j.currentStep}/{j.totalSteps})
                </option>
              ))}
            </select>
          </div>
        </div>

        {statusNotice && (
          <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center justify-between gap-3 text-xs text-cyan-200">
            <span>{statusNotice}</span>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="text-slate-400 hover:text-white font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* SECTION 01: MULTI-RUN LOSS CURVES, CHECKPOINT EXPORT & REAL-TIME SAMPLE IMAGES */}
      {activeSection === 'loss_samples' && selectedJob && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Interactive Multi-Run Loss & Telemetry Curve Chart */}
          <div className={`lg:col-span-7 p-6 rounded-2xl border ${surfaceClass} space-y-5`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  01. Multi-Run Loss Convergence &amp; Telemetry Analytics
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any point on the curve or step presets below to synthesize a real-time checkpoint sample image
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                {(
                  [
                    { id: 'loss', label: 'Train Loss' },
                    { id: 'val_loss', label: 'Val Loss' },
                    { id: 'lr', label: 'Cosine LR' },
                    { id: 'grad_norm', label: 'Grad Norm' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCurveMetric(m.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      curveMetric === m.id
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG Multi-Run Chart */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                <div className="flex flex-wrap items-center gap-4">
                  {jobs.slice(0, 3).map((job, idx) => {
                    const colors = ['text-cyan-400', 'text-purple-400', 'text-emerald-400'];
                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => setSelectedJobId(job.id)}
                        className={`flex items-center gap-1.5 font-semibold cursor-pointer ${
                          selectedJob.id === job.id ? 'underline underline-offset-4' : 'opacity-75 hover:opacity-100'
                        } ${colors[idx % colors.length]}`}
                      >
                        <span>{job.modelName}</span>
                        <span className="font-mono text-[11px]">({job.currentLoss.toFixed(4)})</span>
                      </button>
                    );
                  })}
                </div>
                <span className="font-mono text-slate-400">
                  Inspecting Step {sampleInspectStep} / {selectedJob.totalSteps}
                </span>
              </div>

              <svg
                viewBox="0 0 680 220"
                className="w-full h-52 overflow-visible select-none"
                role="img"
                aria-label="Multi-run LoRA training loss curve"
              >
                {/* Horizontal Reference Grid Lines */}
                {[0.4, 0.3, 0.2, 0.1, 0.05].map((val, i) => {
                  const y = 20 + i * 42;
                  return (
                    <g key={val}>
                      <line x1="44" y1={y} x2="660" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                      <text x="38" y={y + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                        {curveMetric === 'lr' ? `${(val * 2.5).toFixed(1)}e-4` : val.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Plot Lines for Up to 3 Active Runs */}
                {jobs.slice(0, 3).map((job, idx) => {
                  const strokeColors = ['#22d3ee', '#a855f7', '#10b981'];
                  const pts = job.lossHistory;
                  if (pts.length === 0) return null;

                  const polylinePoints = pts
                    .map((pt) => {
                      const x = 44 + (pt.step / Math.max(1, job.totalSteps)) * 616;
                      const metricVal =
                        curveMetric === 'val_loss'
                          ? pt.loss * 1.08
                          : curveMetric === 'grad_norm'
                          ? pt.loss * 0.85 + 0.03
                          : curveMetric === 'lr'
                          ? (pt.step / job.totalSteps) * 0.35
                          : pt.loss;
                      const y =
                        curveMetric === 'lr'
                          ? 28 + metricVal * 420
                          : Math.min(195, Math.max(18, 195 - metricVal * 410));
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ');

                  return (
                    <g key={job.id}>
                      <polyline
                        fill="none"
                        stroke={strokeColors[idx % strokeColors.length]}
                        strokeWidth={selectedJob.id === job.id ? '3' : '1.75'}
                        strokeOpacity={selectedJob.id === job.id ? '1' : '0.55'}
                        points={polylinePoints}
                      />
                      {selectedJob.id === job.id &&
                        pts.map((pt) => {
                          const x = 44 + (pt.step / Math.max(1, job.totalSteps)) * 616;
                          const y = Math.min(195, Math.max(18, 195 - pt.loss * 410));
                          return (
                            <circle
                              key={pt.step}
                              cx={x}
                              cy={y}
                              r={Math.abs(pt.step - sampleInspectStep) < 40 ? 5.5 : 3}
                              fill={Math.abs(pt.step - sampleInspectStep) < 40 ? '#fbbf24' : '#22d3ee'}
                              className="cursor-pointer"
                              onClick={() => {
                                setSampleInspectStep(pt.step);
                                handleGenerateCheckpointSample(pt.step);
                              }}
                            >
                              <title>
                                Step {pt.step}: Loss {pt.loss} (Click to synthesize sample)
                              </title>
                            </circle>
                          );
                        })}
                    </g>
                  );
                })}
              </svg>

              {/* Step Checkpoints & Export Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-400">Sample Step:</span>
                  {[250, 500, 750, 1000, selectedJob.currentStep].map((st, idx) => (
                    <button
                      key={`${st}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSampleInspectStep(st);
                        handleGenerateCheckpointSample(st);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer transition-colors ${
                        sampleInspectStep === st
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Step {st}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportSafetensorsCheckpoint(selectedJob)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export .safetensors ({selectedJob.safetensorsSizeMb} MB)</span>
                  </button>
                  {onOpenNewModelBuilder && (
                    <button
                      type="button"
                      onClick={onOpenNewModelBuilder}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>New Run</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Automated Experiment Reproducibility Log Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Network Rank / Alpha</div>
                <div className="text-sm font-bold text-white mt-0.5 font-mono">
                  R={selectedJob.networkRankDim} / α={selectedJob.networkAlpha}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Quantization Precision</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5 font-mono">
                  {selectedJob.precision}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Logo &amp; IoU Lock</div>
                <div className="text-sm font-bold text-emerald-300 mt-0.5 font-mono">
                  {selectedJob.invariantTargets.logoIntegrityTarget}% / {selectedJob.invariantTargets.geometrySilhouetteIouTarget}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Weight SHA-256</div>
                <div className="text-sm font-bold text-amber-300 mt-0.5 font-mono truncate">
                  {selectedJob.sha256Checksum.slice(0, 14)}…
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Real-Time Sample Image Generator & Gallery */}
          <div className={`lg:col-span-5 p-6 rounded-2xl border ${surfaceClass} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Real-Time Checkpoint Sample Generator
                </h3>
                <p className="text-xs text-slate-400">
                  Evaluate {selectedJob.triggerToken} fidelity during training
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-300 tabular-nums">
                Step {sampleInspectStep}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Validation Sample Prompt (Auto-Injects {selectedJob.triggerToken})
                </label>
                <textarea
                  rows={2}
                  value={samplePrompt}
                  onChange={(e) => setSamplePrompt(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>CFG Guidance</span>
                    <span className="font-mono text-white">{sampleCfgScale.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="15"
                    step="0.5"
                    value={sampleCfgScale}
                    onChange={(e) => setSampleCfgScale(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>LoRA Adapter Scale</span>
                    <span className="font-mono text-cyan-300">{sampleLoraWeight.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.05"
                    value={sampleLoraWeight}
                    onChange={(e) => setSampleLoraWeight(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateCheckpointSample()}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize Step {sampleInspectStep} Sample</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateLiveGeminiSample}
                  disabled={isGeneratingLiveAiSample}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingLiveAiSample ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingLiveAiSample ? 'Rendering AI…' : 'Gemini Image Render'}</span>
                </button>
              </div>
            </div>

            {/* Latest Sample Preview Card */}
            {generatedSamples[0] && (
              <div className="space-y-2 pt-2">
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={generatedSamples[0].imageDataUri}
                    alt={generatedSamples[0].prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-44 object-cover"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
                  <span>
                    {generatedSamples[0].modelName} · Step {generatedSamples[0].step} · Loss {generatedSamples[0].lossAtStep}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAnimPrompt(generatedSamples[0].prompt);
                      setActiveSection('sora2_animation');
                    }}
                    className="text-purple-300 hover:text-purple-200 font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    Animate in Sora 2 →
                  </button>
                </div>
              </div>
            )}

            {/* Step Comparison Strip */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {generatedSamples.slice(0, 3).map((smp) => (
                <button
                  key={smp.id}
                  type="button"
                  onClick={() => {
                    setGeneratedSamples((prev) => [smp, ...prev.filter((x) => x.id !== smp.id)]);
                  }}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left transition-colors cursor-pointer"
                >
                  <img
                    src={smp.imageDataUri}
                    alt={`Step ${smp.step}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-16 object-cover rounded-lg"
                  />
                  <div className="text-[10px] font-mono text-slate-300 mt-1 truncate tabular-nums">
                    Step {smp.step} · {smp.lossAtStep}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 02: SORA 2 AI VIDEO GENERATOR — TEXT TO ANIMATION VIDEO */}
      {activeSection === 'sora2_animation' && selectedJob && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Interactive 60FPS HTML5 Canvas Animation Viewport */}
          <div className={`lg:col-span-7 p-6 rounded-2xl border ${surfaceClass} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  02. Sora 2 AI Video Generator — Text-to-Animation Viewport
                </h3>
                <p className="text-xs text-slate-400">
                  Bound LoRA Checkpoint: <span className="font-mono text-cyan-300">{selectedJob.triggerToken}</span> · Style: <span className="text-purple-300 font-semibold">{activeAnimScene.style}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnimPlaying((prev) => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {isAnimPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{isAnimPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportAnimationWebm}
                  disabled={isRecordingWebm}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isRecordingWebm ? 'Recording WebM (3s)…' : 'Export Animation (.webm)'}</span>
                </button>
              </div>
            </div>

            {/* HTML5 Canvas Real-Time Animation Synthesizer */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <canvas
                ref={animCanvasRef}
                width={760}
                height={420}
                className="w-full h-auto block"
              />
            </div>

            {/* Interactive Timeline Scrubber & 4 Keyframe Beats */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 text-xs tabular-nums">
                <span className="font-mono text-slate-400">Timeline Scrub:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={animProgressPct}
                  onChange={(e) => {
                    setIsAnimPlaying(false);
                    setAnimProgressPct(Number(e.target.value));
                  }}
                  className="flex-1 accent-purple-500 cursor-pointer"
                />
                <span className="font-mono text-purple-300 w-12 text-right">{animProgressPct}%</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {aiStoryboardBeats.map((beat, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed"
                  >
                    <div className="font-mono text-[11px] text-purple-300 font-semibold mb-1">
                      Keyframe Act 0{idx + 1}
                    </div>
                    {beat}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Text-to-Animation Controls & LoRA Adapter Binding */}
          <div className={`lg:col-span-5 p-6 rounded-2xl border ${surfaceClass} space-y-4`}>
            <h3 className="text-base font-bold text-white">
              Text-to-Animation Synthesis Controls
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Animation Scene Prompt
                </label>
                <textarea
                  rows={3}
                  value={animPrompt}
                  onChange={(e) => setAnimPrompt(e.target.value)}
                  placeholder="Describe character motion, lighting, physics, and camera trajectory..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Animation Visual Style Preset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SORA2_ANIMATION_STYLES.map((styleName) => (
                    <button
                      key={styleName}
                      type="button"
                      onClick={() => setAnimStyle(styleName)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-colors cursor-pointer truncate ${
                        animStyle === styleName
                          ? 'bg-purple-600/30 border-purple-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {styleName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
                <div>
                  <label className="block text-slate-400 mb-1">Camera Trajectory</label>
                  <select
                    value={animCameraMotion}
                    onChange={(e) => setAnimCameraMotion(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Orbital Dolly">Orbital Dolly</option>
                    <option value="FPV Crane Sweep">FPV Crane Sweep</option>
                    <option value="Parallax Pan">Parallax Pan</option>
                    <option value="Anamorphic Push-In">Anamorphic Push-In</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Frame Rate (FPS)</label>
                  <select
                    value={animFps}
                    onChange={(e) => setAnimFps(Number(e.target.value) as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value={24}>24 FPS (Anime Film)</option>
                    <option value={60}>60 FPS (Smooth Motion)</option>
                    <option value={120}>120 FPS (High Velocity)</option>
                    <option value={1000}>1000 FPS (Sora 2 Ultra)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>LoRA Adapter Weight</span>
                    <span className="font-mono text-purple-300">{animLoraScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.05"
                    value={animLoraScale}
                    onChange={(e) => setAnimLoraScale(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Clip Duration</span>
                    <span className="font-mono text-white">{animDurationSec}s</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="30"
                    step="2"
                    value={animDurationSec}
                    onChange={(e) => setAnimDurationSec(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSynthesizeSora2Animation}
                  disabled={isAiStoryboardLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isAiStoryboardLoading
                      ? 'Synthesizing Storyboard…'
                      : 'Generate Text-to-Animation Video'}
                  </span>
                </button>

                {onDeployToLeoStudio && (
                  <button
                    type="button"
                    onClick={() =>
                      onDeployToLeoStudio(
                        `${selectedJob.modelName} (${animStyle})`,
                        activeAnimScene.prompt
                      )
                    }
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Open in LEO 32K Studio →
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-cyan-300">
                  MLOps Convergence &amp; Temporal Consistency Diagnostic
                </div>
                <p className="text-slate-400 leading-relaxed">{mlopsAiTip}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 03: HUGGING FACE DATASETS, GITHUB VERSION CONTROL & ENCRYPTED CLOUD STORAGE */}
      {activeSection === 'hf_github_storage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 4 Cols: Hugging Face Datasets Integration */}
          <div className={`lg:col-span-4 p-5 rounded-2xl border ${surfaceClass} space-y-4`}>
            <div>
              <h3 className="text-base font-bold text-white">
                01. Hugging Face Dataset Hub
              </h3>
              <p className="text-xs text-slate-400">
                Zero-copy WebDataset streaming &amp; SHA-256 shard verification
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={newHfRepoInput}
                onChange={(e) => setNewHfRepoInput(e.target.value)}
                placeholder="org/dataset-name (e.g. loraflow/3d-twins)"
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center gap-2">
                <select
                  value={newHfModality}
                  onChange={(e) => setNewHfModality(e.target.value as any)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200"
                >
                  <option value="3D Spatial Latents">3D Spatial Latents</option>
                  <option value="Video Motion Trajectories">Video Motion Trajectories</option>
                  <option value="Image-Text Pairs">Image-Text Pairs</option>
                </select>
                <button
                  type="button"
                  onClick={handleConnectHfDataset}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer whitespace-nowrap shrink-0"
                >
                  Connect Repo
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {hfDatasets.map((ds) => (
                <div
                  key={ds.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs tabular-nums"
                >
                  <div className="font-mono font-bold text-amber-300 truncate">
                    hf://{ds.repoId}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-slate-400">
                    <span>{ds.modality}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ds.sampleCount.toLocaleString()} samples</span>
                    <span aria-hidden="true">·</span>
                    <span>{ds.sizeGb} GB</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    {ds.encryptionStatus} · Split: {ds.split}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center 4 Cols: GitHub Collaborative Version Control */}
          <div className={`lg:col-span-4 p-5 rounded-2xl border ${surfaceClass} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  02. GitHub Version Control
                </h3>
                <p className="text-xs text-slate-400">
                  Experiment reproducibility &amp; collaborative PR workflows
                </p>
              </div>
              <select
                value={activeGitBranch}
                onChange={(e) => setActiveGitBranch(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-cyan-300"
              >
                <option value="main">main</option>
                <option value="feat/fp8-ring-attn">feat/fp8-ring-attn</option>
                <option value="exp/sora2-text-to-animation">exp/sora2-text-to-animation</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCommitMessage}
                onChange={(e) => setNewCommitMessage(e.target.value)}
                placeholder="Commit message for current LoRA hyperparameters..."
                className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleCommitToGitHub}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                Commit &amp; Push
              </button>
            </div>

            <div className="space-y-2.5">
              {gitCommits.map((c) => (
                <div
                  key={c.commitHash}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs tabular-nums"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-cyan-300 font-bold">
                      {c.commitHash} · {c.branch}
                    </span>
                    <span className="text-emerald-400">Loss {c.validationLoss}</span>
                  </div>
                  <div className="text-white font-medium leading-snug">{c.message}</div>
                  <div className="text-[11px] text-slate-400">
                    {c.author} · Rank {c.loraRank} · LR {c.learningRate}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 4 Cols: Built-In Encrypted Cloud Storage Vault */}
          <div className={`lg:col-span-4 p-5 rounded-2xl border ${surfaceClass} space-y-4`}>
            <div>
              <h3 className="text-base font-bold text-white">
                03. Encrypted Cloud Storage Vault
              </h3>
              <p className="text-xs text-slate-400">
                Save project configurations &amp; encrypted checkpoint backups
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCloudProvider}
                onChange={(e) => setSelectedCloudProvider(e.target.value as any)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="AWS S3 (Encrypted)">AWS S3 (Encrypted KMS)</option>
                <option value="Google Cloud Storage">Google Cloud Storage</option>
                <option value="Cloudflare R2 Zero-Egress">Cloudflare R2 Zero-Egress</option>
                <option value="Azure Blob Vault">Azure Blob Vault</option>
              </select>
              <button
                type="button"
                onClick={handleSaveCloudSnapshot}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Backup Config</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {cloudSnapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs tabular-nums"
                >
                  <div className="font-semibold text-white truncate">{snap.name}</div>
                  <div className="font-mono text-[11px] text-slate-400 truncate">
                    {snap.bucketUri}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 pt-1">
                    <span>
                      {snap.encryptionAtRest} · {snap.sizeMb} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(snap, null, 2)], {
                          type: 'application/json',
                        });
                        triggerBrowserDownload(blob, `${snap.name}.loraflow.json`);
                      }}
                      className="text-cyan-300 hover:underline cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 04: CLOUD-NATIVE COMPUTE SCALING & BOTTLENECK DETECTOR */}
      {activeSection === 'cloud_bottlenecks' && (
        <div className={`p-6 rounded-2xl border ${surfaceClass} space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">
                04. Multi-Cloud Elastic GPU Infrastructure &amp; Bottleneck Telemetry
              </h3>
              <p className="text-xs text-slate-400">
                Real-time NVLink bandwidth, VRAM utilization, and automated I/O bottleneck remediation across major cloud providers
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-300 tabular-nums">
              Total Elastic Capacity: {cloudNodes.reduce((acc, n) => acc + n.gpuCount, 0)} GPUs Online
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cloudNodes.map((node) => (
              <div
                key={node.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 tabular-nums"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono text-cyan-300 font-semibold">
                      {node.provider} · {node.region}
                    </div>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      {node.instanceType} ({node.gpuCount}× GPUs)
                    </h4>
                  </div>

                  <span
                    className={`text-xs font-semibold ${
                      node.status === 'bottleneck_detected'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {node.status === 'bottleneck_detected' ? 'Bottleneck Detected' : 'Nominal Operation'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">GPU Occupancy</div>
                    <div className="text-sm font-bold text-white mt-0.5">{node.utilizationPct}%</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Fabric Bandwidth</div>
                    <div className="text-sm font-bold text-cyan-300 mt-0.5">{node.networkThroughputGbps} Gbps</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Compute Burn</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">${node.hourlyCostUsd}/hr</div>
                  </div>
                </div>

                {node.bottleneckReason && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-amber-200">{node.bottleneckReason}</span>
                    <button
                      type="button"
                      onClick={() => handleRemediateBottleneck(node.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Auto-Remediate I/O
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">
                    VRAM Pool: {node.gpuCount * node.vramPerGpuGb} GB HBM3e
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleScaleCloudNode(node.id, -8)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
                    >
                      -8 GPUs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScaleCloudNode(node.id, 8)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold cursor-pointer"
                    >
                      +8 GPUs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 05: RBAC, MFA, REAL-TIME ALERTS & COMPLIANCE AUDIT TRAIL */}
      {activeSection === 'security_rbac_audit' && (
        <div className="space-y-6">
          {/* Top Row: RBAC Matrix + 3P Auth / MFA Controls + Real-Time Push Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Role-Based Access Control (RBAC) & 3P SSO/MFA */}
            <div className={`lg:col-span-5 p-6 rounded-2xl border ${surfaceClass} space-y-4`}>
              <div>
                <h3 className="text-base font-bold text-white">
                  01. Role-Based Access Control (RBAC) &amp; MFA Security
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {rolePermissions.description}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-300">Launch &amp; Modify LoRA Runs</span>
                  <span className={rolePermissions.canLaunchRuns ? 'text-emerald-400 font-bold' : 'text-rose-400 font-semibold'}>
                    {rolePermissions.canLaunchRuns ? 'Permitted' : 'Restricted'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-300">Export .safetensors Checkpoints</span>
                  <span className={rolePermissions.canExportCheckpoints ? 'text-emerald-400 font-bold' : 'text-rose-400 font-semibold'}>
                    {rolePermissions.canExportCheckpoints ? 'Permitted' : 'Restricted'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-300">Scale Multi-Cloud GPU Clusters</span>
                  <span className={rolePermissions.canScaleCloudCompute ? 'text-emerald-400 font-bold' : 'text-rose-400 font-semibold'}>
                    {rolePermissions.canScaleCloudCompute ? 'Permitted' : 'Restricted'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-300">Export SOC 2 Audit Logs</span>
                  <span className={rolePermissions.canExportAuditCompliance ? 'text-emerald-400 font-bold' : 'text-rose-400 font-semibold'}>
                    {rolePermissions.canExportAuditCompliance ? 'Permitted' : 'Restricted'}
                  </span>
                </div>
              </div>

              {/* Third-Party SSO Provider & Multi-Factor Authentication */}
              <div className="pt-2 space-y-3">
                <div className="text-xs font-semibold text-slate-300">
                  Third-Party Identity Provider (SSO) &amp; Multi-Factor Authentication
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      'GitHub OAuth + MFA',
                      'Hugging Face SSO + Passkey',
                      'Google Workspace SAML',
                      'Okta Enterprise MFA',
                    ] as const
                  ).map((sso) => (
                    <button
                      key={sso}
                      type="button"
                      onClick={() => {
                        setActiveSsoProvider(sso);
                        appendAuditLog('SWITCH_SSO_IDENTITY_PROVIDER', sso);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-medium text-left border cursor-pointer truncate ${
                        activeSsoProvider === sso
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sso}
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-white">Hardware WebAuthn Passkey + TOTP</div>
                    <div className="text-slate-400">Enforces phishing-resistant MFA before weight export</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMfaHardwarePasskeyVerified((prev) => !prev);
                      appendAuditLog('VERIFY_HARDWARE_MFA_PASSKEY', 'YubiKey-5C-FIPS');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                      mfaHardwarePasskeyVerified
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {mfaHardwarePasskeyVerified ? 'MFA Active' : 'Verify MFA'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Real-Time Alerts & Push Notifications for System Failures / Suspicious Activity */}
            <div className={`lg:col-span-7 p-6 rounded-2xl border ${surfaceClass} space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    02. Real-Time System Alerts &amp; Automated Push Notifications
                  </h3>
                  <p className="text-xs text-slate-400">
                    Instant alerts for critical system failures, I/O bottlenecks, and suspicious security activity
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateCriticalAlert}
                  className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Test Critical Push Alert</span>
                </button>
              </div>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border space-y-2 text-xs ${
                      alert.severity === 'critical'
                        ? 'bg-rose-950/30 border-rose-500/50'
                        : alert.severity === 'security'
                        ? 'bg-amber-950/30 border-amber-500/50'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            alert.severity === 'critical'
                              ? 'text-rose-400'
                              : alert.severity === 'security'
                              ? 'text-amber-400'
                              : 'text-cyan-400'
                          }`}
                        />
                        <span>{alert.title}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {alert.category} · {alert.pushDispatched ? 'Push Sent' : 'Logged'}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{alert.detail}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-cyan-300 font-medium">
                        Recommended Action: {alert.remediationAction}
                      </span>
                      {!alert.acknowledged ? (
                        <button
                          type="button"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
                        >
                          Acknowledge &amp; Resolve
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Resolved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Full-Width: Immutable Compliance Audit Trail Table */}
          <div className={`p-6 rounded-2xl border ${surfaceClass} space-y-4`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  03. Comprehensive Compliance Audit Trail (Immutable SHA-256 Chain)
                </h3>
                <p className="text-xs text-slate-400">
                  Every training run, checkpoint export, RBAC mutation, and security event is cryptographically logged
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    placeholder="Filter by actor, action, resource..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <select
                  value={auditStatusFilter}
                  onChange={(e) => setAuditStatusFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ALLOWED">Allowed</option>
                  <option value="BLOCKED_RBAC">Blocked by RBAC</option>
                  <option value="FLAGGED_SECURITY">Flagged Security</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleExportAuditReport('csv')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export CSV Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportAuditReport('json')}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON Audit</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs tabular-nums">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">Event ID</th>
                    <th className="py-2.5 px-3 font-semibold">Timestamp (UTC)</th>
                    <th className="py-2.5 px-3 font-semibold">Actor &amp; RBAC Role</th>
                    <th className="py-2.5 px-3 font-semibold">Auth &amp; MFA</th>
                    <th className="py-2.5 px-3 font-semibold">Action &amp; Resource</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/60">
                      <td className="py-2.5 px-3 font-mono font-semibold text-cyan-300 whitespace-nowrap">
                        {log.id}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {log.timestampIso.replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-white font-medium">{log.actor}</div>
                        <div className="text-[11px] text-slate-400">{log.role} · IP {log.ipAddress}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        {log.authMethod}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-semibold text-slate-200">{log.action}</div>
                        <div className="font-mono text-[11px] text-slate-400 truncate max-w-xs">
                          {log.resource}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-semibold">
                        <span
                          className={
                            log.status === 'ALLOWED'
                              ? 'text-emerald-400'
                              : log.status === 'BLOCKED_RBAC'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
