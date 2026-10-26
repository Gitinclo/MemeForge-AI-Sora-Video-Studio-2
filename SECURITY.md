# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions of **MemeForge AI, LEO Video & Cinema VFX Studio**:

| Version | Supported          | Security Status |
| :------ | :----------------- | :-------------- |
| 1.3.x   | :white_check_mark: | Current Release (Active Support) |
| 1.2.x   | :white_check_mark: | Security & Maintenance Updates |
| 1.1.x   | :white_check_mark: | Critical Security Fixes Only |
| < 1.1.0 | :x:                | Deprecated (Upgrade to 1.3.x) |

---

## Reporting a Vulnerability (Private Disclosure)

The security of our users, developers, and creators is our highest priority. If you discover a security vulnerability, credential exposure, or potential exploit within this repository, **please do NOT disclose it publicly** via public GitHub Issues, Discussions, Pull Requests, or social media before a fix has been released.

### How to Disclose Privately to the Project Maintainer

Please use one of the following private disclosure channels:

1. **GitHub Private Vulnerability Reporting (Preferred)**:
   - Navigate to the repository's **Security** tab on GitHub:
     `https://github.com/Gitinclo/MemeForge-AI-Sora-Video-Studio/security/advisories/new`
   - Click **"Report a vulnerability"** to open a private security advisory draft directly with the maintainer (`@Gitinclo`).

2. **Direct Private Email to the Maintainer**:
   - **Maintainer Security Contacts**: `lijogeorge1133@gmail.com` / `creatergame31@gmail.com`
   - **Subject Line**: `[SECURITY VULNERABILITY] MemeForge Studio - <Brief Summary>`

### What to Include in Your Report

To help us triage and resolve the issue quickly, please include:
- **Vulnerability Type**: (e.g., API route injection, authentication/OAuth bypass, XSS, SSRF, secret exposure, dependency vulnerability).
- **Affected Component(s)**: File path(s), endpoint(s) (e.g., `server.ts`, `/api/youtube/upload`), or configuration files involved.
- **Reproduction Steps**: Clear, step-by-step instructions or a minimal Proof of Concept (PoC) to reproduce the issue.
- **Impact Assessment**: What an attacker could achieve and the estimated severity (CVSS v3.1 score if applicable).
- **Suggested Remediation**: Any proposed fix or mitigation strategy (optional).

---

## Response & Disclosure Timeline (SLA)

We are committed to transparent, coordinated vulnerability disclosure:

| Stage | Target SLA | Description |
| :--- | :--- | :--- |
| **1. Acknowledgment** | **Within 24 hours** | Confirmation that your private report was received by the maintainer. |
| **2. Triage & Validation** | **Within 48–72 hours** | Reproduction of the issue, severity classification, and remediation plan. |
| **3. Patch Development** | **Within 7 days** | Development and verification of a security patch (prioritized by severity). |
| **4. Coordinated Disclosure** | **Upon Release** | Publication of the patched release (`CHANGELOG.md` & GitHub Security Advisory) with credit to the reporter (unless anonymity is requested). |

---

## Scope & Security Architecture Guidelines

### 1. API Keys & Environment Secrets
- **Zero Hardcoded Secrets**: Never commit real API keys (`AIza...`), `.env` files, OAuth client secrets, or service account JSON files to version control.
- **Server-Side Proxy Isolation**: All Google Gemini API requests (`@google/genai`) and upstream video synthesis calls are executed strictly server-side inside `server.ts` (`/api/*`). Client code never accesses server-side secret keys.
- **Template Configuration**: Only placeholder variable names may be committed in `.env.example`.

### 2. Google OAuth 2.0 & YouTube Data API v3
- Google Workspace / YouTube OAuth uses client-side token acquisition passed via `Authorization: Bearer <token>` headers for resumable uploads, avoiding server-side storage of long-lived user refresh tokens.

### 3. Android Keystore & Package Signing Policy
- **Direct Store Auto-Publish Disabled**: Automated direct publishing to the Google Play Store is permanently disabled across all tiers to safeguard developer credentials and private signing keys.
- **Offline Keystore Guard**: All `.jks`, `.keystore`, `.pem`, `.p12`, and `.pfx` signing files are blocked via `.gitignore` and compiled strictly in local/offline environments.

### 4. Payment & Web3 Non-Custodial Security
- Indian UPI deep links (`upi://pay`) and QR codes follow NPCI intent standards and never collect or transmit banking PINs, MPINs, or passwords.
- Web3 wallet interactions operate on non-custodial client-side state and never request private seed phrases.

---

## Safe Harbor

We consider security research conducted in good faith and in accordance with this policy to be authorized conduct. We will not pursue legal action against researchers who discover and report vulnerabilities privately without disrupting service availability, exfiltrating user data, or violating user privacy.
