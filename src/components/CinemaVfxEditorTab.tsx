import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Layers,
  Sliders,
  SlidersHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Scissors,
  Sparkles,
  Cpu,
  Server,
  Zap,
  Activity,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Clock,
  Wand2,
  Crosshair,
  Grid,
  BarChart3,
  RefreshCw,
  Download,
  CheckCircle2,
  Waves,
  Boxes,
  Upload,
  Plus,
  FolderOpen,
  CornerUpLeft,
  Radio,
} from 'lucide-react';
import {
  CinemaProjectSpec,
  ResolutionPreset,
  ColorBitDepth,
  ColorSpaceStandard,
  HdrStandard,
  AudioSampleRate,
  AudioBitDepth,
  AudioChannelLayout,
  ProCodec,
  RenderEngineBackend,
  ProxyQuality,
  TimelineTool,
  TimelineTrack,
  TimelineClip,
  ScopeMode,
  ColorGradeControls,
  ParsedCubeLut,
  VfxNode,
  VfxNodeConnection,
  AiVfxToolState,
  AiVfxFeatureId,
  AudioBusConfig,
  AudioTrackChannelStrip,
  RenderGraphStage,
  RenderTileCell,
  PerformanceFoundationConfig,
  RenderQueueJob,
  MulticamAngle,
} from '../types/cinemaEngine';
import {
  CINEMA_RESOLUTIONS,
  CINEMA_FRAME_RATES,
  AUDIO_SAMPLE_RATES,
  AUDIO_BIT_DEPTHS,
  AUDIO_CHANNEL_LAYOUTS,
  COLOR_BIT_DEPTHS,
  COLOR_SPACES,
  HDR_STANDARDS,
  PRO_CODECS,
  RENDER_BACKENDS,
  CINEMA_LUT_PRESETS,
  DEFAULT_CINEMA_PROJECT,
  MULTICAM_ANGLES_DEFAULT,
  DEFAULT_VFX_NODES,
  DEFAULT_VFX_CONNECTIONS,
  DEFAULT_AI_VFX_TOOLS,
  DEFAULT_AUDIO_BUSES,
  DEFAULT_AUDIO_STRIPS,
  DEFAULT_RENDER_GRAPH_STAGES,
  DEFAULT_PERFORMANCE_FOUNDATION,
  TICKS_PER_SECOND_64,
  calculateUltraComputeMetrics,
  ticksToTimecode64,
  getProxyDimensions,
  splitClipAtTicks64,
  rippleTrimClip64,
  rollingEditClips64,
  slipClipSource64,
  slideClipPosition64,
  createCompoundClip64,
  applyMagneticSnap64,
  parseCubeLutFile,
  generateSampleCubeLutContent,
  buildCombinedColorFilter,
  benchmarkTimebaseAccuracy64,
  generateRenderTileGrid,
} from '../utils/cinemaEngine';
import { exportNleTimelineXml, exportCmx3600Edl } from '../utils/enterpriseCollabEngine';
import { UserSubscription } from '../types/subscription';

interface CinemaVfxEditorTabProps {
  subscription?: UserSubscription;
  onOpenSubscriptionModal?: () => void;
}

export const CinemaVfxEditorTab: React.FC<CinemaVfxEditorTabProps> = () => {
  // DaVinci-style 5-Room Switcher
  const [workspaceMode, setWorkspaceMode] = useState<'edit' | 'vfx' | 'color' | 'audio' | 'deliver'>('edit');

  // Active Project Specifications
  const [projectSpec, setProjectSpec] = useState<CinemaProjectSpec>(DEFAULT_CINEMA_PROJECT);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(false);

  // Playback & 64-bit Frame-Accurate Timebase state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTicks, setCurrentTicks] = useState<bigint>(2n * TICKS_PER_SECOND_64);
  const [durationTicks, setDurationTicks] = useState<bigint>(10n * TICKS_PER_SECOND_64);
  const [activeTool, setActiveTool] = useState<TimelineTool>('select');
  const [selectedClipId, setSelectedClipId] = useState<string>('c-v1-1');

  // Multicam 4-Up Monitor State
  const [multicamMode, setMulticamMode] = useState<boolean>(false);
  const [multicamAngles] = useState<MulticamAngle[]>(MULTICAM_ANGLES_DEFAULT);
  const [activeMulticamAngleId, setActiveMulticamAngleId] = useState<string>('cam-a');

  // Nested Timeline / Compound Clip Breadcrumb state
  const [nestedCompoundClip, setNestedCompoundClip] = useState<TimelineClip | null>(null);

  // Broadcast HDR Scopes state (all 5 scopes)
  const [scopes, setScopes] = useState<ScopeMode>({
    waveform: true,
    rgbParade: true,
    vectorscope: true,
    histogram: false,
    falseColor: false,
  });

  // Color Grading & .cube 3D LUT state
  const [colorGrade, setColorGrade] = useState<ColorGradeControls>({
    lift: { r: 0, g: 0, b: 0, luma: 0 },
    gamma: { r: 0, g: 0, b: 0, luma: 0 },
    gain: { r: 0, g: 0, b: 0, luma: 0 },
    offset: { r: 0, g: 0, b: 0, luma: 0 },
    contrast: 1.15,
    pivot: 0.43,
    saturation: 110,
    temperature: 5600,
    tint: 0,
    activeLut: 'hollywood_teal_orange',
  });
  const [customCubeLuts, setCustomCubeLuts] = useState<ParsedCubeLut[]>([]);
  const [activeCustomCubeId, setActiveCustomCubeId] = useState<string | null>(null);
  const cubeFileInputRef = useRef<HTMLInputElement | null>(null);

  // Fusion VFX Node Graph & 11 AI VFX Tools state
  const [vfxNodes, setVfxNodes] = useState<VfxNode[]>(DEFAULT_VFX_NODES);
  const [vfxConnections] = useState<VfxNodeConnection[]>(DEFAULT_VFX_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-ai-rotomask');
  const [aiVfxTools, setAiVfxTools] = useState<AiVfxToolState[]>(DEFAULT_AI_VFX_TOOLS);

  // Fairlight 192 kHz / 64-bit Audio Engine state
  const [audioBuses, setAudioBuses] = useState<AudioBusConfig[]>(DEFAULT_AUDIO_BUSES);
  const [audioStrips, setAudioStrips] = useState<AudioTrackChannelStrip[]>(DEFAULT_AUDIO_STRIPS);
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string>('a1');

  // Deliver, GPU Render Graph, Tile Cache & Benchmark state
  const [renderStages] = useState<RenderGraphStage[]>(DEFAULT_RENDER_GRAPH_STAGES);
  const [perfConfig, setPerfConfig] = useState<PerformanceFoundationConfig>(DEFAULT_PERFORMANCE_FOUNDATION);
  const [renderTiles, setRenderTiles] = useState<RenderTileCell[]>(() =>
    generateRenderTileGrid(4, 6, 1024, 4)
  );
  const [showTimebaseBenchmark, setShowTimebaseBenchmark] = useState<boolean>(false);
  const [renderQueue, setRenderQueue] = useState<RenderQueueJob[]>([
    {
      id: 'job-1',
      title: 'Master Archival Reel (32K 1000 FPS)',
      codec: 'Apple ProRes 4444 XQ',
      resolutionLabel: '32000×32000',
      fps: 1000,
      colorSpace: 'ACES 2.0 AP0',
      hdrStandard: 'Dolby Vision Profile 7 (Dual Layer)',
      status: 'completed',
      progressPct: 100,
      assignedNodes: 8,
      estimatedSizeGb: 412.8,
    },
    {
      id: 'job-2',
      title: 'VFX Deep Compositing Plates',
      codec: 'OpenEXR 32-bit Float Sequence',
      resolutionLabel: '15360×8640',
      fps: 240,
      colorSpace: 'OpenColorIO (OCIO v2)',
      hdrStandard: 'HDR10+ Adaptive',
      status: 'queued',
      progressPct: 0,
      assignedNodes: 4,
      estimatedSizeGb: 186.4,
    },
  ]);

  // Status banner feedback
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');

  // Multi-Track 64-Bit Timeline Tracks
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: 'v3',
      name: 'V3 · Fusion VFX & AI Roto',
      type: 'fusion',
      isMuted: false,
      isLocked: false,
      color: 'bg-cyan-500/25 border-cyan-500/50 text-cyan-100',
      clips: [
        {
          id: 'c-v3-1',
          trackId: 'v3',
          name: 'Fusion Node Comp: AI Depth Glow + RotoSpline',
          startTicks: 1n * TICKS_PER_SECOND_64,
          durationTicks: 6n * TICKS_PER_SECOND_64,
          sourceStartTicks: 0n,
          color: 'bg-cyan-600/35 border-cyan-400 text-cyan-100',
          speedMultiplier: 1.0,
          fusionCompId: 'comp-main',
        },
      ],
    },
    {
      id: 'v2',
      name: 'V2 · Cinema Titles & Subtitles',
      type: 'subtitle',
      isMuted: false,
      isLocked: false,
      color: 'bg-purple-500/25 border-purple-500/50 text-purple-100',
      clips: [
        {
          id: 'c-v2-1',
          trackId: 'v2',
          name: '32K IMAX Master Slate + AI Timecode Subtitles',
          startTicks: 0n,
          durationTicks: 5n * TICKS_PER_SECOND_64,
          sourceStartTicks: 0n,
          color: 'bg-purple-600/35 border-purple-400 text-purple-100',
          speedMultiplier: 1.0,
        },
      ],
    },
    {
      id: 'v1',
      name: 'V1 · 32K 1000 FPS RAW Master',
      type: 'multicam',
      isMuted: false,
      isLocked: false,
      color: 'bg-amber-500/25 border-amber-500/50 text-amber-100',
      clips: [
        {
          id: 'c-v1-1',
          trackId: 'v1',
          name: 'ARRI 32K Omnimax Plate (Cam A · 1000 FPS)',
          startTicks: 0n,
          durationTicks: 6n * TICKS_PER_SECOND_64,
          sourceStartTicks: 0n,
          color: 'bg-amber-600/35 border-amber-400 text-amber-100',
          speedMultiplier: 1.0,
          multicamAngleId: 'cam-a',
        },
        {
          id: 'c-v1-2',
          trackId: 'v1',
          name: 'Phantom 1000 FPS Optical Flow Plate (Cam C)',
          startTicks: 6n * TICKS_PER_SECOND_64,
          durationTicks: 4n * TICKS_PER_SECOND_64,
          sourceStartTicks: 0n,
          color: 'bg-amber-600/35 border-amber-400 text-amber-100',
          speedMultiplier: 1.0,
          multicamAngleId: 'cam-c',
        },
      ],
    },
    {
      id: 'fx1',
      name: 'FX1 · ACES 2.0 OCIO Adjustment',
      type: 'adjustment',
      isMuted: false,
      isLocked: false,
      color: 'bg-indigo-500/25 border-indigo-500/50 text-indigo-100',
      clips: [
        {
          id: 'c-fx-1',
          trackId: 'fx1',
          name: 'OCIO v2 ACES 2.0 AP0 -> Dolby Vision Profile 7 + 3D LUT',
          startTicks: 0n,
          durationTicks: 10n * TICKS_PER_SECOND_64,
          sourceStartTicks: 0n,
          color: 'bg-indigo-600/35 border-indigo-400 text-indigo-100',
          speedMultiplier: 1.0,
        },
      ],
    },
    {
      id: 'a1',
      name: 'A1 · Dialogue (192 kHz / 32f)',
      type: 'audio',
      isMuted: false,
      isLocked: false,
      color: 'bg-emerald-500/25 border-emerald-500/50 text-emerald-100',
      clips: [
        {
          id: 'c-a1-1',
          trackId: 'a1',
          name: 'Studio Boom Stem 192 kHz (AI Speech Enhanced · Side-Chain Key)',
          startTicks: 0n,
          durationTicks: 8n * TICKS_PER_SECOND_64,
          sourceStartTicks: 0n,
          color: 'bg-emerald-600/35 border-emerald-400 text-emerald-100',
          speedMultiplier: 1.0,
        },
      ],
    },
    {
      id: 'a2',
      name: 'A2 · Dolby Atmos 7.1.4 Bed',
      type: 'audio',
      isMuted: false,
      isLocked: false,
      color: 'bg-teal-500/25 border-teal-500/50 text-teal-100',
      clips: [
        {
          id: 'c-a2-1',
          trackId: 'a2',
          name: '16-Channel 3rd Order Ambisonics + Atmos Object Bed',
          startTicks: 0n,
          durationTicks: 10n * TICKS_PER_SECOND_64,
          sourceStartTicks: 0n,
          color: 'bg-teal-600/35 border-teal-400 text-teal-100',
          speedMultiplier: 1.0,
        },
      ],
    },
  ]);

  // Compute metrics for current project configuration
  const computeMetrics = calculateUltraComputeMetrics(
    projectSpec.width,
    projectSpec.height,
    projectSpec.frameRate,
    projectSpec.colorDepth
  );

  const proxyDims = getProxyDimensions(
    projectSpec.width,
    projectSpec.height,
    projectSpec.proxyQuality
  );

  // Playback timer loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      const step = (now: number) => {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        setCurrentTicks((prev) => {
          const deltaTicks = BigInt(Math.round(deltaSeconds * Number(TICKS_PER_SECOND_64)));
          const next = prev + deltaTicks;
          if (next >= durationTicks) {
            return 0n;
          }
          return next;
        });

        animFrameRef.current = requestAnimationFrame(step);
      };
      animFrameRef.current = requestAnimationFrame(step);
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, durationTicks]);

  // Step 1 frame forward or backward with 64-bit frame accuracy
  const handleStepFrame = (direction: 1 | -1) => {
    const ticksPerFrame = BigInt(Math.round(Number(TICKS_PER_SECOND_64) / projectSpec.frameRate));
    setCurrentTicks((prev) => {
      const next = prev + BigInt(direction) * ticksPerFrame;
      if (next < 0n) return 0n;
      if (next > durationTicks) return durationTicks;
      return next;
    });
  };

  // Change Resolution Preset
  const handleSelectResolution = (resId: ResolutionPreset) => {
    const cfg = CINEMA_RESOLUTIONS.find((r) => r.id === resId);
    if (cfg) {
      setProjectSpec((prev) => ({
        ...prev,
        resolutionPreset: resId,
        width: resId === 'Custom' ? prev.width : cfg.width,
        height: resId === 'Custom' ? prev.height : cfg.height,
        proxyQuality:
          cfg.megapixels > 500
            ? '1/16 Super Proxy'
            : cfg.megapixels > 30
            ? '1/4 Proxy'
            : '1:1 Full Master',
      }));
    }
  };

  // Update Unlimited Custom Resolution dimensions
  const handleCustomDimensionChange = (axis: 'width' | 'height', value: number) => {
    const clamped = Math.max(64, Math.min(65536, Math.round(value || 1920)));
    setProjectSpec((prev) => {
      const ratio = prev.width / Math.max(1, prev.height);
      const nextWidth =
        axis === 'width'
          ? clamped
          : aspectRatioLocked
          ? Math.max(64, Math.round(clamped * ratio))
          : prev.width;
      const nextHeight =
        axis === 'height'
          ? clamped
          : aspectRatioLocked
          ? Math.max(64, Math.round(clamped / ratio))
          : prev.height;
      return {
        ...prev,
        resolutionPreset: 'Custom',
        width: nextWidth,
        height: nextHeight,
      };
    });
  };

  // Trigger status feedback
  const notifyAction = (title: string, detail: string) => {
    setIsProcessingAi(true);
    setAiStatusMessage(`${title}: ${detail}`);
    setTimeout(() => {
      setIsProcessingAi(false);
      setAiStatusMessage(`${title} — ${detail}`);
      setTimeout(() => setAiStatusMessage(''), 4000);
    }, 450);
  };

  // Execute active NLE timeline tool on clip click or nudge button
  const handleClipInteraction = (trackId: string, clip: TimelineClip) => {
    setSelectedClipId(clip.id);

    if (activeTool === 'blade') {
      // Split clip at playhead if inside clip, otherwise split at clip midpoint
      const clipEnd = clip.startTicks + clip.durationTicks;
      const splitPoint =
        currentTicks > clip.startTicks && currentTicks < clipEnd
          ? currentTicks
          : clip.startTicks + clip.durationTicks / 2n;

      const splitResult = splitClipAtTicks64(clip, splitPoint);
      if (splitResult) {
        const [leftClip, rightClip] = splitResult;
        setTracks((prev) =>
          prev.map((t) => {
            if (t.id !== trackId || t.isLocked) return t;
            const nextClips = t.clips.flatMap((c) =>
              c.id === clip.id ? [leftClip, rightClip] : [c]
            );
            return {
              ...t,
              clips: projectSpec.enableMagneticTimeline
                ? applyMagneticSnap64(nextClips)
                : nextClips,
            };
          })
        );
        setSelectedClipId(rightClip.id);
        notifyAction(
          'Blade Split (64-Bit)',
          `Split "${clip.name}" at ${ticksToTimecode64(splitPoint, projectSpec.frameRate)}`
        );
      }
      return;
    }

    if (clip.isCompoundClip && clip.nestedClips && clip.nestedClips.length > 0) {
      setNestedCompoundClip(clip);
    }
  };

  // Nudge active NLE trim operation (+10 frames or -10 frames, or +/- 0.5s)
  const handleTrimNudge = (direction: 1 | -1) => {
    const deltaTicks = BigInt(direction) * (TICKS_PER_SECOND_64 / 2n); // +/- 0.5s
    setTracks((prev) =>
      prev.map((track) => {
        if (track.isLocked) return track;
        const hasClip = track.clips.some((c) => c.id === selectedClipId);
        if (!hasClip) return track;

        let updatedClips = [...track.clips];
        if (activeTool === 'ripple' || activeTool === 'select') {
          updatedClips = rippleTrimClip64(updatedClips, selectedClipId, deltaTicks);
        } else if (activeTool === 'rolling') {
          updatedClips = rollingEditClips64(updatedClips, selectedClipId, deltaTicks);
        } else if (activeTool === 'slip') {
          updatedClips = updatedClips.map((c) =>
            c.id === selectedClipId ? slipClipSource64(c, deltaTicks) : c
          );
        } else if (activeTool === 'slide') {
          updatedClips = updatedClips.map((c) =>
            c.id === selectedClipId ? slideClipPosition64(c, deltaTicks, durationTicks) : c
          );
        }

        if (projectSpec.enableMagneticTimeline && activeTool !== 'slide') {
          updatedClips = applyMagneticSnap64(updatedClips);
        }
        return { ...track, clips: updatedClips };
      })
    );
  };

  // Create Compound Clip on track V1 or active track
  const handleCreateCompoundClip = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? createCompoundClip64(t, `${t.name.split('·')[0].trim()} Compound`) : t))
    );
    notifyAction('Compound Clip Created', `Packaged track ${trackId.toUpperCase()} into a nested 64-bit sequence`);
  };

  // Un-nest Compound Clip back into discrete clips
  const handleUnnestCompoundClip = (trackId: string, compoundClipId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const nextClips = t.clips.flatMap((c) =>
          c.id === compoundClipId && c.nestedClips ? c.nestedClips : [c]
        );
        return { ...t, clips: nextClips };
      })
    );
    setNestedCompoundClip(null);
    notifyAction('Compound Un-Nested', 'Restored nested clips to main timeline');
  };

  // Add unlimited video/audio/adjustment tracks
  const handleAddTrack = (type: TimelineTrack['type']) => {
    const count = tracks.filter((t) => t.type === type).length + 1;
    const prefix =
      type === 'audio' ? `A${count + 1}` : type === 'adjustment' ? `FX${count}` : `V${count + 2}`;
    const newId = `${prefix.toLowerCase()}-${Date.now()}`;
    const newTrack: TimelineTrack = {
      id: newId,
      name:
        type === 'audio'
          ? `${prefix} · 192 kHz Stem Track`
          : type === 'adjustment'
          ? `${prefix} · OCIO Grade Layer`
          : `${prefix} · 32K VFX Layer`,
      type,
      isMuted: false,
      isLocked: false,
      color:
        type === 'audio'
          ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-100'
          : type === 'adjustment'
          ? 'bg-indigo-500/25 border-indigo-500/50 text-indigo-100'
          : 'bg-cyan-500/25 border-cyan-500/50 text-cyan-100',
      clips: [
        {
          id: `clip-${newId}`,
          trackId: newId,
          name:
            type === 'audio'
              ? `${prefix} 32-bit Float Stem`
              : `${prefix} 32000×32000 Layer Plate`,
          startTicks: 0n,
          durationTicks: 8n * TICKS_PER_SECOND_64,
          sourceStartTicks: 0n,
          color:
            type === 'audio'
              ? 'bg-emerald-600/35 border-emerald-400 text-emerald-100'
              : 'bg-cyan-600/35 border-cyan-400 text-cyan-100',
          speedMultiplier: 1.0,
        },
      ],
    };

    setTracks((prev) => (type === 'audio' ? [...prev, newTrack] : [newTrack, ...prev]));
    if (type === 'audio') {
      setAudioStrips((prev) => [
        ...prev,
        {
          trackId: newId,
          name: newTrack.name,
          busId: 'bus-master-atmos',
          faderDb: 0.0,
          panX: 0.0,
          panY: 0.5,
          heightZ: 0.25,
          isMuted: false,
          isSolo: false,
          recordArmed: false,
          sideChainSendActive: false,
          vst3Chain: [
            {
              id: `vst-${Date.now()}`,
              name: 'Fairlight Channel EQ & Dynamics',
              vendor: 'Blackmagic Design',
              category: 'EQ',
              bypassed: false,
              wetMixPct: 100,
              latencySamples: 32,
            },
          ],
        },
      ]);
    }
  };

  // Handle real .cube 3D LUT file upload
  const handleCubeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const parsed = parseCubeLutFile(content, file.name);
      setCustomCubeLuts((prev) => [parsed, ...prev]);
      setActiveCustomCubeId(parsed.id);
      setColorGrade((prev) => ({ ...prev, activeLut: parsed.id }));
      notifyAction(
        '.cube 3D LUT Loaded',
        `${parsed.title} (${parsed.size}³ grid · ${parsed.sampleCount} RGB triplets parsed)`
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Generate & parse an in-app sample .cube 3D LUT or download it
  const handleLoadSampleCubeFile = () => {
    const content = generateSampleCubeLutContent('ACES_2.0_IMAX_TealOrange_33', 6, {
      r: 1.09,
      g: 1.01,
      b: 0.89,
    });
    const parsed = parseCubeLutFile(content, 'ACES_2.0_IMAX_TealOrange_33.cube');
    setCustomCubeLuts((prev) => [parsed, ...prev]);
    setActiveCustomCubeId(parsed.id);
    setColorGrade((prev) => ({ ...prev, activeLut: parsed.id }));
    notifyAction(
      'Generated & Parsed .cube LUT',
      `${parsed.title} (${parsed.size}³ lattice · ${parsed.sampleCount} triplets)`
    );
  };

  const handleDownloadCubeLut = () => {
    const content = generateSampleCubeLutContent(
      `CinemaVFX_${projectSpec.colorSpace.replace(/\s+/g, '_')}`,
      5,
      {
        r: Number((1 + colorGrade.gain.r / 100).toFixed(3)),
        g: Number((1 + colorGrade.gamma.g / 100).toFixed(3)),
        b: Number((1 + colorGrade.lift.b / 100).toFixed(3)),
      }
    );
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MasterGrade_${projectSpec.colorSpace.replace(/[^a-zA-Z0-9]/g, '_')}.cube`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle AI VFX tool state
  const handleToggleAiTool = (id: AiVfxFeatureId) => {
    setAiVfxTools((prev) =>
      prev.map((tool) => {
        if (tool.id !== id) return tool;
        const nextEnabled = !tool.enabled;
        notifyAction(
          tool.name,
          nextEnabled ? `Active on GPU Render Graph (${tool.modelArchitecture})` : 'Bypassed'
        );
        return { ...tool, enabled: nextEnabled };
      })
    );
  };

  // Add a new Fusion VFX node to the graph
  const handleAddFusionNode = (
    label: string,
    category: VfxNode['category']
  ) => {
    const newNode: VfxNode = {
      id: `node-${Date.now()}`,
      label,
      category,
      bypassed: false,
      computeTimeMs: 0.95,
      vramMb: 1024,
      x: 450,
      y: 140,
      inputs: ['RGBA 32f'],
      outputs: ['RGBA 32f'],
      parameters: [
        { key: 'mix', label: 'Blend Mix', value: 100, min: 0, max: 100, step: 1, unit: '%' },
        { key: 'precision', label: 'Shader Float Mode', value: '32-bit IEEE Float' },
      ],
    };
    setVfxNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    notifyAction('Fusion Node Added', `Inserted ${label} into active GPU Render Graph`);
  };

  // Queue & run a new distributed render job
  const handleQueueRenderJob = () => {
    const newJob: RenderQueueJob = {
      id: `job-${Date.now()}`,
      title: `${projectSpec.title} (${projectSpec.resolutionPreset})`,
      codec: projectSpec.codec,
      resolutionLabel: `${projectSpec.width}×${projectSpec.height}`,
      fps: projectSpec.frameRate,
      colorSpace: projectSpec.colorSpace,
      hdrStandard: projectSpec.hdrStandard,
      status: 'rendering',
      progressPct: 35,
      assignedNodes: projectSpec.renderFarmNodes,
      estimatedSizeGb: Number((computeMetrics.frameSizeGb * projectSpec.frameRate * 0.25).toFixed(1)),
    };
    setRenderQueue((prev) => [newJob, ...prev]);
    notifyAction(
      'Distributed Render Dispatched',
      `Encoding ${projectSpec.codec} across ${projectSpec.renderFarmNodes} GPU nodes`
    );
    setTimeout(() => {
      setRenderQueue((prev) =>
        prev.map((j) => (j.id === newJob.id ? { ...j, status: 'completed', progressPct: 100 } : j))
      );
    }, 1800);
  };

  // Determine active LUT filter (built-in or custom .cube)
  const builtInLut = CINEMA_LUT_PRESETS.find((l) => l.id === colorGrade.activeLut);
  const customLut = customCubeLuts.find((l) => l.id === activeCustomCubeId || l.id === colorGrade.activeLut);
  const activeLutFilterString = customLut?.cssFilterApproximation || builtInLut?.colorFilter;
  const combinedCanvasFilter = buildCombinedColorFilter(colorGrade, activeLutFilterString);

  const selectedVfxNode = vfxNodes.find((n) => n.id === selectedNodeId) || vfxNodes[0];
  const selectedAudioStrip =
    audioStrips.find((s) => s.trackId === selectedAudioTrackId) || audioStrips[0];
  const activeMulticamAngle =
    multicamAngles.find((a) => a.id === activeMulticamAngleId) || multicamAngles[0];
  const activeAiToolsCount = aiVfxTools.filter((t) => t.enabled).length;
  const timebaseBenchmarkRows = benchmarkTimebaseAccuracy64();

  return (
    <div className="space-y-4 text-slate-100">
      {/* Top Workstation Header & DaVinci-Style 5-Room Switcher */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Film className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Cinema &amp; VFX Workstation Master
            </h2>
            <span className="text-xs font-mono text-slate-400">
              · {projectSpec.width}×{projectSpec.height} · {projectSpec.frameRate} FPS · {projectSpec.colorDepth} · {projectSpec.audioSampleRate / 1000} kHz
            </span>
          </div>
          <p className="text-xs text-slate-400">
            64-bit precision timebase (120B ticks/sec) · ACES 2.0 &amp; OpenColorIO v2 color pipeline · Fusion VFX node compositor · Fairlight 192 kHz Dolby Atmos console
          </p>
        </div>

        {/* DaVinci-Style 5-Room Switcher */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setWorkspaceMode('edit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              workspaceMode === 'edit'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Edit &amp; Multicam</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('vfx')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              workspaceMode === 'vfx'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Fusion VFX ({activeAiToolsCount} AI)</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('color')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              workspaceMode === 'color'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Color &amp; OCIO</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('audio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              workspaceMode === 'audio'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Fairlight 192 kHz</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('deliver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              workspaceMode === 'deliver'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Deliver &amp; GPU Graph</span>
          </button>
        </div>
      </div>

      {/* Hardware Telemetry & Proxy Ribbon (Unboxed Tabular Metadata) */}
      <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums">
        <div className="flex flex-wrap items-center gap-2 text-slate-400">
          <span className="text-slate-200 font-semibold">{projectSpec.renderBackend}</span>
          <span aria-hidden="true">·</span>
          <span>
            Canvas: <strong className="text-cyan-300">{projectSpec.width}×{projectSpec.height}</strong> ({computeMetrics.megapixels} MP)
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Rate: <strong className="text-amber-300">{projectSpec.frameRate} FPS</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Raw Frame: <strong className="text-white">{computeMetrics.frameSizeGb} GB</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Stream: <strong className="text-purple-300">{computeMetrics.throughputGbps} Gbps</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            1024px Tiles: <strong className="text-emerald-300">{computeMetrics.tileCount1024}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            Active Proxy: <strong className="text-cyan-300">{proxyDims.width}×{proxyDims.height}</strong>
          </span>
          <select
            value={projectSpec.proxyQuality}
            onChange={(e) =>
              setProjectSpec({ ...projectSpec, proxyQuality: e.target.value as ProxyQuality })
            }
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-400"
          >
            <option value="1:1 Full Master">1:1 Full Master</option>
            <option value="1/2 Proxy">1/2 Proxy</option>
            <option value="1/4 Proxy">1/4 Proxy</option>
            <option value="1/8 Proxy">1/8 Proxy</option>
            <option value="1/16 Super Proxy">1/16 Super Proxy (32K Realtime)</option>
          </select>
        </div>
      </div>

      {/* Live Action / AI Feedback Banner */}
      {aiStatusMessage && (
        <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isProcessingAi ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{aiStatusMessage}</span>
          </div>
          <span className="text-slate-400">64-bit Tick: {currentTicks.toString()}</span>
        </div>
      )}

      {/* MAIN DUAL-PANE WORKSPACE (Monitor + Scopes on Left 7 Cols, Active Room Inspector on Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT 7 COLS: Program / Multicam Monitor + 5 Live HDR Scopes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            {/* Monitor Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-white font-semibold">{activeMulticamAngle.label}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">{projectSpec.colorSpace}</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300">{projectSpec.hdrStandard}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMulticamMode(false)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    !multicamMode
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Program View
                </button>
                <button
                  type="button"
                  onClick={() => setMulticamMode(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                    multicamMode
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>4-Up Multicam</span>
                </button>
              </div>
            </div>

            {/* Viewport Screen: Single Master View OR 4-Up Multicam Grid */}
            {!multicamMode ? (
              <div
                className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-800 flex items-center justify-center"
                style={{ filter: combinedCanvasFilter }}
              >
                {/* AI Virtual Stage Background Replacement Layer */}
                {aiVfxTools.find((t) => t.id === 'background_replacement')?.enabled && (
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/70 via-slate-950 to-purple-950/70 pointer-events-none" />
                )}

                {/* AI 3D Stabilization Horizon Grid Overlay */}
                {aiVfxTools.find((t) => t.id === 'ai_stabilization')?.enabled && (
                  <div className="absolute inset-4 border border-dashed border-emerald-400/40 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-px bg-emerald-400/30" />
                  </div>
                )}

                {/* AI Rotoscoping & Subject Masking Contour Overlay */}
                {(aiVfxTools.find((t) => t.id === 'ai_rotoscoping')?.enabled ||
                  aiVfxTools.find((t) => t.id === 'ai_masking')?.enabled) && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 400 225"
                  >
                    <path
                      d="M 140 50 C 175 30, 230 35, 255 65 C 280 95, 270 155, 235 175 C 195 195, 145 185, 125 150 C 105 115, 115 70, 140 50 Z"
                      fill={
                        aiVfxTools.find((t) => t.id === 'ai_masking')?.enabled
                          ? 'rgba(6, 182, 212, 0.14)'
                          : 'none'
                      }
                      stroke="#22d3ee"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <circle cx="140" cy="50" r="3" fill="#f59e0b" />
                    <circle cx="255" cy="65" r="3" fill="#f59e0b" />
                    <circle cx="235" cy="175" r="3" fill="#f59e0b" />
                    <circle cx="125" cy="150" r="3" fill="#f59e0b" />
                  </svg>
                )}

                {/* AI Object Removal Clean-Plate Region */}
                {aiVfxTools.find((t) => t.id === 'object_removal')?.enabled && (
                  <div className="absolute top-6 left-6 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-400/60 text-rose-200 text-[10px] font-mono">
                    Inpaint Region · Temporal Clean Plate Active
                  </div>
                )}

                {/* Center Telemetry Readout */}
                <div className="relative z-10 text-center px-6 space-y-1.5 pointer-events-none">
                  <div className="text-xs font-mono text-cyan-300">
                    {activeMulticamAngle.cameraModel} · {activeMulticamAngle.lens}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {projectSpec.width}×{projectSpec.height} · {projectSpec.frameRate} FPS Master
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    LUT: {customLut ? customLut.title : builtInLut?.name || 'Bypass'} · {activeAiToolsCount} AI Passes Active
                  </p>
                </div>

                {/* AI Subtitles Burn-In Bar */}
                {aiVfxTools.find((t) => t.id === 'ai_subtitles')?.enabled && (
                  <div className="absolute bottom-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-black/80 text-white text-xs font-mono border border-slate-700 whitespace-nowrap">
                    [SPEAKER 1 · 192 kHz]: &ldquo;64-bit frame sync locked at {projectSpec.frameRate} frames per second.&rdquo;
                  </div>
                )}

                {/* Real-time False Color Exposure Heatmap Overlay */}
                {scopes.falseColor && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700/55 via-emerald-500/40 to-amber-500/55 mix-blend-color pointer-events-none" />
                )}

                {/* Bottom Overlay Bar: Active Timecode */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono tabular-nums pointer-events-none">
                  <span className="px-2.5 py-1 rounded bg-black/75 border border-slate-800 text-slate-300">
                    Frame #{(currentTicks / BigInt(Math.round(Number(TICKS_PER_SECOND_64) / projectSpec.frameRate))).toString()}
                  </span>
                  <span className="px-3 py-1 rounded bg-black/80 border border-amber-500/40 text-amber-300 font-bold">
                    {ticksToTimecode64(currentTicks, projectSpec.frameRate)}
                  </span>
                </div>
              </div>
            ) : (
              /* 4-Up Multicam Sync Monitor */
              <div className="grid grid-cols-2 gap-2.5 aspect-video">
                {multicamAngles.map((angle) => {
                  const isSelected = angle.id === activeMulticamAngleId;
                  return (
                    <button
                      key={angle.id}
                      type="button"
                      onClick={() => {
                        setActiveMulticamAngleId(angle.id);
                        setTracks((prev) =>
                          prev.map((t) =>
                            t.id === 'v1'
                              ? {
                                  ...t,
                                  clips: t.clips.map((c) =>
                                    c.id === selectedClipId
                                      ? { ...c, multicamAngleId: angle.id, name: `${angle.label} (${angle.cameraModel})` }
                                      : c
                                  ),
                                }
                              : t
                          )
                        );
                      }}
                      className={`relative rounded-xl p-3 text-left bg-slate-900 border transition-all flex flex-col justify-between overflow-hidden ${
                        isSelected
                          ? 'border-amber-400 ring-1 ring-amber-400/50'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                      style={{ filter: combinedCanvasFilter }}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-white">{angle.label}</span>
                        <span className="text-amber-300">{angle.fps} FPS</span>
                      </div>
                      <div className="my-auto text-center">
                        <div className="text-xs font-semibold text-slate-200">{angle.cameraModel}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {angle.resolution} · {angle.lens}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>TC: {ticksToTimecode64(currentTicks, angle.fps)}</span>
                        <span className={isSelected ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                          {isSelected ? 'LIVE CUT' : 'Click to Cut'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Transport & 64-Bit Timecode Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentTicks(0n)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Jump to Start"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepFrame(-1)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors"
                >
                  -1F
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStepFrame(1)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors"
                >
                  +1F
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTicks(durationTicks)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Jump to End"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs tabular-nums">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white font-bold">
                  {ticksToTimecode64(currentTicks, projectSpec.frameRate)}
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">
                  {ticksToTimecode64(durationTicks, projectSpec.frameRate)}
                </span>
              </div>
            </div>
          </div>

          {/* 5 Real-Time Broadcast HDR Scopes Panel */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white">
                  Broadcast HDR Scopes (ACES 2.0 / BT.2100)
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                {(
                  [
                    ['waveform', 'Waveform'],
                    ['rgbParade', 'RGB Parade'],
                    ['vectorscope', 'Vectorscope'],
                    ['histogram', 'Histogram'],
                    ['falseColor', 'False Color'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setScopes((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap ${
                      scopes[key]
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 font-mono text-[11px] tabular-nums">
              {scopes.waveform && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Waveform (IRE)</span>
                    <span className="text-emerald-400">
                      {Math.round(850 * colorGrade.contrast)} Nits
                    </span>
                  </div>
                  <div className="h-24 rounded bg-black border border-slate-800 p-2 flex flex-col justify-between text-[9px] text-slate-500 relative overflow-hidden">
                    <div className="border-b border-red-500/30 text-red-400">100 IRE (1000 Nits)</div>
                    <div className="border-b border-amber-500/20 text-amber-400">70 IRE</div>
                    <div className="border-b border-emerald-500/20 text-emerald-400">50 IRE</div>
                    <div className="border-b border-cyan-500/20 text-cyan-400">0 IRE</div>
                    <div
                      className="absolute inset-x-2 bottom-2 bg-gradient-to-t from-emerald-500/20 via-emerald-400/45 to-cyan-300/75 rounded transition-all"
                      style={{
                        height: `${Math.min(92, Math.max(25, Math.round(58 * colorGrade.contrast + colorGrade.gain.luma * 0.3)))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {scopes.rgbParade && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>RGB Parade</span>
                    <span className="text-cyan-300">32-bit Float</span>
                  </div>
                  <div className="h-24 rounded bg-black border border-slate-800 p-2 grid grid-cols-3 gap-1.5 items-end">
                    <div
                      className="bg-gradient-to-t from-red-950 via-red-600/60 to-red-400 rounded-t transition-all"
                      style={{
                        height: `${Math.min(95, Math.max(20, 68 + colorGrade.gain.r + (colorGrade.temperature - 5600) / 180))}%`,
                      }}
                    />
                    <div
                      className="bg-gradient-to-t from-emerald-950 via-emerald-600/60 to-emerald-400 rounded-t transition-all"
                      style={{
                        height: `${Math.min(95, Math.max(20, 64 + colorGrade.gamma.g - colorGrade.tint * 0.25))}%`,
                      }}
                    />
                    <div
                      className="bg-gradient-to-t from-blue-950 via-blue-600/60 to-blue-400 rounded-t transition-all"
                      style={{
                        height: `${Math.min(95, Math.max(20, 72 + colorGrade.lift.b - (colorGrade.temperature - 5600) / 180))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {scopes.vectorscope && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Vectorscope</span>
                    <span className="text-amber-300">Sat: {colorGrade.saturation}%</span>
                  </div>
                  <div className="h-24 rounded bg-black border border-slate-800 flex items-center justify-center relative">
                    <div className="w-20 h-20 rounded-full border border-dashed border-slate-700 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border border-slate-800" />
                    </div>
                    <div className="absolute w-20 h-px bg-amber-400/40 -rotate-45" />
                    <div
                      className="absolute rounded-full bg-cyan-400/35 border border-cyan-300/60 transition-all"
                      style={{
                        width: `${Math.max(12, Math.min(48, Math.round((colorGrade.saturation / 100) * 26)))}px`,
                        height: `${Math.max(12, Math.min(48, Math.round((colorGrade.saturation / 100) * 26)))}px`,
                      }}
                    />
                  </div>
                </div>
              )}

              {scopes.histogram && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Log Histogram</span>
                    <span className="text-purple-300">Pivot {colorGrade.pivot}</span>
                  </div>
                  <div className="h-24 rounded bg-black border border-slate-800 p-2 flex items-end gap-1">
                    {[28, 45, 72, 88, 64, 52, 38, 22].map((bar, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-purple-500/60 rounded-t"
                        style={{ height: `${Math.min(95, Math.round(bar * (colorGrade.contrast * 0.9)))}%` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: Context-Sensitive Workstation Room Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {/* ROOM 1: EDIT & MASTER SPECIFICATIONS */}
          {workspaceMode === 'edit' && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white">
                    Ultra Resolution &amp; 64-Bit Frame Rate Engine
                  </h4>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  720p–32K + Custom
                </span>
              </div>

              {/* Resolution Presets */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Resolution Preset
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CINEMA_RESOLUTIONS.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleSelectResolution(res.id)}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        projectSpec.resolutionPreset === res.id
                          ? 'bg-slate-800 border-amber-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{res.id}</div>
                      <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                        {res.id === 'Custom'
                          ? `${projectSpec.width}×${projectSpec.height}`
                          : `${res.width}×${res.height}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Unlimited Custom Width x Height Controls */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Unlimited Custom Canvas Dimensions (px)
                  </span>
                  <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aspectRatioLocked}
                      onChange={(e) => setAspectRatioLocked(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900"
                    />
                    <span>Lock Aspect</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Width (64–65536)</span>
                    <input
                      type="number"
                      min={64}
                      max={65536}
                      value={projectSpec.width}
                      onChange={(e) => handleCustomDimensionChange('width', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Height (64–65536)</span>
                    <input
                      type="number"
                      min={64}
                      max={65536}
                      value={projectSpec.height}
                      onChange={(e) => handleCustomDimensionChange('height', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* All 19 High Frame Rate Engine Presets */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">
                    High Frame Rate Engine (19 Rates)
                  </span>
                  <span className="font-mono text-amber-300 tabular-nums">
                    {(TICKS_PER_SECOND_64 / BigInt(Math.round(projectSpec.frameRate))).toLocaleString()} ticks/frame
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {CINEMA_FRAME_RATES.map((fps) => (
                    <button
                      key={fps}
                      type="button"
                      onClick={() => setProjectSpec({ ...projectSpec, frameRate: fps })}
                      className={`px-2 py-1 rounded border text-[11px] font-mono font-semibold tabular-nums transition-colors ${
                        projectSpec.frameRate === fps
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {fps}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deep Color Pipeline & HDR */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Deep Color Precision</label>
                  <select
                    value={projectSpec.colorDepth}
                    onChange={(e) =>
                      setProjectSpec({ ...projectSpec, colorDepth: e.target.value as ColorBitDepth })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  >
                    {COLOR_BIT_DEPTHS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">HDR Transfer Standard</label>
                  <select
                    value={projectSpec.hdrStandard}
                    onChange={(e) =>
                      setProjectSpec({ ...projectSpec, hdrStandard: e.target.value as HdrStandard })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  >
                    {HDR_STANDARDS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ROOM 2: FUSION VFX NODE GRAPH & ALL 11 AI VFX FEATURES */}
          {workspaceMode === 'vfx' && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white">
                    Fusion VFX Node Graph &amp; 11 AI Neural Passes
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddFusionNode('AI Relight & Deep Z-Blur', 'ai_neural')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Node</span>
                </button>
              </div>

              {/* Interactive Fusion Node DAG */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Active Node Pipeline ({vfxNodes.length} Nodes · {vfxConnections.length} Pipes)</span>
                  <span className="text-cyan-300">32-bit Float Linear</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {vfxNodes.map((node) => {
                    const isSelected = node.id === selectedVfxNode.id;
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                          node.bypassed
                            ? 'bg-slate-950 border-slate-800 opacity-50'
                            : isSelected
                            ? 'bg-slate-900 border-cyan-400 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold truncate">{node.label}</span>
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setVfxNodes((prev) =>
                                prev.map((n) =>
                                  n.id === node.id ? { ...n, bypassed: !n.bypassed } : n
                                )
                              );
                            }}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                          >
                            {node.bypassed ? 'OFF' : 'ON'}
                          </button>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1 tabular-nums">
                          {node.computeTimeMs} ms · {node.vramMb} MB
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Node Parameter Inspector */}
                {selectedVfxNode && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-cyan-300 font-bold">{selectedVfxNode.label}</span>
                      <span className="text-slate-400">
                        In: {selectedVfxNode.inputs.join(', ') || 'Source'} → Out: {selectedVfxNode.outputs.join(', ') || 'Master'}
                      </span>
                    </div>
                    {selectedVfxNode.parameters.map((param) => (
                      <div key={param.key} className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                        <span>{param.label}:</span>
                        <span className="text-white font-semibold">
                          {String(param.value)} {param.unit || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All 11 AI VFX Tools Suite */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {aiVfxTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-white truncate">{tool.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          · {tool.gpuComputeMs} ms
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{tool.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={tool.intensity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAiVfxTools((prev) =>
                            prev.map((t) => (t.id === tool.id ? { ...t, intensity: val } : t))
                          );
                        }}
                        className="w-16 accent-cyan-400"
                        title={`Intensity: ${tool.intensity}%`}
                      />
                      <button
                        type="button"
                        onClick={() => handleToggleAiTool(tool.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                          tool.enabled
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {tool.enabled ? 'Active' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ROOM 3: COLOR & OCIO v2 + REAL .CUBE 3D LUT PARSER */}
          {workspaceMode === 'color' && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white">
                    ACES 2.0 / OpenColorIO v2 &amp; .cube 3D LUT Loader
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    ref={cubeFileInputRef}
                    type="file"
                    accept=".cube,.txt"
                    onChange={handleCubeFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => cubeFileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload .cube</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleCubeFile}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Parse Sample .cube
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCubeLut}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
                    title="Export current grade as .cube 3D LUT"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Color Space & HDR Pipeline */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">OCIO Working Color Space</label>
                  <select
                    value={projectSpec.colorSpace}
                    onChange={(e) =>
                      setProjectSpec({
                        ...projectSpec,
                        colorSpace: e.target.value as ColorSpaceStandard,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  >
                    {COLOR_SPACES.map((cs) => (
                      <option key={cs} value={cs}>
                        {cs}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">HDR Mastering Format</label>
                  <select
                    value={projectSpec.hdrStandard}
                    onChange={(e) =>
                      setProjectSpec({
                        ...projectSpec,
                        hdrStandard: e.target.value as HdrStandard,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  >
                    {HDR_STANDARDS.map((hdr) => (
                      <option key={hdr} value={hdr}>
                        {hdr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parsed Custom .cube LUT Inspector */}
              {customLut && (
                <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/40 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-purple-300 font-bold">
                    <span>Parsed .cube: {customLut.title}</span>
                    <span>{customLut.size}³ Lattice ({customLut.sampleCount} pts)</span>
                  </div>
                  <div className="text-slate-400">
                    Domain: [{customLut.domainMin.r}, {customLut.domainMin.g}, {customLut.domainMin.b}] → [{customLut.domainMax.r}, {customLut.domainMax.g}, {customLut.domainMax.b}] · Avg RGB ({customLut.averageTint.r}, {customLut.averageTint.g}, {customLut.averageTint.b})
                  </div>
                </div>
              )}

              {/* Built-In Film Emulation LUTs */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  3D LUT Film Look Library
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {CINEMA_LUT_PRESETS.map((lut) => (
                    <button
                      key={lut.id}
                      type="button"
                      onClick={() => {
                        setActiveCustomCubeId(null);
                        setColorGrade({ ...colorGrade, activeLut: lut.id });
                      }}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                        colorGrade.activeLut === lut.id && !activeCustomCubeId
                          ? 'bg-slate-800 border-purple-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-semibold truncate">{lut.name}</span>
                      <span className="text-[10px] font-mono text-purple-300 shrink-0 ml-2">
                        {lut.targetSpace}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive 4-Way Primary Wheels (Lift, Gamma, Gain, Offset) + Contrast/Sat/Temp */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs font-mono tabular-nums">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Lift (Shadows)</span>
                      <span className="text-white">{colorGrade.lift.luma}</span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={colorGrade.lift.luma}
                      onChange={(e) =>
                        setColorGrade({
                          ...colorGrade,
                          lift: { ...colorGrade.lift, luma: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Gamma (Midtones)</span>
                      <span className="text-white">{colorGrade.gamma.luma}</span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={colorGrade.gamma.luma}
                      onChange={(e) =>
                        setColorGrade({
                          ...colorGrade,
                          gamma: { ...colorGrade.gamma, luma: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Gain (Highlights)</span>
                      <span className="text-white">{colorGrade.gain.luma}</span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={colorGrade.gain.luma}
                      onChange={(e) =>
                        setColorGrade({
                          ...colorGrade,
                          gain: { ...colorGrade.gain, luma: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-purple-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Offset (Global)</span>
                      <span className="text-white">{colorGrade.offset.luma}</span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={colorGrade.offset.luma}
                      onChange={(e) =>
                        setColorGrade({
                          ...colorGrade,
                          offset: { ...colorGrade.offset, luma: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Contrast</span>
                      <span className="text-white">{colorGrade.contrast}</span>
                    </div>
                    <input
                      type="range"
                      min={0.6}
                      max={1.8}
                      step={0.05}
                      value={colorGrade.contrast}
                      onChange={(e) =>
                        setColorGrade({ ...colorGrade, contrast: Number(e.target.value) })
                      }
                      className="w-full accent-purple-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Sat</span>
                      <span className="text-white">{colorGrade.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      value={colorGrade.saturation}
                      onChange={(e) =>
                        setColorGrade({ ...colorGrade, saturation: Number(e.target.value) })
                      }
                      className="w-full accent-purple-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Temp</span>
                      <span className="text-white">{colorGrade.temperature}K</span>
                    </div>
                    <input
                      type="range"
                      min={2800}
                      max={9000}
                      step={100}
                      value={colorGrade.temperature}
                      onChange={(e) =>
                        setColorGrade({ ...colorGrade, temperature: Number(e.target.value) })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ROOM 4: FAIRLIGHT 192 kHz / 64-BIT AUDIO CONSOLE */}
          {workspaceMode === 'audio' && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">
                    Fairlight 192 kHz / 64-Bit Mixing Console
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTrack('audio')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Audio Track</span>
                </button>
              </div>

              {/* Sample Rate, Bit Depth & Channel Layout */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Sample Rate</label>
                  <select
                    value={projectSpec.audioSampleRate}
                    onChange={(e) =>
                      setProjectSpec({
                        ...projectSpec,
                        audioSampleRate: Number(e.target.value) as AudioSampleRate,
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  >
                    {AUDIO_SAMPLE_RATES.map((sr) => (
                      <option key={sr} value={sr}>
                        {sr / 1000} kHz
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Audio Precision</label>
                  <select
                    value={projectSpec.audioBitDepth}
                    onChange={(e) =>
                      setProjectSpec({
                        ...projectSpec,
                        audioBitDepth: e.target.value as AudioBitDepth,
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  >
                    {AUDIO_BIT_DEPTHS.map((bd) => (
                      <option key={bd} value={bd}>
                        {bd}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Spatial Bus</label>
                  <select
                    value={projectSpec.audioLayout}
                    onChange={(e) =>
                      setProjectSpec({
                        ...projectSpec,
                        audioLayout: e.target.value as AudioChannelLayout,
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  >
                    {AUDIO_CHANNEL_LAYOUTS.map((layout) => (
                      <option key={layout} value={layout}>
                        {layout}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Channel Strips & Faders */}
              <div className="space-y-2">
                {audioStrips.map((strip) => (
                  <div
                    key={strip.trackId}
                    onClick={() => setSelectedAudioTrackId(strip.trackId)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      selectedAudioStrip?.trackId === strip.trackId
                        ? 'bg-slate-950 border-emerald-400'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-white truncate">{strip.name}</span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setAudioStrips((prev) =>
                              prev.map((s) =>
                                s.trackId === strip.trackId
                                  ? { ...s, sideChainSendActive: !s.sideChainSendActive }
                                  : s
                              )
                            );
                          }}
                          className={`px-1.5 py-0.5 rounded border ${
                            strip.sideChainSendActive
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'border-slate-800 text-slate-500'
                          }`}
                        >
                          SC Key
                        </button>
                        <span className="text-emerald-300 tabular-nums">{strip.faderDb.toFixed(1)} dB</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={-48}
                      max={12}
                      step={0.5}
                      value={strip.faderDb}
                      onChange={(e) => {
                        const nextDb = Number(e.target.value);
                        setAudioStrips((prev) =>
                          prev.map((s) =>
                            s.trackId === strip.trackId ? { ...s, faderDb: nextDb } : s
                          )
                        );
                      }}
                      className="w-full accent-emerald-400"
                    />
                  </div>
                ))}
              </div>

              {/* VST3 Plugin Rack & 3D Spatial Atmos Panner for Selected Track */}
              {selectedAudioStrip && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-emerald-300 font-bold">
                      VST3 Rack &amp; 3D Atmos Panner · {selectedAudioStrip.name.split('·')[0]}
                    </span>
                    <span className="text-slate-400">64-bit Summing</span>
                  </div>

                  {/* VST3 Plugins */}
                  <div className="space-y-1.5">
                    {selectedAudioStrip.vst3Chain.map((vst) => (
                      <div
                        key={vst.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-white">{vst.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {vst.vendor} · {vst.category} · {vst.latencySamples} spls
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setAudioStrips((prev) =>
                              prev.map((s) =>
                                s.trackId === selectedAudioStrip.trackId
                                  ? {
                                      ...s,
                                      vst3Chain: s.vst3Chain.map((p) =>
                                        p.id === vst.id ? { ...p, bypassed: !p.bypassed } : p
                                      ),
                                    }
                                  : s
                              )
                            )
                          }
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            !vst.bypassed
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {vst.bypassed ? 'Bypassed' : 'Active'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* 3D Dolby Atmos / Ambisonics Spatial Panner Controls */}
                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] tabular-nums pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-slate-400 block">Pan L/R: {selectedAudioStrip.panX}</span>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={selectedAudioStrip.panX}
                        onChange={(e) =>
                          setAudioStrips((prev) =>
                            prev.map((s) =>
                              s.trackId === selectedAudioStrip.trackId
                                ? { ...s, panX: Number(e.target.value) }
                                : s
                            )
                          )
                        }
                        className="w-full accent-emerald-400"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block">Front/Rear: {selectedAudioStrip.panY}</span>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={selectedAudioStrip.panY}
                        onChange={(e) =>
                          setAudioStrips((prev) =>
                            prev.map((s) =>
                              s.trackId === selectedAudioStrip.trackId
                                ? { ...s, panY: Number(e.target.value) }
                                : s
                            )
                          )
                        }
                        className="w-full accent-emerald-400"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block">Atmos Z: {Math.round(selectedAudioStrip.heightZ * 100)}%</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={selectedAudioStrip.heightZ}
                        onChange={(e) =>
                          setAudioStrips((prev) =>
                            prev.map((s) =>
                              s.trackId === selectedAudioStrip.trackId
                                ? { ...s, heightZ: Number(e.target.value) }
                                : s
                            )
                          )
                        }
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Buses & Side-Chain Summary */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-[11px] tabular-nums">
                {audioBuses.map((bus) => (
                  <div key={bus.id} className="flex items-center justify-between text-slate-300">
                    <span className="truncate">{bus.name}</span>
                    <span className="text-emerald-400 shrink-0">
                      {bus.lufsIntegrated} LUFS {bus.sideChainReductionDb < 0 ? `· SC ${bus.sideChainReductionDb} dB` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ROOM 5: DELIVER, GPU RENDER GRAPH, TILE CACHE & 64-BIT BENCHMARK */}
          {workspaceMode === 'deliver' && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white">
                    GPU Render Graph, Tile Cache &amp; 13-Codec Farm
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTimebaseBenchmark(!showTimebaseBenchmark)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 text-xs font-mono font-semibold"
                >
                  {showTimebaseBenchmark ? 'Hide 64-Bit Benchmark' : '64-Bit Benchmark'}
                </button>
              </div>

              {/* Backend & Codec Selectors */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">GPU Render Graph API</label>
                  <select
                    value={projectSpec.renderBackend}
                    onChange={(e) =>
                      setProjectSpec({
                        ...projectSpec,
                        renderBackend: e.target.value as RenderEngineBackend,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  >
                    {RENDER_BACKENDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Master Export Codec (13)</label>
                  <select
                    value={projectSpec.codec}
                    onChange={(e) =>
                      setProjectSpec({ ...projectSpec, codec: e.target.value as ProCodec })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  >
                    {PRO_CODECS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 64-Bit Timebase Frame-Accurate Benchmark Inspector */}
              {showTimebaseBenchmark ? (
                <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-300 font-bold">
                      64-Bit Timebase Benchmark (120,000,000,000 Ticks/Sec)
                    </span>
                    <span className="text-emerald-400">Zero Drift Verified</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto font-mono text-[10px] tabular-nums space-y-1">
                    {timebaseBenchmarkRows.map((row) => (
                      <div
                        key={row.fps}
                        className="flex items-center justify-between py-1 border-b border-slate-900 text-slate-300"
                      >
                        <span className="font-bold text-white">{row.fps} FPS</span>
                        <span>{row.ticksPerFrame.toLocaleString()} ticks/f</span>
                        <span className="text-cyan-300">F1000: {row.sampleTimecodeAtFrame1000}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Interactive 1024x1024 Tile Rendering & Multi-GPU Cache Visualizer */
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">
                      1024×1024 GPU Tile Cache Grid ({perfConfig.multiGpuCount}x Local GPUs)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setRenderTiles((prev) =>
                          prev.map((t) => ({ ...t, state: 'vram_resident' }))
                        )
                      }
                      className="text-cyan-400 hover:underline"
                    >
                      Cache All Tiles
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {renderTiles.map((tile) => (
                      <button
                        key={tile.id}
                        type="button"
                        onClick={() =>
                          setRenderTiles((prev) =>
                            prev.map((t) =>
                              t.id === tile.id
                                ? {
                                    ...t,
                                    state:
                                      t.state === 'vram_resident'
                                        ? 'compute_active'
                                        : 'vram_resident',
                                  }
                                : t
                            )
                          )
                        }
                        className={`h-7 rounded border text-[9px] font-mono tabular-nums flex items-center justify-center transition-colors ${
                          tile.state === 'vram_resident'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : tile.state === 'compute_active'
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                            : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        }`}
                        title={`Tile (${tile.row},${tile.col}) · GPU #${tile.gpuIndex} · ${tile.renderTimeMs}ms`}
                      >
                        G{tile.gpuIndex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Foundation Toggles & GPU Render Graph Controls */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                {(
                  [
                    ['multiThreadedEngine', 'Multi-Threaded Engine'],
                    ['simdOptimization', 'SIMD Vector Accel'],
                    ['gpuMemoryStreaming', 'GPU VRAM Streaming'],
                    ['incrementalRendering', 'Incremental Render'],
                    ['backgroundDecoding', 'Background Decode'],
                    ['zeroCopyGpuPipeline', 'Zero-Copy GPU DMA'],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-slate-300 truncate">{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(perfConfig[key])}
                      onChange={(e) =>
                        setPerfConfig({ ...perfConfig, [key]: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-900"
                    />
                  </label>
                ))}
                <label className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300 truncate">HW Compute Shaders</span>
                  <input
                    type="checkbox"
                    checked={perfConfig.hardwareEncodingDecoding}
                    onChange={(e) =>
                      setPerfConfig({ ...perfConfig, hardwareEncodingDecoding: e.target.checked })
                    }
                    className="rounded border-slate-700 bg-slate-900"
                  />
                </label>
                <label className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300 truncate">Background Conform</span>
                  <input
                    type="checkbox"
                    checked={perfConfig.backgroundConformActive}
                    onChange={(e) =>
                      setPerfConfig({ ...perfConfig, backgroundConformActive: e.target.checked })
                    }
                    className="rounded border-slate-700 bg-slate-900"
                  />
                </label>
              </div>

              {/* Proxy Mode, Dynamic RAM Cache, Multi-GPU & Render Farm Node Controls */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs font-mono">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Proxy Mode</span>
                    <select
                      value={projectSpec.proxyQuality}
                      onChange={(e) =>
                        setProjectSpec({
                          ...projectSpec,
                          proxyQuality: e.target.value as ProxyQuality,
                        })
                      }
                      className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-800 text-white text-[11px]"
                    >
                      {(
                        [
                          '1:1 Full Master',
                          '1/2 Proxy',
                          '1/4 Proxy',
                          '1/8 Proxy',
                          '1/16 Super Proxy',
                        ] as const
                      ).map((pq) => (
                        <option key={pq} value={pq}>
                          {pq}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Multi-GPU</span>
                    <select
                      value={perfConfig.multiGpuCount}
                      onChange={(e) => {
                        const count = Number(e.target.value);
                        setPerfConfig({ ...perfConfig, multiGpuCount: count });
                        setRenderTiles(generateRenderTileGrid(4, 6, 1024, count));
                      }}
                      className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-[11px]"
                    >
                      {[1, 2, 4, 8].map((g) => (
                        <option key={g} value={g}>
                          {g}x Local GPUs
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Render Farm</span>
                    <select
                      value={projectSpec.renderFarmNodes}
                      onChange={(e) =>
                        setProjectSpec({
                          ...projectSpec,
                          renderFarmNodes: Number(e.target.value),
                        })
                      }
                      className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-800 text-amber-300 text-[11px]"
                    >
                      {[1, 4, 8, 16, 32, 64].map((n) => (
                        <option key={n} value={n}>
                          {n} Cluster Nodes
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Dynamic RAM Cache Pool</span>
                    <span className="text-emerald-400 font-bold">{perfConfig.dynamicRamCacheGb} GB RAM</span>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={512}
                    step={16}
                    value={perfConfig.dynamicRamCacheGb}
                    onChange={(e) =>
                      setPerfConfig({ ...perfConfig, dynamicRamCacheGb: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-400"
                  />
                </div>
              </div>

              {/* Dispatch Render Button + NLE XML / EDL Interchange Export */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleQueueRenderJob}
                  className="sm:col-span-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Server className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    Dispatch {projectSpec.codec} ({projectSpec.renderFarmNodes} Nodes)
                  </span>
                </button>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      exportNleTimelineXml(projectSpec.title, projectSpec.frameRate, projectSpec.width, projectSpec.height);
                      notifyAction('NLE XML Exported', 'Downloaded Final Cut / Premiere XML v5');
                    }}
                    className="py-2 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold text-[11px]"
                    title="Export NLE XML (.xml)"
                  >
                    XML
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportCmx3600Edl(projectSpec.title);
                      notifyAction('CMX 3600 EDL Exported', 'Downloaded Broadcast EDL');
                    }}
                    className="py-2 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold text-[11px]"
                    title="Export CMX 3600 EDL (.edl)"
                  >
                    EDL
                  </button>
                </div>
              </div>


              <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-[11px] tabular-nums">
                {renderQueue.map((job) => (
                  <div
                    key={job.id}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <div className="text-white font-semibold truncate">{job.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {job.codec} · {job.resolutionLabel} @ {job.fps} FPS
                      </div>
                    </div>
                    <span
                      className={`shrink-0 font-bold ${
                        job.status === 'completed' ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {job.progressPct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: 64-BIT MULTI-TRACK NLE TIMELINE (Premiere + Final Cut Magnetic + Compound Clips) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        {/* Timeline Tool Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['select', 'Select (V)'],
                ['blade', 'Blade Split (C)'],
                ['ripple', 'Ripple Edit (B)'],
                ['rolling', 'Rolling Edit (N)'],
                ['slip', 'Slip (Y)'],
                ['slide', 'Slide (U)'],
              ] as const
            ).map(([toolId, label]) => (
              <button
                key={toolId}
                type="button"
                onClick={() => setActiveTool(toolId)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTool === toolId
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}

            {/* Nudge Trim Buttons for active tool */}
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-800">
              <button
                type="button"
                onClick={() => handleTrimNudge(-1)}
                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
                title="Apply active trim tool -0.5s"
              >
                Trim -0.5s
              </button>
              <button
                type="button"
                onClick={() => handleTrimNudge(1)}
                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
                title="Apply active trim tool +0.5s"
              >
                Trim +0.5s
              </button>
              <button
                type="button"
                onClick={() => handleCreateCompoundClip('v1')}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Compound V1</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddTrack('video')}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Track</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={projectSpec.enableMagneticTimeline}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setProjectSpec({ ...projectSpec, enableMagneticTimeline: enabled });
                  if (enabled) {
                    setTracks((prev) =>
                      prev.map((t) => ({ ...t, clips: applyMagneticSnap64(t.clips) }))
                    );
                  }
                }}
                className="rounded border-slate-700 bg-slate-900"
              />
              <span>Magnetic Timeline</span>
            </label>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              120,000,000,000 Ticks/s
            </span>
          </div>
        </div>

        {/* Nested Compound Clip Breadcrumb Bar (if inside a compound clip) */}
        {nestedCompoundClip && (
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-300">
              <span>Master Timeline</span>
              <span>/</span>
              <span className="font-bold text-white">{nestedCompoundClip.name}</span>
              <span className="text-slate-400">
                ({nestedCompoundClip.nestedClips?.length || 0} nested clips)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleUnnestCompoundClip(nestedCompoundClip.trackId, nestedCompoundClip.id)
                }
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 hover:text-white"
              >
                Un-Nest to Main Timeline
              </button>
              <button
                type="button"
                onClick={() => setNestedCompoundClip(null)}
                className="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-bold flex items-center gap-1"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
                <span>Back to Master</span>
              </button>
            </div>
          </div>
        )}

        {/* Timecode Ruler & Interactive Scrubbing */}
        <div className="space-y-2 overflow-x-auto">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = Math.max(0, e.clientX - rect.left - 176);
              const laneWidth = Math.max(1, rect.width - 176);
              const pct = Math.max(0, Math.min(1, clickX / laneWidth));
              setCurrentTicks(BigInt(Math.round(pct * Number(durationTicks))));
            }}
            className="flex items-center text-[10px] font-mono tabular-nums text-slate-400 pl-44 pr-4 h-6 border-b border-slate-800 cursor-pointer select-none"
            title="Click ruler to scrub 64-bit playhead"
          >
            <div className="w-1/4">00:00:00:000</div>
            <div className="w-1/4">00:00:02:500</div>
            <div className="w-1/4">00:00:05:000</div>
            <div className="w-1/4 text-right">00:00:10:000</div>
          </div>

          {/* Multi-Track Lanes */}
          {tracks.map((track) => (
            <div key={track.id} className="flex items-center gap-2">
              {/* Track Header */}
              <div className="w-42 shrink-0 p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 truncate">{track.name}</span>
                <div className="flex items-center gap-1 text-slate-500 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setTracks((prev) =>
                        prev.map((t) => (t.id === track.id ? { ...t, isMuted: !t.isMuted } : t))
                      )
                    }
                    className={`p-1 rounded hover:text-white ${track.isMuted ? 'text-red-400' : ''}`}
                    title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
                  >
                    {track.isMuted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTracks((prev) =>
                        prev.map((t) => (t.id === track.id ? { ...t, isLocked: !t.isLocked } : t))
                      )
                    }
                    className={`p-1 rounded hover:text-white ${track.isLocked ? 'text-amber-400' : ''}`}
                    title={track.isLocked ? 'Unlock Track' : 'Lock Track'}
                  >
                    {track.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Track Clip Lane */}
              <div className="flex-1 h-11 rounded-lg bg-slate-950 border border-slate-800 p-1 relative flex items-center overflow-hidden">
                {track.clips.map((clip) => {
                  const startPct = (Number(clip.startTicks) / Number(durationTicks)) * 100;
                  const widthPct = (Number(clip.durationTicks) / Number(durationTicks)) * 100;
                  const isSelected = clip.id === selectedClipId;

                  return (
                    <div
                      key={clip.id}
                      onClick={() => handleClipInteraction(track.id, clip)}
                      className={`absolute h-9 rounded border px-2.5 py-1 text-xs font-semibold flex items-center justify-between truncate cursor-pointer transition-all ${
                        clip.color
                      } ${isSelected ? 'ring-1 ring-amber-400' : ''}`}
                      style={{
                        left: `${startPct}%`,
                        width: `${Math.max(4, widthPct)}%`,
                      }}
                      title={`${clip.name} · In: ${ticksToTimecode64(clip.startTicks, projectSpec.frameRate)} · Dur: ${ticksToTimecode64(clip.durationTicks, projectSpec.frameRate)}`}
                    >
                      <span className="truncate">{clip.name}</span>
                      <span className="text-[10px] font-mono tabular-nums opacity-85 shrink-0 ml-1">
                        {ticksToTimecode64(clip.durationTicks, projectSpec.frameRate)}
                      </span>
                    </div>
                  );
                })}

                {/* 64-Bit Playhead Indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
                  style={{
                    left: `${(Number(currentTicks) / Number(durationTicks)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
