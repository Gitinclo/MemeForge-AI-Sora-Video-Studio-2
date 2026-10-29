/**
 * User Guides & Interactive "How to Use the App" Onboarding Engine
 * Provides structured step-by-step instructions, live full-text search,
 * persistent checklist progress calculation, keyboard shortcut reference,
 * and troubleshooting FAQ for MemeForge AI Studio.
 */

import { clampNumber, readStorageJson, writeStorageJson } from './sharedCoreEngine';

export const MEMEFORGE_USER_GUIDES_STORAGE_KEY = 'memeforge_user_guides_progress_v1';

export type GuideCategoryId =
  | 'quick_start'
  | 'core_modules'
  | 'ai_architecture'
  | 'publishing_monetization'
  | 'shortcuts_faq';

export type GuideDeepLinkTarget =
  | 'tab:meme'
  | 'tab:leo'
  | 'tab:cinema'
  | 'tab:team'
  | 'tab:market'
  | 'tab:youtube'
  | 'tab:enterprise'
  | 'modal:magic_caption'
  | 'modal:ai_director'
  | 'modal:android_apk'
  | 'modal:subscription'
  | 'modal:original_bridge'
  | 'modal:legal_terms';

export interface GuideStep {
  id: string;
  stepNumber: number;
  title: string;
  whereToClick: string;
  description: string;
  expectedOutcome: string;
  shortcutHint?: string;
  deepLinkAction: GuideDeepLinkTarget;
  deepLinkLabel: string;
}

export interface GuideSamplePrompt {
  id: string;
  label: string;
  targetModule: string;
  promptText: string;
}

export interface GuideSection {
  id: string;
  category: GuideCategoryId;
  chapterNumber: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  overview: string;
  whoIsItFor: string;
  primaryDeepLink: GuideDeepLinkTarget;
  primaryDeepLinkLabel: string;
  steps: GuideStep[];
  proTips: string[];
  samplePrompts?: GuideSamplePrompt[];
}

export interface GuideShortcutItem {
  id: string;
  keys: string[];
  action: string;
  context: string;
  deepLinkAction?: GuideDeepLinkTarget;
}

export interface GuideFaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'meme_canvas' | 'video_audio' | 'ai_tools' | 'marketplace_billing' | 'export_mobile';
  deepLinkAction?: GuideDeepLinkTarget;
  deepLinkLabel?: string;
}

export interface UserGuideProgressState {
  completedStepIds: string[];
  bookmarkedGuideIds: string[];
  lastActiveGuideId: string;
  updatedAt: string;
}

export interface GuideProgressSummary {
  totalSteps: number;
  completedSteps: number;
  percentComplete: number;
  completedChaptersCount: number;
  totalChaptersCount: number;
}

export const USER_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'quick-start-60s',
    category: 'quick_start',
    chapterNumber: '01',
    title: 'Quick Start: Make Your First Meme in 60 Seconds',
    subtitle: 'Learn the 4 essential steps to pick a template, edit captions, use AI, and download your meme.',
    estimatedMinutes: 1,
    overview:
      'New to MemeForge AI Studio? Start here. This 60-second walkthrough teaches you how to load any meme template or custom photo, customize text right on the canvas, generate funny captions with AI, and save a clean high-resolution image.',
    whoIsItFor: 'First-time visitors and creators who want to make and download a meme right away.',
    primaryDeepLink: 'tab:meme',
    primaryDeepLinkLabel: 'Open M1 MemeForge Studio',
    steps: [
      {
        id: 'qs-step-1',
        stepNumber: 1,
        title: 'Choose a Template, Upload a Photo, or Paste with Ctrl+V',
        whereToClick: 'M1 MemeForge AI Tab → Template Gallery (below canvas) or "Upload Custom Image"',
        description:
          'Scroll to the Meme Template Selector below the canvas and click any trending template, click Upload to pick a photo from your device, or press Ctrl+V anywhere on the page to paste an image from your clipboard.',
        expectedOutcome:
          'Your chosen image immediately loads onto the interactive MemeCanvas with default top and bottom text layers ready to edit.',
        shortcutHint: 'Ctrl+V',
        deepLinkAction: 'tab:meme',
        deepLinkLabel: 'Go to Template Gallery',
      },
      {
        id: 'qs-step-2',
        stepNumber: 2,
        title: 'Click Text on the Canvas and Customize Your Caption',
        whereToClick: 'MemeCanvas (Left) or Live Layer Editor Toolbar (Right)',
        description:
          'Click either the top or bottom text directly on the canvas to select it, or drag it anywhere to reposition. Use the right-hand MemeToolbar to type your new caption, change the font (Impact, Anton, Bebas Neue), adjust font size, or change text and outline colors.',
        expectedOutcome:
          'The canvas updates at 60 FPS as you type and drag, showing your exact font styling, stroke outline, and drop shadow.',
        deepLinkAction: 'tab:meme',
        deepLinkLabel: 'Edit Canvas Text Now',
      },
      {
        id: 'qs-step-3',
        stepNumber: 3,
        title: 'Generate Instant Joke Ideas with Magic Caption AI',
        whereToClick: 'Top Header Bar or Under Canvas → "Magic Caption" Button',
        description:
          'Stuck on what to write? Click the purple-and-amber Magic Caption button. Choose a comedy vibe (Sarcastic, Relatable, Tech Bro, Gen-Z Absurd) and click Generate to let AI analyze your meme and write top/bottom punchlines.',
        expectedOutcome:
          'Clicking any AI-suggested caption automatically applies both the top and bottom text layers to your canvas and saves a version snapshot.',
        deepLinkAction: 'modal:magic_caption',
        deepLinkLabel: 'Launch Magic Caption AI',
      },
      {
        id: 'qs-step-4',
        stepNumber: 4,
        title: 'Download Clean PNG/JPG/WebP or Copy to Clipboard',
        whereToClick: 'Quick Action Bar (directly below the MemeCanvas) → "PNG" or "Copy"',
        description:
          'When your meme looks great, click the PNG, JPG, or WebP button under the canvas to download the image file, or click Copy to place the image directly on your clipboard for pasting into Discord, Slack, WhatsApp, or X.',
        expectedOutcome:
          'The dashed selection box is automatically stripped out before export so your downloaded or copied meme is 100% clean.',
        deepLinkAction: 'tab:meme',
        deepLinkLabel: 'Go to Canvas Export Bar',
      },
    ],
    proTips: [
      'Your current meme layout (text layers, stickers, and filters) auto-saves to your browser every 30 seconds so you never lose work.',
      'Need a custom punchline brainstorm? Click "AI Co-Director" in the top header to chat with an interactive comedy writer.',
    ],
    samplePrompts: [
      {
        id: 'prompt-qs-1',
        label: 'Magic Caption Context Idea',
        targetModule: 'Magic Caption Modal',
        promptText: 'When the senior engineer says "it is a 5-minute config change" on Friday at 4:55 PM',
      },
    ],
  },
  {
    id: 'm1-memeforge-advanced',
    category: 'core_modules',
    chapterNumber: '02',
    title: 'How to Use M1: Multi-Layer Text, Stickers, Filters & Audio Memes',
    subtitle: 'Master custom text layers, emoji stickers, aspect ratios, sound effects, and WebM video exports.',
    estimatedMinutes: 3,
    overview:
      'Module 1 (MemeForge AI) goes far beyond static two-line memes. Learn how to stack unlimited text layers, place draggable stickers, switch aspect ratios for Instagram Reels or YouTube Shorts, attach sound effects like the MLG Airhorn, and export a playable video meme with embedded audio.',
    whoIsItFor: 'Meme creators building multi-panel jokes, reaction stickers, or viral video memes with sound.',
    primaryDeepLink: 'tab:meme',
    primaryDeepLinkLabel: 'Open M1 MemeForge Studio',
    steps: [
      {
        id: 'm1-step-1',
        stepNumber: 1,
        title: 'Add Extra Text Layers & Apply One-Click Style Presets',
        whereToClick: 'Under Canvas → "+ Add Text" or Right Toolbar → "Style Presets"',
        description:
          'Click "+ Add Text" below the canvas to create additional text boxes for multi-character memes. Use the Style Preset Picker in the toolbar to switch between Classic Impact, Modern TikTok Pill, Neon Cyberpunk, or Breaking News banners.',
        expectedOutcome:
          'A new draggable text layer appears in the center of your canvas and can be positioned over any character or object.',
        shortcutHint: 'Alt+1',
        deepLinkAction: 'tab:meme',
        deepLinkLabel: 'Open M1 Layer Editor',
      },
      {
        id: 'm1-step-2',
        stepNumber: 2,
        title: 'Place Stickers, Change Filters & Switch Aspect Ratio',
        whereToClick: 'Right Toolbar → Stickers, Filters & Aspect Ratio Controls',
        description:
          'Click any sticker in the toolbar (Deal With It Glasses, Fire, Skull, Crying Laugh) to drop it onto the canvas. Choose a canvas filter (Deep Fried, Noir Grayscale, Vintage Sepia, High Contrast) and pick 1:1 Square, 16:9 Landscape, or 9:16 Vertical.',
        expectedOutcome:
          'Your canvas resizes and applies real-time color grading while keeping all text and stickers crisp.',
        deepLinkAction: 'tab:meme',
        deepLinkLabel: 'Try Stickers & Filters',
      },
      {
        id: 'm1-step-3',
        stepNumber: 3,
        title: 'Attach Sound Effects & Export as a Video Meme (.webm)',
        whereToClick: 'Meme Audio Layer Panel (below toolbar) & "Test Audio" / "Export Video"',
        description:
          'Select a built-in meme sound effect (MLG Airhorn, Vine Boom, Sad Violin, Bruh, Windows XP Error) or upload your own MP3/WAV file. Adjust volume and playback speed, click "Test Audio" to preview, then click "Export Video (.webm)".',
        expectedOutcome:
          'MemeForge records your canvas frames synchronized with the Web Audio stream and downloads a ready-to-post video file with sound.',
        deepLinkAction: 'tab:meme',
        deepLinkLabel: 'Configure Meme Audio Layer',
      },
      {
        id: 'm1-step-4',
        stepNumber: 4,
        title: 'Brainstorm Skits with the AI Co-Director Chat',
        whereToClick: 'Top Navigation Header → "AI Co-Director"',
        description:
          'Click "AI Co-Director" in the top bar to open the conversational comedy assistant. Ask for roast ideas, caption variations, or short video skit scripts.',
        expectedOutcome:
          'The AI Co-Director replies with structured punchlines and visual gag suggestions you can copy straight into your meme.',
        deepLinkAction: 'modal:ai_director',
        deepLinkLabel: 'Ask AI Co-Director',
      },
    ],
    proTips: [
      'Use the "Deep Fried" filter combined with the "Vine Boom" audio effect and 1.25x playback speed for classic ironic meme edits.',
      'You can remove any extra text layer or sticker at any time using the trash icon next to that item in the right-hand toolbar.',
    ],
  },
  {
    id: 'm2-leo-video-studio',
    category: 'core_modules',
    chapterNumber: '03',
    title: 'How to Use M2: LEO AI Video Studio & Sora 2 Ultra Planner',
    subtitle: 'Generate cinematic AI video clips, configure keyframes, and plan 32K / 1000 FPS sequences.',
    estimatedMinutes: 4,
    overview:
      'Module 2 (LEO Video Studio) is your AI text-to-video and keyframe animation workbench. Learn how to write cinematic video prompts, choose camera movements and frame rates, inspect the Sora 2 Ultra 32K / 1000 FPS / 100-hour memory planner, and send generated video clips to YouTube.',
    whoIsItFor: 'Video creators, animators, and AI filmmakers generating motion clips from text prompts.',
    primaryDeepLink: 'tab:leo',
    primaryDeepLinkLabel: 'Open M2 LEO Video Studio',
    steps: [
      {
        id: 'm2-step-1',
        stepNumber: 1,
        title: 'Switch to M2 LEO Video Studio',
        whereToClick: 'Top Studio Switcher → "M2 LEO Video (Sora 2)" (or press Alt+2)',
        description:
          'Click the "M2 LEO Video (Sora 2)" button in the top navigation bar or press Alt+2 on your keyboard to switch from the static meme canvas to the AI video studio.',
        expectedOutcome:
          'The LEO Video Studio workspace opens with prompt controls, resolution selectors, keyframe interpolators, and hardware cluster monitors.',
        shortcutHint: 'Alt+2',
        deepLinkAction: 'tab:leo',
        deepLinkLabel: 'Switch to M2 LEO Video',
      },
      {
        id: 'm2-step-2',
        stepNumber: 2,
        title: 'Enter a Video Prompt, Resolution & Camera Motion',
        whereToClick: 'LEO Video Prompt Box & Camera / Resolution Controls',
        description:
          'Type a descriptive scene prompt (subject, lighting, camera movement, lens style), select your target resolution (1080p, 4K, 8K, or 32K Ultra), frame rate (24 to 1000 FPS), and duration, then click Generate Video.',
        expectedOutcome:
          'The studio simulates or executes the diffusion denoising pipeline and renders an interactive preview with telemetry metrics.',
        deepLinkAction: 'tab:leo',
        deepLinkLabel: 'Create a Video Prompt',
      },
      {
        id: 'm2-step-3',
        stepNumber: 3,
        title: 'Configure Multi-Keyframe Camera Paths & Sora 2 Ultra Horizon',
        whereToClick: 'LEO Studio → Keyframe Timeline & Sora 2 Ultra 32K Planner',
        description:
          'Add start, middle, and end keyframes with custom camera pan/zoom curves, or inspect the Sora 2 Ultra planner to calculate hierarchical ring-attention memory budgets for long-horizon video.',
        expectedOutcome:
          'Produces smooth keyframe transition curves and exact VRAM / token throughput calculations for your sequence.',
        deepLinkAction: 'tab:leo',
        deepLinkLabel: 'Open Keyframe & Sora 2 Planner',
      },
      {
        id: 'm2-step-4',
        stepNumber: 4,
        title: 'Launch AI Video Pilot: One Chapter to a 3-Minute Animated Episode (Veo 3.1)',
        whereToClick: 'M2 LEO Video Studio Header → "AI Video Pilot (Veo 3.1 · 3-Min Episode)" Button',
        description:
          'Open the AI Video Pilot workbench to play the 23-shot (180s) "Nocturne in the Rainy Bookstore" 2.5D Anime Animatic, compile any novel chapter into 23 schema-validated shots, simulate Google Veo 3.1 pricing against the atomic $500 Budget Guard, export costs.csv, and verify the 5-Clause Book License Gate.',
        expectedOutcome:
          'Plays the 23-shot episode animatic at 60 FPS, computes exact Sept 2026 Veo 3.1 costs, and allows 1-click loading of any shot into the LEO Studio prompt editor.',
        deepLinkAction: 'tab:leo',
        deepLinkLabel: 'Open AI Video Pilot in M2',
      },
    ],
    proTips: [
      'Include camera movement terms like "slow dolly zoom", "35mm anamorphic tracking shot", or "FPV drone flythrough" for stronger motion coherence.',
      'Use the "AI Video Pilot (Veo 3.1 · 3-Min Episode)" button in M2 to compile a full book chapter into 23 non-verbatim shots (180s total) with atomic $500 budget enforcement.',
      'From inside LEO Video Studio, you can also open the "Vibe Coder Deployment Guide" to generate ready-to-run Docker and FastAPI scripts for rented GPUs.',
    ],
    samplePrompts: [
      {
        id: 'prompt-m2-1',
        label: 'Cinematic Cyberpunk Ramen Stall',
        targetModule: 'M2 LEO Video Studio',
        promptText:
          'Cinematic tracking shot of a neon noodle stall in rainy Tokyo at midnight, steam rising under glowing holographic signs, 35mm anamorphic lens, 60fps',
      },
      {
        id: 'prompt-m2-2',
        label: 'Viral Reaction Animation',
        targetModule: 'M2 LEO Video Studio',
        promptText:
          'Golden Shiba Inu wearing aviator sunglasses typing furiously on three glowing mechanical keyboards in a server room, dramatic rim lighting',
      },
    ],
  },
  {
    id: 'm3-cinema-32k-nle',
    category: 'core_modules',
    chapterNumber: '04',
    title: 'How to Use M3: Cinema 32K NLE & Fairlight Audio Mixer',
    subtitle: 'Edit multi-track video timelines, apply color grading LUTs, and mix multi-bus audio.',
    estimatedMinutes: 3,
    overview:
      'Module 3 (Cinema 32K NLE) provides a non-linear editing timeline, ACEScg color grading inspector, optical flow speed ramps, and a Fairlight-style audio console. Use it to assemble clips, add transitions, and master your final video.',
    whoIsItFor: 'Video editors and post-production creators combining clips, VFX nodes, and multi-track audio.',
    primaryDeepLink: 'tab:cinema',
    primaryDeepLinkLabel: 'Open M3 Cinema 32K NLE',
    steps: [
      {
        id: 'm3-step-1',
        stepNumber: 1,
        title: 'Open M3 Cinema 32K NLE Timeline',
        whereToClick: 'Top Studio Switcher → "M3 Cinema 32K NLE" (or press Alt+3)',
        description:
          'Click "M3 Cinema 32K NLE" in the top bar or press Alt+3. Inspect the multi-track timeline containing video tracks, VFX overlays, and synchronized audio buses.',
        expectedOutcome:
          'Opens the Cinema NLE interface with playhead scrubbing, clip inspector, LUT color wheels, and audio meters.',
        shortcutHint: 'Alt+3',
        deepLinkAction: 'tab:cinema',
        deepLinkLabel: 'Open M3 Cinema NLE',
      },
      {
        id: 'm3-step-2',
        stepNumber: 2,
        title: 'Apply Color Grading LUTs & Transition Effects',
        whereToClick: 'Cinema NLE → Color Grading & Transition Inspector',
        description:
          'Select any clip on the timeline to adjust exposure, contrast, saturation, or apply cinema LUT presets (Teal & Orange, Cyberpunk Neon, Kodachrome 64, IMAX Clean) and transition wipes.',
        expectedOutcome:
          'The viewport preview updates immediately with your selected color grade and transition timing.',
        deepLinkAction: 'tab:cinema',
        deepLinkLabel: 'Try Cinema Color Grading',
      },
      {
        id: 'm3-step-3',
        stepNumber: 3,
        title: 'Balance Dialogue, SFX & Music in the Audio Mixer',
        whereToClick: 'Cinema NLE → Fairlight Audio Console Panel',
        description:
          'Adjust gain faders, stereo pan, parametric EQ, and loudness normalization (-14 LUFS for YouTube/Spotify) across your voiceover, sound effects, and background music tracks.',
        expectedOutcome:
          'Ensures crisp, distortion-free audio levels before exporting your master sequence.',
        deepLinkAction: 'tab:cinema',
        deepLinkLabel: 'Open Audio Mixer in M3',
      },
    ],
    proTips: [
      'Target -14 LUFS integrated loudness when mastering clips intended for YouTube or TikTok so platform normalization never crushes your audio punchline.',
    ],
  },
  {
    id: 'm4-enterprise-cloud-vault',
    category: 'core_modules',
    chapterNumber: '05',
    title: 'How to Use M4: Cloud Workspace, Version Rollback & Plans',
    subtitle: 'Restore previous meme versions in one click, collaborate with teams, and manage subscriptions.',
    estimatedMinutes: 2,
    overview:
      'Module 4 (Enterprise Cloud) keeps track of your project version history, team review comments, role-based workspaces, and subscription tiers. If you ever make a mistake on your meme canvas, you can roll back to any saved snapshot here.',
    whoIsItFor: 'Solo creators wanting version history rollback and teams collaborating on shared campaigns.',
    primaryDeepLink: 'tab:team',
    primaryDeepLinkLabel: 'Open M4 Enterprise Cloud',
    steps: [
      {
        id: 'm4-step-1',
        stepNumber: 1,
        title: 'View Version History & Roll Back to Any Earlier Snapshot',
        whereToClick: 'Top Studio Switcher → "M4 Enterprise Cloud" (Alt+4) → Version History',
        description:
          'Every time you switch templates, add text layers, or apply Magic Captions, the app records a snapshot. Open M4 Enterprise Cloud and click "Restore / Rollback" on any historical entry.',
        expectedOutcome:
          'Your MemeForge canvas immediately restores the exact image, text layers, and filter from that point in time.',
        shortcutHint: 'Alt+4',
        deepLinkAction: 'tab:team',
        deepLinkLabel: 'Open Version History (M4)',
      },
      {
        id: 'm4-step-2',
        stepNumber: 2,
        title: 'Collaborate in Team Workspaces & Review Approval Queues',
        whereToClick: 'M4 Enterprise Cloud → Team Members & Asset Vault',
        description:
          'Add team comments, review campaign approval statuses, and organize shared brand assets inside the encrypted cloud workspace.',
        expectedOutcome:
          'Keeps creative teams aligned with clear audit logs and versioned feedback.',
        deepLinkAction: 'tab:team',
        deepLinkLabel: 'Open Team Workspace',
      },
      {
        id: 'm4-step-3',
        stepNumber: 3,
        title: 'Manage Free, India Pro (Rs. 999) or Global PPP Plans',
        whereToClick: 'Top Header → "Plans: Rs. 999 / Global PPP" Button',
        description:
          'Click the Plans button in the top header to compare Free, Individual Creator Pro, and Company Team plans, including automatic Purchasing Power Parity (PPP) fair regional pricing.',
        expectedOutcome:
          'Opens the Subscription Modal where you can switch countries, preview local currency pricing, and activate Pro features.',
        deepLinkAction: 'modal:subscription',
        deepLinkLabel: 'View Subscription Plans',
      },
    ],
    proTips: [
      'You can also import and export full JSON meme layouts across applets using the "Original Studio" bridge button in the top header.',
    ],
  },
  {
    id: 'pytorch-dit-architecture',
    category: 'ai_architecture',
    chapterNumber: '06',
    title: 'How to Use PyTorch DiT Build Spec & LoRAFlow MLOps',
    subtitle: 'Inspect the 7-module PyTorch Text-to-Video Diffusion Transformer spec and train custom LoRA models.',
    estimatedMinutes: 4,
    overview:
      'For AI engineers and technical creators: MemeForge AI Studio includes an interactive workbench for the PyTorch 2.x Text-to-Video Diffusion Transformer (`pytorch_dit/`) and the LoRAFlow Spatial MLOps training dashboard.',
    whoIsItFor: 'ML engineers, technical creators, and developers inspecting tensor shapes, FP8 quantization, and LoRA fine-tuning.',
    primaryDeepLink: 'tab:enterprise',
    primaryDeepLinkLabel: 'Open LoRAFlow & Sora 2 Tab',
    steps: [
      {
        id: 'dit-step-1',
        stepNumber: 1,
        title: 'Inspect the PyTorch DiT Build Spec in M2 LEO Video',
        whereToClick: 'M2 LEO Video Studio Header → "PyTorch DiT Build Spec (CLAUDE.md)" Button',
        description:
          'Switch to M2 LEO Video and click the PyTorch DiT Build Spec button to explore all 7 modules (`vae.py`, `patchify.py`, `dit.py`, `attention.py`, `text.py`, `sampler.py`, `pipeline.py`), tensor shapes `[B, T, H, W, C]`, and acceptance tests.',
        expectedOutcome:
          'Opens the interactive PyTorch DiT workbench where you can simulate Causal 3D VAE compression, spatial/temporal attention, and FP8 quantization.',
        deepLinkAction: 'tab:leo',
        deepLinkLabel: 'Go to M2 for PyTorch DiT Spec',
      },
      {
        id: 'dit-step-2',
        stepNumber: 2,
        title: 'Train Custom Brand or Character Styles in LoRAFlow & Sora 2',
        whereToClick: 'Top Studio Switcher → "LoRAFlow & Sora 2" Tab',
        description:
          'Click "LoRAFlow & Sora 2" in the top navigation bar to configure custom LoRA rank, learning rate, and training steps, monitor loss curves in real time, and test model consistency in the sandbox.',
        expectedOutcome:
          'Once a LoRA checkpoint is trained, click "Deploy to LEO Studio" to use your custom model directly in M2 video generation.',
        deepLinkAction: 'tab:enterprise',
        deepLinkLabel: 'Open LoRAFlow MLOps Tab',
      },
    ],
    proTips: [
      'All tensor shapes in the PyTorch DiT package strictly follow the [B, T, H, W, C] docstring convention and enforce left-only causal temporal padding in 3D convolutions.',
    ],
    samplePrompts: [
      {
        id: 'prompt-dit-1',
        label: 'Run PyTorch DiT Acceptance & Benchmark Suite',
        targetModule: 'Terminal / PyTorch DiT Package',
        promptText: 'python3 -m pytorch_dit.bench --frames 8 --height 64 --width 64 --steps 4 --dtype bf16',
      },
    ],
  },
  {
    id: 'marketplace-youtube-apk',
    category: 'publishing_monetization',
    chapterNumber: '07',
    title: 'How to Use Marketplace, YouTube Publisher & Android APK Export',
    subtitle: 'Unlock or sell templates with Crypto/UPI, publish directly to YouTube, and export mobile packages.',
    estimatedMinutes: 3,
    overview:
      'Ready to share or monetize your work? Learn how to unlock exclusive templates in the Marketplace using free Testnet Crypto or UPI, publish your meme or video directly to YouTube, or package the studio for Android devices.',
    whoIsItFor: 'Creators publishing to YouTube Shorts/Video, trading templates, or installing the app on Android.',
    primaryDeepLink: 'tab:market',
    primaryDeepLinkLabel: 'Open Template Marketplace',
    steps: [
      {
        id: 'pub-step-1',
        stepNumber: 1,
        title: 'Unlock Premium Templates or List Your Own Meme in Marketplace',
        whereToClick: 'Top Studio Switcher → "Marketplace" Tab',
        description:
          'Open the Marketplace tab to browse community templates. Need free test funds? Click the Testnet Faucet button to add free ETH, SOL, MEME, and UPI balance, then unlock any template or list your current canvas for sale.',
        expectedOutcome:
          'Unlocked templates immediately load into your M1 MemeForge canvas and record a transaction receipt.',
        deepLinkAction: 'tab:market',
        deepLinkLabel: 'Explore Marketplace',
      },
      {
        id: 'pub-step-2',
        stepNumber: 2,
        title: 'Publish Your Meme or Video Directly to YouTube',
        whereToClick: 'Top Studio Switcher → "YouTube" Tab (or "Publish to YouTube" button)',
        description:
          'Click the YouTube tab in the top navigation bar. The app automatically captures a clean snapshot of your current canvas as a thumbnail and helps you configure title, description, tags, visibility, and Shorts formatting.',
        expectedOutcome:
          'Prepares and validates your YouTube upload package with one-click metadata generation.',
        deepLinkAction: 'tab:youtube',
        deepLinkLabel: 'Open YouTube Publisher',
      },
      {
        id: 'pub-step-3',
        stepNumber: 3,
        title: 'Export Android APK & AAB Packages or Install as a Web App',
        whereToClick: 'Top Header → "Export APK & AAB" or "Install App" (PWA)',
        description:
          'Click "Export APK & AAB" in the top right header to generate Capacitor Android build scripts and manifest bundles, or click "Install App" to install MemeForge AI Studio onto your desktop or phone home screen.',
        expectedOutcome:
          'Downloads ready-to-build Android packaging configs or installs the offline-capable Progressive Web App.',
        deepLinkAction: 'modal:android_apk',
        deepLinkLabel: 'Open Android APK Builder',
      },
    ],
    proTips: [
      'Clicking the YouTube tab while editing a meme in M1 automatically snapshots your clean canvas without selection borders so you can use it immediately as your video thumbnail.',
    ],
  },
];

export const USER_GUIDE_SHORTCUTS: GuideShortcutItem[] = [
  {
    id: 'sc-alt-1',
    keys: ['Alt', '1'],
    action: 'Switch to Module 1: MemeForge AI Canvas & Editor',
    context: 'Global Studio Navigation',
    deepLinkAction: 'tab:meme',
  },
  {
    id: 'sc-alt-2',
    keys: ['Alt', '2'],
    action: 'Switch to Module 2: LEO AI Video Studio (Sora 2 Ultra)',
    context: 'Global Studio Navigation',
    deepLinkAction: 'tab:leo',
  },
  {
    id: 'sc-alt-3',
    keys: ['Alt', '3'],
    action: 'Switch to Module 3: Cinema 32K NLE & Fairlight Audio',
    context: 'Global Studio Navigation',
    deepLinkAction: 'tab:cinema',
  },
  {
    id: 'sc-alt-4',
    keys: ['Alt', '4'],
    action: 'Switch to Module 4: Enterprise Cloud Vault & Version History',
    context: 'Global Studio Navigation',
    deepLinkAction: 'tab:team',
  },
  {
    id: 'sc-alt-g',
    keys: ['Alt', 'G'],
    action: 'Open or Close the Interactive User Guide Hub ("How to Use")',
    context: 'Global Help & Onboarding',
  },
  {
    id: 'sc-ctrl-v',
    keys: ['Ctrl / Cmd', 'V'],
    action: 'Paste any image directly from your clipboard onto the MemeCanvas',
    context: 'M1 MemeForge Canvas',
    deepLinkAction: 'tab:meme',
  },
  {
    id: 'sc-drag',
    keys: ['Click + Drag'],
    action: 'Reposition any text layer or emoji sticker directly on the canvas',
    context: 'M1 MemeForge Canvas',
    deepLinkAction: 'tab:meme',
  },
];

export const USER_GUIDE_FAQS: GuideFaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do I change or delete text on my meme?',
    answer:
      'Click directly on any text line on the MemeCanvas (or select it in the right-hand MemeToolbar). Type in the text box to change the words, drag it on the canvas to move it, or click the trash icon next to the layer to remove extra layers.',
    category: 'meme_canvas',
    deepLinkAction: 'tab:meme',
    deepLinkLabel: 'Go to Meme Canvas',
  },
  {
    id: 'faq-2',
    question: 'Will the dashed selection box appear in my downloaded meme?',
    answer:
      'No. When you click Download (PNG, JPG, WebP), Copy to Clipboard, or Export Video, MemeForge automatically strips out all interactive selection outlines so your exported file is 100% clean.',
    category: 'export_mobile',
    deepLinkAction: 'tab:meme',
    deepLinkLabel: 'Try Clean Export',
  },
  {
    id: 'faq-3',
    question: 'How do I add sound effects and download a video meme with audio?',
    answer:
      'In M1 MemeForge AI, scroll to the Meme Audio Layer panel on the right. Pick an effect like MLG Airhorn or upload custom audio, click "Test Audio" to preview, and then click "Export Video (.webm)" below the canvas.',
    category: 'video_audio',
    deepLinkAction: 'tab:meme',
    deepLinkLabel: 'Open Audio Controls',
  },
  {
    id: 'faq-4',
    question: 'How do I undo a change or restore an earlier version of my meme?',
    answer:
      'Press Alt+4 or click "M4 Enterprise Cloud" in the top bar. Under Version History, you will see snapshots saved automatically whenever you apply templates or AI captions. Click "Restore / Rollback" on any snapshot.',
    category: 'meme_canvas',
    deepLinkAction: 'tab:team',
    deepLinkLabel: 'Open Version History (M4)',
  },
  {
    id: 'faq-5',
    question: 'How do I unlock premium templates in the Marketplace without spending real money?',
    answer:
      'Open the Marketplace tab and click the "Testnet Faucet" button. It grants free testnet ETH, SOL, MEME tokens, and simulated UPI balance so you can unlock any template and test checkout flows for free.',
    category: 'marketplace_billing',
    deepLinkAction: 'tab:market',
    deepLinkLabel: 'Open Marketplace & Faucet',
  },
  {
    id: 'faq-6',
    question: 'Where can I find the PyTorch Diffusion Transformer (DiT) code and simulator?',
    answer:
      'Switch to M2 LEO Video (Alt+2) and click the "PyTorch DiT Build Spec (CLAUDE.md)" button in the studio header. It inspects the on-disk Python modules in pytorch_dit/ and runs interactive VAE, attention, and quantization checks.',
    category: 'ai_tools',
    deepLinkAction: 'tab:leo',
    deepLinkLabel: 'Open M2 LEO Video Studio',
  },
];

/**
 * Returns default initial user guide progress state.
 */
export function getDefaultUserGuideProgress(): UserGuideProgressState {
  return {
    completedStepIds: [],
    bookmarkedGuideIds: [],
    lastActiveGuideId: USER_GUIDE_SECTIONS[0].id,
    updatedAt: new Date(0).toISOString(),
  };
}

/**
 * Loads persisted user guide progress from localStorage.
 */
export function loadUserGuideProgress(): UserGuideProgressState {
  const fallback = getDefaultUserGuideProgress();
  const saved = readStorageJson<Partial<UserGuideProgressState>>(
    MEMEFORGE_USER_GUIDES_STORAGE_KEY,
    fallback
  );
  return {
    completedStepIds: Array.isArray(saved.completedStepIds) ? saved.completedStepIds : [],
    bookmarkedGuideIds: Array.isArray(saved.bookmarkedGuideIds) ? saved.bookmarkedGuideIds : [],
    lastActiveGuideId:
      typeof saved.lastActiveGuideId === 'string' &&
      USER_GUIDE_SECTIONS.some((s) => s.id === saved.lastActiveGuideId)
        ? saved.lastActiveGuideId
        : fallback.lastActiveGuideId,
    updatedAt: typeof saved.updatedAt === 'string' ? saved.updatedAt : fallback.updatedAt,
  };
}

/**
 * Saves user guide progress state to localStorage.
 */
export function saveUserGuideProgress(state: UserGuideProgressState): boolean {
  return writeStorageJson(MEMEFORGE_USER_GUIDES_STORAGE_KEY, {
    ...state,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Toggles a single step ID inside the completedStepIds array.
 */
export function toggleGuideStepCompletion(
  currentStepIds: string[],
  stepId: string
): string[] {
  const trimmed = stepId.trim();
  if (!trimmed) return currentStepIds;
  if (currentStepIds.includes(trimmed)) {
    return currentStepIds.filter((id) => id !== trimmed);
  }
  return [...currentStepIds, trimmed];
}

/**
 * Marks all steps within a specific guide section as completed (or uncompleted if all are already done).
 */
export function toggleAllStepsInGuide(
  currentStepIds: string[],
  guideId: string
): string[] {
  const section = USER_GUIDE_SECTIONS.find((s) => s.id === guideId);
  if (!section) return currentStepIds;

  const sectionStepIds = section.steps.map((st) => st.id);
  const allCompleted = sectionStepIds.every((id) => currentStepIds.includes(id));

  if (allCompleted) {
    return currentStepIds.filter((id) => !sectionStepIds.includes(id));
  }

  const merged = new Set([...currentStepIds, ...sectionStepIds]);
  return Array.from(merged);
}

/**
 * Calculates overall and per-guide completion statistics.
 */
export function calculateGuideProgressSummary(
  completedStepIds: string[],
  sections: GuideSection[] = USER_GUIDE_SECTIONS
): GuideProgressSummary {
  const validStepSet = new Set<string>();
  sections.forEach((sec) => {
    sec.steps.forEach((st) => validStepSet.add(st.id));
  });

  const totalSteps = validStepSet.size;
  const completedSteps = completedStepIds.filter((id) => validStepSet.has(id)).length;
  const rawPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const percentComplete = clampNumber(rawPercent, 0, 100, 0);

  const completedChaptersCount = sections.filter(
    (sec) => sec.steps.length > 0 && sec.steps.every((st) => completedStepIds.includes(st.id))
  ).length;

  return {
    totalSteps,
    completedSteps,
    percentComplete,
    completedChaptersCount,
    totalChaptersCount: sections.length,
  };
}

/**
 * Calculates completion percentage for a single guide section.
 */
export function calculateSingleGuideProgress(
  guide: GuideSection,
  completedStepIds: string[]
): { completed: number; total: number; percent: number } {
  const total = guide.steps.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = guide.steps.filter((st) => completedStepIds.includes(st.id)).length;
  const percent = clampNumber(Math.round((completed / total) * 100), 0, 100, 0);
  return { completed, total, percent };
}

/**
 * Filters guide sections, steps, shortcuts, and FAQs by a search query and optional category.
 */
export function searchUserGuides(
  query: string,
  category: GuideCategoryId | 'all' = 'all'
): {
  matchingSections: GuideSection[];
  matchingShortcuts: GuideShortcutItem[];
  matchingFaqs: GuideFaqItem[];
} {
  const normalizedQuery = (query || '').trim().toLowerCase();

  const categoryFilteredSections =
    category === 'all'
      ? USER_GUIDE_SECTIONS
      : USER_GUIDE_SECTIONS.filter((sec) => sec.category === category);

  if (!normalizedQuery) {
    return {
      matchingSections: categoryFilteredSections,
      matchingShortcuts: USER_GUIDE_SHORTCUTS,
      matchingFaqs: USER_GUIDE_FAQS,
    };
  }

  const matchingSections = categoryFilteredSections.filter((sec) => {
    const inHeader =
      sec.title.toLowerCase().includes(normalizedQuery) ||
      sec.subtitle.toLowerCase().includes(normalizedQuery) ||
      sec.overview.toLowerCase().includes(normalizedQuery) ||
      sec.whoIsItFor.toLowerCase().includes(normalizedQuery);

    const inSteps = sec.steps.some(
      (st) =>
        st.title.toLowerCase().includes(normalizedQuery) ||
        st.whereToClick.toLowerCase().includes(normalizedQuery) ||
        st.description.toLowerCase().includes(normalizedQuery) ||
        st.expectedOutcome.toLowerCase().includes(normalizedQuery)
    );

    const inTips = sec.proTips.some((tip) => tip.toLowerCase().includes(normalizedQuery));

    return inHeader || inSteps || inTips;
  });

  const matchingShortcuts = USER_GUIDE_SHORTCUTS.filter(
    (sc) =>
      sc.action.toLowerCase().includes(normalizedQuery) ||
      sc.context.toLowerCase().includes(normalizedQuery) ||
      sc.keys.some((k) => k.toLowerCase().includes(normalizedQuery))
  );

  const matchingFaqs = USER_GUIDE_FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(normalizedQuery) ||
      faq.answer.toLowerCase().includes(normalizedQuery)
  );

  return {
    matchingSections,
    matchingShortcuts,
    matchingFaqs,
  };
}
