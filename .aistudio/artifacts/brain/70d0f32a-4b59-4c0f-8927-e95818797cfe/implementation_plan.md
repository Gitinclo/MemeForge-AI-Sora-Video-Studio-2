# Interactive "How to Use the App" User Guide Hub

This plan delivers a clear, step-by-step **User Guide Hub** in the top navigation bar that teaches any user—from a first-time visitor to a power creator—exactly **how to use MemeForge AI Studio** from start to finish, complete with interactive progress checklists, searchable instructions, and one-click **"Take Me There"** buttons.

## User Review & Critical Decisions

> [!IMPORTANT]
> This revised plan puts practical, plain-English **"How to Use the App"** instructions front and center so users immediately understand what every button, tab, and tool does. Click **Proceed** to build the User Guide Hub.

- **Primary Focus — Teaching Users How to Use the App**:
  - **Quick Start (Your First Meme in 60 Seconds)**: A visual 4-step walkthrough showing new users how to pick a template (or paste/upload an image), edit text on the canvas, apply AI captions or sound effects, and download/copy their finished meme.
  - **Step-by-Step Task Guides for Every Feature**: Clear *"Where to click → What to do → What happens"* instructions covering all studio tabs and buttons so users never feel lost.
- **Confirmed Access Experience**: Dedicated **How to Use / User Guide** button in the top navigation header (plus mobile menu item and `Alt+G` shortcut) opening the interactive guide modal.
- **Confirmed Interactive Features**:
  - Searchable *"How do I...?"* walkthroughs and FAQ answers.
  - Interactive step-by-step checklists that remember what the user has already tried.
  - One-click **"Try This Step Now"** buttons that take the user directly to that exact feature or tab in the app.

---

## 1. Overview & Core Concept

- **What It Does**: Acts as an always-available, plain-language instruction manual and interactive onboarding companion inside the app. Whenever a user wonders *"How do I add text?"*, *"How do I export a meme video with sound?"*, *"How do I generate an AI video?"*, or *"How do I publish to YouTube?"*, the User Guide explains the exact steps and offers a button to jump straight to that tool.
- **Target Audience / Persona**:
  - **New & Everyday Creators** who want simple, jargon-free instructions on making memes, using AI caption writers, adding audio, and downloading images or videos.
  - **Advanced Studio Users** exploring LEO Video generation, Cinema timeline editing, Team workspaces, Marketplace templates, LoRA training, and PyTorch DiT specs.
- **Key Value**: Turns a feature-rich studio into an easy-to-learn experience by explaining **where to click**, **how each control works**, and **how to export or share results**.

---

## 2. User Experience & "How to Use the App" Curriculum

### Core Guide Tracks (What the User Learns)

1. **Quick Start: Make Your First Meme in 60 Seconds**
   - *Step 1*: Choose a meme template from the gallery below the canvas, upload your own photo, or press `Ctrl+V` to paste any image from your clipboard.
   - *Step 2*: Click directly on the Top or Bottom text on the canvas to select it, then type your caption and customize fonts, colors, outlines, and stickers in the right-hand toolbar.
   - *Step 3*: Click **Magic Caption** in the top bar (or ask the **AI Co-Director**) to automatically generate funny caption ideas tailored to your template.
   - *Step 4*: Click **Download PNG/JPG/WebP** or **Copy Meme** below the canvas to save and share your creation immediately.

2. **How to Use Module 1: MemeForge Canvas, Stickers & Audio**
   - How to add, drag, rotate, and style multiple text layers and emoji stickers.
   - How to apply visual filters and aspect ratios (`1:1`, `16:9`, `9:16`).
   - How to attach sound effects (like MLG Airhorn) and click **Export Video (.webm)** to download a playable video meme with sound.

3. **How to Use Module 2: LEO AI Video Studio & Sora 2 Ultra**
   - How to switch to **M2 LEO Video** (`Alt+2`), enter a video prompt, choose camera motion and aspect ratio, and generate AI video clips.
   - How to inspect or simulate the **PyTorch DiT Build Spec** and Sora 2 Ultra planner from the studio header.

4. **How to Use Module 3: Cinema 32K NLE & Multi-Track Editor**
   - How to switch to **M3 Cinema 32K NLE** (`Alt+3`), arrange video/audio clips on the multi-track timeline, apply color grading LUTs, and mix audio levels.

5. **How to Use Module 4: Cloud Workspace, Version History & Subscriptions**
   - How to use **M4 Enterprise Cloud** (`Alt+4`) to review automatic version snapshots, roll back to an earlier meme state in one click, collaborate with team members, or manage Free/Pro plans.

6. **How to Use Marketplace, YouTube Publishing & LoRAFlow**
   - **Marketplace**: How to unlock premium templates using testnet Crypto or UPI, use the free Testnet Faucet, or list your own meme for sale.
   - **YouTube Publisher**: How to send your current canvas or video directly to the **YouTube** tab with auto-generated titles, tags, and thumbnails.
   - **LoRAFlow & APK Export**: How to train custom visual styles in **LoRAFlow & Sora 2** and how to package the app for Android via **Export APK & AAB**.

7. **Keyboard Shortcuts, Troubleshooting & "How Do I...?" FAQ**
   - Quick-reference table of every keyboard shortcut (`Alt+1`–`Alt+4`, `Alt+G`, `Ctrl+V`).
   - Instant fixes for common questions (e.g., *"Why didn't clipboard copy work?"*, *"How do I undo a change?"*, *"How do I install the app offline as a PWA?"*).

### Visual Identity & Layout
- **Clean Two-Pane Instruction Layout**:
  - **Left Navigation Sidebar ($260\text{px}$)**: Displays the user's overall onboarding progress bar (`tabular-nums` percentage) and the 7 clear *"How to Use"* guide chapters.
  - **Right Instruction Reader**: Shows a prominent *"How do I...?"* search bar at the top, followed by numbered step-by-step cards. Each step explicitly states:
    1. **Where to Click** (exact button or tab name)
    2. **What to Do** (plain-language instruction)
    3. **Expected Result** (what happens on screen)
    4. **Try It Now Button** (one-click deep link that activates that exact feature)
- **Theme & Typography**: Matches the dark slate studio palette (`#020617` / `#0F172A`) with high-contrast readable typography, unboxed inline metadata (`4 steps · 2 min read`), and tabular numerals (`font-mono tabular-nums`) for step numbers, progress percentages, and shortcut keys.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Task-Oriented "Where to Click → What to Do" Step Format**
  - *Chosen Approach*: Structure every guide step around concrete UI actions (*Where to click*, *What to do*, *What happens*) paired with a live **"Take Me There"** button.
  - *Why*: Users opening a guide want immediate answers on how to operate the app rather than abstract technical descriptions.
- **Decision 2: Persistent Checklist & Searchable "How Do I...?" Bar**
  - *Chosen Approach*: Persist completed tutorial steps in `localStorage` and provide real-time search across all step instructions, button names, shortcuts, and FAQs.
  - *Why*: Allows new users to follow a guided onboarding checklist at their own pace while letting returning users search any specific question in seconds.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MemeForge AI Studio (App)                            │
│  ┌───────────────────────────┐   ┌───────────────────────────────────────┐  │
│  │ Top Navigation Header     │   │ Active App Tabs & Feature Modals      │  │
│  │ • [User Guide (Alt+G)] ───┼──►│ • M1 MemeForge Canvas & Audio Toolbar │  │
│  │ • Mobile '⋯' Menu Item    │   │ • Magic Caption AI & AI Co-Director   │  │
│  └───────────────────────────┘   │ • M2 LEO Video & PyTorch DiT Spec     │  │
│                                  │ • M3 Cinema 32K NLE Timeline          │  │
│                                  │ • M4 Cloud Workspace & Rollback       │  │
│                                  │ • Marketplace / YouTube / LoRAFlow    │  │
│                                  └───────────────────▲───────────────────┘  │
└──────────────────────────────────────────────────────┼──────────────────────┘
                                                       │ "Take Me There" Action
                                                       │ (onExecuteDeepLink)
┌──────────────────────────────────────────────────────┴──────────────────────┐
│                         UserGuidesModal Component                           │
│  ┌──────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │ Left Chapter Sidebar     │  │ Main "How to Use the App" Viewport      │  │
│  │ • Onboarding Progress %  │  │ • "How do I...?" Live Search Input      │  │
│  │ • Quick Start (60 Sec)   │  │ • Numbered Step-by-Step Instructions    │  │
│  │ • M1–M4 Feature Guides   │  │   (Where to Click -> What to Do)        │  │
│  │ • Marketplace & YouTube  │  │ • Interactive Checkboxes & Progress     │  │
│  │ • Shortcuts & FAQ        │  │ • One-Click "Try This Step Now" Buttons │  │
│  └──────────────────────────┘  └─────────────────────▲───────────────────┘  │
└──────────────────────────────────────────────────────┼──────────────────────┘
                                                       │
┌──────────────────────────────────────────────────────┴──────────────────────┐
│                  User Guides Engine & Storage State                         │
│  • Step-by-Step App Tutorials, Pro Tips, Sample Prompts & FAQ Data          │
│  • Full-Text Search & Filter Engine across all steps, buttons & questions   │
│  • Checklist Progress Calculator & localStorage Persistence                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **GuideSection**: Contains `id`, `category`, `title`, `subtitle`, `estimatedMinutes`, `overview`, `steps`, `proTips`, `samplePrompts`, and `primaryDeepLink`.
- **GuideStep**: Contains `id`, `stepNumber`, `title`, `whereToClick`, `description`, `expectedOutcome`, `shortcutHint`, `deepLinkAction`, and `deepLinkLabel`.
- **DeepLinkTarget**: Typed union supporting direct navigation to any studio tab (`tab:meme`, `tab:leo`, `tab:cinema`, `tab:team`, `tab:market`, `tab:youtube`, `tab:enterprise`) or utility modal (`modal:magic_caption`, `modal:ai_director`, `modal:android_apk`, `modal:subscription`, `modal:original_bridge`).
- **UserGuideProgressState**: Persisted state in `localStorage` storing `completedStepIds`, `bookmarkedGuideIds`, and `lastActiveGuideId`.

### Interactive Component & State Mapping
- **Live "How Do I...?" Search**: Filtering by keyword (e.g., `"download"`, `"audio"`, `"text"`, `"youtube"`, `"rollback"`) immediately surfaces matching how-to guides, individual steps, keyboard shortcuts, and FAQ answers.
- **Step Checkboxes & Onboarding Progress**: Checking off any step updates the per-guide and overall completion progress bars (`tabular-nums`) and saves automatically to `localStorage`.
- **One-Click "Try This Step Now" Handler**: Clicking any step's action button invokes `onExecuteDeepLink`, closing the guide modal and immediately opening the target tab or modal in `App`.
