# Project Governance & Decision-Making Structure (`GOVERNANCE.md`)

This document defines the governance model, leadership roles, role-based access control (RBAC) hierarchy, and technical decision-making procedures for **MemeForge AI, LEO Video & Cinema VFX Studio** (`v2.3.0` / `2060-01-01` Edition).

---

## 1. Governance Principles

1. **Clear Authority & Accountability**: Every architectural, security, and moderation decision has a clearly designated owner so contributors and enterprise customers never face ambiguity.
2. **Strict Engineering Boundaries**: Codebase modifications must respect the decoupled engine architecture (`src/utils/*Engine.ts`), compact contracts (`src/types/studioEngineContracts.ts`), and mandatory automated test gates (`npm test` + `npm run lint`).
3. **Long-Horizon Stability (`2060/01/01`)**: Backward compatibility, 128-bit `BigInt` temporal safety, and NIST Post-Quantum Cryptography (`ML-KEM-1024` / `ML-DSA-87`) provenance are preserved across all releases.

---

## 2. Project Roles & Authority Hierarchy

| Role | Designated Account / Scope | Responsibilities & Permissions |
| :--- | :--- | :--- |
| **Primary Root Administration / GM / Admin / Moderator** | **`creatergame31@gmail.com`** | Supreme administrative, Game Master (GM), Super-Admin, Moderator, and Owner authority across the repository and in-app Enterprise workspaces (`src/utils/enterpriseCollabEngine.ts`, `src/utils/subscriptionUtils.ts`, `src/utils/futureProof2060Engine.ts`). Holds final sign-off on governance, security disclosures, RBAC overrides, C2PA v3.0 Post-Quantum key rotation, and release approvals. |
| **Core Maintainers** | `@Gitinclo` & Core Engineering Leads (`creatergame31@gmail.com`, `lijogeorge1133@gmail.com`) | Review and merge Pull Requests, manage CI/CD pipelines, maintain `AGENTS.md` and `docs/api-schemas.md`, and steward the `2060/01/01` roadmap. |
| **Engine Committers** | Approved contributors to `src/utils/`, `pytorch_dit/`, and `video_pilot/` | Author and maintain pure TypeScript engines, `.test.ts` suites, and Python/PyTorch 2.x kernels. Must maintain 100% test pass rates before requesting merge. |
| **Community Contributors** | All open-source developers, testers, and documentation authors | Submit bug fixes, feature enhancements, templates, and documentation improvements via Pull Requests following [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md). |

---

## 3. Decision-Making & RFC Process

### A. Routine Changes (Bug Fixes, UI Polish, Non-Breaking Engine Updates)
- Require a Pull Request passing all automated checks (`npm test`, `npm run lint`, `npm run build`) and approval from at least **one Core Maintainer** or the **Primary Root Administrator (`creatergame31@gmail.com`)**.

### B. Architectural & Cross-Language Changes (RFC Required)
Changes that affect any of the following require an **Architecture Proposal / RFC** in GitHub Issues and explicit sign-off from **`creatergame31@gmail.com`**:
1. Modifying the **PyTorch DiT Build Spec** in `AGENTS.md` / `CLAUDE.md` (such as changing Causal 3D VAE padding rules, tensor shape conventions `[B, T, H, W, C]`, or `BF16`/`FP8` quantization rules).
2. Modifying shared single-source-of-truth (SSoT) manifests (`config/pricing.yaml`, `shots/shot_list.json`, `style/style_guide.md`, or `src/types/studioEngineContracts.ts`).
3. Adding new runtime dependencies to `package.json` or `pyproject.toml`.
4. Changing authentication, RBAC permissions, or Post-Quantum Cryptography (`ML-KEM-1024` / `ML-DSA-87`) algorithms.

### C. Voting & Consensus Resolution
- Core Maintainers strive for **lazy consensus** on technical proposals within 72 hours.
- If a tie or dispute arises among maintainers or committers, the **Primary Root Administration / GM / Admin / Moderator (`creatergame31@gmail.com`)** holds the decisive tie-breaking vote and final veto authority.

---

## 4. In-App Enterprise RBAC & Moderation Governance

Within the running application (**Module 4 · Enterprise Cloud Vault & Collaboration**), `src/utils/enterpriseCollabEngine.ts` enforces the same governance model programmatically:
- **`isSuperAdminGmModeratorAccount('creatergame31@gmail.com')`** returns `true` and unlocks all 11 administrative, GM, and moderator capabilities (`canManageAllWorkspaces`, `canAssignRoles`, `canModerateContent`, `canOverrideLocks`, `canRotateQuantumKeys`, `canExportAuditLogs`, `canApproveEnterpriseBilling`).
- All administrative and moderation actions are recorded in an immutable, timestamped audit log exportable as JSON or CSV.

---

## 5. Governance Contact

For governance inquiries, maintainer nominations, or institutional partnerships, contact:
- **Primary Administration / GM / Admin / Moderator**: [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)
