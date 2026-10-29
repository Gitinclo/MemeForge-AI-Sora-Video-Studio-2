# Dev Server Startup Fix & AI Video Pilot Backend Routes

Resolves the development server startup crash when `GEMINI_API_KEY` is unset in the environment by switching to lazy, fault-tolerant Gemini SDK initialization on port 3000, while adding `/api/health` readiness diagnostics and server-side AI Video Pilot endpoints.

## User Review & Critical Decisions

> [!IMPORTANT]
> Both architectural choices were confirmed during Phase 1 clarification and are incorporated into this plan.

- **Confirmed Decision 1 (Lazy SDK Initialization)**: Lazy-initialize the `@google/genai` client only when a valid `GEMINI_API_KEY` is present so the Express + Vite middleware server always starts cleanly on `0.0.0.0:3000` with graceful deterministic fallbacks when the key is unset.
- **Confirmed Decision 2 (Health & AI Video Pilot Endpoints)**: Expose a `/api/health` server readiness endpoint alongside `/api/video-pilot/compile-chapter` and `/api/video-pilot/pricing` routes backing the AI Video Pilot workbench.

---

## 1. Overview & Core Concept

- **What It Does**: Eliminates the top-level `new GoogleGenAI({ apiKey: '' })` constructor exception that prevented `tsx server.ts` from binding to port `3000` when `GEMINI_API_KEY` is missing or empty, and connects the AI Video Pilot workbench to live server-side chapter-to-shot compilation and readiness endpoints.
- **Target Audience / Persona**: Creators, technical directors, and developers running MemeForge AI & LEO Video Studio in local or cloud sandbox environments with or without an active Gemini API key configured.
- **Key Value**: Guaranteed zero-crash server startup on port `3000`, transparent API readiness reporting, and server-assisted 23-shot episode compilation using `gemini-3.8-flash` (with deterministic fallback when running without an API key).

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Zero-Config Startup**: When the application starts, the Express + Vite server immediately binds to `0.0.0.0:3000` regardless of whether `GEMINI_API_KEY` is set.
  2. **AI Video Pilot Chapter Compilation**: Inside the **AI Video Pilot (Veo 3.1 · 3-Min Episode)** modal, clicking **Compile Chapter into 23 Shots (180s)** dispatches the chapter text to `/api/video-pilot/compile-chapter` (falling back seamlessly to the local compiler if offline) and updates the 23-shot storyboard player and cost table.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-contrast studio console with single-elevation surfaces and clean typographic hierarchy.
  - *Color Palette & Mood*: Deep slate studio surfaces (`#0F172A`, `#020617`), semantic emerald (`#16A34A`) for verified budget/gate states, warm amber (`#D97706`) for Veo 3.1 pilot controls, and crimson (`#DC2626`) for hard budget-cap or license blockers.
  - *Typography & Hierarchy*: Clean sans-serif headings paired with strict tabular monospace numerals (`font-mono tabular-nums`) across all cost, duration, and shot-timer readouts.
  - *Component Styling & Layout*: Single-level bordered panels (`border-slate-800`), compact data rows with right-aligned financial figures, and unboxed inline metadata separators (`·`).
- **Interactive Feedback & Motion**: Instantaneous tab switching, smooth 24fps HTML5 canvas storyboard playback, and clear inline status feedback when compiling chapters or exporting `costs.csv`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Lazy On-Demand `GoogleGenAI` Client Factory**
  - *Chosen Approach*: Replace the eager top-level `const ai = new GoogleGenAI({ apiKey })` call with a `getGenAiClient()` helper that returns `null` when `GEMINI_API_KEY` is absent or a placeholder, and instantiates `GoogleGenAI` inside a `try/catch` block only when a valid key is present.
  - *Why*: Top-level instantiation crashes Node.js before `startServer()` can mount Vite middlewares or bind port `3000`.
  - *Alternatives Considered*: Passing a dummy placeholder string to the constructor at startup was rejected because future SDK validations or accidental network calls with a fake key produce noisy runtime errors.
- **Decision 2: Server-Backed Chapter-to-Shot Compilation with Deterministic Fallback**
  - *Chosen Approach*: Add `POST /api/video-pilot/compile-chapter` using `gemini-3.8-flash` structured JSON output when an API key is configured, paired with the deterministic 23-shot compiler (`180s` total duration) when running in zero-key mode.
  - *Why*: Ensures the 23-shot animated episode workflow works both with live Gemini structured generation and in offline/private testing environments.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     Client SPA (Vite + React 19)                         │
│                                                                          │
│  ┌────────────────────────────┐      ┌────────────────────────────────┐  │
│  │      LeoStudioTab          │─────▶│       AiVideoPilotModal        │  │
│  │ (32K / 8K / Post-Sora Hub) │      │  - 23-Shot Animatic Canvas     │  │
│  └────────────────────────────┘      │  - $500 Atomic Budget Guard    │  │
│                                      │  - 5-Clause License Analyzer   │  │
│                                      └───────────────┬────────────────┘  │
└──────────────────────────────────────────────────────┼───────────────────┘
                                                       │ HTTP JSON (/api/*)
                                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                Express + Vite Middleware Server (Port 3000)              │
│                                                                          │
│  ┌────────────────────────────┐      ┌────────────────────────────────┐  │
│  │   getGenAiClient() Guard   │      │  /api/health                   │  │
│  │ (Lazy Init / Null-Safe)    │      │  /api/video-pilot/pricing      │  │
│  └─────────────┬──────────────┘      │  /api/video-pilot/compile      │  │
│                │                     └───────────────┬────────────────┘  │
│                ▼                                     ▼                   │
│  ┌────────────────────────────┐      ┌────────────────────────────────┐  │
│  │  @google/genai SDK         │      │  Deterministic Fallback Engine │  │
│  │  (gemini-3.8-flash JSON)   │      │  (23 Shots · 180s · Veo Rates) │  │
│  └────────────────────────────┘      └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `ServerHealthStatus`: `{ status: 'ok', port: number, geminiConfigured: boolean, timestamp: string }`.
  - `PilotShotSpec`: `{ shot_id, duration_s: 4 | 6 | 8, resolution: '720p' | '1080p', model_tier: 'lite' | 'fast' | 'standard', characters, location, action, dialogue, camera, prompt, seed, reference_image_ids, transition_from_prev }`.
- **Interactive Component & State Mapping**:
  - **Server Startup (`startServer`)**: Mounts `/api/health`, `/api/video-pilot/pricing`, `/api/video-pilot/compile-chapter`, and existing studio routes before attaching `vite.middlewares` and binding `0.0.0.0:3000`.
  - **Chapter Compilation Handler (`handleCompileChapter`)**: Sends chapter prose to `POST /api/video-pilot/compile-chapter`, validates the returned 23 shots against the schema, resets `activeShotIndex` to `0`, and starts the 2.5D canvas animatic loop.
