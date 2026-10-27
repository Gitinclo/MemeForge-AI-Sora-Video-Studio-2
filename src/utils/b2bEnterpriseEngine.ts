import {
  GpuClusterNodeMetrics,
  LoraLossPoint,
  LoraTrainingJob,
  LoraTrainingPhase,
  SandboxEvaluationRun,
  SandboxLensPreset,
  SandboxAspectRatio,
  SandboxPresetScenario,
  DatasetUploadImage,
} from '../types/b2bEnterprise';
import {
  clampNumber,
  createPrefixedId,
  encodeSvgDataUri,
} from './sharedCoreEngine';

const PHASE_ORDER: LoraTrainingPhase[] = [
  'validating_dataset',
  'extracting_latents',
  'training_lora',
  'compiling_safetensors',
  'completed',
];

function createProductSvgDataUri(
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  label: string,
  sublabel: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}" />
        <stop offset="60%" stop-color="#090d16" />
        <stop offset="100%" stop-color="${secondaryColor}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="48%" r="45%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="800" height="500" fill="url(#bg)" />
    <circle cx="400" cy="240" r="220" fill="url(#glow)" />
    <!-- Travertine / Studio Pedestal -->
    <ellipse cx="400" cy="390" rx="190" ry="34" fill="#1e293b" stroke="${accentColor}" stroke-opacity="0.4" stroke-width="2" />
    <path d="M210 390 L210 440 A190 34 0 0 0 590 440 L590 390 Z" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
    <!-- Hero Product Silhouette -->
    <rect x="330" y="135" width="140" height="235" rx="22" fill="#0b1120" stroke="${accentColor}" stroke-width="3" />
    <rect x="362" y="92" width="76" height="44" rx="8" fill="#1e293b" stroke="${accentColor}" stroke-width="2.5" />
    <rect x="348" y="185" width="104" height="92" rx="10" fill="#111827" stroke="#475569" stroke-width="1.5" />
    <text x="400" y="226" fill="#f8fafc" font-family="sans-serif" font-size="15" font-weight="700" text-anchor="middle" letter-spacing="2">${label}</text>
    <text x="400" y="252" fill="${accentColor}" font-family="monospace" font-size="11" font-weight="600" text-anchor="middle">${sublabel}</text>
  </svg>`;
  return encodeSvgDataUri(svg);
}

export function generateLossCurve(totalSteps: number, currentStep: number): LoraLossPoint[] {
  const points: LoraLossPoint[] = [];
  const interval = Math.max(25, Math.floor(totalSteps / 24));
  for (let step = interval; step <= Math.min(totalSteps, Math.max(interval, currentStep)); step += interval) {
    const progress = step / totalSteps;
    const baseLoss = 0.42 * Math.exp(-2.65 * progress) + 0.048;
    const wave = Math.sin(step * 0.09) * 0.0045;
    const loss = Number(Math.max(0.042, baseLoss + wave).toFixed(4));
    const learningRate = Number((1e-4 * (1 - progress * 0.75)).toExponential(2));
    points.push({ step, loss, learningRate });
  }
  return points;
}

export const INITIAL_LORA_JOBS: LoraTrainingJob[] = [
  {
    id: 'lora-job-aurum-01',
    modelName: 'Maison Aurum No. 9 Flacon',
    triggerToken: 'aurum_flacon_v4',
    brandClient: 'LVMH Prestige Beauty Lab',
    category: 'Luxury Fragrance & Glass',
    phase: 'completed',
    currentStep: 1500,
    totalSteps: 1500,
    datasetImageCount: 18,
    networkRankDim: 64,
    networkAlpha: 32,
    precision: 'BF16',
    estimatedSecondsRemaining: 0,
    currentLoss: 0.0542,
    lossHistory: generateLossCurve(1500, 1500),
    assignedNodeIds: ['node-h100-01', 'node-h100-02'],
    startedAtIso: '2026-10-27T01:10:00Z',
    completedAtIso: '2026-10-27T01:48:00Z',
    safetensorsSizeMb: 288.4,
    sha256Checksum: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    previewImageUrl: createProductSvgDataUri('#1e1b4b', '#0f172a', '#f59e0b', 'MAISON AURUM', 'aurum_flacon_v4'),
    datasetSampleUrls: [
      createProductSvgDataUri('#1e1b4b', '#0f172a', '#f59e0b', 'FRONT 0°', 'Key Light 5600K'),
      createProductSvgDataUri('#0f172a', '#1e293b', '#f59e0b', 'OBLIQUE 45°', 'Rim Specular'),
      createProductSvgDataUri('#172554', '#090d16', '#f59e0b', 'MACRO NECK', 'Embossed Foil'),
      createProductSvgDataUri('#1e1b4b', '#020617', '#f59e0b', 'BACK 180°', 'Refraction Pass'),
    ],
    invariantTargets: {
      logoIntegrityTarget: 99.1,
      geometrySilhouetteIouTarget: 98.4,
      materialPurityTarget: 97.8,
    },
  },
  {
    id: 'lora-job-chrono-02',
    modelName: 'Vanguard Tourbillon Titanium',
    triggerToken: 'vanguard_chrono_x1',
    brandClient: 'Geneva Horology Group',
    category: 'Consumer Electronics',
    phase: 'training_lora',
    currentStep: 1020,
    totalSteps: 1500,
    datasetImageCount: 16,
    networkRankDim: 64,
    networkAlpha: 32,
    precision: 'FP8-Dynamic',
    estimatedSecondsRemaining: 192,
    currentLoss: 0.0785,
    lossHistory: generateLossCurve(1500, 1020),
    assignedNodeIds: ['node-b200-01', 'node-b200-02'],
    startedAtIso: '2026-10-27T01:55:00Z',
    safetensorsSizeMb: 312.0,
    sha256Checksum: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    previewImageUrl: createProductSvgDataUri('#0f172a', '#022c22', '#38bdf8', 'VANGUARD TI', 'vanguard_chrono_x1'),
    datasetSampleUrls: [
      createProductSvgDataUri('#0f172a', '#022c22', '#38bdf8', 'DIAL MACRO', 'Sapphire AR'),
      createProductSvgDataUri('#090d16', '#0f172a', '#38bdf8', 'CROWN PROFILE', 'Brushed Grade 5'),
      createProductSvgDataUri('#0f172a', '#1e293b', '#38bdf8', 'CASEBACK', 'Calibre 9001'),
    ],
    invariantTargets: {
      logoIntegrityTarget: 98.8,
      geometrySilhouetteIouTarget: 98.2,
      materialPurityTarget: 97.4,
    },
  },
  {
    id: 'lora-job-kinetix-03',
    modelName: 'AeroPulse Carbon Runner Pro',
    triggerToken: 'aeropulse_carbon_9',
    brandClient: 'Kinetix Athletics Global',
    category: 'Apparel & Footwear',
    phase: 'extracting_latents',
    currentStep: 280,
    totalSteps: 1200,
    datasetImageCount: 14,
    networkRankDim: 32,
    networkAlpha: 16,
    precision: 'BF16',
    estimatedSecondsRemaining: 410,
    currentLoss: 0.194,
    lossHistory: generateLossCurve(1200, 280),
    assignedNodeIds: ['node-h100-03'],
    startedAtIso: '2026-10-27T02:04:00Z',
    safetensorsSizeMb: 164.8,
    sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    previewImageUrl: createProductSvgDataUri('#064e3b', '#0f172a', '#10b981', 'AEROPULSE 9', 'aeropulse_carbon_9'),
    datasetSampleUrls: [
      createProductSvgDataUri('#064e3b', '#0f172a', '#10b981', 'LATERAL VIEW', 'Carbon Weave'),
      createProductSvgDataUri('#0f172a', '#064e3b', '#10b981', 'OUTSOLE TREAD', 'Specular Grip'),
    ],
    invariantTargets: {
      logoIntegrityTarget: 98.5,
      geometrySilhouetteIouTarget: 97.9,
      materialPurityTarget: 96.8,
    },
  },
];

export const INITIAL_GPU_CLUSTER_NODES: GpuClusterNodeMetrics[] = [
  {
    nodeId: 'node-h100-01',
    hostname: 'dgx-h100-sxm5-west-01.memeforge.enterprise',
    architecture: 'NVIDIA H100 SXM5 (80GB)',
    utilizationPercent: 94,
    vramUsedGb: 74.2,
    vramTotalGb: 80,
    nvlinkBandwidthGbps: 865,
    powerDrawWatts: 665,
    powerCapWatts: 700,
    junctionTempCelsius: 68,
    activeJobId: 'lora-job-aurum-01',
  },
  {
    nodeId: 'node-h100-02',
    hostname: 'dgx-h100-sxm5-west-02.memeforge.enterprise',
    architecture: 'NVIDIA H100 SXM5 (80GB)',
    utilizationPercent: 91,
    vramUsedGb: 71.8,
    vramTotalGb: 80,
    nvlinkBandwidthGbps: 842,
    powerDrawWatts: 648,
    powerCapWatts: 700,
    junctionTempCelsius: 66,
    activeJobId: 'lora-job-aurum-01',
  },
  {
    nodeId: 'node-b200-01',
    hostname: 'hgx-b200-blackwell-01.memeforge.enterprise',
    architecture: 'NVIDIA B200 Blackwell (192GB)',
    utilizationPercent: 98,
    vramUsedGb: 168.4,
    vramTotalGb: 192,
    nvlinkBandwidthGbps: 1740,
    powerDrawWatts: 940,
    powerCapWatts: 1000,
    junctionTempCelsius: 64,
    activeJobId: 'lora-job-chrono-02',
  },
  {
    nodeId: 'node-h100-03',
    hostname: 'dgx-h100-sxm5-west-03.memeforge.enterprise',
    architecture: 'NVIDIA H100 SXM5 (80GB)',
    utilizationPercent: 87,
    vramUsedGb: 66.5,
    vramTotalGb: 80,
    nvlinkBandwidthGbps: 790,
    powerDrawWatts: 615,
    powerCapWatts: 700,
    junctionTempCelsius: 63,
    activeJobId: 'lora-job-kinetix-03',
  },
];

export const SANDBOX_PRESET_SCENARIOS: SandboxPresetScenario[] = [
  {
    id: 'preset-travertine-macro',
    title: 'Studio Macro Travertine Pedestal',
    subtitle: 'Micro-surface reflections, glass refractivity, logo stamp',
    focusArea: 'Optical Refraction & Specular Caustics',
    promptTemplate:
      'Commercial studio product shot of {{token}} resting on a honed Roman travertine stone pedestal, warm golden-hour rim lighting, crisp caustic glass reflections, 8K phase-one medium format.',
    recommendedLens: '50mm Macro Probe Lens',
    recommendedAspectRatio: '16:9',
    recommendedSteps: 40,
    baselineScores: {
      logoIntegrity: 99.4,
      geometrySilhouetteIou: 98.9,
      materialPurity: 98.6,
    },
    lightingSetup: 'Dual Profoto Softboxes + 5600K Rim Key',
    referenceRenderSvg: createProductSvgDataUri('#1c1917', '#0f172a', '#f59e0b', 'TRAVERTINE MACRO', 'Caustic Glass Pass'),
  },
  {
    id: 'preset-high-motion-drift',
    title: 'High Motion & Particle Drift',
    subtitle: 'Kinetic stability, silhouette non-deformation',
    focusArea: 'Temporal Silhouette Lock at 120fps',
    promptTemplate:
      'High-speed phantom flex 1000fps tracking shot of {{token}} suspended amidst slow-motion micro-droplets and gold dust particles, zero geometry warping, razor-sharp brand typography.',
    recommendedLens: 'FPV Dynamic Drone Orbit',
    recommendedAspectRatio: '16:9',
    recommendedSteps: 45,
    baselineScores: {
      logoIntegrity: 98.7,
      geometrySilhouetteIou: 98.2,
      materialPurity: 97.9,
    },
    lightingSetup: 'High-Speed Strobe Array (1/12,000s)',
    referenceRenderSvg: createProductSvgDataUri('#0f172a', '#1e1b4b', '#38bdf8', '1000FPS PARTICLE', 'Zero Mesh Drift'),
  },
  {
    id: 'preset-chiaroscuro-lowkey',
    title: 'Dramatic Low-Key Chiaroscuro',
    subtitle: 'High dynamic range shadows, specular highlights',
    focusArea: 'HDR Shadow Roll-Off & Anodized Metallic Sheen',
    promptTemplate:
      'Moody luxury chiaroscuro cinematography of {{token}} emerging from obsidian shadow, single narrowFresnel spot grazing the metallic bezel and engraved emblem, 16-stop dynamic range.',
    recommendedLens: '85mm Anamorphic Panavision',
    recommendedAspectRatio: '21:9',
    recommendedSteps: 40,
    baselineScores: {
      logoIntegrity: 99.1,
      geometrySilhouetteIou: 98.7,
      materialPurity: 99.0,
    },
    lightingSetup: 'Single 15° Fresnel Barn-Door Spot + Negative Fill',
    referenceRenderSvg: createProductSvgDataUri('#090d16', '#020617', '#a855f7', 'CHIAROSCURO HDR', '16-Stop Contrast'),
  },
  {
    id: 'preset-lifestyle-hands',
    title: 'Lifestyle Hands Interaction',
    subtitle: 'Human grasp physics, scale occlusion',
    focusArea: 'Articulated Finger Occlusion & True Physical Scale',
    promptTemplate:
      'Natural editorial close-up of a model holding {{token}} in soft morning penthouse daylight, accurate ergonomic scale, realistic finger contact shadows without obscuring the primary brand mark.',
    recommendedLens: '35mm Prime Arri Alexa',
    recommendedAspectRatio: '9:16',
    recommendedSteps: 35,
    baselineScores: {
      logoIntegrity: 98.5,
      geometrySilhouetteIou: 98.1,
      materialPurity: 97.6,
    },
    lightingSetup: 'Diffused Daylight Scrim + Warm Bounce',
    referenceRenderSvg: createProductSvgDataUri('#1e293b', '#0f172a', '#10b981', 'HUMAN SCALE LOCK', 'Occlusion Verified'),
  },
  {
    id: 'preset-micro-typography-foil',
    title: 'Micro-Typography & Foil Stamp',
    subtitle: 'Kerning preservation, embossed gold foil',
    focusArea: 'Sub-Millimeter Serif Kerning & Hot-Stamped Foil',
    promptTemplate:
      'Extreme macro inspection of {{token}} label typography, 24k hot-stamped gold foil relief on textured cotton paper, zero character hallucination, exact vector kerning fidelity.',
    recommendedLens: '50mm Macro Probe Lens',
    recommendedAspectRatio: '1:1',
    recommendedSteps: 50,
    baselineScores: {
      logoIntegrity: 99.7,
      geometrySilhouetteIou: 99.2,
      materialPurity: 98.8,
    },
    lightingSetup: 'Cross-Polarized Ring Light + Specular Kicker',
    referenceRenderSvg: createProductSvgDataUri('#27272a', '#090d16', '#fbbf24', 'FOIL KERNING 99.7%', 'Vector Glyph Lock'),
  },
];

export function resolvePhaseForStep(currentStep: number, totalSteps: number): LoraTrainingPhase {
  if (totalSteps <= 0) return 'validating_dataset';
  const ratio = currentStep / totalSteps;
  if (ratio >= 1) return 'completed';
  if (ratio >= 0.9) return 'compiling_safetensors';
  if (ratio >= 0.18) return 'training_lora';
  if (ratio >= 0.05) return 'extracting_latents';
  return 'validating_dataset';
}

export function advanceTrainingJobTick(job: LoraTrainingJob, stepDelta = 35): LoraTrainingJob {
  if (job.phase === 'completed' || job.phase === 'paused' || job.phase === 'failed') {
    return job;
  }
  const nextStep = Math.min(job.totalSteps, job.currentStep + Math.max(1, stepDelta));
  const nextPhase = resolvePhaseForStep(nextStep, job.totalSteps);
  const remainingSteps = Math.max(0, job.totalSteps - nextStep);
  const estimatedSecondsRemaining = Math.round(remainingSteps * 0.4);
  const progress = nextStep / job.totalSteps;
  const nextLoss = Number(Math.max(0.044, 0.42 * Math.exp(-2.65 * progress) + 0.048).toFixed(4));

  return {
    ...job,
    currentStep: nextStep,
    phase: nextPhase,
    estimatedSecondsRemaining,
    currentLoss: nextLoss,
    lossHistory: generateLossCurve(job.totalSteps, nextStep),
    completedAtIso: nextPhase === 'completed' ? new Date().toISOString() : job.completedAtIso,
  };
}

export function perturbGpuClusterTelemetry(
  nodes: GpuClusterNodeMetrics[],
  activeJobs: LoraTrainingJob[]
): GpuClusterNodeMetrics[] {
  const runningJobIds = new Set(
    activeJobs
      .filter((j) => j.phase !== 'completed' && j.phase !== 'paused' && j.phase !== 'failed')
      .map((j) => j.id)
  );

  return nodes.map((node, idx) => {
    const isBusy = node.activeJobId ? runningJobIds.has(node.activeJobId) : false;
    const delta = ((idx % 2 === 0 ? 1 : -1) * ((Date.now() / 1000) % 3)) | 0;
    const utilizationPercent = isBusy
      ? clampNumber(node.utilizationPercent + delta, 84, 99)
      : clampNumber(18 + delta, 12, 28);
    const powerDrawWatts = isBusy
      ? clampNumber(node.powerDrawWatts + delta * 4, 580, node.powerCapWatts)
      : Math.max(160, Math.round(node.powerCapWatts * 0.25));

    return {
      ...node,
      utilizationPercent,
      powerDrawWatts,
    };
  });
}

export function injectTriggerTokenIntoPrompt(promptTemplate: string, triggerToken: string): string {
  const cleanToken = triggerToken.trim() || 'product_token_v1';
  if (promptTemplate.includes('{{token}}')) {
    return promptTemplate.replace(/\{\{token\}\}/g, cleanToken);
  }
  if (promptTemplate.toLowerCase().includes(cleanToken.toLowerCase())) {
    return promptTemplate;
  }
  return `${promptTemplate.trim()} (featuring ${cleanToken})`;
}

export function evaluateSandboxConsistency(params: {
  job: LoraTrainingJob;
  preset: SandboxPresetScenario;
  customPrompt?: string;
  lens: SandboxLensPreset;
  aspectRatio: SandboxAspectRatio;
  inferenceSteps: number;
  cfgScale?: number;
}): SandboxEvaluationRun {
  const {
    job,
    preset,
    customPrompt,
    lens,
    aspectRatio,
    inferenceSteps,
    cfgScale = 7.5,
  } = params;

  const resolvedPrompt = injectTriggerTokenIntoPrompt(
    customPrompt && customPrompt.trim().length > 0 ? customPrompt : preset.promptTemplate,
    job.triggerToken
  );

  const stepBonus = Math.min(0.6, Math.max(-0.8, (inferenceSteps - 35) * 0.03));
  const rankBonus = job.networkRankDim >= 64 ? 0.25 : 0;
  const completionPenalty = job.phase === 'completed' ? 0 : -1.2;

  const logoIntegrity = Number(
    Math.min(99.9, Math.max(94.0, preset.baselineScores.logoIntegrity + stepBonus + rankBonus + completionPenalty)).toFixed(1)
  );
  const geometrySilhouetteIou = Number(
    Math.min(99.8, Math.max(93.5, preset.baselineScores.geometrySilhouetteIou + stepBonus + rankBonus + completionPenalty)).toFixed(1)
  );
  const materialPurity = Number(
    Math.min(99.7, Math.max(93.0, preset.baselineScores.materialPurity + stepBonus + rankBonus + completionPenalty)).toFixed(1)
  );
  const overallConsistency = Number(
    ((logoIntegrity + geometrySilhouetteIou + materialPurity) / 3).toFixed(1)
  );

  const passedEnterpriseThreshold =
    logoIntegrity >= 98.0 && geometrySilhouetteIou >= 97.5 && materialPurity >= 97.0;

  return {
    id: createPrefixedId('eval'),
    jobId: job.id,
    modelName: job.modelName,
    triggerToken: job.triggerToken,
    presetId: preset.id,
    resolvedPrompt,
    lens,
    aspectRatio,
    inferenceSteps,
    cfgScale,
    seed: 84920144,
    timestampIso: new Date().toISOString(),
    inferenceLatencyMs: Math.round(620 + inferenceSteps * 14),
    scores: {
      logoIntegrity,
      geometrySilhouetteIou,
      materialPurity,
      overallConsistency,
    },
    passedEnterpriseThreshold,
  };
}

export function formatDurationEta(seconds: number): string {
  if (seconds <= 0) return 'Completed (0s)';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s remaining`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s remaining`;
}

export function generateDefaultCalibrationDataset(productLabel: string): DatasetUploadImage[] {
  const angles = [
    '01. Front Hero 0°',
    '02. Three-Quarter Left 45°',
    '03. Three-Quarter Right 45°',
    '04. Profile Left 90°',
    '05. Profile Right 90°',
    '06. Rear Elevation 180°',
    '07. Top-Down Plan 90°',
    '08. Low-Angle Hero 15°',
    '09. Macro Logo Stamp',
    '10. Macro Material Grain',
    '11. Rim-Lit Silhouette',
    '12. Hard Daylight Key',
  ];

  return angles.map((angle, idx) => ({
    id: `calib-img-${idx + 1}`,
    filename: `${productLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${idx + 1}.png`,
    angleLabel: angle,
    lightingLabel: idx % 2 === 0 ? 'D65 Neutral Softbox' : '5600K Specular Rim',
    resolution: '4096 × 4096 px (16-bit PNG)',
    qualityScore: Number((98.4 + (idx % 3) * 0.5).toFixed(1)),
    previewDataUri: createProductSvgDataUri(
      idx % 2 === 0 ? '#0f172a' : '#1e1b4b',
      '#090d16',
      '#38bdf8',
      angle.toUpperCase(),
      productLabel.slice(0, 20)
    ),
  }));
}

export function getTrainingPhaseOrder(): LoraTrainingPhase[] {
  return [...PHASE_ORDER];
}
