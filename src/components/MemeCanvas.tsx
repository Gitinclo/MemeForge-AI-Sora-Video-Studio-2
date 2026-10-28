import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Sparkles, ArrowLeftRight, Grid, Layers } from 'lucide-react';
import {
  TextLayer,
  MemeSticker,
  CanvasFilter,
  MemeTransitionConfig,
  MemeTransitionType,
  SlideDirection,
} from '../types/meme';
import {
  DEFAULT_MEME_TRANSITION_CONFIG,
  MEME_TRANSITION_PRESETS,
  clampTransitionProgress,
  renderCanvasTransitionBackground,
} from '../utils/memeTransitionEngine';

interface MemeCanvasProps {
  imageSrc: string;
  textLayers: TextLayer[];
  stickers: MemeSticker[];
  filter: CanvasFilter;
  aspectRatio: string;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayerPosition: (id: string, x: number, y: number) => void;
  onUpdateStickerPosition?: (id: string, x: number, y: number) => void;
  canvasRefOut?: React.RefObject<HTMLCanvasElement | null>;
  isPlayingAudio?: boolean;
  activeAudioName?: string;
}

export const MemeCanvas: React.FC<MemeCanvasProps> = ({
  imageSrc,
  textLayers,
  stickers,
  filter,
  aspectRatio,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayerPosition,
  canvasRefOut,
  isPlayingAudio = false,
  activeAudioName,
}) => {
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = canvasRefOut || localCanvasRef;

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [prevImageObj, setPrevImageObj] = useState<HTMLImageElement | null>(null);
  const currentImageObjRef = useRef<HTMLImageElement | null>(null);

  // Transition Effect Library state
  const [transitionConfig, setTransitionConfig] = useState<MemeTransitionConfig>(
    DEFAULT_MEME_TRANSITION_CONFIG
  );
  const [transitionProgress, setTransitionProgress] = useState<number>(1);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  // Start a smooth requestAnimationFrame transition from 0 -> 1
  const startTransitionAnimation = useCallback(
    (durationMs: number, type: MemeTransitionType) => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      if (type === 'none' || durationMs <= 0) {
        setTransitionProgress(1);
        setIsTransitioning(false);
        return;
      }

      const startTime = performance.now();
      setIsTransitioning(true);
      setTransitionProgress(0);

      const step = (now: number) => {
        const elapsed = now - startTime;
        const rawProgress = clampTransitionProgress(elapsed / durationMs);
        setTransitionProgress(rawProgress);

        if (rawProgress < 1) {
          rafIdRef.current = requestAnimationFrame(step);
        } else {
          rafIdRef.current = null;
          setIsTransitioning(false);
        }
      };

      rafIdRef.current = requestAnimationFrame(step);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Load image when imageSrc changes and trigger transition from previous image
  useEffect(() => {
    if (!imageSrc) return;
    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (isCancelled) return;
      const previous = currentImageObjRef.current;
      if (previous && previous !== img) {
        setPrevImageObj(previous);
        currentImageObjRef.current = img;
        setImageObj(img);
        startTransitionAnimation(transitionConfig.durationMs, transitionConfig.type);
      } else {
        currentImageObjRef.current = img;
        setImageObj(img);
        setTransitionProgress(1);
      }
    };
    img.src = imageSrc;
    return () => {
      isCancelled = true;
    };
  }, [imageSrc, transitionConfig.durationMs, transitionConfig.type, startTransitionAnimation]);

  // Replay / preview the selected transition on demand
  const handleReplayTransition = (overrideType?: MemeTransitionType) => {
    const activeType = overrideType ?? transitionConfig.type;
    if (activeType === 'none') {
      setTransitionProgress(1);
      setIsTransitioning(false);
      return;
    }
    startTransitionAnimation(transitionConfig.durationMs, activeType);
  };

  const handleSelectTransitionType = (type: MemeTransitionType) => {
    setTransitionConfig((prev) => ({ ...prev, type }));
    if (type !== 'none') {
      handleReplayTransition(type);
    } else {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setTransitionProgress(1);
      setIsTransitioning(false);
    }
  };

  // Determine virtual canvas size based on aspect ratio
  const getCanvasDimensions = useCallback(() => {
    const baseWidth = 800;
    switch (aspectRatio) {
      case '16:9':
        return { width: 960, height: 540 };
      case '9:16':
        return { width: 540, height: 960 };
      case '4:3':
        return { width: 800, height: 600 };
      case '3:4':
        return { width: 600, height: 800 };
      case '1:1':
      default:
        return { width: baseWidth, height: baseWidth };
    }
  }, [aspectRatio]);

  // Word-wrap helper
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  // Render canvas (with option to exclude selection boundary box for pristine export)
  const drawMeme = useCallback(
    (includeSelectionOutline = true, forceCompletedTransition = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = getCanvasDimensions();
      canvas.width = width;
      canvas.height = height;

      // Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Image Background with filter & active transition effect
      ctx.save();
      if (filter === 'grayscale') {
        ctx.filter = 'grayscale(100%) contrast(110%)';
      } else if (filter === 'deep_fried') {
        ctx.filter = 'contrast(240%) saturate(300%) brightness(110%)';
      } else if (filter === 'vintage') {
        ctx.filter = 'sepia(50%) contrast(120%) brightness(95%)';
      } else if (filter === 'high_contrast') {
        ctx.filter = 'contrast(170%) brightness(105%)';
      } else if (filter === 'cyberpunk') {
        ctx.filter = 'hue-rotate(280deg) saturate(180%) contrast(130%)';
      } else if (filter === 'warm') {
        ctx.filter = 'sepia(25%) saturate(140%) brightness(105%)';
      } else {
        ctx.filter = 'none';
      }

      const effectiveProgress = forceCompletedTransition ? 1 : transitionProgress;

      renderCanvasTransitionBackground(ctx, {
        outgoingImage: prevImageObj,
        incomingImage: imageObj,
        canvasWidth: width,
        canvasHeight: height,
        progress: effectiveProgress,
        config: transitionConfig,
      });

      ctx.restore();

      // 2. Draw Stickers
      stickers.forEach((sticker) => {
        const posX = (sticker.x / 100) * width;
        const posY = (sticker.y / 100) * height;
        ctx.save();
        ctx.translate(posX, posY);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        const fontSize = 54 * (sticker.scale || 1);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.emoji, 0, 0);
        ctx.restore();
      });

      // 3. Draw Text Layers
      textLayers.forEach((layer) => {
        const textToRender = layer.isUppercase
          ? layer.text.toUpperCase()
          : layer.text;
        if (!textToRender.trim()) return;

        const posX = (layer.x / 100) * width;
        const posY = (layer.y / 100) * height;

        ctx.save();
        ctx.translate(posX, posY);
        if (layer.rotation) {
          ctx.rotate((layer.rotation * Math.PI) / 180);
        }

        const fontStyle = layer.isBold ? 'bold' : 'normal';
        ctx.font = `${fontStyle} ${layer.fontSize}px ${layer.fontFamily}, Impact, sans-serif`;
        ctx.textAlign = layer.textAlign;
        ctx.textBaseline = 'middle';

        const maxTextWidth = width * 0.92;
        const lines = wrapText(ctx, textToRender, maxTextWidth);
        const lineHeight = layer.fontSize * 1.18;
        const totalTextHeight = lines.length * lineHeight;
        const startY = -((lines.length - 1) * lineHeight) / 2;

        // Draw background highlight box if enabled
        if (layer.backgroundColor && layer.backgroundColor !== 'transparent') {
          const paddingX = layer.fontSize * 0.35;
          const paddingY = layer.fontSize * 0.2;
          let widestLine = 0;
          lines.forEach((l) => {
            const w = ctx.measureText(l).width;
            if (w > widestLine) widestLine = w;
          });

          let boxX = -widestLine / 2 - paddingX;
          if (layer.textAlign === 'left') boxX = -paddingX;
          if (layer.textAlign === 'right') boxX = -widestLine - paddingX;

          ctx.fillStyle = layer.backgroundColor;
          ctx.beginPath();
          ctx.roundRect(
            boxX,
            startY - lineHeight / 2 - paddingY,
            widestLine + paddingX * 2,
            totalTextHeight + paddingY * 2,
            8
          );
          ctx.fill();
        }

        // Draw each line with stroke + fill
        lines.forEach((line, idx) => {
          const lineY = startY + idx * lineHeight;

          if (layer.shadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
          } else {
            ctx.shadowColor = 'transparent';
          }

          if (layer.outlineWidth > 0 && layer.outlineColor !== 'transparent') {
            ctx.strokeStyle = layer.outlineColor;
            ctx.lineWidth = layer.outlineWidth * 2;
            ctx.lineJoin = 'miter';
            ctx.miterLimit = 2;
            ctx.strokeText(line, 0, lineY);
          }

          ctx.fillStyle = layer.textColor;
          ctx.fillText(line, 0, lineY);
        });

        // BUG FIX: Only draw dashed selection box during interactive editing, NOT during export/render
        if (includeSelectionOutline && layer.id === selectedLayerId) {
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);

          let maxW = 0;
          lines.forEach((l) => {
            const w = ctx.measureText(l).width;
            if (w > maxW) maxW = w;
          });
          const boxPad = 8;
          let selectX = -maxW / 2 - boxPad;
          if (layer.textAlign === 'left') selectX = -boxPad;
          if (layer.textAlign === 'right') selectX = -maxW - boxPad;

          ctx.strokeRect(
            selectX,
            startY - lineHeight / 2 - boxPad,
            maxW + boxPad * 2,
            totalTextHeight + boxPad * 2
          );
        }

        ctx.restore();
      });
    },
    [
      canvasRef,
      imageObj,
      prevImageObj,
      transitionProgress,
      transitionConfig,
      textLayers,
      stickers,
      filter,
      selectedLayerId,
      getCanvasDimensions,
    ]
  );

  useEffect(() => {
    drawMeme(true, false);
  }, [drawMeme]);

  // Expose clean export drawing function on the canvas element for pristine downloads
  useEffect(() => {
    const canvas = canvasRef.current as any;
    if (canvas) {
      canvas.drawCleanForExport = () => drawMeme(false, true);
      canvas.restoreInteractiveSelection = () => drawMeme(true, false);
    }
  }, [drawMeme, canvasRef]);

  // BUG FIX: Accurate hit testing & Window-attached pointer events for drag reliability
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    let hitId: string | null = null;
    let hitOffset = { x: 0, y: 0 };

    // Test in reverse order (topmost layer first)
    for (let i = textLayers.length - 1; i >= 0; i--) {
      const layer = textLayers[i];
      const posX = (layer.x / 100) * canvas.width;
      const posY = (layer.y / 100) * canvas.height;
      const heightReach = layer.fontSize * 1.5;
      const widthReach = canvas.width * 0.45;

      // Check alignment bounding box
      let minX = posX - widthReach;
      let maxX = posX + widthReach;
      if (layer.textAlign === 'left') {
        minX = posX - 20;
        maxX = posX + widthReach * 2;
      } else if (layer.textAlign === 'right') {
        minX = posX - widthReach * 2;
        maxX = posX + 20;
      }

      if (
        clickX >= minX &&
        clickX <= maxX &&
        Math.abs(clickY - posY) <= heightReach
      ) {
        hitId = layer.id;
        hitOffset = {
          x: clickX - posX,
          y: clickY - posY,
        };
        break;
      }
    }

    if (hitId) {
      onSelectLayer(hitId);

      // Window-level listeners prevent text jumping or losing drag when mouse moves fast
      const onMove = (moveEv: PointerEvent) => {
        if (!canvas) return;
        const currentRect = canvas.getBoundingClientRect();
        const curScaleX = canvas.width / currentRect.width;
        const curScaleY = canvas.height / currentRect.height;
        const curMouseX = (moveEv.clientX - currentRect.left) * curScaleX;
        const curMouseY = (moveEv.clientY - currentRect.top) * curScaleY;

        const newPixelX = curMouseX - hitOffset.x;
        const newPixelY = curMouseY - hitOffset.y;

        const newPercentX = Math.max(5, Math.min(95, (newPixelX / canvas.width) * 100));
        const newPercentY = Math.max(5, Math.min(95, (newPixelY / canvas.height) * 100));

        onUpdateLayerPosition(hitId!, Math.round(newPercentX), Math.round(newPercentY));
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    } else {
      onSelectLayer(null);
    }
  };

  return (
    <div
      className={`relative w-full flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-950/70 rounded-2xl border transition-all duration-300 shadow-2xl backdrop-blur-xl overflow-hidden group gap-3 ${
        isPlayingAudio
          ? 'border-amber-500/80 ring-4 ring-amber-500/20 shadow-amber-500/20'
          : 'border-slate-800/80'
      }`}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
          isPlayingAudio
            ? 'bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-indigo-500/20 opacity-100'
            : 'bg-gradient-to-tr from-amber-500/5 via-indigo-500/5 to-purple-500/10 opacity-60'
        }`}
      />

      {/* Template / Background Transition Effect Library Controls */}
      <div className="relative z-10 w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800/90 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Transition FX:</span>
          </span>

          {MEME_TRANSITION_PRESETS.map((preset) => {
            const isActive = transitionConfig.type === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectTransitionType(preset.id)}
                title={preset.description}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-sm shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                {preset.id === 'fade' && <Layers className="w-3 h-3" />}
                {preset.id === 'slide' && <ArrowLeftRight className="w-3 h-3" />}
                {preset.id === 'dissolve' && <Grid className="w-3 h-3" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Contextual Slide Direction Selector */}
          {transitionConfig.type === 'slide' && (
            <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold">Dir:</span>
              {(['left', 'right', 'up', 'down'] as SlideDirection[]).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => {
                    setTransitionConfig((prev) => ({ ...prev, slideDirection: dir }));
                    startTransitionAnimation(transitionConfig.durationMs, 'slide');
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                    transitionConfig.slideDirection === dir
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          )}

          {/* Contextual Dissolve Grid Size Selector */}
          {transitionConfig.type === 'dissolve' && (
            <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold">Grid:</span>
              {[12, 16, 24].map((grid) => (
                <button
                  key={grid}
                  type="button"
                  onClick={() => {
                    setTransitionConfig((prev) => ({ ...prev, dissolveGridSize: grid }));
                    startTransitionAnimation(transitionConfig.durationMs, 'dissolve');
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    transitionConfig.dissolveGridSize === grid
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {grid}×{grid}
                </button>
              ))}
            </div>
          )}

          {/* Duration selector */}
          <select
            aria-label="Transition Duration"
            value={transitionConfig.durationMs}
            onChange={(e) =>
              setTransitionConfig((prev) => ({
                ...prev,
                durationMs: Number(e.target.value),
              }))
            }
            className="bg-slate-950/90 text-slate-200 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-none focus:border-amber-500"
          >
            <option value={350}>350ms (Fast)</option>
            <option value={650}>650ms (Smooth)</option>
            <option value={1000}>1.0s (Cinematic)</option>
            <option value={1500}>1.5s (Slow)</option>
          </select>

          {/* Replay Transition Button */}
          <button
            type="button"
            disabled={transitionConfig.type === 'none'}
            onClick={() => handleReplayTransition()}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              transitionConfig.type === 'none'
                ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                : isTransitioning
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
            }`}
            title="Preview active transition effect on the canvas"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{isTransitioning ? 'Animating...' : 'Preview FX'}</span>
          </button>
        </div>
      </div>

      <div className="relative w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          className={`max-h-[550px] w-auto max-w-full rounded-xl shadow-2xl cursor-grab active:cursor-grabbing border border-slate-700/60 object-contain touch-none transition-transform duration-200 ${
            isPlayingAudio ? 'scale-[1.01] shadow-amber-500/30' : ''
          }`}
        />

        {/* Playing Audio Equalizer Overlay */}
        {isPlayingAudio && (
          <div className="absolute top-3 right-3 bg-slate-950/90 border border-amber-500/60 rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-2 backdrop-blur-md animate-bounce">
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-1 bg-amber-400 rounded-full animate-pulse h-full" />
              <span
                className="w-1 bg-amber-300 rounded-full animate-pulse h-2"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1 bg-amber-500 rounded-full animate-pulse h-3.5"
                style={{ animationDelay: '300ms' }}
              />
            </div>
            <span className="text-[11px] font-black text-amber-300 tracking-wide flex items-center gap-1">
              <span>Playing:</span>
              <span className="text-white truncate max-w-[120px]">
                {activeAudioName || 'Meme SFX'}
              </span>
            </span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 text-[11px] font-medium text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700/50 backdrop-blur-md pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Click &amp; drag text to reposition
        </div>
      </div>
    </div>
  );
};
