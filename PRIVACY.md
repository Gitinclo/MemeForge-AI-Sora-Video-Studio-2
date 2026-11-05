# Privacy Policy

**Last Updated:** October 27, 2026  
**Effective Date:** October 27, 2026

Welcome to **MemeForge AI, LEO Video & Cinema VFX Studio** ("we," "our," "us," or the "Application"). We are committed to protecting your personal privacy, transparently disclosing our data practices, and giving you complete control over your content.

This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you access or use the MemeForge web application, Progressive Web App (PWA), and compiled Android mobile packages.

---

## 1. Information We Collect

### A. Optional Account, OAuth & Subscription Information
* **No Mandatory Account for Core Studio:** You can use the core Meme Canvas, typography editor, and audio synthesizer locally without creating an account.
* **Optional Account & Subscription Billing:** When you choose to create a workspace profile or activate a subscription (such as *India Creator Pro* at Rs. 999/month, *Team / Company Enterprise* at Rs. 99,999/month, or *Global Purchasing Power Parity (PPP)* tiers), we collect your name, username, business email address, company name, and Indian Goods and Services Tax Identification Number (GSTIN) solely to generate official B2B tax invoices and allocate workspace seats.
* **Google OAuth 2.0 & YouTube Data API v3:** If you choose to connect your Google account to publish videos directly to YouTube, client-side OAuth access tokens (`youtube.upload` scope) are passed ephemerally via `Authorization: Bearer` headers to initiate resumable uploads on the YouTube Data API v3. We do not store long-lived Google passwords or raw refresh tokens in plain text.
* **Team Collaborative Data:** If you invite team collaborators via the Team Hub, we store their email address, display name, and assigned role permissions (e.g., Director, VFX Artist, Editor, Sound Designer, Reviewer).
* **Payment Identifiers & Anti-Arbitrage Verification (UPI, NetBanking & Global PPP):** For optional transactions processed via Indian Unified Payments Interface (UPI), Corporate NetBanking, or international payment processors, we share necessary transaction metadata with payment processors and verify card issuing country BINs (first 6 digits) and IP geolocation solely to prevent cross-border PPP pricing fraud. **We never collect, store, or have access to your bank passwords, full credit/debit card numbers, CVVs, or UPI MPINs.**
* **Web3 Public Addresses:** When connecting a non-custodial Web3 wallet (e.g., Ethereum or Solana), we only read your public wallet address. We never request or store private keys or seed phrases.
* **User Prompts & Feedback:** Text prompts entered for meme caption generation, AI co-director brainstorming, and video scene descriptions.

### B. Uploaded Images, Canvas Media, Enterprise LoRA Calibration & Audio
* **Local In-Browser Processing & 30-Second Auto-Save:** By default, images you upload, text layers you compose, stickers, and synthetic audio you generate are rendered locally within your device's browser using HTML5 Canvas, WebGL/WebGPU, and the Web Audio API, and auto-saved every 30 seconds to local browser storage (`memeforge_autosave_layout`).
* **AI Multimodal Vision Inference & Enterprise B2B LoRA Models:** When you invoke **AI Magic Caption** or **Gemini 4 Argon YouTube Metadata**, the image frame is transmitted securely over HTTPS to our server-side API proxy (`/api/magic-captions` or `/api/youtube/generate-metadata`) and forwarded to the Google Gemini API strictly to analyze scene context and propose captions/metadata. When Enterprise B2B clients calibrate isolated product LoRA models (`10–20 calibration images`), weights are isolated strictly to that tenant's dedicated workspace. **We never sell or use your uploaded images to train public foundation models.**

### C. Automatically Collected Technical Data
* **Device & Environment Data:** Browser type and version, operating system, display resolution, GPU hardware vendor, and WebGPU compute capabilities (used to determine proxy rendering such as 1/16 Super Proxy for 32K projects).
* **Local Storage & Cache:** We utilize browser `localStorage` and `IndexedDB` on your client device to store project draft states, `.cube` LUT selections, subscription state, and version history snapshots.
* **No Third-Party Behavioral Ad Tracking:** We do not embed third-party behavioral advertising trackers or sell personal data to ad networks.

---

## 2. How We Use Your Information

We use the collected information for the following legitimate business purposes:
1. **Provide and Maintain the Studio:** To render the live typography canvas, execute 64-bit frame-accurate video timelines, calculate 32K/1000 FPS bandwidth telemetry, and process multi-track 192 kHz Fairlight audio.
2. **AI Multimodal & Enterprise LoRA Services:** To propose contextual captions, synthesize dense 8K VLM prompts, verify physical invariants in the Model Consistency Sandbox, generate high-CTR YouTube metadata, and power the AI comedy co-director.
3. **Billing, GST Invoicing & Seat Allocation:** To verify optional UPI AutoPay, Corporate NetBanking, and Global PPP payments, allocate multi-seat quotas (up to 50 seats for Enterprise plans), and issue tax-compliant 18% GST invoices.
4. **Offline Android Compilation:** To compile standalone `.apk` and `.aab` packages for offline device sideloading and internal testing.
5. **Customer Support & Security:** To investigate technical errors, prevent denial-of-service exploits, and respond to inquiries.

---

## 3. Data Storage, Retention & Password/Credential Security

* **Data Retention Policy:**
  * **Client-First Local Data:** Local project drafts, auto-saved layouts (`memeforge_autosave_layout`), text layers, audio stems, and timeline snapshots remain on your local device until you clear your browser storage.
  * **Account & Workspace Records:** If you create a workspace account, we retain your account profile (email, username, workspace role) only for as long as your account remains active. Upon account deletion or a "Right to be Forgotten" request, all personal account data and custom LoRA weights are permanently purged within **30 days** (except statutory B2B tax invoices required to be retained under Indian GST / accounting laws).
  * **Server-Side Ephemeral Processing:** Video prompts and multimodal image frames processed by our backend API routes are handled strictly in volatile memory (RAM) during the lifecycle of the HTTP request and are discarded immediately upon completion.
* **Password & Credential Security:**
  * **Industry-Standard Encryption:** We protect all user accounts, credentials, and authentication tokens using industry-standard encryption, including **TLS 1.3** encryption in transit, **AES-256 GCM** encryption at rest for Enterprise Cloud Vault assets, and salted cryptographic hashing / OAuth 2.0 token isolation so plain-text passwords are never stored or exposed.
  * Direct-to-store automated publishing is disabled across all studio tiers to prevent developer keystore leaks and credential exploitation.
  * API keys and secrets are maintained strictly in server-side environment variables and are never exposed to client-side code.

---

## 4. Third-Party Services & Subprocessors

We rely on select trusted service providers when you invoke connected features:

| Provider | Service Provided | Privacy Policy |
| :--- | :--- | :--- |
| **Google Gemini API** | Multimodal Vision & LLM Inference | [Google Privacy Policy](https://policies.google.com/privacy) |
| **YouTube API Services** | Direct Resumable Video Publishing (OAuth 2.0) | [Google Privacy Policy](https://policies.google.com/privacy) & [YouTube Terms](https://www.youtube.com/t/terms) |
| **NPCI / UPI Network** | UPI Intent Payments (GPay, PhonePe, Paytm, BHIM) | [NPCI Data Policy](https://www.npci.org.in/) |
| **Google Cloud Run** | Secure Server Hosting & TLS Termination | [Google Cloud Compliance](https://cloud.google.com/security/compliance) |

We do not sell, rent, or trade your personal information or media files to third-party data brokers or advertising networks.

---

## 5. Your Rights (GDPR, CCPA & Indian DPDPA)

Depending on your geographic location, you possess specific legal rights regarding your personal information:

* **Right of Access & Portability:** You may request a copy of the personal information and workspace billing records we hold about you.
* **Right to Rectification:** You may correct or update your profile name, company details, or GSTIN at any time.
* **Right to Erasure ("Right to be Forgotten"):** You can clear all local application data, canvas layers, and snapshots by clearing your browser's site data. Users who connected Google OAuth can also revoke access at any time via [Google Security Settings](https://myaccount.google.com/permissions).
* **Right to Withdraw Consent:** You may cancel subscription renewals or disconnect your Web3/Google account at any time.

---

## 6. Age Restriction & Adult Audience (18+ / 20+)

MemeForge Studio is designed exclusively for **adult creators, developers, video engineers, and enterprise professionals (aged 18 and older, with a core audience aged 20–25+)**.
* The Application is **not** directed to children under the age of 13 (or under 18 in jurisdictions requiring adult consent for payments/contracts).
* All YouTube exports default to `selfDeclaredMadeForKids: false`.
* We do not knowingly collect personal information from anyone under 18. If we learn that personal data from a minor has been collected, we will delete it immediately.

---

## 7. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our legal obligations, technology updates, or service offerings. When updates occur, we will revise the "Last Updated" date at the top of this document.

---

## 8. Contact Us & Primary Data Protection Authority

If you have questions, feedback, or requests regarding this Privacy Policy, NIST FIPS 203/204 Post-Quantum Cryptography (`ML-KEM-1024` / `ML-DSA-87`) C2PA v3.0 provenance manifests, or our data protection practices, please contact our Primary Administration / GM / Admin / Moderator & Data Protection Team at:

* **Primary Administration / GM / Admin / Moderator Contact:** `creatergame31@gmail.com`
* **Co-Maintainer Contact:** `lijogeorge1133@gmail.com`
* **Project Maintainer:** MemeForge AI Studio Engineering Team (`@Gitinclo`)
* **Repository:** `https://github.com/Gitinclo/MemeForge-AI-Sora-Video-Studio`

