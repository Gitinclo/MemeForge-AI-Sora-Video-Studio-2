# Support & Technical Assistance Guide (`SUPPORT.md`)

Welcome to the official support guide for **MemeForge AI, LEO Video & Cinema VFX Studio** (`v2.3.0` / `2060-01-01` Edition). This document explains how creators, developers, and enterprise teams can get technical help, run self-diagnostics, and contact project administration.

---

## 1. Direct Administration, GM, Admin & Moderator Contact

For account administration, workspace seat provisioning, Enterprise B2B billing (`Rs. 99,999/mo` or Global PPP), security escalations, or moderation inquiries:

- **Primary Administration / GM / Admin / Moderator Contact**: [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)
- **Co-Maintainer & Engineering Support**: [`lijogeorge1133@gmail.com`](mailto:lijogeorge1133@gmail.com)
- **In-App Command & Contact Desk**: Open **Module 4 · Enterprise Cloud (`Alt+4`)** in the studio header to access the live **Administration · GM · Admin · Moderator Command & Contact Desk**.

---

## 2. Self-Service Documentation & In-App Guides

Before opening a support ticket, check these built-in resources:

| Resource | Location / Shortcut | What It Covers |
| :--- | :--- | :--- |
| **Interactive User Guide** | Click **User Guide** in top header or press **`Alt+G`** | Step-by-step interactive walkthroughs, keyboard shortcuts (`Alt+1`–`Alt+4`, `Ctrl+Z`/`Ctrl+Y`), and deep links to every studio module |
| **2060/01/01 Architecture Workbench** | Click **2060/01/01 Plan** in top header | Live 128-bit Y2038/Y2060 timebase verifier, NIST Post-Quantum (`ML-KEM-1024`) key rotation simulator, and 64K/128K Photonic DiT planner |
| **Architecture Deep-Dive** | [`ARCHITECTURE.md`](./ARCHITECTURE.md) & [`AGENTS.md`](./AGENTS.md) | Module boundaries, TypeScript (`src/utils/`) vs. Python (`pytorch_dit/` & `video_pilot/`) routing, and strict interface contracts |
| **Pinned Live API Schemas** | [`docs/api-schemas.md`](./docs/api-schemas.md) | Exact JSON payloads and `@google/genai` model identifiers for Veo 3.1, Gemini 2.5 TTS, and 2060/01/01 audit endpoints |
| **Security & Vulnerability Policy** | [`SECURITY.md`](./SECURITY.md) | Private vulnerability disclosure workflow and SLA response timelines |

---

## 3. Quick Diagnostic Commands

If you are self-hosting or developing locally, run these commands from the repository root to diagnose environment or build issues:

```bash
# 1. Verify Node.js version (requires Node.js >= 22.12.0)
node --version

# 2. Run all TypeScript Engine & Architecture unit test suites (glob-driven tsx runner)
npm test

# 3. Validate TypeScript types across client and server
npm run lint

# 4. Verify production Vite SPA bundle compilation
npm run build

# 5. Check Express backend health & 2060/01/01 readiness (when server is running on port 3000)
curl -s http://localhost:3000/api/health
curl -s http://localhost:3000/api/future-proof-2060/blueprint
```

If you are working with the on-disk Python 3.11+ / PyTorch 2.x packages (`pytorch_dit/` and `video_pilot/`):

```bash
# Run PyTorch DiT shape, causality, SDPA attention, and FP8 quantization acceptance tests
python3 -m unittest pytorch_dit/tests/thresholds.py

# Run latency, tokens/sec, and peak VRAM benchmark
python3 -m pytorch_dit.bench
```

---

## 4. How to File a Bug Report or Feature Request

1. **Search Existing Issues**: Check the GitHub Issues tab to see if your question or bug has already been addressed.
2. **Use the Issue Template**: Follow the structured forms in [`.github/ISSUE_TEMPLATE.md`](./.github/ISSUE_TEMPLATE.md) (or `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md`) and include:
   - Studio module (`M1 MemeForge`, `M2 LEO Video Studio`, `M3 Cinema 32K NLE`, `M4 Enterprise Cloud`, `2060/01/01 Workbench`, or `Python pytorch_dit`)
   - Node.js / Python version, OS, and browser
   - Output of `npm test` and `npm run lint`
3. **Sensitive Security Issues**: **Never** open a public GitHub issue for security vulnerabilities or leaked credentials. Email **`creatergame31@gmail.com`** directly per [`SECURITY.md`](./SECURITY.md).
