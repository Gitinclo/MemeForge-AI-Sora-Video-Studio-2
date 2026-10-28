import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check, Share, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowIOSGuide(true)}
        className="shrink-0 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
        title="Install MemeForge AI Studio as an App"
      >
        <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
        <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Install MemeForge App</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 mt-0.5">
                  <Share className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-bold text-white">Step 1:</span> Open your browser menu (<strong>⋮</strong> or <strong>Share</strong>) in the toolbar.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 mt-0.5">
                  <PlusSquare className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-bold text-white">Step 2:</span> Select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
