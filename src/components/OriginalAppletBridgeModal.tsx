import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Download,
  Upload,
  Globe,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import {
  ORIGINAL_AISTUDIO_APPLET_ID,
  ORIGINAL_AISTUDIO_APPLET_URL,
  buildAiStudioAppletUrl,
  extractAiStudioAppletId,
  triggerBrowserDownload,
} from '../utils';
import { TextLayer, MemeSticker, CanvasFilter } from '../types';

interface OriginalAppletBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayout: {
    textLayers: TextLayer[];
    stickers: MemeSticker[];
    filter: CanvasFilter;
  };
  onImportLayout: (layout: {
    textLayers?: TextLayer[];
    stickers?: MemeSticker[];
    filter?: CanvasFilter;
  }) => void;
}

export const OriginalAppletBridgeModal: React.FC<OriginalAppletBridgeModalProps> = ({
  isOpen,
  onClose,
  currentLayout,
  onImportLayout,
}) => {
  const [customUrlInput, setCustomUrlInput] = useState<string>(ORIGINAL_AISTUDIO_APPLET_URL);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showLiveIframe, setShowLiveIframe] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const resolvedAppletId = extractAiStudioAppletId(customUrlInput) || ORIGINAL_AISTUDIO_APPLET_ID;
  const resolvedFullscreenUrl = buildAiStudioAppletUrl(resolvedAppletId, true);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(resolvedFullscreenUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(false);
    }
  };

  const handleExportBridgeBundle = () => {
    const payload = {
      schemaVersion: '2026.2.0',
      originAppletId: ORIGINAL_AISTUDIO_APPLET_ID,
      originAppletUrl: ORIGINAL_AISTUDIO_APPLET_URL,
      exportedAt: new Date().toISOString(),
      layout: currentLayout,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    triggerBrowserDownload(blob, `memeforge_bridge_${resolvedAppletId.slice(0, 8)}.json`);
  };

  const handleImportBridgeBundle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        const layout = parsed.layout || parsed;
        if (layout && (Array.isArray(layout.textLayers) || Array.isArray(layout.stickers))) {
          onImportLayout(layout);
          setImportStatus('Synced layout state from Original Studio bundle.');
          setTimeout(() => setImportStatus(null), 3500);
        } else {
          setImportStatus('Invalid studio bundle JSON format.');
        }
      } catch {
        setImportStatus('Could not parse JSON bundle.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Original AI Studio Applet Bridge
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">
                  Canonical Origin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Applet ID: <code className="text-indigo-300 font-mono">{resolvedAppletId}</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Close Original Applet Bridge"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Canonical URL Bar */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Original Fullscreen AI Studio Applet URL
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Origin Link
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500"
                placeholder={ORIGINAL_AISTUDIO_APPLET_URL}
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
              <a
                href={resolvedFullscreenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Fullscreen Applet</span>
              </a>
            </div>
          </div>

          {/* State Sync & Layout Portability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Download className="w-4 h-4" />
                <span>Export Layout to Original Studio</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download your current text layers ({currentLayout.textLayers.length}), stickers (
                {currentLayout.stickers.length}), and canvas filter ({currentLayout.filter}) as a
                portable JSON bundle linked to <code className="text-slate-300">4d0cb3f2</code>.
              </p>
              <button
                type="button"
                onClick={handleExportBridgeBundle}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Bridge JSON Bundle</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Upload className="w-4 h-4" />
                <span>Import State from Original Studio</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Restore a saved JSON layout snapshot from the original MemeForge AI Studio applet
                directly onto the live canvas.
              </p>
              <label className="w-full py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Bridge JSON Bundle</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportBridgeBundle}
                  className="hidden"
                />
              </label>
              {importStatus && (
                <p className="text-[11px] text-emerald-400 font-semibold">{importStatus}</p>
              )}
            </div>
          </div>

          {/* Optional Embedded Preview Toggle */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>In-App Applet Viewport ({resolvedFullscreenUrl})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLiveIframe((prev) => !prev)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 border border-slate-700 transition-colors"
              >
                {showLiveIframe ? 'Hide Viewport' : 'Load Embedded Viewport'}
              </button>
            </div>
            {showLiveIframe ? (
              <div className="w-full h-80 bg-slate-950">
                <iframe
                  src={resolvedFullscreenUrl}
                  title="Original MemeForge AI Studio Applet"
                  className="w-full h-full border-0"
                  allow="fullscreen; clipboard-read; clipboard-write"
                />
              </div>
            ) : (
              <div className="p-4 text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Launch the original AI Studio applet directly in a new browser tab for full Google
                  AI Studio authentication, or load the embedded viewport above.
                </span>
                <a
                  href={ORIGINAL_AISTUDIO_APPLET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 shrink-0 text-indigo-400 hover:text-indigo-300 underline font-bold flex items-center gap-1"
                >
                  <span>ai.studio/apps/4d0cb3f2...</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
