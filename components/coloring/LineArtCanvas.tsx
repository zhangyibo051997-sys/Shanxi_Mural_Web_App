"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { ColoringRegion } from "@/data/coloringRegions";
import { useUndoRedo } from "@/hooks/coloring/useUndoRedo";
import {
  fillRegionSolid,
  fillRegionTextured,
  hitTestRegion,
  samplePaintedRegions,
} from "@/utils/coloringPaint";
import { exportColoredArtwork } from "@/utils/coloringExport";
import type { RegionColorMap } from "@/utils/coloringScore";
import {
  paintSizePresets,
  stampPaint,
  type InteractionMode,
  type PaintSizeId,
  type PaintTool,
} from "@/utils/drawingTools";

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 3.2;
const CLICK_THRESHOLD = 8;

export type LineArtCanvasHandle = {
  exportComposite: () => Promise<HTMLCanvasElement>;
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  undo: () => void;
  redo: () => void;
  clearPaint: () => void;
  restoreFromRegionColors: (colors: RegionColorMap) => void;
};

type LineArtCanvasProps = {
  lineArtUrl: string;
  figureName: string;
  templeName: string;
  regions: ColoringRegion[];
  regionColors: RegionColorMap;
  selectedColor: string;
  interactive: boolean;
  mode?: InteractionMode;
  tool?: PaintTool;
  sizeId?: PaintSizeId;
  onFillRegion: (regionId: string) => void;
  onRegionColorsChange?: (colors: RegionColorMap) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
};

function pointerCenter(points: { x: number; y: number }[]) {
  return {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2,
  };
}

const LineArtCanvas = forwardRef<LineArtCanvasHandle, LineArtCanvasProps>(
  function LineArtCanvas(
    {
      lineArtUrl,
      figureName,
      templeName,
      regions,
      regionColors,
      selectedColor,
      interactive,
      mode = "paint",
      tool = "crayon",
      sizeId = "medium",
      onFillRegion,
      onRegionColorsChange,
      onHistoryChange,
    },
    ref
  ) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const paintRef = useRef<HTMLCanvasElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef(1);
    const panRef = useRef({ x: 0, y: 0 });
    const pointersRef = useRef(new Map<number, { x: number; y: number }>());
    const pinchRef = useRef<{
      distance: number;
      zoom: number;
      panX: number;
      panY: number;
      midX: number;
      midY: number;
    } | null>(null);
    const dragRef = useRef<{
      x: number;
      y: number;
      panX: number;
      panY: number;
    } | null>(null);
    const drawingRef = useRef(false);
    const pendingFillRef = useRef<{ x: number; y: number } | null>(null);
    const lastPtRef = useRef<{ x: number; y: number } | null>(null);
    const spaceDownRef = useRef(false);
    const pendingRestoreRef = useRef<RegionColorMap | null>(null);
    const modeRef = useRef(mode);
    const toolRef = useRef(tool);
    const sizeIdRef = useRef(sizeId);
    const colorRef = useRef(selectedColor);
    const interactiveRef = useRef(interactive);
    const [ratio, setRatio] = useState(0.72);

    modeRef.current = mode;
    toolRef.current = tool;
    sizeIdRef.current = sizeId;
    colorRef.current = selectedColor;
    interactiveRef.current = interactive;

    const { pushHistory, undo, redo, canUndo, canRedo } = useUndoRedo(paintRef);
    const brush = paintSizePresets[sizeId];

    const applyTransform = useCallback(() => {
      const stage = stageRef.current;
      if (!stage) return;
      const { x, y } = panRef.current;
      stage.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoomRef.current})`;
    }, []);

    const clampZoom = (value: number) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

    const zoomAt = useCallback(
      (factor: number, clientX?: number, clientY?: number) => {
        const viewport = viewportRef.current;
        const prev = zoomRef.current;
        const next = clampZoom(prev * factor);
        if (viewport && clientX != null && clientY != null) {
          const rect = viewport.getBoundingClientRect();
          const cx = clientX - rect.left - rect.width / 2;
          const cy = clientY - rect.top - rect.height / 2;
          const k = next / prev;
          panRef.current = {
            x: cx - (cx - panRef.current.x) * k,
            y: cy - (cy - panRef.current.y) * k,
          };
        }
        zoomRef.current = next;
        applyTransform();
      },
      [applyTransform]
    );

    const fitView = useCallback(() => {
      zoomRef.current = 1;
      panRef.current = { x: 0, y: 0 };
      applyTransform();
    }, [applyTransform]);

    const screenToArt = useCallback((clientX: number, clientY: number) => {
      const canvas = paintRef.current;
      if (!canvas || canvas.width === 0) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const x = ((clientX - rect.left) / rect.width) * canvas.width;
      const y = ((clientY - rect.top) / rect.height) * canvas.height;
      if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return null;
      return { x, y };
    }, []);

    const emitColors = useCallback(() => {
      const canvas = paintRef.current;
      if (!canvas || canvas.width === 0) return;
      onRegionColorsChange?.(samplePaintedRegions(canvas, regions));
    }, [onRegionColorsChange, regions]);

    const paintBetween = useCallback(
      (
        from: { x: number; y: number } | null,
        to: { x: number; y: number },
        pressure: number
      ) => {
        const ctx = paintRef.current?.getContext("2d");
        if (!ctx) return;
        const currentTool = toolRef.current;
        const currentBrush = paintSizePresets[sizeIdRef.current];
        const color = colorRef.current;
        if (!from) {
          stampPaint(ctx, to.x, to.y, currentTool, color, currentBrush, pressure);
          return;
        }
        const gap = currentTool === "spray" || currentTool === "airbrush" ? 4 : 3;
        const steps = Math.max(
          1,
          Math.hypot(to.x - from.x, to.y - from.y) / gap
        );
        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps;
          stampPaint(
            ctx,
            from.x + (to.x - from.x) * t,
            from.y + (to.y - from.y) * t,
            currentTool,
            color,
            currentBrush,
            pressure
          );
        }
      },
      []
    );

    const fillAtPoint = useCallback(
      (clientX: number, clientY: number) => {
        const art = screenToArt(clientX, clientY);
        const canvas = paintRef.current;
        const ctx = canvas?.getContext("2d");
        if (!art || !canvas || !ctx) return;
        const region = hitTestRegion(
          regions,
          art.x / canvas.width,
          art.y / canvas.height
        );
        if (!region) return;
        pushHistory();
        fillRegionTextured(
          ctx,
          region,
          colorRef.current,
          canvas.width,
          canvas.height,
          paintSizePresets[sizeIdRef.current]
        );
        onFillRegion(region.id);
        emitColors();
      },
      [emitColors, onFillRegion, pushHistory, regions, screenToArt]
    );

    const restoreFromRegionColors = useCallback(
      (colors: RegionColorMap) => {
        const canvas = paintRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx || canvas.width === 0) {
          pendingRestoreRef.current = colors;
          return;
        }
        pendingRestoreRef.current = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const region of [...regions].reverse()) {
          const color = colors[region.id];
          if (!color) continue;
          fillRegionSolid(ctx, region, color, canvas.width, canvas.height);
        }
      },
      [regions]
    );

    const clearPaint = useCallback(() => {
      const canvas = paintRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      pushHistory();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onRegionColorsChange?.({});
    }, [onRegionColorsChange, pushHistory]);

    useImperativeHandle(ref, () => ({
      exportComposite: async () => {
        const paint = paintRef.current;
        if (paint && paint.width > 0) {
          const line = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error("无法加载线稿"));
            image.src = lineArtUrl;
          });
          const canvas = document.createElement("canvas");
          canvas.width = paint.width;
          canvas.height = paint.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("无法创建画布");
          ctx.fillStyle = "#E2DDD3";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(paint, 0, 0);
          ctx.save();
          ctx.globalCompositeOperation = "multiply";
          ctx.drawImage(line, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          return canvas;
        }
        return exportColoredArtwork({
          lineArtUrl,
          regions,
          regionColors,
        });
      },
      zoomIn: () => zoomAt(1.15),
      zoomOut: () => zoomAt(1 / 1.15),
      fitView,
      undo: () => {
        undo();
        emitColors();
      },
      redo: () => {
        redo();
        emitColors();
      },
      clearPaint,
      restoreFromRegionColors,
    }));

    useEffect(() => {
      onHistoryChange?.({ canUndo, canRedo });
    }, [canUndo, canRedo, onHistoryChange]);

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.code === "Space") {
          spaceDownRef.current = true;
          if (event.target === document.body) event.preventDefault();
        }
      };
      const onKeyUp = (event: KeyboardEvent) => {
        if (event.code === "Space") spaceDownRef.current = false;
      };
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      };
    }, []);

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        zoomAt(event.deltaY > 0 ? 1 / 1.08 : 1.08, event.clientX, event.clientY);
      };

      const onPointerDown = (event: PointerEvent) => {
        pointersRef.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
        if (pointersRef.current.size === 2) {
          const pts = [...pointersRef.current.values()];
          const mid = pointerCenter(pts);
          pinchRef.current = {
            distance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
            zoom: zoomRef.current,
            panX: panRef.current.x,
            panY: panRef.current.y,
            midX: mid.x,
            midY: mid.y,
          };
          drawingRef.current = false;
          pendingFillRef.current = null;
          dragRef.current = null;
          return;
        }

        const panNow =
          event.button === 1 ||
          spaceDownRef.current ||
          modeRef.current === "pan";
        if (panNow) {
          event.preventDefault();
          dragRef.current = {
            x: event.clientX,
            y: event.clientY,
            panX: panRef.current.x,
            panY: panRef.current.y,
          };
          viewport.setPointerCapture(event.pointerId);
          return;
        }

        if (!interactiveRef.current || event.button !== 0) return;
        viewport.setPointerCapture(event.pointerId);
        lastPtRef.current = null;
        if (toolRef.current === "crayon") {
          pendingFillRef.current = { x: event.clientX, y: event.clientY };
          drawingRef.current = false;
          return;
        }
        pendingFillRef.current = null;
        drawingRef.current = true;
        pushHistory();
        const start = screenToArt(event.clientX, event.clientY);
        if (start) {
          paintBetween(null, start, event.pressure || 0.5);
          lastPtRef.current = start;
        }
      };

      const onPointerMove = (event: PointerEvent) => {
        if (cursorRef.current && interactiveRef.current) {
          const rect = viewport.getBoundingClientRect();
          const size = paintSizePresets[sizeIdRef.current].size;
          cursorRef.current.style.width = `${size}px`;
          cursorRef.current.style.height = `${size}px`;
          cursorRef.current.style.transform = `translate3d(${
            event.clientX - rect.left - size / 2
          }px, ${event.clientY - rect.top - size / 2}px, 0)`;
        }

        if (!pointersRef.current.has(event.pointerId)) return;
        pointersRef.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });

        if (pointersRef.current.size === 2 && pinchRef.current) {
          const pts = [...pointersRef.current.values()];
          const distance = Math.max(
            1,
            Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
          );
          const mid = pointerCenter(pts);
          zoomRef.current = clampZoom(
            pinchRef.current.zoom * (distance / pinchRef.current.distance)
          );
          panRef.current = {
            x: pinchRef.current.panX + (mid.x - pinchRef.current.midX),
            y: pinchRef.current.panY + (mid.y - pinchRef.current.midY),
          };
          applyTransform();
          return;
        }

        if (dragRef.current) {
          panRef.current = {
            x: dragRef.current.panX + event.clientX - dragRef.current.x,
            y: dragRef.current.panY + event.clientY - dragRef.current.y,
          };
          applyTransform();
          return;
        }

        if (!interactiveRef.current || modeRef.current === "pan") return;
        if (!pendingFillRef.current && !drawingRef.current) return;

        const origin = pendingFillRef.current;
        if (origin && !drawingRef.current) {
          const moved = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
          if (moved < CLICK_THRESHOLD && toolRef.current === "crayon") return;
          pushHistory();
          drawingRef.current = true;
          const start = screenToArt(origin.x, origin.y);
          if (start) {
            paintBetween(null, start, event.pressure || 0.5);
            lastPtRef.current = start;
          }
          pendingFillRef.current = null;
        }

        if (!drawingRef.current) return;
        const art = screenToArt(event.clientX, event.clientY);
        if (!art) return;
        paintBetween(lastPtRef.current, art, event.pressure || 0.5);
        lastPtRef.current = art;
      };

      const endPointer = (event: PointerEvent) => {
        const pending = pendingFillRef.current;
        const wasDrawing = drawingRef.current;
        pointersRef.current.delete(event.pointerId);
        if (pointersRef.current.size < 2) pinchRef.current = null;
        dragRef.current = null;
        pendingFillRef.current = null;
        drawingRef.current = false;
        lastPtRef.current = null;
        try {
          viewport.releasePointerCapture(event.pointerId);
        } catch {
          /* already released */
        }
        if (
          interactiveRef.current &&
          modeRef.current === "paint" &&
          pending &&
          toolRef.current === "crayon"
        ) {
          fillAtPoint(pending.x, pending.y);
          return;
        }
        if (wasDrawing) emitColors();
      };

      viewport.addEventListener("wheel", onWheel, { passive: false });
      viewport.addEventListener("pointerdown", onPointerDown);
      viewport.addEventListener("pointermove", onPointerMove);
      viewport.addEventListener("pointerup", endPointer);
      viewport.addEventListener("pointercancel", endPointer);
      return () => {
        viewport.removeEventListener("wheel", onWheel);
        viewport.removeEventListener("pointerdown", onPointerDown);
        viewport.removeEventListener("pointermove", onPointerMove);
        viewport.removeEventListener("pointerup", endPointer);
        viewport.removeEventListener("pointercancel", endPointer);
      };
    }, [
      applyTransform,
      emitColors,
      fillAtPoint,
      paintBetween,
      pushHistory,
      screenToArt,
      zoomAt,
    ]);

    const panning = mode === "pan";
    const cursorSize = brush.size;

    return (
      <div
        ref={viewportRef}
        data-lineart-canvas
        className={`relative h-full min-h-[280px] w-full touch-none select-none overflow-hidden bg-[#E9E2D4] ${
          !interactive
            ? ""
            : panning
              ? "cursor-grab active:cursor-grabbing"
              : "cursor-none"
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            ref={stageRef}
            className="relative origin-center will-change-transform"
            style={{
              width: "min(100%, 68vh)",
              aspectRatio: `${ratio}`,
            }}
          >
            <div className="coloring-paper absolute inset-0" aria-hidden="true" />
            <canvas
              ref={paintRef}
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lineArtUrl}
              alt={`${templeName}${figureName}线稿`}
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain mix-blend-multiply"
              onLoad={(event) => {
                const image = event.currentTarget;
                if (!image.naturalWidth || !image.naturalHeight) return;
                setRatio(image.naturalWidth / image.naturalHeight);
                const canvas = paintRef.current;
                if (!canvas) return;
                const keep = canvas.width > 0 ? canvas.toDataURL() : null;
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                if (pendingRestoreRef.current) {
                  restoreFromRegionColors(pendingRestoreRef.current);
                } else if (keep) {
                  const restored = new Image();
                  restored.onload = () => {
                    canvas.getContext("2d")?.drawImage(restored, 0, 0);
                  };
                  restored.src = keep;
                }
              }}
            />
          </div>
        </div>

        {interactive && !panning && (
          <div
            ref={cursorRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 hidden rounded-full border border-ink/40 md:block"
            style={{
              width: cursorSize,
              height: cursorSize,
              backgroundColor: `${selectedColor}33`,
            }}
          />
        )}
      </div>
    );
  }
);

export default LineArtCanvas;
