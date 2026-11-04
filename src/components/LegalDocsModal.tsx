import React, { useState } from 'react';
import { X, Shield, FileText, CheckCircle2, Lock, ExternalLink } from 'lucide-react';

interface LegalDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: 'terms' | 'privacy' | 'security' | 'notice' | 'license';
}

export const LegalDocsModal: React.FC<LegalDocsModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'security' | 'notice' | 'license'>(initialDoc);

  React.useEffect(() => {
    if (initialDoc) {
      setActiveTab(initialDoc);
    }
  }, [initialDoc]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {activeTab === 'terms' || activeTab === 'notice' || activeTab === 'license' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {activeTab === 'terms'
                  ? 'Terms & Conditions'
                  : activeTab === 'privacy'
                  ? 'Privacy Policy'
                  : activeTab === 'security'
                  ? 'Security Policy & Private Vulnerability Disclosure'
                  : activeTab === 'notice'
                  ? 'NOTICE — Apache 2.0 Attribution'
                  : 'LICENSE — Apache License 2.0'}
              </h3>
              <p className="text-xs text-slate-400">
                Official legal agreements, security policies &amp; attribution notices for MemeForge AI Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch pills */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTab === 'terms' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTab === 'privacy' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTab === 'security' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Security
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notice')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTab === 'notice' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                NOTICE
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('license')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTab === 'license' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                LICENSE
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs leading-relaxed text-slate-300 font-sans">
          {activeTab === 'terms' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <strong>Executive Summary:</strong> You own your original memes and User Content. Free exports carry a watermark; Pro (Rs. 999/mo) and Enterprise (Rs. 99,999/mo) provide full commercial broadcast rights. Automated Google Play Store direct publishing is permanently disabled to safeguard developer credentials.
              </div>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">1. Acceptance, Age Eligibility (18+ / 20–25+) &amp; Commercial Licenses</h4>
                <p>
                  By accessing or using MemeForge AI Studio, you agree to these Terms. This Service is designed strictly for adult creators, developers, and production teams aged 18+ (primarily serving adults aged 20–25+) and is not directed at children under 13/18. Core studio features work without mandatory registration; optional accounts (such as Google OAuth for YouTube publishing or Team Hub seats) and paid plans (India Creator Pro Rs. 999/mo &amp; Enterprise Rs. 99,999/mo) unlock full commercial broadcast rights without watermarks.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">2. Optional Subscription Billing &amp; 18% GST Taxes</h4>
                <p>
                  Paid subscriptions are optional and billed monthly in Indian Rupees (INR) via UPI AutoPay, Corporate NetBanking, or NEFT/RTGS mandates. Company Enterprise plans include official B2B tax invoices reflecting Company GSTIN with full 18% Goods &amp; Services Tax (GST) Input Tax Credit eligibility. Subscriptions renew automatically until cancelled in the UI. All subscription payments are non-refundable for partial billing periods.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">3. User Content &amp; Intellectual Property</h4>
                <p>
                  You retain all copyright and ownership rights to your original images, text, audio compositions, and video files created in the Studio. You warrant that your uploaded assets do not infringe third-party intellectual property or privacy rights.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">4. Acceptable Use &amp; AI Safety</h4>
                <p>
                  You agree not to use MemeForge Studio to generate defamatory, violent, illegal, or harassing material, or malicious non-consensual deepfakes. Attempting to overload the 32K / 1000 FPS rendering cluster or reverse-engineer private API proxies is strictly prohibited.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">5. Disclaimers, Termination &amp; Limitation of Liability</h4>
                <p>
                  The Application and AI models are provided &quot;AS IS&quot; without warranties of any kind. We reserve the right to suspend or terminate access for violations of these Terms. Under no circumstances shall MemeForge maintainers be liable for incidental, special, or consequential damages. Maximum aggregate liability is strictly limited to amounts paid by you in the preceding 12 months.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">6. Administration, GM, Admin &amp; Moderator Authority &amp; Contact</h4>
                <p>
                  Official studio administration, General Manager (GM) cluster oversight, Admin RBAC seat governance, and content moderation are governed by the primary authority account <code>creatergame31@gmail.com</code>. Direct Administration / GM / Admin / Moderator inquiries: <a href="mailto:creatergame31@gmail.com" className="text-amber-300 underline">creatergame31@gmail.com</a>.
                </p>
              </section>
            </div>
          ) : activeTab === 'privacy' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200">
                <strong>Privacy Summary:</strong> Your canvas layers, drafts, and audio stems are processed locally on your client device. Multimodal image analysis through Google Gemini is handled ephemerally in memory—we do not harvest, store, or sell your images to train AI models, nor do we run third-party behavioral ad trackers.
              </div>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">1. Information We Collect (Optional Accounts, OAuth &amp; Payments)</h4>
                <p>
                  Core meme creation works locally without an account. When you optionally activate a subscription or Team Hub seat, we collect billing identifiers (email, company name, GSTIN) solely for tax-compliant invoicing. When you connect Google OAuth for YouTube publishing, Bearer tokens are used ephemerally for resumable uploads. UPI/NetBanking transactions only log public VPA handles and UTR numbers—never banking passwords, card PINs, or UPI MPINs.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">2. Local-First Processing &amp; Ephemeral AI Storage</h4>
                <p>
                  Image canvas manipulation, typography rendering, and synthetic audio generation execute entirely client-side using browser HTML5 Canvas, Web Audio API, and localStorage. Images sent to <code>/api/magic-captions</code> or <code>/api/youtube/generate-metadata</code> are processed ephemerally in server RAM and immediately discarded.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">3. Adult Audience (18+ / 20–25+) &amp; Offline Security</h4>
                <p>
                  MemeForge Studio is intended strictly for adult creators and professionals aged 18+ (core audience 20–25+) and is not directed at children under 13 (`selfDeclaredMadeForKids: false`). Direct automated Play Store publishing is disabled across all tiers; Android APKs and AABs are compiled strictly for offline sideloading.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">4. Your Rights &amp; Administration / GM / Admin / Moderator Contact (GDPR, CCPA &amp; DPDPA)</h4>
                <p>
                  You have the right to access, rectify, or erase your personal information. Client project data can be purged instantly by clearing browser site storage. For Administration, GM, Admin, Moderator, privacy, or billing inquiries, contact the primary authority account at <code>creatergame31@gmail.com</code> (or secondary contact <code>lijogeorge1133@gmail.com</code>).
                </p>
              </section>
            </div>
          ) : activeTab === 'notice' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-200">
                <strong>Apache License 2.0 Section 4(d) Attribution &amp; Compliance Notice:</strong> Full verbatim contents of the root <code>/NOTICE</code> file.
              </div>
              <pre className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] leading-relaxed font-mono text-slate-200 whitespace-pre-wrap overflow-x-auto">
{`MemeForge AI, LEO Video & Cinema VFX Studio
Copyright 2026 MemeForge-AI Studio Contributors

Primary Author & Lead Architect:
Gitinclo (https://github.com/Gitinclo/MemeForge-AI-LEO-Video-Studio)

================================================================================
APACHE LICENSE 2.0 SECTION 4(d) ATTRIBUTION & COMPLIANCE NOTICE
================================================================================

This product includes software developed by Gitinclo and the MemeForge-AI
Studio Contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at:

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

--------------------------------------------------------------------------------
1. Attribution & License Preservation (Sections 4(a)–4(d))
--------------------------------------------------------------------------------
Under Section 4(d) of the Apache License, Version 2.0, any third-party
redistributor, search engine, AI coding agent index, or reference hub (such as
XERJ, Copus Hub, or similar public code repositories) that indexes, extracts,
or redistributes source code from this repository is legally required to:

  a) Retain a prominent and accessible copy of the Apache 2.0 LICENSE file.
  b) Retain this NOTICE file in its entirety, without alteration or truncation.
  c) Clearly display author attribution to Gitinclo and the original repository
     (https://github.com/Gitinclo/MemeForge-AI-LEO-Video-Studio) alongside any
     worked examples, code excerpts, or indexing results.
  d) Not relicense, sub-license, or redistribute any portion of this codebase
     under different, conflicting, or proprietary licensing terms.

--------------------------------------------------------------------------------
2. Trademark & Non-Endorsement (Section 6)
--------------------------------------------------------------------------------
This License does not grant permission to use the trade names, trademarks,
service marks, or product names of the Licensor ("MemeForge", "MemeForge-AI",
or "Gitinclo"), except as required for reasonable and customary use in
describing the origin of the Work. Public code indexing or reference inclusion
does not imply endorsement, sponsorship, or official affiliation by the author.

--------------------------------------------------------------------------------
3. Asset, Media & Computational Provenance
--------------------------------------------------------------------------------
- Cinema VFX 64-bit sub-frame timebase engine, 32K/1000 FPS compute metrics,
  ACES 2.0 color transforms, and 3D LUT simulators are original implementations.
- In-app Web Audio API synthetic PCM generators and WAV encoders were created
  in-engine and contain no unlicensed third-party audio samples.
- All third-party library dependencies (React, Vite, Express, Tailwind CSS,
  Lucide, and Google GenAI SDK) are permissively licensed open-source packages.`}
              </pre>
            </div>
          ) : activeTab === 'security' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
                <strong>Private Vulnerability Disclosure Policy (<code>/SECURITY.md</code>):</strong> Please do NOT disclose security vulnerabilities publicly on GitHub Issues. Use our private reporting channels below.
              </div>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">1. How to Disclose Privately to the Maintainer</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>GitHub Private Security Advisory (Preferred):</strong> Report directly via <code>github.com/Gitinclo/MemeForge-AI-Sora-Video-Studio/security/advisories/new</code>
                  </li>
                  <li>
                    <strong>Primary Administration / GM / Admin / Moderator Security Email:</strong> Send a private report to <code>creatergame31@gmail.com</code> (or <code>lijogeorge1133@gmail.com</code>) with subject <code>[SECURITY VULNERABILITY] MemeForge Studio</code>.
                  </li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">2. Response &amp; Disclosure SLA</h4>
                <p>
                  We acknowledge private vulnerability reports within <strong>24 hours</strong>, complete triage and severity validation within <strong>48–72 hours</strong>, and target patch deployment within <strong>7 days</strong> before coordinated disclosure.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">3. API Key, OAuth &amp; Keystore Safeguards</h4>
                <p>
                  All Gemini API calls execute strictly server-side in <code>server.ts</code>. Raw credentials, <code>.env</code> files, and Android signing keystores (<code>.jks</code>, <code>.keystore</code>) are never committed to version control, and automated Play Store publishing is permanently disabled.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                <strong>Apache License, Version 2.0 (January 2004):</strong> Full root <code>/LICENSE</code> file governing use, reproduction, and distribution.
              </div>
              <pre className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] leading-relaxed font-mono text-slate-200 whitespace-pre-wrap overflow-x-auto">
{`Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright 2026 MemeForge AI Studio Contributors (Gitinclo)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Compliant with GDPR, CCPA &amp; India DPDPA</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
};
