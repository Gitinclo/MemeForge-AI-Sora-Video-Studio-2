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

import {
  type AllowedDurationSeconds,
  type PilotResolution,
  type VeoModelTier,
  estimateJobCostUsd,
} from './aiVideoPilotEngine.ts';

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

// ============================================================================
// 3. CHARACTER VOICEOVER ENGINE (Lin_Jie & Ji_Zhixiu AI & Uploaded Voice Clips)
// ============================================================================

export type GeminiPrebuiltVoiceName = 'Charon' | 'Fenrir' | 'Puck' | 'Kore' | 'Zephyr';

export type CharacterVoicePresetId =
  | 'lin_charon_warm_mentor'
  | 'lin_fenrir_mysterious_sage'
  | 'lin_puck_conversational'
  | 'lin_charon_ominous_calm'
  | 'ji_kore_cold_vigilant'
  | 'ji_zephyr_breathless_wounded'
  | 'ji_kore_blade_interrogation'
  | 'ji_zephyr_lowering_guard';

export interface CharacterVoicePreset {
  id: CharacterVoicePresetId;
  characterToken: 'Character_A' | 'Character_B';
  speakerHandle: 'Lin_Jie' | 'Ji_Zhixiu';
  label: string;
  geminiVoiceName: GeminiPrebuiltVoiceName;
  stylePrompt: string;
  fundamentalHz: number;
  defaultPitch: number;
  defaultRate: number;
  timbreDescription: string;
  sampleLine?: string;
}

export const AI_CHARACTER_VOICE_PRESETS: CharacterVoicePreset[] = [
  {
    id: 'lin_charon_warm_mentor',
    characterToken: 'Character_A',
    speakerHandle: 'Lin_Jie',
    label: 'Charon — Warm Baritone Shopkeeper (Recommended)',
    geminiVoiceName: 'Charon',
    stylePrompt:
      'Warm, gentle, serene bookstore owner speaking softly and reassuringly over heavy rain',
    fundamentalHz: 122,
    defaultPitch: 0.92,
    defaultRate: 0.95,
    timbreDescription: 'Smooth, calm baritone with gentle chest resonance and an inviting cadence.',
    sampleLine:
      "Welcome. It looks like my long wait hasn't been in vain. The rain has washed a beautiful customer into my humble bookstore.",
  },
  {
    id: 'lin_fenrir_mysterious_sage',
    characterToken: 'Character_A',
    speakerHandle: 'Lin_Jie',
    label: 'Fenrir — Deep Enigmatic Nocturne',
    geminiVoiceName: 'Fenrir',
    stylePrompt:
      'Deep, measured, inadvertently mysterious tone that sounds ordinary yet omniscient to outsiders',
    fundamentalHz: 104,
    defaultPitch: 0.85,
    defaultRate: 0.9,
    timbreDescription: 'Low, resonant bass-baritone with dramatic pauses and mysterious authority.',
    sampleLine:
      'From the look of things, you seem to have encountered some trouble?',
  },
  {
    id: 'lin_puck_conversational',
    characterToken: 'Character_A',
    speakerHandle: 'Lin_Jie',
    label: 'Puck — Friendly Casual Host',
    geminiVoiceName: 'Puck',
    stylePrompt: 'Kind-hearted, relaxed, everyday conversational voice offering hot tea',
    fundamentalHz: 138,
    defaultPitch: 1.0,
    defaultRate: 1.0,
    timbreDescription: 'Light, approachable tenor with warm conversational inflection.',
    sampleLine:
      'What if someone gets caught in the rain without an umbrella and needs a place to wait it out?',
  },
  {
    id: 'lin_charon_ominous_calm',
    characterToken: 'Character_A',
    speakerHandle: 'Lin_Jie',
    label: 'Charon — Serene Rainy-Night Philosopher',
    geminiVoiceName: 'Charon',
    stylePrompt:
      'Quiet, reflective, poetic delivery with unhurried warmth amidst a dark gothic downpour',
    fundamentalHz: 114,
    defaultPitch: 0.88,
    defaultRate: 0.92,
    timbreDescription: 'Velvety low baritone with tranquil, hypnotic pacing.',
    sampleLine:
      "Yes. I've always thought that fate works in miraculous ways, how it brings two complete strangers together.",
  },
  {
    id: 'ji_kore_cold_vigilant',
    characterToken: 'Character_B',
    speakerHandle: 'Ji_Zhixiu',
    label: 'Kore — Cold Vigilant Night Hunter (Recommended)',
    geminiVoiceName: 'Kore',
    stylePrompt:
      'Cold, fiercely vigilant, razor-sharp contralto whispered through guarded tension',
    fundamentalHz: 218,
    defaultPitch: 1.06,
    defaultRate: 1.02,
    timbreDescription: 'Crisp, focused contralto with steely edge and guarded restraint.',
    sampleLine: 'Is it a coincidence or a trap?',
  },
  {
    id: 'ji_zephyr_breathless_wounded',
    characterToken: 'Character_B',
    speakerHandle: 'Ji_Zhixiu',
    label: 'Zephyr — Wounded Breathless Whisper',
    geminiVoiceName: 'Zephyr',
    stylePrompt:
      'Hushed, pained, breathless whisper after an alley battle in torrential rain',
    fundamentalHz: 236,
    defaultPitch: 1.12,
    defaultRate: 0.96,
    timbreDescription: 'Airy, tense whisper carrying physical exhaustion and high alertness.',
    sampleLine: 'Time, I need time.',
  },
  {
    id: 'ji_kore_blade_interrogation',
    characterToken: 'Character_B',
    speakerHandle: 'Ji_Zhixiu',
    label: 'Kore — Razor-Sharp Suspicion & Trigger Poise',
    geminiVoiceName: 'Kore',
    stylePrompt:
      'Low, lethal, suspicious interrogation with thumb poised on the hidden cane-blade release',
    fundamentalHz: 206,
    defaultPitch: 0.98,
    defaultRate: 0.98,
    timbreDescription: 'Piercing, low-register contralto with coiled lethal intensity.',
    sampleLine: 'You were waiting for me?',
  },
  {
    id: 'ji_zephyr_lowering_guard',
    characterToken: 'Character_B',
    speakerHandle: 'Ji_Zhixiu',
    label: 'Zephyr — Guarded Stoic Restraint',
    geminiVoiceName: 'Zephyr',
    stylePrompt:
      'Brief, stoic, composed response while hesitantly accepting the clean towel',
    fundamentalHz: 224,
    defaultPitch: 1.04,
    defaultRate: 0.95,
    timbreDescription: 'Subtle, guarded mid-contralto softening slightly from battle tension.',
    sampleLine: "It's fine.",
  },
];

export type VoiceClipSourceType = 'ai_preset' | 'gemini_tts' | 'uploaded_file';

export interface ShotVoiceoverClip {
  clipId: string;
  shotId: string;
  shotNumber: number;
  lineIndex: number;
  characterToken: 'Character_A' | 'Character_B';
  speakerHandle: 'Lin_Jie' | 'Ji_Zhixiu';
  dialogueText: string;
  deliveryNote: string;
  sourceType: VoiceClipSourceType;
  presetId: CharacterVoicePresetId;
  geminiVoiceName: GeminiPrebuiltVoiceName;
  audioDataUri: string;
  uploadedFileName?: string;
  durationSec: number;
  volume: number;
  pitch: number;
  playbackRate: number;
}

/**
 * Generates a valid 44-byte RIFF WAV (16-bit mono PCM @ 8,000 Hz for compact data URI)
 * shaped with syllable-segmented vocal harmonics so every character voice clip is
 * immediately playable in `<audio>` / `new Audio()` and downloadable as `.wav`.
 */
export function synthesizeCharacterVoiceWavDataUri(
  dialogueText: string,
  characterToken: 'Character_A' | 'Character_B',
  pitchMultiplier = 1.0,
  targetDurationSec = 2.4
): string {
  const sampleRate = 8000;
  const clampedDur = Math.max(0.8, Math.min(5.0, targetDurationSec));
  const numSamples = Math.floor(sampleRate * clampedDur);
  const dataBytes = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // Standard 44-byte RIFF WAV header
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // AudioFormat = 1 (PCM)
  view.setUint16(22, 1, true); // NumChannels = 1 (Mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  const baseFreq = (characterToken === 'Character_A' ? 122 : 218) * pitchMultiplier;
  const words = dialogueText.trim().split(/\s+/).filter(Boolean);
  const syllableCount = Math.max(3, Math.min(24, words.length * 2));

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const normT = i / numSamples;

    // Syllable cadence envelope
    const sylPhase = (normT * syllableCount) % 1;
    const sylEnvelope = Math.sin(Math.PI * sylPhase) ** 1.4;

    // Natural pitchprosody contour (gentle rise then fall)
    const prosody =
      1 +
      0.06 * Math.sin(2 * Math.PI * 1.5 * normT) -
      0.08 * normT +
      0.012 * Math.sin(2 * Math.PI * 5.2 * t);

    const f0 = baseFreq * prosody;
    // Fundamental + 2nd & 3rd vocal formants
    const harmonic =
      0.62 * Math.sin(2 * Math.PI * f0 * t) +
      0.26 * Math.sin(2 * Math.PI * (f0 * 2) * t + 0.4) +
      0.12 * Math.sin(2 * Math.PI * (f0 * 3) * t + 1.1);

    // Fade in / out edges
    const edgeFade = Math.min(1, t / 0.04, (clampedDur - t) / 0.06);
    const sampleFloat = Math.max(-1, Math.min(1, harmonic * sylEnvelope * edgeFade * 0.45));
    view.setInt16(44 + i * 2, Math.round(sampleFloat * 32767), true);
  }

  // Encode ArrayBuffer to base64 (works in both Node.js tests and Browser)
  const bytes = new Uint8Array(buffer);
  let base64 = '';
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes).toString('base64');
  } else {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }

  return `data:audio/wav;base64,${base64}`;
}

/**
 * Builds the complete 10-shot Character Voiceover clip list mapped to `Lin_Jie` (`Character_A`)
 * and `Ji_Zhixiu` (`Character_B`) across the 10-shot animation script.
 * Non-dialogue action shots (Shots 03, 04, 07) receive subtle character vocal/breath cues so
 * every shot in the 10-shot timeline has an editable, replaceable character voiceover slot.
 */
export function buildDefaultShotVoiceoverMappings(
  shots: AnimationShotSpec[] = TEN_SHOT_ANIMATION_SCRIPT,
  selectedPresets: Record<'Character_A' | 'Character_B', CharacterVoicePresetId> = {
    Character_A: 'lin_charon_warm_mentor',
    Character_B: 'ji_kore_cold_vigilant',
  }
): ShotVoiceoverClip[] {
  const clips: ShotVoiceoverClip[] = [];

  const getPreset = (token: 'Character_A' | 'Character_B'): CharacterVoicePreset => {
    const presetId = selectedPresets[token];
    return (
      AI_CHARACTER_VOICE_PRESETS.find((p) => p.id === presetId) ||
      AI_CHARACTER_VOICE_PRESETS.find((p) => p.characterToken === token)!
    );
  };

  const actionVocalFallbacks: Record<
    string,
    { characterToken: 'Character_A' | 'Character_B'; deliveryNote: string; text: string }
  > = {
    shot_03: {
      characterToken: 'Character_A',
      deliveryNote: 'warm contented hum',
      text: 'A warm cup of tea and a good book... ready for whoever seeks shelter from the storm.',
    },
    shot_04: {
      characterToken: 'Character_B',
      deliveryNote: 'sharp combat breath',
      text: 'Out of my way.',
    },
    shot_07: {
      characterToken: 'Character_B',
      deliveryNote: 'guarded internal monologue',
      text: 'A steaming cup of tea waiting on the counter... was he expecting me?',
    },
  };

  for (const shot of shots) {
    if (shot.dialogues.length > 0) {
      shot.dialogues.forEach((d, idx) => {
        const isJi = /Ji_Zhixiu|Character_B|hunter/i.test(d.speaker);
        const token: 'Character_A' | 'Character_B' = isJi ? 'Character_B' : 'Character_A';
        const speakerHandle: 'Lin_Jie' | 'Ji_Zhixiu' = isJi ? 'Ji_Zhixiu' : 'Lin_Jie';
        const preset = getPreset(token);
        const clipDur = Number(
          Math.max(1.5, shot.scriptDurationSec / shot.dialogues.length).toFixed(1)
        );

        clips.push({
          clipId: `vo_${shot.shotId}_line_${idx + 1}`,
          shotId: shot.shotId,
          shotNumber: shot.shotNumber,
          lineIndex: idx + 1,
          characterToken: token,
          speakerHandle,
          dialogueText: d.text,
          deliveryNote: d.delivery || (isJi ? 'cold, vigilant' : 'warm, gentle'),
          sourceType: 'ai_preset',
          presetId: preset.id,
          geminiVoiceName: preset.geminiVoiceName,
          audioDataUri: synthesizeCharacterVoiceWavDataUri(
            d.text,
            token,
            preset.defaultPitch,
            Math.min(2.8, clipDur)
          ),
          durationSec: clipDur,
          volume: 0.9,
          pitch: preset.defaultPitch,
          playbackRate: preset.defaultRate,
        });
      });
    } else {
      const fallback = actionVocalFallbacks[shot.shotId] || {
        characterToken: shot.referencedCharacters[0] || 'Character_A',
        deliveryNote: 'subtle breath / internal cue',
        text: shot.action,
      };
      const token = fallback.characterToken;
      const speakerHandle: 'Lin_Jie' | 'Ji_Zhixiu' =
        token === 'Character_B' ? 'Ji_Zhixiu' : 'Lin_Jie';
      const preset = getPreset(token);

      clips.push({
        clipId: `vo_${shot.shotId}_line_1`,
        shotId: shot.shotId,
        shotNumber: shot.shotNumber,
        lineIndex: 1,
        characterToken: token,
        speakerHandle,
        dialogueText: fallback.text,
        deliveryNote: fallback.deliveryNote,
        sourceType: 'ai_preset',
        presetId: preset.id,
        geminiVoiceName: preset.geminiVoiceName,
        audioDataUri: synthesizeCharacterVoiceWavDataUri(
          fallback.text,
          token,
          preset.defaultPitch,
          2.0
        ),
        durationSec: shot.scriptDurationSec,
        volume: 0.85,
        pitch: preset.defaultPitch,
        playbackRate: preset.defaultRate,
      });
    }
  }

  return clips;
}

/**
 * Updates voiceover clips for a given character (`Lin_Jie` or `Ji_Zhixiu`)
 * to use a newly selected AI Voice Persona preset from the Voice Library.
 * By default (`overwriteUploaded = false`), preserves custom uploaded files unless
 * explicitly overridden (`overwriteUploaded = true`).
 */
export function applyCharacterPresetToVoiceoverClips(
  clips: ShotVoiceoverClip[],
  characterToken: 'Character_A' | 'Character_B',
  presetId: CharacterVoicePresetId,
  overwriteUploaded = false
): ShotVoiceoverClip[] {
  const preset = AI_CHARACTER_VOICE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return clips;

  return clips.map((clip) => {
    if (clip.characterToken !== characterToken) {
      return clip;
    }
    if (!overwriteUploaded && clip.sourceType === 'uploaded_file') {
      return clip;
    }
    return {
      ...clip,
      sourceType: 'ai_preset',
      presetId: preset.id,
      geminiVoiceName: preset.geminiVoiceName,
      uploadedFileName: undefined,
      pitch: preset.defaultPitch,
      playbackRate: preset.defaultRate,
      audioDataUri: synthesizeCharacterVoiceWavDataUri(
        clip.dialogueText,
        characterToken,
        preset.defaultPitch,
        Math.min(2.8, clip.durationSec)
      ),
    };
  });
}

/**
 * Applies a pre-generated AI character voice from the Voice Library dropdown to either
 * a specific `targetClipId` (single shot line) or all lines for a character role
 * (`targetCharacterToken` or the preset's native characterToken), replacing any manual upload.
 */
export function applyVoiceLibraryPresetToClips(
  clips: ShotVoiceoverClip[],
  presetId: CharacterVoicePresetId,
  options: {
    targetClipId?: string;
    targetCharacterToken?: 'Character_A' | 'Character_B';
  } = {}
): ShotVoiceoverClip[] {
  const preset = AI_CHARACTER_VOICE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return clips;

  const effectiveCharToken = options.targetCharacterToken || preset.characterToken;

  return clips.map((clip) => {
    const matchesClip = options.targetClipId && clip.clipId === options.targetClipId;
    const matchesCharacter =
      !options.targetClipId && clip.characterToken === effectiveCharToken;

    if (!matchesClip && !matchesCharacter) {
      return clip;
    }

    return {
      ...clip,
      sourceType: 'ai_preset',
      presetId: preset.id,
      geminiVoiceName: preset.geminiVoiceName,
      uploadedFileName: undefined,
      pitch: preset.defaultPitch,
      playbackRate: preset.defaultRate,
      audioDataUri: synthesizeCharacterVoiceWavDataUri(
        clip.dialogueText,
        clip.characterToken,
        preset.defaultPitch,
        Math.min(2.8, clip.durationSec)
      ),
    };
  });
}

/**
 * Attaches a user-uploaded custom audio clip (or Gemini TTS generated clip) either
 * to a specific `clipId` or across all lines spoken by `characterToken`.
 */
export function attachCustomVoiceAudioToClips(
  clips: ShotVoiceoverClip[],
  options: {
    targetClipId?: string;
    targetCharacterToken?: 'Character_A' | 'Character_B';
    audioDataUri: string;
    uploadedFileName?: string;
    sourceType: VoiceClipSourceType;
  }
): ShotVoiceoverClip[] {
  return clips.map((clip) => {
    const matchesClip = options.targetClipId && clip.clipId === options.targetClipId;
    const matchesCharacter =
      !options.targetClipId &&
      options.targetCharacterToken &&
      clip.characterToken === options.targetCharacterToken;

    if (!matchesClip && !matchesCharacter) {
      return clip;
    }

    return {
      ...clip,
      sourceType: options.sourceType,
      audioDataUri: options.audioDataUri,
      uploadedFileName: options.uploadedFileName || clip.uploadedFileName,
    };
  });
}

export const ALLOWED_VOICE_UPLOAD_EXTENSIONS = ['.mp3', '.wav'] as const;
export const MAX_VOICE_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export interface VoiceUploadValidationResult {
  valid: boolean;
  normalizedFormat: 'MP3' | 'WAV' | 'UNKNOWN';
  error?: string;
}

/**
 * Validates that a dropped or selected custom voice file is a valid `.mp3` or `.wav`
 * audio file within the 25 MB limit.
 */
export function validateVoiceUploadFile(
  fileName: string,
  mimeType = '',
  fileSizeBytes = 0
): VoiceUploadValidationResult {
  const cleanName = (fileName || '').trim().toLowerCase();
  const cleanMime = (mimeType || '').trim().toLowerCase();

  if (!cleanName) {
    return {
      valid: false,
      normalizedFormat: 'UNKNOWN',
      error: 'Missing file name. Please drop a valid .mp3 or .wav audio file.',
    };
  }

  if (fileSizeBytes > MAX_VOICE_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      normalizedFormat: 'UNKNOWN',
      error: `File "${fileName}" exceeds the 25 MB maximum upload size.`,
    };
  }

  const isMp3 =
    cleanName.endsWith('.mp3') || cleanMime === 'audio/mpeg' || cleanMime === 'audio/mp3';
  const isWav =
    cleanName.endsWith('.wav') ||
    cleanMime === 'audio/wav' ||
    cleanMime === 'audio/x-wav' ||
    cleanMime === 'audio/wave';

  if (isMp3) {
    return { valid: true, normalizedFormat: 'MP3' };
  }
  if (isWav) {
    return { valid: true, normalizedFormat: 'WAV' };
  }

  return {
    valid: false,
    normalizedFormat: 'UNKNOWN',
    error: `Unsupported file "${fileName}". Only .mp3 and .wav voice files are supported.`,
  };
}

export interface InferredVoiceRoleMapping {
  characterToken: 'Character_A' | 'Character_B';
  speakerHandle: 'Lin_Jie' | 'Ji_Zhixiu';
  shotId?: string;
  confidence: 'filename_match' | 'default_fallback';
}

/**
 * Inspects a dropped `.mp3` or `.wav` filename (e.g., `ji_zhixiu_shot_05.wav` or `lin_jie_welcome.mp3`)
 * to automatically infer the character role (`Character_A: Lin_Jie` vs `Character_B: Ji_Zhixiu`)
 * and optional target shot ID (`shot_01`..`shot_10`).
 */
export function inferCharacterAndShotFromFileName(
  fileName: string,
  fallbackCharacter: 'Character_A' | 'Character_B' = 'Character_A'
): InferredVoiceRoleMapping {
  const lower = (fileName || '').toLowerCase();
  const shotMatch = lower.match(/(?:shot[_-\s]?|s)(0?[1-9]|10)(?![0-9])/);
  const matchedShotId = shotMatch
    ? `shot_${String(Number(shotMatch[1])).padStart(2, '0')}`
    : undefined;

  if (/ji[_\-\s]?zhixiu|character[_\-\s]?b|hunter|zhixiu|female|kore|zephyr/i.test(lower)) {
    return {
      characterToken: 'Character_B',
      speakerHandle: 'Ji_Zhixiu',
      shotId: matchedShotId,
      confidence: 'filename_match',
    };
  }

  if (/lin[_\-\s]?jie|character[_\-\s]?a|shopkeeper|lin|male|charon|fenrir|puck/i.test(lower)) {
    return {
      characterToken: 'Character_A',
      speakerHandle: 'Lin_Jie',
      shotId: matchedShotId,
      confidence: 'filename_match',
    };
  }

  return {
    characterToken: fallbackCharacter,
    speakerHandle: fallbackCharacter === 'Character_B' ? 'Ji_Zhixiu' : 'Lin_Jie',
    shotId: matchedShotId,
    confidence: 'default_fallback',
  };
}

export interface UploadedCharacterVoiceAsset {
  id: string;
  fileName: string;
  format: 'MP3' | 'WAV';
  fileSizeKb: number;
  characterToken: 'Character_A' | 'Character_B';
  speakerHandle: 'Lin_Jie' | 'Ji_Zhixiu';
  targetScope: 'all_role_lines' | string; // 'all_role_lines' or a specific clipId / shotId
  audioDataUri: string;
  uploadedAtUtc: string;
}

/**
 * Restores a specific clip or all clips for a character role back to their synthesized AI Voice Preset.
 */
export function resetVoiceClipToAiPreset(
  clips: ShotVoiceoverClip[],
  options: {
    targetClipId?: string;
    targetCharacterToken?: 'Character_A' | 'Character_B';
    selectedPresets: Record<'Character_A' | 'Character_B', CharacterVoicePresetId>;
  }
): ShotVoiceoverClip[] {
  return clips.map((clip) => {
    const matchesClip = options.targetClipId && clip.clipId === options.targetClipId;
    const matchesCharacter =
      !options.targetClipId &&
      options.targetCharacterToken &&
      clip.characterToken === options.targetCharacterToken;

    if (!matchesClip && !matchesCharacter) {
      return clip;
    }

    const presetId = options.selectedPresets[clip.characterToken];
    const preset =
      AI_CHARACTER_VOICE_PRESETS.find((p) => p.id === presetId) ||
      AI_CHARACTER_VOICE_PRESETS.find((p) => p.characterToken === clip.characterToken)!;

    return {
      ...clip,
      sourceType: 'ai_preset',
      presetId: preset.id,
      geminiVoiceName: preset.geminiVoiceName,
      uploadedFileName: undefined,
      pitch: preset.defaultPitch,
      playbackRate: preset.defaultRate,
      audioDataUri: synthesizeCharacterVoiceWavDataUri(
        clip.dialogueText,
        clip.characterToken,
        preset.defaultPitch,
        Math.min(2.8, clip.durationSec)
      ),
    };
  });
}
