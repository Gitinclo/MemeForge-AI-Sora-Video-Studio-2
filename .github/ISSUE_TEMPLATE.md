# Issue Template (`ISSUE_TEMPLATE.md`)

> **Security Notice**: Do **NOT** use public GitHub issues to report security vulnerabilities, authentication bypasses, or leaked credentials. Please report security issues privately to **`creatergame31@gmail.com`** per [`SECURITY.md`](../SECURITY.md).

---

## 1. Issue Category
Please check one of the following:
- [ ] **Bug Report** (unexpected behavior, build/test failure, UI glitch, or audio/video export error)
- [ ] **Feature Request** (new studio capability, AI model integration, or workflow improvement)
- [ ] **2060/01/01 Architecture / RFC Proposal** (128-bit timebase, NIST Post-Quantum Vault, or Photonic DiT spec change)

---

## 2. Affected Studio Module
- [ ] `M1` · MemeForge AI (`MemeCanvas`, `MemeToolbar`, Undo/Redo `versionHistoryEngine`, Timeline Soundboard)
- [ ] `M2` · LEO AI Video Studio (`Veo 3.1 Pilot`, `10-Shot 3D Text-to-Animation`, `Sora 2 Ultra 32K`, `PyTorch DiT`)
- [ ] `M3` · Cinema 32K NLE & Fairlight 192 kHz Audio Engine
- [ ] `M4` · Enterprise Cloud Vault, RBAC & Admin/GM/Mod Command Desk (`creatergame31@gmail.com`)
- [ ] `2060/01/01` Architecture & Full-Stack Future-Proofing Workbench (`FutureProof2060Modal`)
- [ ] Express Backend API (`server.ts`) or Python CLI (`pytorch_dit/` / `video_pilot/`)

---

## 3. Environment & System Specifications
- **Studio Version**: `v2.3.0` (`2060-01-01` Edition)
- **Operating System**: (e.g., Ubuntu 24.04 LTS, macOS 15, Windows 11, Android 15)
- **Node.js Version (`node -v`)**: (Requires `>=22.12.0`)
- **Browser & GPU**: (e.g., Chrome 132 / WebGPU / NVIDIA RTX 4090)
- **Python / PyTorch Version (if applicable)**: (e.g., Python 3.11, PyTorch 2.4+cu124)

---

## 4. Steps to Reproduce (For Bug Reports)
1. Navigate to module `...`
2. Click on `...`
3. Observe error or unexpected output `...`

### Expected Behavior
Describe what should happen cleanly.

### Actual Behavior & Console / CLI Logs
Paste any terminal output from `npm test`, `npm run lint`, or browser console logs below:
```text
Paste logs here
```

---

## 5. Proposed Solution or Design (For Feature Requests / RFCs)
Describe how the feature should work, which engine (`src/utils/*Engine.ts`) and contract (`src/types/studioEngineContracts.ts`) it touches, and how it will be unit-tested.
