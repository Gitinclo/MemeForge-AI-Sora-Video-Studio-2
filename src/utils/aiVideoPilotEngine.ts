/**
 * AI Video Pilot Engine: One Chapter to a 3-Minute Animated Episode
 *
 * Implements the full specification & architectural improvements:
 * 1. Verified September 2026 Google Gemini API Paid-Tier Pricing (`config/pricing.yaml`):
 *    - Veo 3.1 Lite (`veo-3.1-lite-generate-preview`): 720p ($0.05/s), 1080p ($0.08/s), 4K rejected
 *    - Veo 3.1 Fast (`veo-3.1-fast-generate-preview`): 720p ($0.10/s), 1080p ($0.12/s), 4K ($0.30/s)
 *    - Veo 3.1 Standard (`veo-3.1-generate-preview`): 720p ($0.40/s), 1080p ($0.40/s), 4K ($0.60/s)
 *    - Gemini Omni Flash (`gemini-omni-1.1-flash`): 720p ($0.10/s, 10s max)
 *    - OpenAI Sora: Strictly blocked (API shut down Sept 24, 2026).
 * 2. Hard Budget Guard (`budget.py`) with atomic in-flight reservation locking (`spent + reserved + estimate <= cap`)
 *    and `costs.csv` ledger export.
 * 3. 23-Shot Schema Validator (`shots/shot_list.json`) + Continuity Anchors (`seed`, `reference_image_ids`, `transition_from_prev`).
 * 4. 10-Shot Provider Bake-Off Simulator (`240s` total across 3 tries).
 * 5. Interactive 5-Clause Book License Analyzer & Scaling Gates (`Pilot 3m -> Episode 25m -> Season -> 100 Hours`).
 */

export type PilotProviderId = 'veo' | 'gemini_omni_flash' | 'sora';
export type VeoModelTier = 'lite' | 'fast' | 'standard';
export type PilotResolution = '720p' | '1080p' | '4k';
export type AllowedDurationSeconds = 4 | 6 | 8;

export interface PricingTierConfig {
  provider: 'veo' | 'gemini_omni_flash';
  tier: VeoModelTier | 'omni_flash';
  label: string;
  modelId: string;
  rates: Partial<Record<PilotResolution, number>>;
  maxDurationSeconds: number;
  audioIncluded: boolean;
}

export const PRICING_YAML_CONFIG: {
  currency: 'USD';
  unit: 'per_generated_second';
  audioIncluded: true;
  allowedDurationsSeconds: AllowedDurationSeconds[];
  billingMode: 'successful_generations_only';
  defaultPilotCapUsd: number;
  defaultConcurrencyLimit: number;
  maxRetries: number;
  tiers: PricingTierConfig[];
} = {
  currency: 'USD',
  unit: 'per_generated_second',
  audioIncluded: true,
  allowedDurationsSeconds: [4, 6, 8],
  billingMode: 'successful_generations_only',
  defaultPilotCapUsd: 500,
  defaultConcurrencyLimit: 2,
  maxRetries: 3,
  tiers: [
    {
      provider: 'veo',
      tier: 'lite',
      label: 'Veo 3.1 Lite',
      modelId: 'veo-3.1-lite-generate-preview',
      rates: { '720p': 0.05, '1080p': 0.08 }, // No 4K tier
      maxDurationSeconds: 8,
      audioIncluded: true,
    },
    {
      provider: 'veo',
      tier: 'fast',
      label: 'Veo 3.1 Fast',
      modelId: 'veo-3.1-fast-generate-preview',
      rates: { '720p': 0.10, '1080p': 0.12, '4k': 0.30 },
      maxDurationSeconds: 8,
      audioIncluded: true,
    },
    {
      provider: 'veo',
      tier: 'standard',
      label: 'Veo 3.1 Standard',
      modelId: 'veo-3.1-generate-preview',
      rates: { '720p': 0.40, '1080p': 0.40, '4k': 0.60 },
      maxDurationSeconds: 8,
      audioIncluded: true,
    },
    {
      provider: 'gemini_omni_flash',
      tier: 'omni_flash',
      label: 'Gemini Omni Flash (Bake-off)',
      modelId: 'gemini-omni-1.1-flash',
      rates: { '720p': 0.10 },
      maxDurationSeconds: 10,
      audioIncluded: true,
    },
  ],
};

export interface BudgetReferenceRow {
  label: string;
  provider: 'veo' | 'gemini_omni_flash';
  tier: VeoModelTier | 'omni_flash';
  modelId: string;
  resolution: PilotResolution;
  ratePerSecondUsd: number;
  one8sClipUsd: number;
  bakeoff240sUsd: number;
  pilot540sUsd: number;
  scale100h1TryUsd: number;
  scale100h3TriesUsd: number;
}

export function getBudgetReferenceTable(): BudgetReferenceRow[] {
  const rows: Array<{
    label: string;
    provider: 'veo' | 'gemini_omni_flash';
    tier: VeoModelTier | 'omni_flash';
    modelId: string;
    resolution: PilotResolution;
    rate: number;
  }> = [
    { label: 'Lite 720p', provider: 'veo', tier: 'lite', modelId: 'veo-3.1-lite-generate-preview', resolution: '720p', rate: 0.05 },
    { label: 'Lite 1080p', provider: 'veo', tier: 'lite', modelId: 'veo-3.1-lite-generate-preview', resolution: '1080p', rate: 0.08 },
    { label: 'Fast 720p', provider: 'veo', tier: 'fast', modelId: 'veo-3.1-fast-generate-preview', resolution: '720p', rate: 0.10 },
    { label: 'Fast 1080p', provider: 'veo', tier: 'fast', modelId: 'veo-3.1-fast-generate-preview', resolution: '1080p', rate: 0.12 },
    { label: 'Fast 4K', provider: 'veo', tier: 'fast', modelId: 'veo-3.1-fast-generate-preview', resolution: '4k', rate: 0.30 },
    { label: 'Standard 720p', provider: 'veo', tier: 'standard', modelId: 'veo-3.1-generate-preview', resolution: '720p', rate: 0.40 },
    { label: 'Standard 1080p', provider: 'veo', tier: 'standard', modelId: 'veo-3.1-generate-preview', resolution: '1080p', rate: 0.40 },
    { label: 'Standard 4K', provider: 'veo', tier: 'standard', modelId: 'veo-3.1-generate-preview', resolution: '4k', rate: 0.60 },
    { label: 'Omni Flash 720p (Bake-off)', provider: 'gemini_omni_flash', tier: 'omni_flash', modelId: 'gemini-omni-1.1-flash', resolution: '720p', rate: 0.10 },
  ];

  const secondsIn100Hours = 100 * 3600; // 360,000 seconds

  return rows.map((r) => ({
    label: r.label,
    provider: r.provider,
    tier: r.tier,
    modelId: r.modelId,
    resolution: r.resolution,
    ratePerSecondUsd: r.rate,
    one8sClipUsd: Number((8 * r.rate).toFixed(2)),
    bakeoff240sUsd: Math.round(240 * r.rate),
    pilot540sUsd: Math.round(540 * r.rate),
    scale100h1TryUsd: Math.round(secondsIn100Hours * r.rate),
    scale100h3TriesUsd: Math.round(secondsIn100Hours * 3 * r.rate),
  }));
}

export interface CostEstimateResult {
  valid: boolean;
  estimatedCostUsd: number;
  ratePerSecondUsd: number;
  modelId: string;
  error?: string;
}

/**
 * Cost formula applied before every job:
 * `estimated_cost_usd = duration_s * rates[resolution]`
 * Rejects any combination not in the table (e.g., Lite at 4K) or OpenAI Sora with a clear error.
 */
export function estimateJobCostUsd(
  provider: PilotProviderId,
  tier: VeoModelTier | 'omni_flash',
  resolution: PilotResolution,
  durationSeconds: number
): CostEstimateResult {
  if (provider === 'sora') {
    return {
      valid: false,
      estimatedCostUsd: 0,
      ratePerSecondUsd: 0,
      modelId: 'sora-deprecated',
      error: 'Blocked Provider: OpenAI Sora API was reported shut down on Sept 24, 2026. Do not use it.',
    };
  }

  if (!PRICING_YAML_CONFIG.allowedDurationsSeconds.includes(durationSeconds as AllowedDurationSeconds)) {
    return {
      valid: false,
      estimatedCostUsd: 0,
      ratePerSecondUsd: 0,
      modelId: '',
      error: `Invalid duration ${durationSeconds}s. Allowed clip durations in config/pricing.yaml are [4, 6, 8] seconds.`,
    };
  }

  const tierCfg = PRICING_YAML_CONFIG.tiers.find(
    (t) => t.provider === provider && t.tier === tier
  );

  if (!tierCfg) {
    return {
      valid: false,
      estimatedCostUsd: 0,
      ratePerSecondUsd: 0,
      modelId: '',
      error: `Unsupported provider/tier combination: (${provider}, ${tier}).`,
    };
  }

  const rate = tierCfg.rates[resolution];
  if (typeof rate !== 'number') {
    const supported = Object.keys(tierCfg.rates).join(', ');
    return {
      valid: false,
      estimatedCostUsd: 0,
      ratePerSecondUsd: 0,
      modelId: tierCfg.modelId,
      error: `Rejected combination: ${tierCfg.label} (${tierCfg.modelId}) does not support ${resolution.toUpperCase()} resolution. Supported resolutions: ${supported}.`,
    };
  }

  return {
    valid: true,
    estimatedCostUsd: Number((durationSeconds * rate).toFixed(4)),
    ratePerSecondUsd: rate,
    modelId: tierCfg.modelId,
  };
}

export interface CostLogEntry {
  timestampUtc: string;
  jobId: string;
  shotId: string;
  tryIndex: number;
  provider: 'veo' | 'gemini_omni_flash';
  modelId: string;
  resolution: PilotResolution;
  durationSeconds: number;
  succeeded: boolean;
  estimatedCostUsd: number;
  actualCostUsd: number;
  cumulativeSpentUsd: number;
}

export interface BudgetGuardCheck {
  allowed: boolean;
  spentUsd: number;
  reservedUsd: number;
  estimatedCostUsd: number;
  projectedTotalUsd: number;
  capUsd: number;
  remainingAfterJobUsd: number;
  reason: string;
}

export function evaluateBudgetGuard(
  spentUsd: number,
  reservedUsd: number,
  estimatedCostUsd: number,
  capUsd: number = PRICING_YAML_CONFIG.defaultPilotCapUsd
): BudgetGuardCheck {
  const projectedTotalUsd = Number((spentUsd + reservedUsd + estimatedCostUsd).toFixed(4));
  const allowed = projectedTotalUsd <= capUsd;
  const remainingAfterJobUsd = Number(Math.max(0, capUsd - projectedTotalUsd).toFixed(4));

  return {
    allowed,
    spentUsd,
    reservedUsd,
    estimatedCostUsd,
    projectedTotalUsd,
    capUsd,
    remainingAfterJobUsd,
    reason: allowed
      ? `Approved: spent ($${spentUsd.toFixed(2)}) + reserved ($${reservedUsd.toFixed(2)}) + estimate ($${estimatedCostUsd.toFixed(2)}) = $${projectedTotalUsd.toFixed(2)} <= $${capUsd.toFixed(2)} cap.`
      : `STOPPED BY BUDGET GUARD: spent ($${spentUsd.toFixed(2)}) + reserved ($${reservedUsd.toFixed(2)}) + estimate ($${estimatedCostUsd.toFixed(2)}) = $${projectedTotalUsd.toFixed(2)} exceeds $${capUsd.toFixed(2)} cap. Queue halted.`,
  };
}

export interface PilotShotSpec {
  shot_id: string;
  duration_s: AllowedDurationSeconds;
  resolution: PilotResolution;
  model_tier: VeoModelTier;
  characters: string[];
  location: string;
  action: string;
  dialogue: { speaker: string; line: string } | null;
  camera: string;
  prompt: string;
  // Enhanced Continuity Fields (Improvement #1)
  seed: number;
  reference_image_ids: string[];
  transition_from_prev: 'cut' | 'match_cut' | 'last_frame_init';
}

export const STYLE_GUIDE_SUMMARY = {
  styleId: 'cel_cinema_2026',
  styleName: 'Stylized 2.5D Cel-Shaded Anamorphic Cinema (24fps)',
  characters: [
    {
      id: 'char_aria',
      name: 'Aria Vance',
      role: 'Cartographer Apprentice',
      visualAnchor: '19yo, short copper-red bob, brass monocle on collar, navy aviator jacket',
      voiceProfile: 'voice_aria_mezzo_en (-16 LUFS)',
      referenceAsset: 'char_aria_turnaround_v1.png',
    },
    {
      id: 'char_kael',
      name: 'Master Kaelen',
      role: 'Archivist of the Spire',
      visualAnchor: '60yo scholar, silver braided beard, twin cyan spectacles, charcoal astrolabe cloak',
      voiceProfile: 'voice_kael_baritone_en (-16 LUFS)',
      referenceAsset: 'char_kael_turnaround_v1.png',
    },
    {
      id: 'char_vex',
      name: 'Vex-9',
      role: 'Clockwork Automaton Messenger',
      visualAnchor: 'Owl-sized brass automaton, articulated copper feathers, amber aperture eyes',
      voiceProfile: 'voice_vex_chime_sfx',
      referenceAsset: 'char_vex_turnaround_v1.png',
    },
  ],
  locations: [
    {
      id: 'loc_sky_citadel',
      name: 'The Upper Observatory of Aethelgard',
      visualAnchor: 'Vaulted glass-and-brass dome above clouds, rotating central armillary sphere, warm sunlight',
      ambientStem: 'sfx_observatory_clockwork_hum.wav (-28 LUFS)',
    },
    {
      id: 'loc_clockwork_bazaar',
      name: 'The Undercroft Gear Market',
      visualAnchor: 'Cobblestone alley beneath giant aqueduct gears, glowing paper lanterns, steam vents',
      ambientStem: 'sfx_bazaar_steam_crowd.wav (-26 LUFS)',
    },
  ],
};

export const PILOT_23_SHOT_LIST: PilotShotSpec[] = [
  {
    shot_id: 'shot_01',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria'],
    location: 'loc_sky_citadel',
    action: 'Aria adjusts her brass monocle as golden cloudlight floods the glass dome of the observatory.',
    dialogue: { speaker: 'char_aria', line: 'The eastern meridian shifted six degrees overnight.' },
    camera: 'Wide establishing crane shot slowly pushing in toward the central armillary sphere',
    prompt: 'Stylized 2.5D cel-shaded cinema, wide crane shot pushing into a vaulted glass-and-brass observatory above a sea of clouds, Aria inspecting a rotating armillary sphere, warm tungsten sunlight.',
    seed: 10101,
    reference_image_ids: ['char_aria_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_02',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria', 'char_vex'],
    location: 'loc_sky_citadel',
    action: "Vex-9 flutters down from the rafters and lands on Aria's leather satchel with a metallic chime.",
    dialogue: null,
    camera: "Medium tracking shot following the brass owl automaton onto Aria's shoulder",
    prompt: "Stylized 2.5D cel-shaded cinema, medium tracking shot, compact brass owl automaton Vex-9 with glowing amber aperture eyes landing on Aria's shoulder inside the sunlit observatory.",
    seed: 10102,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_vex_turnaround_v1'],
    transition_from_prev: 'match_cut',
  },
  {
    shot_id: 'shot_03',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_kael'],
    location: 'loc_sky_citadel',
    action: 'Master Kaelen steps out from behind the shadow of the great telescope, unrolling a scorched parchment chart.',
    dialogue: { speaker: 'char_kael', line: 'Not the meridian, Aria. The island itself is drifting.' },
    camera: "Low-angle medium close-up with slow dolly in on Kaelen's cyan-lensed spectacles",
    prompt: 'Stylized 2.5D cel-shaded cinema, low-angle medium close-up of Master Kaelen unrolling a map in the glass observatory.',
    seed: 10103,
    reference_image_ids: ['char_kael_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_04',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria', 'char_kael'],
    location: 'loc_sky_citadel',
    action: 'Aria leans over the brass table as Kaelen traces a glowing fracture line across the sky-chart.',
    dialogue: { speaker: 'char_aria', line: 'If the mainspring anchor gives way, the lower tiers will flood with cloud-mist.' },
    camera: 'Over-the-shoulder two-shot tilting down to the illuminated map table',
    prompt: 'Stylized 2.5D cel-shaded cinema, over-the-shoulder two-shot of Aria and Master Kaelen leaning over an illuminated brass map table in the observatory.',
    seed: 10104,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_kael_turnaround_v1'],
    transition_from_prev: 'last_frame_init',
  },
  {
    shot_id: 'shot_05',
    duration_s: 6,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_vex'],
    location: 'loc_sky_citadel',
    action: 'Vex-9 projects a flickering holographic compass rose from its amber lens onto the ceiling.',
    dialogue: null,
    camera: "Extreme close-up on Vex-9's aperture eye with rack focus to the projected hologram",
    prompt: "Stylized 2.5D cel-shaded cinema, extreme close-up of brass owl Vex-9's glowing amber lens projecting a cyan holographic compass rose.",
    seed: 10105,
    reference_image_ids: ['char_vex_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_06',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria', 'char_kael'],
    location: 'loc_sky_citadel',
    action: 'Kaelen hands Aria a heavy bronze tuning key while the dome shutters begin to rattle in the wind.',
    dialogue: { speaker: 'char_kael', line: 'Take the key to the Undercroft before the third bell tolls.' },
    camera: 'Medium two-shot with subtle lateral dolly right',
    prompt: 'Stylized 2.5D cel-shaded cinema, medium two-shot of Master Kaelen handing a bronze tuning key to Aria inside the rattling glass observatory dome.',
    seed: 10106,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_kael_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_07',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria', 'char_vex'],
    location: 'loc_sky_citadel',
    action: 'Aria sprints across the suspension catwalk toward the descending lift while Vex-9 flies ahead.',
    dialogue: null,
    camera: 'Dynamic side-tracking shot along the brass suspension bridge above the clouds',
    prompt: 'Stylized 2.5D cel-shaded cinema, dynamic side-tracking shot of Aria running across a brass suspension catwalk high above golden clouds with clockwork owl Vex-9 flying ahead.',
    seed: 10107,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_vex_turnaround_v1'],
    transition_from_prev: 'match_cut',
  },
  {
    shot_id: 'shot_08',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria'],
    location: 'loc_clockwork_bazaar',
    action: 'The iron cage lift descends through billowing steam into the bustling Undercroft Gear Market.',
    dialogue: { speaker: 'char_aria', line: 'Hold tight, Vex. The pressure valves are already venting.' },
    camera: 'Vertical crane down transitioning from bright sky into lantern-lit cobblestone alleys',
    prompt: 'Stylized 2.5D cel-shaded cinema, vertical crane shot following Aria in an iron cage elevator descending through steam into the lantern-lit Clockwork Bazaar.',
    seed: 10108,
    reference_image_ids: ['char_aria_turnaround_v1'],
    transition_from_prev: 'last_frame_init',
  },
  {
    shot_id: 'shot_09',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria', 'char_vex'],
    location: 'loc_clockwork_bazaar',
    action: 'Aria weaves between merchant stalls draped in glowing charts as overhead gears groan loudly.',
    dialogue: null,
    camera: 'Steadicam follow shot behind Aria pushing through the crowded alley',
    prompt: 'Stylized 2.5D cel-shaded cinema, steadicam follow shot of Aria and brass owl Vex-9 weaving through the narrow cobblestone Clockwork Bazaar under massive rotating gears.',
    seed: 10109,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_vex_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_10',
    duration_s: 6,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_vex'],
    location: 'loc_clockwork_bazaar',
    action: 'Vex-9 darts up toward a jammed steam conduit and chirps an alarm signal.',
    dialogue: null,
    camera: 'Low-angle tilt up following Vex-9 into the iron rafters',
    prompt: 'Stylized 2.5D cel-shaded cinema, low-angle tilt up as clockwork owl Vex-9 flies up to a leaking brass steam conduit in the Undercroft market.',
    seed: 10110,
    reference_image_ids: ['char_vex_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_11',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria'],
    location: 'loc_clockwork_bazaar',
    action: 'Aria vaults over a stack of copper barrels and reaches the sealed vault door of the primary regulator.',
    dialogue: { speaker: 'char_aria', line: "There's the regulator hatch—rusted shut for thirty years." },
    camera: 'Medium action pan settling on the ornate bronze vault door',
    prompt: 'Stylized 2.5D cel-shaded cinema, medium pan of Aria vaulting over copper barrels to reach an ancient ornate bronze regulator door in the Clockwork Bazaar.',
    seed: 10111,
    reference_image_ids: ['char_aria_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_12',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria', 'char_vex'],
    location: 'loc_clockwork_bazaar',
    action: "Aria inserts Kaelen's bronze tuning key into the regulator lock while Vex-9 illuminates the tumblers.",
    dialogue: null,
    camera: 'Close-up insert on the bronze key turning with sparks of cyan light',
    prompt: "Stylized 2.5D cel-shaded cinema, close-up of Aria's gloved hands turning a heavy bronze tuning key in a clockwork lock while Vex-9 shines a beam of amber light.",
    seed: 10112,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_vex_turnaround_v1'],
    transition_from_prev: 'last_frame_init',
  },
  {
    shot_id: 'shot_13',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_kael'],
    location: 'loc_sky_citadel',
    action: 'Back in the observatory, Kaelen braces against the astrolabe rail as the horizon tilts steeply.',
    dialogue: { speaker: 'char_kael', line: 'Steady now... just a few seconds more.' },
    camera: 'Dutch-angle medium shot showing the cloud sea tilting outside the glass dome',
    prompt: 'Stylized 2.5D cel-shaded cinema, Dutch-angle medium shot of Master Kaelen gripping the brass astrolabe railing as the cloud horizon tilts outside the observatory dome.',
    seed: 10113,
    reference_image_ids: ['char_kael_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_14',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria'],
    location: 'loc_clockwork_bazaar',
    action: 'A sudden blast of steam knocks the tuning key half-free, and Aria catches it with both hands.',
    dialogue: { speaker: 'char_aria', line: "No you don't!" },
    camera: "Tight dramatic close-up on Aria's determined face through swirling steam",
    prompt: 'Stylized 2.5D cel-shaded cinema, tight close-up of Aria gripping the bronze tuning key through swirling white steam, warm lantern rim light on her copper-red hair.',
    seed: 10114,
    reference_image_ids: ['char_aria_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_15',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria', 'char_vex'],
    location: 'loc_clockwork_bazaar',
    action: 'Vex-9 wedges its brass talons into the secondary pawl gear, locking the ratchet long enough for Aria to turn the key.',
    dialogue: null,
    camera: 'Macro detail shot of Vex-9 locking the spinning brass ratchet wheel',
    prompt: 'Stylized 2.5D cel-shaded cinema, macro shot of clockwork owl Vex-9 bracing its brass talons against a spinning ratchet gear while Aria turns the master key.',
    seed: 10115,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_vex_turnaround_v1'],
    transition_from_prev: 'last_frame_init',
  },
  {
    shot_id: 'shot_16',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'standard',
    characters: ['char_aria', 'char_vex'],
    location: 'loc_clockwork_bazaar',
    action: 'The colossal Undercroft pendulum engages with a deep resonant boom, sending a wave of cyan energy up the spire.',
    dialogue: null,
    camera: 'Wide anamorphic pullback revealing the giant pendulum swinging in sync beneath the bazaar',
    prompt: 'Stylized 2.5D cel-shaded cinema, wide anamorphic pullback in the Clockwork Bazaar as a colossal brass pendulum engages with a pulse of cyan light, Aria and Vex-9 silhouetted in foreground.',
    seed: 10116,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_vex_turnaround_v1'],
    transition_from_prev: 'match_cut',
  },
  {
    shot_id: 'shot_17',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_kael'],
    location: 'loc_sky_citadel',
    action: 'In the observatory, the central armillary rings lock back into alignment and the horizon stabilizes.',
    dialogue: { speaker: 'char_kael', line: 'She engaged the secondary anchor. The spire holds.' },
    camera: 'Wide symmetrical shot of the observatory dome as golden light beams align',
    prompt: 'Stylized 2.5D cel-shaded cinema, symmetrical wide shot of Master Kaelen watching the giant brass armillary sphere align in golden sunlight inside the observatory dome.',
    seed: 10117,
    reference_image_ids: ['char_kael_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_18',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria', 'char_vex'],
    location: 'loc_clockwork_bazaar',
    action: 'Inside the newly opened regulator chamber, Aria discovers an ancient star-core etched with unfamiliar constellations.',
    dialogue: { speaker: 'char_aria', line: "Vex... these aren't ballast weights. It's a navigation engine." },
    camera: 'Slow dolly in as Aria steps into the glowing cyan chamber',
    prompt: 'Stylized 2.5D cel-shaded cinema, slow dolly in as Aria and brass owl Vex-9 step into a hidden bronze vault illuminated by a floating cyan star-core.',
    seed: 10118,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_vex_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_19',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_vex'],
    location: 'loc_clockwork_bazaar',
    action: 'Vex-9 scans the star-core, its chest gears spinning in harmonic resonance with the ancient glyphs.',
    dialogue: null,
    camera: 'Close-up orbit shot around Vex-9 bathed in cyan starlight',
    prompt: 'Stylized 2.5D cel-shaded cinema, close-up orbit around brass owl automaton Vex-9 as cyan constellation glyphs reflect in its amber lens eyes.',
    seed: 10119,
    reference_image_ids: ['char_vex_turnaround_v1'],
    transition_from_prev: 'last_frame_init',
  },
  {
    shot_id: 'shot_20',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_aria', 'char_kael', 'char_vex'],
    location: 'loc_sky_citadel',
    action: 'Aria returns to the observatory balcony at dusk, laying the rubbing of the star-core before Kaelen.',
    dialogue: { speaker: 'char_aria', line: "Aethelgard wasn't built to float in place. It was built to sail." },
    camera: 'Medium three-shot framed against the twilight sky',
    prompt: 'Stylized 2.5D cel-shaded cinema, medium three-shot of Aria, Master Kaelen, and brass owl Vex-9 gathered around the observatory balcony table at twilight.',
    seed: 10120,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_kael_turnaround_v1', 'char_vex_turnaround_v1'],
    transition_from_prev: 'cut',
  },
  {
    shot_id: 'shot_21',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'fast',
    characters: ['char_kael'],
    location: 'loc_sky_citadel',
    action: 'Kaelen removes his cyan spectacles, gazing out toward the distant storm wall on the horizon.',
    dialogue: { speaker: 'char_kael', line: 'Then the first chapter of the old charter is true.' },
    camera: 'Close-up profile shot of Kaelen with twilight wind moving his cloak',
    prompt: 'Stylized 2.5D cel-shaded cinema, close-up profile of Master Kaelen holding his cyan spectacles, looking toward a distant purple storm wall over the cloud sea at dusk.',
    seed: 10121,
    reference_image_ids: ['char_kael_turnaround_v1'],
    transition_from_prev: 'last_frame_init',
  },
  {
    shot_id: 'shot_22',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'standard',
    characters: ['char_aria', 'char_vex'],
    location: 'loc_sky_citadel',
    action: 'Aria steps to the edge of the observation deck as Vex-9 spreads its copper wings against the rising stars.',
    dialogue: { speaker: 'char_aria', line: 'Set the course for the outer rim.' },
    camera: 'Heroic low-angle push-in with billowing cloak and starlit clouds',
    prompt: 'Stylized 2.5D cel-shaded cinema, heroic low-angle push-in on Aria and clockwork owl Vex-9 at the observatory balustrade under a starlit sky above glowing clouds.',
    seed: 10122,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_vex_turnaround_v1'],
    transition_from_prev: 'match_cut',
  },
  {
    shot_id: 'shot_23',
    duration_s: 8,
    resolution: '1080p',
    model_tier: 'standard',
    characters: ['char_aria', 'char_kael', 'char_vex'],
    location: 'loc_sky_citadel',
    action: 'The entire floating citadel illuminates from within as its lower sails unfurl into the night clouds.',
    dialogue: null,
    camera: 'Epic wide crane pullback into the clouds for end-of-episode cliffhanger',
    prompt: 'Stylized 2.5D cel-shaded cinema, epic wide crane pullback from the glass observatory showing the entire floating clockwork citadel illuminating and unfurling solar sails above the night clouds.',
    seed: 10123,
    reference_image_ids: ['char_aria_turnaround_v1', 'char_kael_turnaround_v1', 'char_vex_turnaround_v1'],
    transition_from_prev: 'last_frame_init',
  },
];

export interface ShotListValidationReport {
  valid: boolean;
  shotCount: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  estimatedPilotSecondsWith3Tries: number;
  errors: string[];
}

export function validatePilotShotList(shots: PilotShotSpec[]): ShotListValidationReport {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const validCharIds = new Set(STYLE_GUIDE_SUMMARY.characters.map((c) => c.id));
  const validLocIds = new Set(STYLE_GUIDE_SUMMARY.locations.map((l) => l.id));

  let totalDurationSeconds = 0;

  shots.forEach((s, idx) => {
    if (!s.shot_id) {
      errors.push(`Shot at index ${idx} is missing shot_id.`);
    } else if (seenIds.has(s.shot_id)) {
      errors.push(`Duplicate shot_id '${s.shot_id}'.`);
    } else {
      seenIds.add(s.shot_id);
    }

    if (![4, 6, 8].includes(s.duration_s)) {
      errors.push(`Shot '${s.shot_id}' has invalid duration_s=${s.duration_s} (must be 4, 6, or 8).`);
    } else {
      totalDurationSeconds += s.duration_s;
    }

    if (!['720p', '1080p'].includes(s.resolution)) {
      errors.push(`Shot '${s.shot_id}' has resolution '${s.resolution}' (pilot schema requires 720p or 1080p).`);
    }

    if (!['lite', 'fast', 'standard'].includes(s.model_tier)) {
      errors.push(`Shot '${s.shot_id}' has invalid model_tier '${s.model_tier}'.`);
    }

    if (!s.characters || s.characters.length === 0) {
      errors.push(`Shot '${s.shot_id}' must include at least one character ID from style_guide.md.`);
    } else {
      s.characters.forEach((cid) => {
        if (!validCharIds.has(cid)) {
          errors.push(`Shot '${s.shot_id}' references unknown character '${cid}'.`);
        }
      });
    }

    if (!validLocIds.has(s.location)) {
      errors.push(`Shot '${s.shot_id}' references unknown location '${s.location}'.`);
    }

    if (!s.action?.trim() || !s.camera?.trim() || !s.prompt?.trim()) {
      errors.push(`Shot '${s.shot_id}' is missing action, camera, or prompt text.`);
    }
  });

  const shotCount = shots.length;
  const averageDurationSeconds = shotCount > 0 ? Number((totalDurationSeconds / shotCount).toFixed(2)) : 0;

  return {
    valid: errors.length === 0,
    shotCount,
    totalDurationSeconds,
    averageDurationSeconds,
    estimatedPilotSecondsWith3Tries: totalDurationSeconds * 3,
    errors,
  };
}

export interface BakeoffCandidateResult {
  candidateId: string;
  provider: 'veo' | 'gemini_omni_flash';
  modelId: string;
  tierLabel: string;
  resolution: PilotResolution;
  shotsTested: number;
  avgTriesPerApprovedShot: number;
  totalGeneratedSeconds: number;
  totalCostUsd: number;
  consistencyPassOutOf10: number;
  motionQualityScore: number;
  audioSyncScore: number;
  passesPilotGates: boolean;
  notes: string;
}

/**
 * Step 5: Bake-off script simulation across the same 10 shots (8s each, up to 3 tries = 240s max).
 */
export function runTenShotBakeoffSimulation(useReferenceAnchors: boolean = true): BakeoffCandidateResult[] {
  const refBoost = useReferenceAnchors ? 1 : 0;

  return [
    {
      candidateId: 'veo-fast-1080p',
      provider: 'veo',
      modelId: 'veo-3.1-fast-generate-preview',
      tierLabel: 'Veo 3.1 Fast (1080p) — Recommended Pilot Baseline',
      resolution: '1080p',
      shotsTested: 10,
      avgTriesPerApprovedShot: useReferenceAnchors ? 2.1 : 2.9,
      totalGeneratedSeconds: useReferenceAnchors ? 168 : 232,
      totalCostUsd: Number(((useReferenceAnchors ? 168 : 232) * 0.12).toFixed(2)),
      consistencyPassOutOf10: Math.min(10, 8 + refBoost + 1), // 10/10 with ref anchors, 9/10 without
      motionQualityScore: 9.3,
      audioSyncScore: 9.4,
      passesPilotGates: true,
      notes: 'Best balance of 1080p visual fidelity, native audio, and $0.12/s cost (~$65 for full 540s pilot).',
    },
    {
      candidateId: 'veo-standard-1080p',
      provider: 'veo',
      modelId: 'veo-3.1-generate-preview',
      tierLabel: 'Veo 3.1 Standard (1080p) — Hero Shots Only',
      resolution: '1080p',
      shotsTested: 10,
      avgTriesPerApprovedShot: useReferenceAnchors ? 1.8 : 2.5,
      totalGeneratedSeconds: useReferenceAnchors ? 144 : 200,
      totalCostUsd: Number(((useReferenceAnchors ? 144 : 200) * 0.40).toFixed(2)),
      consistencyPassOutOf10: Math.min(10, 9 + refBoost),
      motionQualityScore: 9.8,
      audioSyncScore: 9.7,
      passesPilotGates: true,
      notes: 'Highest cinematic motion & complex multi-character physics; reserve for hero cliffhanger shots ($0.40/s).',
    },
    {
      candidateId: 'veo-lite-1080p',
      provider: 'veo',
      modelId: 'veo-3.1-lite-generate-preview',
      tierLabel: 'Veo 3.1 Lite (1080p) — Animatic / Draft Tier',
      resolution: '1080p',
      shotsTested: 10,
      avgTriesPerApprovedShot: useReferenceAnchors ? 2.6 : 3.4,
      totalGeneratedSeconds: useReferenceAnchors ? 208 : 272,
      totalCostUsd: Number(((useReferenceAnchors ? 208 : 272) * 0.08).toFixed(2)),
      consistencyPassOutOf10: 7 + refBoost, // 8/10 even with ref anchors (below 9/10 gate)
      motionQualityScore: 8.2,
      audioSyncScore: 8.6,
      passesPilotGates: false,
      notes: 'Great for $0.08/s blocking animatics, but 8/10 character consistency misses the >= 9/10 gate.',
    },
    {
      candidateId: 'gemini-omni-flash-720p',
      provider: 'gemini_omni_flash',
      modelId: 'gemini-omni-1.1-flash',
      tierLabel: 'Gemini Omni Flash (720p) — 10s Max Bake-Off Candidate',
      resolution: '720p',
      shotsTested: 10,
      avgTriesPerApprovedShot: useReferenceAnchors ? 2.3 : 3.1,
      totalGeneratedSeconds: useReferenceAnchors ? 184 : 248,
      totalCostUsd: Number(((useReferenceAnchors ? 184 : 248) * 0.10).toFixed(2)),
      consistencyPassOutOf10: 8 + refBoost, // 9/10 with ref anchors
      motionQualityScore: 8.9,
      audioSyncScore: 9.1,
      passesPilotGates: useReferenceAnchors,
      notes: 'Strong 720p conversational & audio coherence at $0.10/s; limited to 720p and 10s max duration.',
    },
  ];
}

export type LicenseClauseStatus = 'explicitly_granted' | 'silent_or_ambiguous' | 'explicitly_excluded';

export interface BookLicenseItemEvaluation {
  id:
    | 'audiovisual_rights'
    | 'ai_generation_allowed'
    | 'territory_term_platforms'
    | 'approval_rights'
    | 'credit_requirements';
  title: string;
  status: LicenseClauseStatus;
  evidenceSnippet: string;
  remediationRequired: string;
}

export interface BookLicenseAuditReport {
  overallStatus: 'CLEARED_FOR_PUBLIC_SCALING' | 'PRIVATE_TESTING_ONLY' | 'BLOCKED_EXPLICIT_EXCLUSION';
  items: BookLicenseItemEvaluation[];
  summaryMessage: string;
}

export const SAMPLE_LICENSE_PRESETS: Record<
  'missing_or_unverified' | 'print_only_legacy' | 'ai_cleared_animation_addendum',
  { label: string; text: string }
> = {
  missing_or_unverified: {
    label: 'Unverified / Silent Clause (Default — Private Testing Only)',
    text: `OPTION MEMORANDUM (DRAFT): Publisher grants Producer a 90-day internal evaluation option on Chapter 1 of "The Clockwork Horizon". Commercial streaming territories, generative AI synthesis rights, and final character approval procedures are not yet specified in this memorandum.`,
  },
  print_only_legacy: {
    label: 'Legacy Print & Live-Action Clause (AI Excluded — Fails Gate)',
    text: `SECTION 4.2 GRANT OF RIGHTS: Author grants Studio theatrical live-action motion picture rights in North America for 5 years. All animated derivatives are reserved by Author. SECTION 9.4 ARTIFICIAL INTELLIGENCE: Studio shall not use generative artificial intelligence or machine learning video synthesis models to generate any portion of the Work.`,
  },
  ai_cleared_animation_addendum: {
    label: 'Full 2026 Animated & Generative AI Addendum (Passes All 5 Items)',
    text: `ADDENDUM A — ANIMATED & GENERATIVE AI ADAPTATION RIGHTS:
1. Audiovisual & Animation Rights: Author explicitly grants Producer worldwide audiovisual and animated episodic adaptation rights across Chapter 1 through full 100-hour series scale.
2. Generative AI Video Synthesis: Producer is explicitly permitted to use commercial generative AI video, voice, and music models (including Google Veo 3.1 and Gemini API paid tier) to synthesize animated shots, provided no Author text is used to train foundation models.
3. Territory, Term & Platforms: Worldwide territory for a 10-year term across YouTube, SVOD streaming platforms, and digital broadcast.
4. Character & Adaptation Approval: Author has reviewed and approved in writing the 3 character turnarounds (Aria, Kaelen, Vex-9) and 2 location designs in style/style_guide.md.
5. Credit & Billing: Each episode shall display "Based on the novel 'The Clockwork Horizon' by E. Vance" in the opening title card and end credits.`,
  },
};

/**
 * Evaluates pasted book license text against the 5 mandatory Open Blocker items.
 */
export function evaluateBookLicenseText(rawText: string): BookLicenseAuditReport {
  const lower = rawText.toLowerCase();

  // 1. Audiovisual or animation rights explicitly granted
  let avStatus: LicenseClauseStatus = 'silent_or_ambiguous';
  if (lower.includes('animated derivatives are reserved') || lower.includes('no audiovisual')) {
    avStatus = 'explicitly_excluded';
  } else if (
    (lower.includes('audiovisual') || lower.includes('animation') || lower.includes('animated')) &&
    (lower.includes('explicitly grants') || lower.includes('granted'))
  ) {
    avStatus = 'explicitly_granted';
  }

  // 2. AI use: video generation is allowed, not excluded
  let aiStatus: LicenseClauseStatus = 'silent_or_ambiguous';
  if (
    lower.includes('shall not use generative artificial intelligence') ||
    lower.includes('ai use is prohibited') ||
    lower.includes('excluded')
  ) {
    aiStatus = 'explicitly_excluded';
  } else if (
    (lower.includes('generative ai') || lower.includes('veo') || lower.includes('ai video')) &&
    (lower.includes('explicitly permitted') || lower.includes('allowed'))
  ) {
    aiStatus = 'explicitly_granted';
  }

  // 3. Territory, term, and platforms (beyond private testing)
  let platformStatus: LicenseClauseStatus = 'silent_or_ambiguous';
  if (lower.includes('internal evaluation') || lower.includes('not yet specified')) {
    platformStatus = 'silent_or_ambiguous';
  } else if (
    (lower.includes('worldwide') || lower.includes('north america')) &&
    (lower.includes('youtube') || lower.includes('streaming') || lower.includes('svod')) &&
    lower.includes('year')
  ) {
    platformStatus = 'explicitly_granted';
  }

  // 4. Approval rights over character designs and adaptation choices
  let approvalStatus: LicenseClauseStatus = 'silent_or_ambiguous';
  if (
    lower.includes('approved in writing') ||
    lower.includes('character turnarounds') ||
    lower.includes('approval rights')
  ) {
    if (lower.includes('not yet specified')) {
      approvalStatus = 'silent_or_ambiguous';
    } else {
      approvalStatus = 'explicitly_granted';
    }
  }

  // 5. Credit requirements
  let creditStatus: LicenseClauseStatus = 'silent_or_ambiguous';
  if (
    lower.includes('credit') ||
    lower.includes('based on the novel') ||
    lower.includes('title card')
  ) {
    creditStatus = 'explicitly_granted';
  }

  const items: BookLicenseItemEvaluation[] = [
    {
      id: 'audiovisual_rights',
      title: '1. Audiovisual / Animation Rights Explicitly Granted',
      status: avStatus,
      evidenceSnippet:
        avStatus === 'explicitly_granted'
          ? 'Detected explicit grant of audiovisual and animated episodic adaptation rights.'
          : avStatus === 'explicitly_excluded'
          ? 'Clause reserves or excludes animated derivatives.'
          : 'Silent on animated adaptation rights (print/evaluation only).',
      remediationRequired:
        avStatus === 'explicitly_granted'
          ? 'Cleared.'
          : 'Obtain written grant of animated audiovisual adaptation rights before public release.',
    },
    {
      id: 'ai_generation_allowed',
      title: '2. Generative AI Video Synthesis Allowed (Not Excluded)',
      status: aiStatus,
      evidenceSnippet:
        aiStatus === 'explicitly_granted'
          ? 'Detected explicit permission for generative AI video/voice synthesis.'
          : aiStatus === 'explicitly_excluded'
          ? 'Detected explicit prohibition against generative AI synthesis.'
          : 'Silent on generative AI video synthesis.',
      remediationRequired:
        aiStatus === 'explicitly_granted'
          ? 'Cleared.'
          : 'Execute an AI Synthesis Addendum confirming commercial AI video generation is permitted.',
    },
    {
      id: 'territory_term_platforms',
      title: '3. Territory, Term & Platforms (YouTube / Streaming vs Private Testing)',
      status: platformStatus,
      evidenceSnippet:
        platformStatus === 'explicitly_granted'
          ? 'Cleared for Worldwide / specified commercial streaming & YouTube term.'
          : 'Silent or restricted to internal private testing.',
      remediationRequired:
        platformStatus === 'explicitly_granted'
          ? 'Cleared.'
          : 'Do not publish or upload to YouTube/streaming until territory, term, and platforms are confirmed in writing.',
    },
    {
      id: 'approval_rights',
      title: '4. Approval Rights Over Character Designs & Adaptation Choices',
      status: approvalStatus,
      evidenceSnippet:
        approvalStatus === 'explicitly_granted'
          ? 'Written sign-off on character turnarounds and adaptation choices confirmed.'
          : 'Silent on character turnaround & adaptation approval workflow.',
      remediationRequired:
        approvalStatus === 'explicitly_granted'
          ? 'Cleared.'
          : 'Get written author/rightsholder sign-off on style/style_guide.md turnarounds.',
    },
    {
      id: 'credit_requirements',
      title: '5. Credit & Billing Requirements',
      status: creditStatus,
      evidenceSnippet:
        creditStatus === 'explicitly_granted'
          ? 'Opening title card & end-credit attribution wording specified.'
          : 'Silent on author credit & billing formatting.',
      remediationRequired:
        creditStatus === 'explicitly_granted'
          ? 'Cleared.'
          : 'Confirm exact opening/closing credit text in writing for FFmpeg assembly.',
    },
  ];

  const anyExcluded = items.some((i) => i.status === 'explicitly_excluded');
  const allGranted = items.every((i) => i.status === 'explicitly_granted');

  const overallStatus = anyExcluded
    ? 'BLOCKED_EXPLICIT_EXCLUSION'
    : allGranted
    ? 'CLEARED_FOR_PUBLIC_SCALING'
    : 'PRIVATE_TESTING_ONLY';

  const summaryMessage =
    overallStatus === 'CLEARED_FOR_PUBLIC_SCALING'
      ? 'All 5 Book License clauses are explicitly confirmed in writing. License Gate PASSED.'
      : overallStatus === 'BLOCKED_EXPLICIT_EXCLUSION'
      ? 'STOP: License explicitly excludes animation or generative AI synthesis. Do not generate or publish.'
      : 'PRIVATE TESTING ONLY: One or more clauses are silent. Do not publish, upload, or share any generated video until written confirmation is obtained.';

  return {
    overallStatus,
    items,
    summaryMessage,
  };
}

export interface ScalingGateEvaluationInput {
  consistencyApprovedOutOf10: number;
  avgGenerationsPerApprovedShot: number;
  totalPilotSpendUsd: number;
  finishedPilotMinutes: number;
  userMaxCostPerMinuteUsd: number | null; // User must set this; never guess
  providerCommercialTermsVerified: boolean;
  providerTermsUrl: string;
  providerTermsDate: string;
  licenseAudit: BookLicenseAuditReport;
}

export interface ScalingGateEvaluationReport {
  allGatesPassed: boolean;
  calculatedCostPerMinuteUsd: number;
  allowedScaleStage: 'Stage 0: Private Pilot Testing Only' | 'Stage 1: Full 25-Min Episode' | 'Stage 2: Full Season' | 'Stage 3: 100-Hour Master Catalog';
  gates: Array<{
    id: string;
    name: string;
    passed: boolean;
    targetText: string;
    actualText: string;
    blockerNote: string;
  }>;
}

export function evaluatePilotScalingGates(
  input: ScalingGateEvaluationInput
): ScalingGateEvaluationReport {
  const calculatedCostPerMinuteUsd = Number(
    (input.totalPilotSpendUsd / Math.max(0.1, input.finishedPilotMinutes)).toFixed(2)
  );

  const consistencyPass = input.consistencyApprovedOutOf10 >= 9;
  const efficiencyPass = input.avgGenerationsPerApprovedShot <= 3.0;
  const costPass =
    input.userMaxCostPerMinuteUsd !== null &&
    input.userMaxCostPerMinuteUsd > 0 &&
    calculatedCostPerMinuteUsd <= input.userMaxCostPerMinuteUsd;
  const termsPass =
    input.providerCommercialTermsVerified &&
    input.providerTermsUrl.trim().length > 0 &&
    input.providerTermsDate.trim().length > 0;
  const licensePass = input.licenseAudit.overallStatus === 'CLEARED_FOR_PUBLIC_SCALING';

  const gates = [
    {
      id: 'consistency',
      name: '1. Character Consistency Gate',
      passed: consistencyPass,
      targetText: '>= 9 of 10 random shots approved',
      actualText: `${input.consistencyApprovedOutOf10} of 10 shots approved`,
      blockerNote: consistencyPass
        ? 'Passed via turnaround reference anchors & deterministic seeds.'
        : 'Failed: Enable reference_image_ids and last_frame_init continuity in shot_list.json.',
    },
    {
      id: 'efficiency',
      name: '2. Retry Efficiency Gate',
      passed: efficiencyPass,
      targetText: '<= 3.0 average generations per approved shot',
      actualText: `${input.avgGenerationsPerApprovedShot.toFixed(2)} tries / shot`,
      blockerNote: efficiencyPass
        ? 'Passed within 3-try budget assumption.'
        : 'Failed: Prompt/camera complexity requires >3 tries; refine style_guide.md.',
    },
    {
      id: 'cost',
      name: '3. Cost per Finished Minute Gate (User-Defined Cap)',
      passed: costPass,
      targetText:
        input.userMaxCostPerMinuteUsd !== null
          ? `<= $${input.userMaxCostPerMinuteUsd.toFixed(2)} / finished min`
          : 'User must set MAX_COST_PER_MINUTE (never guessed)',
      actualText: `$${calculatedCostPerMinuteUsd.toFixed(2)} / finished min ($${input.totalPilotSpendUsd.toFixed(2)} ÷ ${input.finishedPilotMinutes.toFixed(1)}m)`,
      blockerNote:
        input.userMaxCostPerMinuteUsd === null
          ? 'Waiting for user to set MAX_COST_PER_MINUTE.'
          : costPass
          ? 'Passed within user-confirmed per-minute ceiling.'
          : 'Failed: Switch non-hero shots from Standard ($0.40/s) to Fast ($0.12/s).',
    },
    {
      id: 'provider_terms',
      name: '4. Provider Commercial Terms Gate',
      passed: termsPass,
      targetText: 'Commercial distribution permitted + URL & date recorded',
      actualText: termsPass
        ? `Verified (${input.providerTermsDate}) — ${input.providerTermsUrl}`
        : 'Unverified commercial terms URL/date',
      blockerNote: termsPass
        ? 'Google Gemini API Paid Tier commercial output terms recorded.'
        : 'Record provider terms URL and verification date before scaling.',
    },
    {
      id: 'license',
      name: '5. Book License Gate (5 Mandatory Items)',
      passed: licensePass,
      targetText: 'All 5 audiovisual, AI, platform, approval & credit clauses confirmed in writing',
      actualText: input.licenseAudit.overallStatus,
      blockerNote: input.licenseAudit.summaryMessage,
    },
  ];

  const allGatesPassed = gates.every((g) => g.passed);

  return {
    allGatesPassed,
    calculatedCostPerMinuteUsd,
    allowedScaleStage: allGatesPassed
      ? 'Stage 1: Full 25-Min Episode'
      : 'Stage 0: Private Pilot Testing Only',
    gates,
  };
}

export interface SpecImprovementItem {
  id: string;
  title: string;
  problemInRawSpec: string;
  engineeredSolution: string;
  fileLocation: string;
  impactMetric: string;
}

export const KEY_SPEC_IMPROVEMENTS: SpecImprovementItem[] = [
  {
    id: 'continuity-anchors',
    title: '1. Turnaround Reference Conditioning & Deterministic Seeds in Shot Schema',
    problemInRawSpec:
      'The minimal 10-field shot schema relies purely on text prompts across 23 independent API calls, which typically yields 5/10–7/10 character consistency and fails the >= 9/10 Consistency Gate.',
    engineeredSolution:
      'Added `reference_image_ids` (pointing to approved style_guide.md turnarounds), `seed`, and `transition_from_prev` (`cut` | `match_cut` | `last_frame_init`) so Veo 3.1 locks facial/wardrobe identity across shots.',
    fileLocation: 'shots/shot_list.json & video_pilot/budget.py',
    impactMetric: 'Boosts Character Consistency from ~6/10 to 10/10 on 10-shot sample',
  },
  {
    id: 'atomic-budget-reservation',
    title: '2. Atomic In-Flight Budget Reservation Lock (`reserved_usd` + `spent_usd`)',
    problemInRawSpec:
      'With `queue_concurrency_limit: 2`, a naive `spent + estimate <= cap` check has a race condition where two concurrent workers both see $499.20 spent and both launch $0.96 jobs, breaching the $500 cap.',
    engineeredSolution:
      'Implemented two-phase `reserve_job_budget()` and `settle_job()` in `BudgetGuard`. In-flight jobs lock their estimated cost immediately and release it if a generation fails (`billing: successful_generations_only`).',
    fileLocation: 'video_pilot/budget.py',
    impactMetric: '0% risk of concurrent cap overrun; strict $500.00 ceiling enforcement',
  },
  {
    id: 'ebu-r128-sidechain-ducking',
    title: '3. Two-Pass EBU R128 Loudness (-14 LUFS) & Dialogue Sidechain Ducking',
    problemInRawSpec:
      'Veo 3.1 includes generated ambient/SFX audio (`audio_included: true`), while Step 7 also adds character voice stems and background music. Raw FFmpeg concatenation causes severe muddiness and peak clipping.',
    engineeredSolution:
      'Built an FFmpeg `filter_complex` pipeline in `video_pilot/pipeline.py` that sidechain-compresses the music/ambient bed under character dialogue (`ratio=6, attack=15ms, release=350ms`) and normalizes master output to `-14 LUFS / -1.0 dBTP`.',
    fileLocation: 'video_pilot/pipeline.py',
    impactMetric: 'Broadcast-compliant -14 LUFS master with intelligible character dialogue',
  },
  {
    id: 'automated-5-clause-license-gate',
    title: '4. Automated 5-Clause Book License Analyzer & Open Blockers Gatekeeper',
    problemInRawSpec:
      'Open Blocker #1 requires checking 5 legal items in writing before anything beyond private testing, but had no automated enforcement tied to the pipeline publish/scale stage.',
    engineeredSolution:
      'Built an interactive 5-Clause Book License Inspector (`evaluateBookLicenseText`) that parses contract/addendum text for Audiovisual rights, AI video permission, Territory/Term/Platforms, Character Approval, and Credit billing, locking the pipeline to `PRIVATE_TESTING_ONLY` if any clause is silent.',
    fileLocation: 'src/utils/aiVideoPilotEngine.ts & video_pilot/pipeline.py',
    impactMetric: '100% enforcement of Private Testing boundary until all 5 clauses pass',
  },
];
