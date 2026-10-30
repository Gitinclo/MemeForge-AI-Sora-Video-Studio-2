import React, { useState } from 'react';
import { MemeAudioConfig, SoundboardTriggerCue } from '../types/meme';
import {
  MEME_AUDIO_EFFECTS,
  createSoundboardTriggerCue,
  frameToTimestampSec,
  computeVideoExportTimelineInfo,
  playQuickSoundboardEffect,
  playMemeAudio,
  stopMemeAudio,
  downloadMemeAudioTrack,
} from '../utils/memeAudioEngine';
import {
  Zap,
  Play,
  Square,
  Plus,
  Trash2,
  Film,
  Download,
  Clock,
  Sliders,
  Sparkles,
  Volume2,
} from 'lucide-react';

interface MemeSoundboardPanelProps {
  audioConfig: MemeAudioConfig;
  onChangeAudioConfig: (updates: Partial<MemeAudioConfig>) => void;
  onExportVideoWithAudio: () => void;
  isExportingVideo: boolean;
  exportProgress: { percent: number; status: string } | null;
}

const FEATURED_QUICK_IDS = [
  'airhorn',
  'laugh_track',
  'sad_violin',
  'vine_boom',
  'bruh',
  'emotional_damage',
  'metal_pipe',
  'curb_theme',
  'gigachad',
  'dun_dun_dun',
  'record_scratch',
  'roblox_oof',
];

export const MemeSoundboardPanel: React.FC<MemeSoundboardPanelProps> = ({
  audioConfig,
  onChangeAudioConfig,
  onExportVideoWithAudio,
  isExportingVideo,
  exportProgress,
}) => {
  const fps = audioConfig.exportFps || 30;
  const minDurationSec = audioConfig.exportDurationSec || 4.0;
  const timelineInfo = computeVideoExportTimelineInfo(audioConfig);
  const totalFrames = timelineInfo.totalFrames;
  const sortedTriggers = timelineInfo.sortedTriggers;

  const [targetFrame, setTargetFrame] = useState<number>(0);
  const [autoPinOnTap, setAutoPinOnTap] = useState<boolean>(true);
  const [showAllPads, setShowAllPads] = useState<boolean>(false);
  const [activePadId, setActivePadId] = useState<string | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);

  const clampedTargetFrame = Math.min(totalFrames, Math.max(0, targetFrame));
  const targetTimestampSec = frameToTimestampSec(clampedTargetFrame, fps);

  const displayedEffects = showAllPads
    ? MEME_AUDIO_EFFECTS
    : MEME_AUDIO_EFFECTS.filter((e) => FEATURED_QUICK_IDS.includes(e.id));

  // Pin a sound effect trigger at a specific frame
  const handlePinSoundAtFrame = (effectId: string, frameNum = clampedTargetFrame) => {
    const newCue = createSoundboardTriggerCue(effectId, frameNum, fps, {
      volume: audioConfig.volume ?? 1.0,
      playbackRate: audioConfig.playbackRate ?? 1.0,
    });
    const currentList = audioConfig.soundboardTriggers || [];
    onChangeAudioConfig({
      soundboardTriggers: [...currentList, newCue],
    });
  };

  // Quick-fire pad click: immediately audition sound on canvas visualizer + optionally pin to targetFrame
  const handlePadClick = async (effectId: string) => {
    setActivePadId(effectId);
    setIsPlayingSequence(false);
    if (autoPinOnTap) {
      handlePinSoundAtFrame(effectId, clampedTargetFrame);
    }
    await playQuickSoundboardEffect(
      effectId,
      audioConfig.volume ?? 1.0,
      audioConfig.playbackRate ?? 1.0,
      () => {
        setActivePadId((prev) => (prev === effectId ? null : prev));
      }
    );
  };

  // Update a specific trigger cue's frame number or volume
  const handleUpdateCue = (cueId: string, updates: Partial<SoundboardTriggerCue>) => {
    const currentList = audioConfig.soundboardTriggers || [];
    const nextList = currentList.map((cue) => {
      if (cue.id !== cueId) return cue;
      const updatedFrame =
        updates.frameNumber !== undefined
          ? Math.max(0, Math.round(updates.frameNumber))
          : cue.frameNumber;
      const updatedFps = updates.fps ?? fps;
      return {
        ...cue,
        ...updates,
        frameNumber: updatedFrame,
        fps: updatedFps,
        timestampSec: frameToTimestampSec(updatedFrame, updatedFps),
      };
    });
    onChangeAudioConfig({ soundboardTriggers: nextList });
  };

  const handleRemoveCue = (cueId: string) => {
    const currentList = audioConfig.soundboardTriggers || [];
    onChangeAudioConfig({
      soundboardTriggers: currentList.filter((c) => c.id !== cueId),
    });
  };

  const handleClearAllCues = () => {
    stopMemeAudio();
    setIsPlayingSequence(false);
    setActivePadId(null);
    onChangeAudioConfig({ soundboardTriggers: [] });
  };

  // Change FPS and recalculate all existing trigger timestamps
  const handleFpsChange = (newFps: number) => {
    const currentList = audioConfig.soundboardTriggers || [];
    const updatedList = currentList.map((cue) => ({
      ...cue,
      fps: newFps,
      timestampSec: frameToTimestampSec(cue.frameNumber, newFps),
    }));
    onChangeAudioConfig({
      exportFps: newFps,
      soundboardTriggers: updatedList,
    });
  };

  // Apply 1-click multi-trigger combo preset
  const handleApplyComboPreset = (
    presetCues: Array<{ effectId: string; frameOffset: number; volume?: number }>
  ) => {
    const builtCues = presetCues.map((item) =>
      createSoundboardTriggerCue(item.effectId, item.frameOffset, fps, {
        volume: item.volume ?? 1.0,
        playbackRate: 1.0,
      })
    );
    const nextConfig: MemeAudioConfig = {
      ...audioConfig,
      soundboardTriggers: builtCues,
    };
    onChangeAudioConfig({ soundboardTriggers: builtCues });
    setIsPlayingSequence(true);
    setActivePadId(null);
    playMemeAudio(nextConfig, () => {
      setIsPlayingSequence(false);
    });
  };

  // Play or stop full frame-accurate sequence
  const handleTogglePlaySequence = async () => {
    if (isPlayingSequence || activePadId) {
      stopMemeAudio();
      setIsPlayingSequence(false);
      setActivePadId(null);
      return;
    }
    if (sortedTriggers.length === 0 && !audioConfig.selectedEffectId) {
      return;
    }
    setIsPlayingSequence(true);
    await playMemeAudio(audioConfig, () => {
      setIsPlayingSequence(false);
    });
  };

  const quickFramePresets = [
    { label: 'F0 (Start)', frame: 0 },
    { label: `F${Math.round(fps * 0.5)} (0.5s)`, frame: Math.round(fps * 0.5) },
    { label: `F${fps} (1.0s)`, frame: fps },
    { label: `F${Math.round(fps * 1.5)} (1.5s)`, frame: Math.round(fps * 1.5) },
    { label: `F${fps * 2} (2.0s)`, frame: fps * 2 },
    { label: `F${fps * 3} (3.0s)`, frame: fps * 3 },
  ];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-3 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-600/15 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-lg shadow-inner">
            🎛️
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <span>Quick-Fire Soundboard &amp; Frame Sequencer</span>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-500 text-slate-950 rounded-full">
                {fps} FPS
              </span>
            </h4>
            <p className="text-[11px] text-slate-300">
              Tap pads for instant airhorns, laughs &amp; sad violins or pin triggers to exact video frames
            </p>
          </div>
        </div>

        {sortedTriggers.length > 0 && (
          <button
            onClick={handleClearAllCues}
            className="px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-700/80 text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0"
            title="Clear all frame triggers"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear ({sortedTriggers.length})</span>
          </button>
        )}
      </div>

      {/* Frame Playhead Scrubber & FPS / Duration Controls */}
      <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider">
              Target Frame Timestamp:
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black">
              Frame {clampedTargetFrame} ({targetTimestampSec.toFixed(2)}s)
            </span>
          </div>

          {/* Auto-Pin on Pad Tap Toggle */}
          <button
            type="button"
            onClick={() => setAutoPinOnTap((prev) => !prev)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border transition-all flex items-center gap-1.5 ${
              autoPinOnTap
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="When enabled, clicking any soundboard pad both plays the sound AND pins it at the current target frame"
          >
            <Zap className="w-3 h-3" />
            <span>{autoPinOnTap ? 'Auto-Pin @ Frame: ON' : 'Auto-Pin @ Frame: OFF'}</span>
          </button>
        </div>

        {/* Frame Number Scrubber Slider */}
        <div className="space-y-1.5">
          <input
            type="range"
            min={0}
            max={totalFrames}
            step={1}
            value={clampedTargetFrame}
            onChange={(e) => setTargetFrame(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Frame 0 (0.00s)</span>
            <span className="text-amber-300 font-bold">
              Playhead: F{clampedTargetFrame} / {totalFrames} ({targetTimestampSec.toFixed(2)}s)
            </span>
            <span>
              Frame {totalFrames} ({timelineInfo.totalDurationSec.toFixed(1)}s)
            </span>
          </div>
        </div>

        {/* Quick Frame Stamp Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Jump Frame:</span>
          {quickFramePresets.map((preset) => {
            const isSelected = clampedTargetFrame === preset.frame;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setTargetFrame(Math.min(totalFrames, preset.frame))}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Export FPS & Min Video Duration Row */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-amber-400" />
              Export Frame Rate
            </label>
            <div className="flex gap-1">
              {[24, 30, 60].map((rateOpt) => (
                <button
                  key={rateOpt}
                  type="button"
                  onClick={() => handleFpsChange(rateOpt)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold border transition-all ${
                    fps === rateOpt
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {rateOpt} FPS
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Film className="w-3 h-3 text-purple-400" />
              Min Video Length
            </label>
            <div className="flex gap-1">
              {[3, 4, 6, 8].map((secOpt) => (
                <button
                  key={secOpt}
                  type="button"
                  onClick={() => onChangeAudioConfig({ exportDurationSec: secOpt })}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold border transition-all ${
                    minDurationSec === secOpt
                      ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {secOpt}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick-Fire Soundboard Pad Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick-Fire Soundboard Pads ({displayedEffects.length})</span>
          </label>
          <button
            type="button"
            onClick={() => setShowAllPads((prev) => !prev)}
            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
          >
            {showAllPads ? 'Show Core 12 Pads' : `Show All ${MEME_AUDIO_EFFECTS.length} Pads`}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
          {displayedEffects.map((sfx) => {
            const isFiring = activePadId === sfx.id;
            const pinnedCount = sortedTriggers.filter((c) => c.effectId === sfx.id).length;

            return (
              <div
                key={sfx.id}
                className={`p-2 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 ${
                  isFiring
                    ? 'bg-gradient-to-br from-amber-500/30 to-rose-500/20 border-amber-400 shadow-lg shadow-amber-500/20 scale-[0.99]'
                    : pinnedCount > 0
                    ? 'bg-slate-950/90 border-amber-500/40 hover:border-amber-400'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handlePadClick(sfx.id)}
                  className="text-left flex items-start gap-2 w-full group cursor-pointer"
                  title={`Fire ${sfx.name} (${sfx.durationSec}s)${
                    autoPinOnTap ? ` and pin at Frame ${clampedTargetFrame}` : ''
                  }`}
                >
                  <span className="text-xl shrink-0 group-hover:scale-125 transition-transform">
                    {sfx.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-extrabold text-white truncate flex items-center gap-1">
                      <span className="truncate">{sfx.name}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5">
                      <span>{sfx.durationSec}s</span>
                      {pinnedCount > 0 && (
                        <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                          ×{pinnedCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Explicit + Pin @ Frame button */}
                <button
                  type="button"
                  onClick={() => handlePinSoundAtFrame(sfx.id, clampedTargetFrame)}
                  className="w-full py-1 px-2 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-slate-800 hover:border-amber-400 text-[10px] font-extrabold font-mono flex items-center justify-center gap-1 transition-all cursor-pointer"
                  title={`Add ${sfx.name} trigger at Frame ${clampedTargetFrame} (${targetTimestampSec.toFixed(2)}s)`}
                >
                  <Plus className="w-3 h-3" />
                  <span>Pin @ F{clampedTargetFrame}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1-Click Viral Soundboard Combo Presets */}
      <div className="p-3 bg-slate-950/70 border border-slate-800/90 rounded-2xl space-y-2">
        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>1-Click Multi-Frame Soundboard Combos</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() =>
              handleApplyComboPreset([
                { effectId: 'vine_boom', frameOffset: 0 },
                { effectId: 'airhorn', frameOffset: Math.round(fps * 0.8) },
                { effectId: 'laugh_track', frameOffset: Math.round(fps * 2.0) },
              ])
            }
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition-all cursor-pointer"
          >
            <div className="text-[10px] font-extrabold text-amber-300">💥📯😂 MLG Hype Drop</div>
            <div className="text-[9px] text-slate-400 font-mono">
              F0 Boom → F{Math.round(fps * 0.8)} Airhorn → F{fps * 2} Laugh
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleApplyComboPreset([
                { effectId: 'record_scratch', frameOffset: 0 },
                { effectId: 'bruh', frameOffset: Math.round(fps * 0.6) },
                { effectId: 'sad_violin', frameOffset: Math.round(fps * 1.3) },
              ])
            }
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-left transition-all cursor-pointer"
          >
            <div className="text-[10px] font-extrabold text-purple-300">💿🗿🎻 Tragic Fail L</div>
            <div className="text-[9px] text-slate-400 font-mono">
              F0 Scratch → F{Math.round(fps * 0.6)} Bruh → F{Math.round(fps * 1.3)} Violin
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleApplyComboPreset([
                { effectId: 'dun_dun_dun', frameOffset: 0 },
                { effectId: 'vine_boom', frameOffset: Math.round(fps * 1.0) },
                { effectId: 'emotional_damage', frameOffset: Math.round(fps * 1.8) },
              ])
            }
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 text-left transition-all cursor-pointer"
          >
            <div className="text-[10px] font-extrabold text-rose-300">😱💥⚡ Shock Roast</div>
            <div className="text-[9px] text-slate-400 font-mono">
              F0 DunDun → F{fps} Boom → F{Math.round(fps * 1.8)} Damage
            </div>
          </button>
        </div>
      </div>

      {/* Visual Frame Timeline Track & Pinned Trigger Cue Sequencer */}
      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" />
            <span>
              Pinned Video Frame Triggers ({sortedTriggers.length} cue
              {sortedTriggers.length === 1 ? '' : 's'})
            </span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Total Export: {timelineInfo.totalDurationSec.toFixed(1)}s ({totalFrames} frames @ {fps}fps)
          </span>
        </div>

        {/* Visual Horizontal Frame Marker Bar */}
        <div className="relative h-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center px-2">
          {/* Playhead vertical line */}
          <div
            style={{
              left: `${Math.min(98, Math.max(1, (clampedTargetFrame / Math.max(1, totalFrames)) * 100))}%`,
            }}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10 pointer-events-none"
          />

          {sortedTriggers.length === 0 ? (
            <span className="text-[10px] text-slate-500 mx-auto">
              No frame triggers pinned yet — click any Soundboard pad above to drop a trigger!
            </span>
          ) : (
            sortedTriggers.map((cue) => {
              const leftPct = Math.min(
                94,
                Math.max(2, (cue.frameNumber / Math.max(1, totalFrames)) * 100)
              );
              return (
                <button
                  key={cue.id}
                  type="button"
                  onClick={() => setTargetFrame(cue.frameNumber)}
                  style={{ left: `${leftPct}%` }}
                  className="absolute -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/70 text-[10px] font-mono font-bold text-amber-200 flex items-center gap-0.5 shadow-sm transition-all z-20 cursor-pointer"
                  title={`${cue.name} @ Frame ${cue.frameNumber} (${cue.timestampSec.toFixed(2)}s)`}
                >
                  <span>{cue.emoji}</span>
                  <span className="text-[8px]">F{cue.frameNumber}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Cue List */}
        {sortedTriggers.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {sortedTriggers.map((cue, idx) => (
              <div
                key={cue.id}
                className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-base shrink-0">{cue.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{cue.name}</div>
                    <div className="text-[10px] font-mono text-amber-300">
                      Frame {cue.frameNumber} · {cue.timestampSec.toFixed(2)}s
                    </div>
                  </div>
                </div>

                {/* Frame Stepper & Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateCue(cue.id, {
                        frameNumber: Math.max(0, cue.frameNumber - 5),
                      })
                    }
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300"
                    title="Move 5 frames earlier"
                  >
                    -5f
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={totalFrames * 2}
                    value={cue.frameNumber}
                    onChange={(e) =>
                      handleUpdateCue(cue.id, {
                        frameNumber: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-14 px-1.5 py-0.5 text-center text-[11px] font-mono font-bold bg-slate-950 border border-slate-700 rounded text-amber-300"
                    title="Exact Frame Number"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateCue(cue.id, {
                        frameNumber: cue.frameNumber + 5,
                      })
                    }
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300"
                    title="Move 5 frames later"
                  >
                    +5f
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      playQuickSoundboardEffect(cue.effectId, cue.volume, cue.playbackRate)
                    }
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 transition-colors"
                    title={`Audition ${cue.name}`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveCue(cue.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Remove frame trigger"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sequence Playback & Video Export Action Row */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={handleTogglePlaySequence}
            disabled={sortedTriggers.length === 0 && !audioConfig.selectedEffectId}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isPlayingSequence || activePadId
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                : sortedTriggers.length > 0 || audioConfig.selectedEffectId
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isPlayingSequence || activePadId ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Visualizer Audio</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Sequence on Canvas ({sortedTriggers.length} Cues)</span>
              </>
            )}
          </button>

          {(sortedTriggers.length > 0 || audioConfig.selectedEffectId) && (
            <button
              type="button"
              onClick={() =>
                downloadMemeAudioTrack(audioConfig, `meme_soundboard_${fps}fps.wav`)
              }
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download mixed multi-trigger WAV audio track"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>.WAV</span>
            </button>
          )}
        </div>

        {/* Export Video with Frame Triggers */}
        <button
          type="button"
          onClick={onExportVideoWithAudio}
          disabled={
            isExportingVideo ||
            (sortedTriggers.length === 0 &&
              !audioConfig.selectedEffectId &&
              !audioConfig.customAudioUrl)
          }
          className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
            isExportingVideo
              ? 'bg-purple-900/60 text-purple-200 cursor-wait'
              : sortedTriggers.length > 0 ||
                audioConfig.selectedEffectId ||
                audioConfig.customAudioUrl
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white shadow-purple-500/25 cursor-pointer active:scale-98'
              : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
          }`}
        >
          <Film className="w-4 h-4 text-amber-200" />
          <span>
            {isExportingVideo
              ? exportProgress?.status || 'Recording Video with Frame Triggers...'
              : `🎬 Export Video with ${sortedTriggers.length} Frame Trigger${
                  sortedTriggers.length === 1 ? '' : 's'
                } (@ ${fps} FPS)`}
          </span>
        </button>
      </div>
    </div>
  );
};
