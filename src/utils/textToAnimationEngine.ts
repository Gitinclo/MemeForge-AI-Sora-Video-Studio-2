/**
 * Text-to-Animation Video Generator Engine (T2V / I2V Global Asset & 10-Shot Script Compiler)
 *
 * Implements:
 * 1. Global Visual & Asset Definitions (`Global_Art_Style`, `Character_A (Lin_Jie)`,
 *    `Character_B (Ji_Zhixiu)`, `Environment_A (Rainy_Street_And_Alley)`, `Environment_B (Bookstore_Interior)`).
 * 2. Sequential 10-Shot Animation Script across 3 Scenes (45s native 24fps timeline / 52s Veo 3.1 normalized).
 * 3. Automatic Token Injection & T2V/I2V Master Prompt Compiler (`compileExpandedT2VPrompt`).
 * 4. Live AI Script Parser (`parseAnimationScriptText`) that converts raw Markdown/bullet scripts into
 *    playable, frame-accurate 24fps animation shots.
 * 5. Provider compatibility & cost analyzer comparing Native Script Durations (Gemini Omni Flash 1-10s)
 *    vs. Google Veo 3.1 Paid-Tier Durations ([4, 6, 8]s per config/pricing.yaml).
 */

import { AllowedDurationSeconds, PilotResolution, VeoModelTier, estimateJobCostUsd } from './aiVideoPilotEngine';

export interface GlobalCharacterSheet {
  tokenId: 'Character_A' | 'Character_B';
  handle: 'Lin_Jie' | 'Ji_Zhixiu';
  displayName: string;
  appearancePrompt: string;
  wardrobePrompt: string;
  expressionPrompt: string;
  signatureProp?: string;
  accentColorHex: string;
}

export interface GlobalEnvironmentSheet {
  tokenId: 'Environment_A' | 'Environment_B';
  handle: 'Rainy_Street_And_Alley' | 'Bookstore_Interior';
  displayName: string;
  lightingAndAtmosphere: string;
  setDressingPrompt: string;
  primaryPaletteHex: string[];
}

export interface GlobalVisualAssets {
  globalArtStyle: string;
  frameRateFps: 24;
  targetMasterResolution: '8K (7680×4320)';
  characters: Record<'Character_A' | 'Character_B', GlobalCharacterSheet>;
  environments: Record<'Environment_A' | 'Environment_B', GlobalEnvironmentSheet>;
}

export interface AnimationDialogueLine {
  speaker: string;
  delivery?: string;
  text: string;
}

export interface AnimationShotSpec {
  shotNumber: number;
  shotId: string;
  sceneNumber: number;
  sceneTitle: string;
  title: string;
  scriptDurationSec: number; // Exact duration from AI script (e.g. 3s, 4s, 5s, 6s)
  veoNormalizedDurationSec: AllowedDurationSeconds; // Normalized to [4, 6, 8]s for Veo 3.1
  visualPrompt: string;
  camera: string;
  action: string;
  audioSfx: string;
  dialogues: AnimationDialogueLine[];
  referencedCharacters: Array<'Character_A' | 'Character_B'>;
  referencedEnvironment: 'Environment_A' | 'Environment_B';
  choreographyPreset:
    | 'doorway_rain_bell'
    | 'wooden_step_open_sign'
    | 'counter_lamp_two_teacups'
    | 'alley_blade_slash'
    | 'alley_embers_ash'
    | 'street_pov_retract_cane'
    | 'interior_pov_enter'
    | 'shopkeeper_closeup_teacup'
    | 'hunter_split_macro_trigger'
    | 'counter_twoshot_towel';
}

export const DEFAULT_GLOBAL_VISUAL_ASSETS: GlobalVisualAssets = {
  globalArtStyle:
    'Dark urban fantasy anime, cinematic lighting, high contrast, heavy atmospheric rain, detailed 2D/2.5D animation style, 24fps, 8k resolution.',
  frameRateFps: 24,
  targetMasterResolution: '8K (7680×4320)',
  characters: {
    Character_A: {
      tokenId: 'Character_A',
      handle: 'Lin_Jie',
      displayName: 'Character_A (Lin_Jie)',
      appearancePrompt:
        'Young East Asian male, pale skin, slightly messy short black hair, dark eyes, slender build.',
      wardrobePrompt: 'Wearing a fitted black button-down shirt and black trousers.',
      expressionPrompt: 'Warm, gentle, serene, inadvertently mysterious smile.',
      signatureProp: 'Warm porcelain teacup & hardcover rental book',
      accentColorHex: '#fbbf24',
    },
    Character_B: {
      tokenId: 'Character_B',
      handle: 'Ji_Zhixiu',
      displayName: 'Character_B (Ji_Zhixiu)',
      appearancePrompt:
        'Young East Asian female, sculpted facial features, ivory-white skin, drenched dark hair clinging to her neck and cheeks.',
      wardrobePrompt:
        'Wearing a wet, low-cut black formal evening dress stained with dark blood.',
      expressionPrompt: 'Cold, fiercely vigilant, pained, narrowed eyes.',
      signatureProp: 'Sleek black metal cane that mechanically transforms into a long silver blade',
      accentColorHex: '#f43f5e',
    },
  },
  environments: {
    Environment_A: {
      tokenId: 'Environment_A',
      handle: 'Rainy_Street_And_Alley',
      displayName: 'Environment_A (Rainy_Street_And_Alley)',
      lightingAndAtmosphere:
        'Dark gothic-modern city street in a torrential downpour. Murky sky, heavy mist, deep puddles.',
      setDressingPrompt:
        'A narrow, shadowy alleyway sits directly opposite an old storefront with a wooden door and a single warm glowing window.',
      primaryPaletteHex: ['#050814', '#0f172a', '#38bdf8', '#f43f5e'],
    },
    Environment_B: {
      tokenId: 'Environment_B',
      handle: 'Bookstore_Interior',
      displayName: 'Environment_B (Bookstore_Interior)',
      lightingAndAtmosphere:
        'Lit solely by a single warm yellow desk lamp on the wooden counter, casting deep, eerie shadows across the room.',
      setDressingPrompt:
        'Narrow, cramped antique bookstore. Towering bookshelves, stacks of books strewn across the floor blocking half a wooden staircase, dust-caked windows.',
      primaryPaletteHex: ['#090d16', '#1c1917', '#fbbf24', '#d97706'],
    },
  },
};

/**
 * Maps arbitrary script durations (e.g. 3s, 4s, 5s, 6s) to the nearest allowed
 * Google Veo 3.1 clip duration in config/pricing.yaml ([4, 6, 8] seconds).
 */
export function normalizeDurationForVeo(scriptDurationSec: number): AllowedDurationSeconds {
  if (scriptDurationSec <= 4) return 4;
  if (scriptDurationSec <= 6) return 6;
  return 8;
}

export const TEN_SHOT_ANIMATION_SCRIPT: AnimationShotSpec[] = [
  // Scene 1: The Bookstore Opens
  {
    shotNumber: 1,
    shotId: 'shot_01',
    sceneNumber: 1,
    sceneTitle: 'Scene 1: The Bookstore Opens',
    title: 'Exterior Doorway',
    scriptDurationSec: 4,
    veoNormalizedDurationSec: 4,
    visualPrompt:
      'Medium shot of Lin_Jie opening an old wooden bookstore door from the inside during a torrential rainstorm. Water streams down the doorframe and dusty transom window. Thick mist and puddles cover the pavement outside.',
    camera: 'Slow push-in from the street toward the doorway.',
    action: 'Lin_Jie frowns slightly as rain splashes onto his black shirt and trousers.',
    audioSfx:
      'Muffled bronze bell chime, heavy pouring rain, distant muffled TV broadcast: "This heavy precipitation that began last night will continue for approximately a week. The Meteorological Centre has issued a yellow warning..."',
    dialogues: [{ speaker: 'Lin_Jie', text: 'Such a heavy downpour.' }],
    referencedCharacters: ['Character_A'],
    referencedEnvironment: 'Environment_A',
    choreographyPreset: 'doorway_rain_bell',
  },
  {
    shotNumber: 2,
    shotId: 'shot_02',
    sceneNumber: 1,
    sceneTitle: 'Scene 1: The Bookstore Opens',
    title: 'Entrance Step',
    scriptDurationSec: 3,
    veoNormalizedDurationSec: 4,
    visualPrompt:
      'Low-angle close-up at the bookstore entrance. Lin_Jie places a wooden board over a triangular support frame on the wet floor to create a makeshift step, then flips the hanging door sign to display "OPEN".',
    camera: 'Static low angle.',
    action: 'Hands placing the wooden ramp; sign flipping.',
    audioSfx: 'Wooden thud, sign clacking against glass, continuous heavy rain.',
    dialogues: [
      {
        speaker: 'Lin_Jie',
        text: 'Sigh. What if someone gets caught in the rain without an umbrella and needs a place to wait it out?',
      },
    ],
    referencedCharacters: ['Character_A'],
    referencedEnvironment: 'Environment_B',
    choreographyPreset: 'wooden_step_open_sign',
  },
  {
    shotNumber: 3,
    shotId: 'shot_03',
    sceneNumber: 1,
    sceneTitle: 'Scene 1: The Bookstore Opens',
    title: 'Behind the Counter',
    scriptDurationSec: 5,
    veoNormalizedDurationSec: 6,
    visualPrompt:
      'Medium shot inside Environment_B. Lin_Jie walks to the wooden counter holding a book, clicks on a warm yellow desk lamp, places a clean folded towel on the counter, and pours two steaming cups of hot tea.',
    camera: 'Smooth pan following Lin_Jie to the counter.',
    action:
      'Lin_Jie sits behind the counter, opens his book, gently pushes one steaming teacup across the counter toward an empty high stool, takes a sip from his own cup, and smiles warmly.',
    audioSfx: 'Lamp switch click, pouring hot water, gentle porcelain clink.',
    dialogues: [],
    referencedCharacters: ['Character_A'],
    referencedEnvironment: 'Environment_B',
    choreographyPreset: 'counter_lamp_two_teacups',
  },

  // Scene 2: Slaughter in the Alley
  {
    shotNumber: 4,
    shotId: 'shot_04',
    sceneNumber: 2,
    sceneTitle: 'Scene 2: Slaughter in the Alley',
    title: 'Dark Alleyway',
    scriptDurationSec: 4,
    veoNormalizedDurationSec: 4,
    visualPrompt:
      'Dynamic medium action shot in Environment_A. Ji_Zhixiu stands in a dark, rain-drenched alley. She twists the neck of a shadowy attacker, spins rapidly, and slashes a long mechanical blade across the throat of a second attacker.',
    camera: 'Fast handheld tracking shot with slight camera shake on impact.',
    action: 'Swift, lethal martial movements; rain splashing against the blade.',
    audioSfx: 'Sharp bone crack, metallic blade slash, choked gurgle ("Gurk..."), roaring rain.',
    dialogues: [],
    referencedCharacters: ['Character_B'],
    referencedEnvironment: 'Environment_A',
    choreographyPreset: 'alley_blade_slash',
  },
  {
    shotNumber: 5,
    shotId: 'shot_05',
    sceneNumber: 2,
    sceneTitle: 'Scene 2: Slaughter in the Alley',
    title: 'Alley Aftermath',
    scriptDurationSec: 5,
    veoNormalizedDurationSec: 6,
    visualPrompt:
      'Wide angle in the dark alley. Ji_Zhixiu walks toward the foreground as a pile of ten corpses behind her ignites with dark embers and dissolves into ash in the rain. Dark blood seeps through her black dress, dripping onto the wet ground and evaporating into acrid steam.',
    camera: 'Slow dolly backward, keeping Ji_Zhixiu centered.',
    action:
      'Ji_Zhixiu clutches her ribs briefly in pain, breathing heavily as steam rises from her blood, then looks forward toward the street.',
    audioSfx: 'Sizzling steam, crackling ash, heavy breathing, rain.',
    dialogues: [{ speaker: 'Ji_Zhixiu', delivery: 'whispered', text: 'Time, I need time.' }],
    referencedCharacters: ['Character_B'],
    referencedEnvironment: 'Environment_A',
    choreographyPreset: 'alley_embers_ash',
  },
  {
    shotNumber: 6,
    shotId: 'shot_06',
    sceneNumber: 2,
    sceneTitle: 'Scene 2: Slaughter in the Alley',
    title: 'Street Crossing',
    scriptDurationSec: 4,
    veoNormalizedDurationSec: 4,
    visualPrompt:
      'Over-the-shoulder POV shot from Ji_Zhixiu looking across the pitch-black street. Through the curtain of rain, only the old bookstore window glows with faint yellow light, showing rows of bookshelves and the "OPEN" sign.',
    camera:
      'Static over-the-shoulder, shifting focus from the retracting weapon in the foreground to the bookstore in the background.',
    action:
      'Ji_Zhixiu presses a mechanism on her hilt; the long silver blade retracts into an ordinary black metal cane. She walks out of the alley toward the bookstore.',
    audioSfx: 'Sharp metallic Shing! as the blade retracts, footsteps splashing through puddles.',
    dialogues: [
      {
        speaker: 'Ji_Zhixiu',
        delivery: 'internal/whispered',
        text: 'Is it a coincidence or a trap?',
      },
    ],
    referencedCharacters: ['Character_B'],
    referencedEnvironment: 'Environment_A',
    choreographyPreset: 'street_pov_retract_cane',
  },

  // Scene 3: The Encounter
  {
    shotNumber: 7,
    shotId: 'shot_07',
    sceneNumber: 3,
    sceneTitle: 'Scene 3: The Encounter',
    title: 'Entering the Bookstore',
    scriptDurationSec: 5,
    veoNormalizedDurationSec: 6,
    visualPrompt:
      "Wide interior shot of Environment_B from Ji_Zhixiu's perspective. The bookstore looks cramped, shadowy, and ominous. Books clutter the floor and block half the stairs. At the counter, illuminated only by a single desk lamp, sits pale-skinned Lin_Jie in all-black clothing, holding a teacup. On the counter in front of an empty stool sits a steaming cup of tea and a clean towel.",
    camera: 'Slow panning POV scan of the room, settling on Lin_Jie.',
    action:
      'Ji_Zhixiu steps inside leaning on her black cane, water dripping from her hair and dress onto the wooden floor.',
    audioSfx: 'Door creak, bronze bell chime, water dripping (Drip, drip) in sudden quiet.',
    dialogues: [],
    referencedCharacters: ['Character_A', 'Character_B'],
    referencedEnvironment: 'Environment_B',
    choreographyPreset: 'interior_pov_enter',
  },
  {
    shotNumber: 8,
    shotId: 'shot_08',
    sceneNumber: 3,
    sceneTitle: 'Scene 3: The Encounter',
    title: "The Shopkeeper's Greeting",
    scriptDurationSec: 5,
    veoNormalizedDurationSec: 6,
    visualPrompt:
      'Medium close-up of Lin_Jie behind the counter. Warm yellow lamp light reflects in his dark pupils. He looks up from his book, smiles calmly, and slides the steaming teacup closer to the edge of the counter.',
    camera: "Subtle push-in on Lin_Jie's face.",
    action: 'Lin_Jie gestures politely toward the teacup.',
    audioSfx: 'Soft porcelain slide on wood, quiet rain pattering outside window.',
    dialogues: [
      {
        speaker: 'Lin_Jie',
        text: "Welcome. It looks like my long wait hasn't been in vain. The rain has washed a beautiful customer into my humble bookstore.",
      },
    ],
    referencedCharacters: ['Character_A'],
    referencedEnvironment: 'Environment_B',
    choreographyPreset: 'shopkeeper_closeup_teacup',
  },
  {
    shotNumber: 9,
    shotId: 'shot_09',
    sceneNumber: 3,
    sceneTitle: 'Scene 3: The Encounter',
    title: "The Hunter's Suspicion",
    scriptDurationSec: 4,
    veoNormalizedDurationSec: 4,
    visualPrompt:
      "Extreme close-up split sequence: First on Ji_Zhixiu's narrowed, sharp eyes glaring cautiously at the steaming teacup; second on her wet fingers resting on the handle of the black metal cane, her thumb hovering over a hidden release button.",
    camera: 'Tight, tense macro shots.',
    action: "Ji_Zhixiu shifts her thumb onto the cane's trigger mechanism, ready to strike.",
    audioSfx: 'Faint metallic click, tense ambient drone.',
    dialogues: [{ speaker: 'Ji_Zhixiu', text: 'You were waiting for me?' }],
    referencedCharacters: ['Character_B'],
    referencedEnvironment: 'Environment_B',
    choreographyPreset: 'hunter_split_macro_trigger',
  },
  {
    shotNumber: 10,
    shotId: 'shot_10',
    sceneNumber: 3,
    sceneTitle: 'Scene 3: The Encounter',
    title: 'The Offer',
    scriptDurationSec: 6,
    veoNormalizedDurationSec: 6,
    visualPrompt:
      'Two-shot across the counter. Lin_Jie sits relaxed in the warm light while Ji_Zhixiu stands rigid and drenched in the shadows. Lin_Jie gestures warmly toward the folded towel on the counter.',
    camera: 'Medium profile shot framing both characters across the counter divide.',
    action:
      'Ji_Zhixiu hesitates, slightly lowers her guard on the cane, picks up the towel with one hand, and shakes her head slightly. Lin_Jie leans forward with a concerned expression.',
    audioSfx: 'Cloth rustle, quiet ambient rain, warm room tone.',
    dialogues: [
      {
        speaker: 'Lin_Jie',
        text: "Yes. I've always thought that fate works in miraculous ways, how it brings two complete strangers together in the least expected way. Feel free to use the towel there to wipe yourself dry. Don't worry, it's unused. Would you like me to turn on the heater?",
      },
      { speaker: 'Ji_Zhixiu', text: "It's fine." },
      {
        speaker: 'Lin_Jie',
        text: 'From the look of things, you seem to have encountered some trouble?',
      },
    ],
    referencedCharacters: ['Character_A', 'Character_B'],
    referencedEnvironment: 'Environment_B',
    choreographyPreset: 'counter_twoshot_towel',
  },
];

/**
 * Compiles a self-contained T2V / I2V Master Prompt for a shot by resolving all
 * Global Visual & Asset Definitions (`Global_Art_Style`, `Character_A`, `Character_B`,
 * `Environment_A`, `Environment_B`).
 */
export function compileExpandedT2VPrompt(
  shot: AnimationShotSpec,
  assets: GlobalVisualAssets = DEFAULT_GLOBAL_VISUAL_ASSETS
): string {
  const env = assets.environments[shot.referencedEnvironment];
  const charDescriptions = shot.referencedCharacters
    .map((cId) => {
      const c = assets.characters[cId];
      return `[${c.displayName}: ${c.appearancePrompt} ${c.wardrobePrompt} Expression: ${c.expressionPrompt}]`;
    })
    .join(' ');

  const dialogueBlock =
    shot.dialogues.length > 0
      ? ` Lip-sync / Dialogue: ${shot.dialogues
          .map((d) => `${d.speaker}${d.delivery ? ` (${d.delivery})` : ''}: "${d.text}"`)
          .join(' | ')}`
      : '';

  return [
    `[STYLE: ${assets.globalArtStyle}]`,
    `[ENVIRONMENT ${env.displayName}: ${env.lightingAndAtmosphere} ${env.setDressingPrompt}]`,
    charDescriptions,
    `[SHOT ${String(shot.shotNumber).padStart(2, '0')} - ${shot.title} (${shot.scriptDurationSec}s @ ${assets.frameRateFps}fps)]: ${shot.visualPrompt}`,
    `[CAMERA: ${shot.camera}]`,
    `[ACTION: ${shot.action}]`,
    `[AUDIO/SFX: ${shot.audioSfx}]${dialogueBlock}`,
  ]
    .filter(Boolean)
    .join(' ');
}

export interface ScriptAuditSummary {
  shotCount: number;
  sceneCount: number;
  totalScriptDurationSec: number;
  totalFramesAt24Fps: number;
  totalVeoNormalizedDurationSec: number;
  durationNormalizedShots: Array<{
    shotId: string;
    scriptDurationSec: number;
    veoDurationSec: AllowedDurationSeconds;
  }>;
  estimatedVeoFast1080pUsd: number;
  estimatedVeoStandard1080pUsd: number;
  estimatedOmniFlash720pNativeUsd: number;
}

/**
 * Evaluates the 10-shot script for timing, 24fps frame counts, Veo 3.1 duration normalization,
 * and multi-provider cost estimates.
 */
export function evaluateAnimationScriptSummary(
  shots: AnimationShotSpec[] = TEN_SHOT_ANIMATION_SCRIPT,
  resolution: PilotResolution = '1080p',
  veoTier: VeoModelTier = 'fast'
): ScriptAuditSummary {
  const sceneNumbers = new Set(shots.map((s) => s.sceneNumber));
  const totalScriptDurationSec = shots.reduce((acc, s) => acc + s.scriptDurationSec, 0);
  const totalVeoNormalizedDurationSec = shots.reduce(
    (acc, s) => acc + s.veoNormalizedDurationSec,
    0
  );

  const durationNormalizedShots = shots
    .filter((s) => s.scriptDurationSec !== s.veoNormalizedDurationSec)
    .map((s) => ({
      shotId: s.shotId,
      scriptDurationSec: s.scriptDurationSec,
      veoDurationSec: s.veoNormalizedDurationSec,
    }));

  const fastCost = shots.reduce((sum, s) => {
    const est = estimateJobCostUsd('veo', veoTier, resolution, s.veoNormalizedDurationSec);
    return sum + (est.valid ? est.estimatedCostUsd : 0);
  }, 0);

  const stdCost = shots.reduce((sum, s) => {
    const est = estimateJobCostUsd('veo', 'standard', resolution, s.veoNormalizedDurationSec);
    return sum + (est.valid ? est.estimatedCostUsd : 0);
  }, 0);

  // Gemini Omni Flash (gemini-omni-1.1-flash) supports up to 10s @ $0.10/s (720p)
  const omniCost = Number((totalScriptDurationSec * 0.1).toFixed(2));

  return {
    shotCount: shots.length,
    sceneCount: sceneNumbers.size,
    totalScriptDurationSec,
    totalFramesAt24Fps: totalScriptDurationSec * 24,
    totalVeoNormalizedDurationSec,
    durationNormalizedShots,
    estimatedVeoFast1080pUsd: Number(fastCost.toFixed(2)),
    estimatedVeoStandard1080pUsd: Number(stdCost.toFixed(2)),
    estimatedOmniFlash720pNativeUsd: omniCost,
  };
}

/**
 * Parses a structured AI Text-to-Animation script (`Shot XX | Title | Duration: Xs`)
 * into playable `AnimationShotSpec[]` records. Falls back to `TEN_SHOT_ANIMATION_SCRIPT`
 * if the input is empty or does not contain shot headers.
 */
export function parseAnimationScriptText(rawScript: string): AnimationShotSpec[] {
  if (!rawScript || !rawScript.trim()) {
    return TEN_SHOT_ANIMATION_SCRIPT;
  }

  const shotRegex = /Shot\s+(\d+)\s*\|\s*([^|]+)\|\s*Duration:\s*(\d+)s/gi;
  const matches = Array.from(rawScript.matchAll(shotRegex));
  if (matches.length === 0) {
    return TEN_SHOT_ANIMATION_SCRIPT;
  }

  const parsedShots: AnimationShotSpec[] = [];
  const choreographyCycle: AnimationShotSpec['choreographyPreset'][] = [
    'doorway_rain_bell',
    'wooden_step_open_sign',
    'counter_lamp_two_teacups',
    'alley_blade_slash',
    'alley_embers_ash',
    'street_pov_retract_cane',
    'interior_pov_enter',
    'shopkeeper_closeup_teacup',
    'hunter_split_macro_trigger',
    'counter_twoshot_towel',
  ];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const shotNum = Number(match[1]) || i + 1;
    const title = match[2].trim();
    const scriptDurationSec = Math.max(1, Math.min(10, Number(match[3]) || 4));
    const startIdx = match.index ?? 0;
    const endIdx = i + 1 < matches.length ? (matches[i + 1].index ?? rawScript.length) : rawScript.length;
    const block = rawScript.slice(startIdx, endIdx);

    const extractField = (label: string): string => {
      const reg = new RegExp(`\\*\\s*${label}\\s*:\\s*([^\\n*]+)`, 'i');
      const m = block.match(reg);
      return m ? m[1].trim() : '';
    };

    const visualPrompt = extractField('Visual Prompt') || title;
    const camera = extractField('Camera') || 'Medium cinematic tracking shot';
    const action = extractField('Action') || 'Subtle character movement in heavy rain';
    const audioSfx = extractField('Audio \\/ SFX') || 'Heavy atmospheric rain';

    const dialogueMatches = Array.from(
      block.matchAll(/\*\s*Dialogue\s*\(([^)]+)\)\s*:\s*"?([^"\n]+)"?/gi)
    );
    const dialogues: AnimationDialogueLine[] = dialogueMatches.map((dm) => {
      const rawSpeaker = dm[1].trim();
      const parts = rawSpeaker.split(',').map((p) => p.trim());
      return {
        speaker: parts[0] || 'Speaker',
        delivery: parts[1],
        text: dm[2].trim().replace(/^["“]|["”]$/g, ''),
      };
    });

    const hasLin = /Lin_Jie|Character_A|shopkeeper/i.test(block);
    const hasJi = /Ji_Zhixiu|Character_B|hunter/i.test(block);
    const referencedCharacters: Array<'Character_A' | 'Character_B'> = [];
    if (hasLin) referencedCharacters.push('Character_A');
    if (hasJi) referencedCharacters.push('Character_B');
    if (referencedCharacters.length === 0) referencedCharacters.push('Character_A');

    const isAlleyOrStreet =
      /Environment_A|alley|street|corpses|outside/i.test(block) &&
      !/Wide interior shot of Environment_B/i.test(block);

    parsedShots.push({
      shotNumber: shotNum,
      shotId: `shot_${String(shotNum).padStart(2, '0')}`,
      sceneNumber: shotNum <= 3 ? 1 : shotNum <= 6 ? 2 : 3,
      sceneTitle:
        shotNum <= 3
          ? 'Scene 1: The Bookstore Opens'
          : shotNum <= 6
          ? 'Scene 2: Slaughter in the Alley'
          : 'Scene 3: The Encounter',
      title,
      scriptDurationSec,
      veoNormalizedDurationSec: normalizeDurationForVeo(scriptDurationSec),
      visualPrompt,
      camera,
      action,
      audioSfx,
      dialogues,
      referencedCharacters,
      referencedEnvironment: isAlleyOrStreet ? 'Environment_A' : 'Environment_B',
      choreographyPreset: choreographyCycle[(shotNum - 1) % choreographyCycle.length],
    });
  }

  return parsedShots;
}

export const RAW_USER_10_SHOT_SCRIPT_TEXT = `Scene 1: The Bookstore Opens
Shot 01 | Exterior Doorway | Duration: 4s
 * Visual Prompt: Medium shot of Lin_Jie opening an old wooden bookstore door from the inside during a torrential rainstorm. Water streams down the doorframe and dusty transom window. Thick mist and puddles cover the pavement outside.
 * Camera: Slow push-in from the street toward the doorway.
 * Action: Lin_Jie frowns slightly as rain splashes onto his black shirt and trousers.
 * Audio / SFX: Muffled bronze bell chime, heavy pouring rain, distant muffled TV broadcast: "This heavy precipitation that began last night will continue for approximately a week. The Meteorological Centre has issued a yellow warning..."
 * Dialogue (Lin_Jie): "Such a heavy downpour."
Shot 02 | Entrance Step | Duration: 3s
 * Visual Prompt: Low-angle close-up at the bookstore entrance. Lin_Jie places a wooden board over a triangular support frame on the wet floor to create a makeshift step, then flips the hanging door sign to display "OPEN".
 * Camera: Static low angle.
 * Action: Hands placing the wooden ramp; sign flipping.
 * Audio / SFX: Wooden thud, sign clacking against glass, continuous heavy rain.
 * Dialogue (Lin_Jie): "Sigh. What if someone gets caught in the rain without an umbrella and needs a place to wait it out?"
Shot 03 | Behind the Counter | Duration: 5s
 * Visual Prompt: Medium shot inside Environment_B. Lin_Jie walks to the wooden counter holding a book, clicks on a warm yellow desk lamp, places a clean folded towel on the counter, and pours two steaming cups of hot tea.
 * Camera: Smooth pan following Lin_Jie to the counter.
 * Action: Lin_Jie sits behind the counter, opens his book, gently pushes one steaming teacup across the counter toward an empty high stool, takes a sip from his own cup, and smiles warmly.
 * Audio / SFX: Lamp switch click, pouring hot water, gentle porcelain clink.
Scene 2: Slaughter in the Alley
Shot 04 | Dark Alleyway | Duration: 4s
 * Visual Prompt: Dynamic medium action shot in Environment_A. Ji_Zhixiu stands in a dark, rain-drenched alley. She twists the neck of a shadowy attacker, spins rapidly, and slashes a long mechanical blade across the throat of a second attacker.
 * Camera: Fast handheld tracking shot with slight camera shake on impact.
 * Action: Swift, lethal martial movements; rain splashing against the blade.
 * Audio / SFX: Sharp bone crack, metallic blade slash, choked gurgle ("Gurk..."), roaring rain.
Shot 05 | Alley Aftermath | Duration: 5s
 * Visual Prompt: Wide angle in the dark alley. Ji_Zhixiu walks toward the foreground as a pile of ten corpses behind her ignites with dark embers and dissolves into ash in the rain. Dark blood seeps through her black dress, dripping onto the wet ground and evaporating into acrid steam.
 * Camera: Slow dolly backward, keeping Ji_Zhixiu centered.
 * Action: Ji_Zhixiu clutches her ribs briefly in pain, breathing heavily as steam rises from her blood, then looks forward toward the street.
 * Audio / SFX: Sizzling steam, crackling ash, heavy breathing, rain.
 * Dialogue (Ji_Zhixiu, whispered): "Time, I need time."
Shot 06 | Street Crossing | Duration: 4s
 * Visual Prompt: Over-the-shoulder POV shot from Ji_Zhixiu looking across the pitch-black street. Through the curtain of rain, only the old bookstore window glows with faint yellow light, showing rows of bookshelves and the "OPEN" sign.
 * Camera: Static over-the-shoulder, shifting focus from the retracting weapon in the foreground to the bookstore in the background.
 * Action: Ji_Zhixiu presses a mechanism on her hilt; the long silver blade retracts into an ordinary black metal cane. She walks out of the alley toward the bookstore.
 * Audio / SFX: Sharp metallic Shing! as the blade retracts, footsteps splashing through puddles.
 * Dialogue (Ji_Zhixiu, internal/whispered): "Is it a coincidence or a trap?"
Scene 3: The Encounter
Shot 07 | Entering the Bookstore | Duration: 5s
 * Visual Prompt: Wide interior shot of Environment_B from Ji_Zhixiu's perspective. The bookstore looks cramped, shadowy, and ominous. Books clutter the floor and block half the stairs. At the counter, illuminated only by a single desk lamp, sits pale-skinned Lin_Jie in all-black clothing, holding a teacup. On the counter in front of an empty stool sits a steaming cup of tea and a clean towel.
 * Camera: Slow panning POV scan of the room, settling on Lin_Jie.
 * Action: Ji_Zhixiu steps inside leaning on her black cane, water dripping from her hair and dress onto the wooden floor.
 * Audio / SFX: Door creak, bronze bell chime, water dripping (Drip, drip) in sudden quiet.
Shot 08 | The Shopkeeper's Greeting | Duration: 5s
 * Visual Prompt: Medium close-up of Lin_Jie behind the counter. Warm yellow lamp light reflects in his dark pupils. He looks up from his book, smiles calmly, and slides the steaming teacup closer to the edge of the counter.
 * Camera: Subtle push-in on Lin_Jie's face.
 * Action: Lin_Jie gestures politely toward the teacup.
 * Dialogue (Lin_Jie): "Welcome. It looks like my long wait hasn't been in vain. The rain has washed a beautiful customer into my humble bookstore."
Shot 09 | The Hunter's Suspicion | Duration: 4s
 * Visual Prompt: Extreme close-up split sequence: First on Ji_Zhixiu's narrowed, sharp eyes glaring cautiously at the steaming teacup; second on her wet fingers resting on the handle of the black metal cane, her thumb hovering over a hidden release button.
 * Camera: Tight, tense macro shots.
 * Action: Ji_Zhixiu shifts her thumb onto the cane's trigger mechanism, ready to strike.
 * Audio / SFX: Faint metallic click, tense ambient drone.
 * Dialogue (Ji_Zhixiu): "You were waiting for me?"
Shot 10 | The Offer | Duration: 6s
 * Visual Prompt: Two-shot across the counter. Lin_Jie sits relaxed in the warm light while Ji_Zhixiu stands rigid and drenched in the shadows. Lin_Jie gestures warmly toward the folded towel on the counter.
 * Camera: Medium profile shot framing both characters across the counter divide.
 * Action: Ji_Zhixiu hesitates, slightly lowers her guard on the cane, picks up the towel with one hand, and shakes her head slightly. Lin_Jie leans forward with a concerned expression.
 * Dialogue (Lin_Jie): "Yes. I've always thought that fate works in miraculous ways, how it brings two complete strangers together in the least expected way. Feel free to use the towel there to wipe yourself dry. Don't worry, it's unused. Would you like me to turn on the heater?"
 * Dialogue (Ji_Zhixiu): "It's fine."
 * Dialogue (Lin_Jie): "From the look of things, you seem to have encountered some trouble?"`;
