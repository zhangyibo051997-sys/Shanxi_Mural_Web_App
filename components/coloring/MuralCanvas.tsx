"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { coloringArtwork } from "@/data/coloringArtwork";
import { coloringRegions } from "@/data/coloringRegions";
import { useRegionMasks } from "@/hooks/coloring/useRegionMasks";
import { useUndoRedo } from "@/hooks/coloring/useUndoRedo";
import {
  clearRegion,
  crayonFillRegion,
  stampBrush,
  type BrushSettings,
  type DrawingTool,
} from "@/utils/drawingTools";
import { loadImage } from "@/utils/maskProcessing";
import { useLocale } from "@/components/i18n/LocaleProvider";

export interface MuralCanvasHandle {
  getPaintCanvas: () => HTMLCanvasElement | null;
  getLineCanvas: () => HTMLCanvasElement | null;
  getPaintDataUrl: () => string | null;
  restorePaintFromDataUrl: (url: string) => void;
  clearAll: () => void;
  undo: () => void;
  redo: () => void;
}

interface MuralCanvasProps {
  active: boolean;
  tool: DrawingTool;
  color: string;
  brush: BrushSettings;
  onColoredRegionsChange: (regions: Set<string>) => void;
  onCompletionChange: (pct: number) => void;
  onHoverRegion: (index: number | null) => void;
}

const MuralCanvas = forwardRef<MuralCanvasHandle, MuralCanvasProps>(
  function MuralCanvas(
    {
      active,
      tool,
      color,
      brush,
      onColoredRegionsChange,
      onCompletionChange,
      onHoverRegion,
    },
    ref
  ) {
    const { t } = useLocale();
    const containerRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const paperRef = useRef<HTMLCanvasElement>(null);
    const baseRef = useRef<HTMLCanvasElement>(null);
    const paintRef = useRef<HTMLCanvasElement>(null);
    const lineRef = useRef<HTMLCanvasElement>(null);
    const agingRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);

    const [artSize, setArtSize] = useState({ w: 0, h: 0 });
    const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
    const [loading, setLoading] = useState(true);
    const drawing = useRef(false);
    const lastPt = useRef<{ x: number; y: number } | null>(null);
    const coloredRegionsRef = useRef<Set<string>>(new Set());
    const rafRef = useRef<number | null>(null);
    const pendingPt = useRef<{ x: number; y: number; pressure: number } | null>(
      null
    );

    const { pushHistory, undo, redo } = useUndoRedo(paintRef);

    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [undo]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container || artSize.w === 0) return;

      const updateDisplaySize = () => {
        const pad = 16;
        const maxW = container.clientWidth - pad * 2;
        const maxH = container.clientHeight - pad * 2;
        const scale = Math.min(maxW / artSize.w, maxH / artSize.h, 1);
        setDisplaySize({
          w: Math.floor(artSize.w * scale),
          h: Math.floor(artSize.h * scale),
        });
      };

      updateDisplaySize();
      const ro = new ResizeObserver(updateDisplaySize);
      ro.observe(container);
      return () => ro.disconnect();
    }, [artSize]);

    const { loaded: masksLoaded, masksRef, hitTest } = useRegionMasks(
      artSize.w,
      artSize.h,
      artSize.w > 0
    );

    useEffect(() => {
      let cancelled = false;
      setLoading(true);
      loadImage(coloringArtwork.lineArtSrc).then((img) => {
        if (cancelled) return;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        setArtSize({ w, h });

        [paperRef, baseRef, paintRef, lineRef, agingRef, previewRef].forEach(
          (r) => {
            const c = r.current;
            if (!c) return;
            c.width = w;
            c.height = h;
          }
        );

        const paper = paperRef.current!.getContext("2d")!;
        paper.fillStyle = "#E2DDD3";
        paper.fillRect(0, 0, w, h);

        const base = baseRef.current!.getContext("2d")!;
        base.drawImage(img, 0, 0);

        const line = lineRef.current!.getContext("2d")!;
        line.drawImage(img, 0, 0);
        const lineData = line.getImageData(0, 0, w, h);
        for (let i = 0; i < lineData.data.length; i += 4) {
          const gray =
            lineData.data[i] * 0.299 +
            lineData.data[i + 1] * 0.587 +
            lineData.data[i + 2] * 0.114;
          const ink = gray < 200 ? 255 - gray * 0.85 : 0;
          lineData.data[i] = 38;
          lineData.data[i + 1] = 36;
          lineData.data[i + 2] = 31;
          lineData.data[i + 3] = ink;
        }
        line.putImageData(lineData, 0, 0);

        const aging = agingRef.current!.getContext("2d")!;
        aging.fillStyle = "rgba(154,148,136,0.04)";
        for (let i = 0; i < 400; i++) {
          aging.fillRect(
            Math.random() * w,
            Math.random() * h,
            1 + Math.random() * 2,
            1 + Math.random() * 2
          );
        }

        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, []);

    const screenToArt = useCallback(
      (clientX: number, clientY: number, pressure = 0.5) => {
        const vp = viewportRef.current;
        if (!vp || artSize.w === 0) return null;
        const rect = vp.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * artSize.w;
        const y = ((clientY - rect.top) / rect.height) * artSize.h;
        if (x < 0 || y < 0 || x > artSize.w || y > artSize.h) return null;
        return { x, y, pressure };
      },
      [artSize]
    );

    const updateProgress = useCallback(() => {
      const paint = paintRef.current;
      const masks = masksRef.current;
      if (!paint || masks.length === 0) return;

      const ctx = paint.getContext("2d")!;
      const data = ctx.getImageData(0, 0, artSize.w, artSize.h).data;
      const colored = new Set<string>();
      let covered = 0;
      let total = 0;

      masks.forEach((mask, i) => {
        let area = 0;
        let painted = 0;
        for (let p = 0; p < mask.length; p++) {
          if (!mask[p]) continue;
          area++;
          if (data[p * 4 + 3] > 20) painted++;
        }
        total++;
        if (area > 0 && painted > area * 0.08) {
          colored.add(coloringRegions[i].id);
          covered++;
        }
      });

      coloredRegionsRef.current = colored;
      onColoredRegionsChange(colored);
      onCompletionChange(Math.round((covered / total) * 100));
    }, [artSize, masksRef, onColoredRegionsChange, onCompletionChange]);

    const fillRegionAt = useCallback(
      (regionIndex: number) => {
        const ctx = paintRef.current?.getContext("2d");
        const mask = masksRef.current[regionIndex];
        if (!ctx || !mask) return;
        pushHistory();
        crayonFillRegion(ctx, mask, artSize.w, artSize.h, color, brush);
        updateProgress();
      },
      [artSize, brush, color, masksRef, pushHistory, updateProgress]
    );

    const clearRegionAt = useCallback(
      (regionIndex: number) => {
        const ctx = paintRef.current?.getContext("2d");
        const mask = masksRef.current[regionIndex];
        if (!ctx || !mask) return;
        pushHistory();
        clearRegion(ctx, mask, artSize.w, artSize.h);
        updateProgress();
      },
      [artSize, masksRef, pushHistory, updateProgress]
    );

    const drawFrame = useCallback(() => {
      rafRef.current = null;
      const pt = pendingPt.current;
      if (!pt || !paintRef.current) return;
      const ctx = paintRef.current.getContext("2d")!;

      if (lastPt.current) {
        const steps = Math.max(
          1,
          Math.hypot(pt.x - lastPt.current.x, pt.y - lastPt.current.y) / 3
        );
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = lastPt.current.x + (pt.x - lastPt.current.x) * t;
          const y = lastPt.current.y + (pt.y - lastPt.current.y) * t;
          stampBrush(ctx, x, y, tool, color, brush, pt.pressure);
        }
      } else {
        stampBrush(ctx, pt.x, pt.y, tool, color, brush, pt.pressure);
      }

      lastPt.current = { x: pt.x, y: pt.y };
      pendingPt.current = null;
    }, [brush, color, tool]);

    const scheduleDraw = useCallback(
      (pt: { x: number; y: number; pressure: number }) => {
        pendingPt.current = pt;
        if (rafRef.current == null) {
          rafRef.current = requestAnimationFrame(drawFrame);
        }
      },
      [drawFrame]
    );

    const showPreview = useCallback(
      (regionIndex: number | null) => {
        const c = previewRef.current;
        if (!c) return;
        const ctx = c.getContext("2d")!;
        ctx.clearRect(0, 0, artSize.w, artSize.h);
        if (regionIndex == null) return;
        const mask = masksRef.current[regionIndex];
        if (!mask) return;
        ctx.fillStyle = "rgba(62,98,100,0.14)";
        for (let p = 0; p < mask.length; p++) {
          if (!mask[p]) continue;
          const px = p % artSize.w;
          const py = (p / artSize.w) | 0;
          ctx.fillRect(px, py, 1, 1);
        }
      },
      [artSize, masksRef]
    );

    const handlePointerDown = (e: React.PointerEvent) => {
      if (!active || loading || e.button !== 0) return;

      const pt = screenToArt(e.clientX, e.clientY, e.pressure);
      if (!pt) return;

      const region = hitTest(pt.x, pt.y);

      if (tool === "crayon") {
        if (region != null) fillRegionAt(region);
        return;
      }

      if (tool === "eraser" && region != null) {
        clearRegionAt(region);
        return;
      }

      e.currentTarget.setPointerCapture(e.pointerId);
      drawing.current = true;
      lastPt.current = null;
      pushHistory();
      scheduleDraw(pt);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      const pt = screenToArt(e.clientX, e.clientY, e.pressure);
      if (!pt) return;

      if (tool === "crayon" || (tool === "eraser" && !drawing.current)) {
        const region = hitTest(pt.x, pt.y);
        onHoverRegion(region);
        showPreview(region);
        return;
      }

      if (!drawing.current) return;
      scheduleDraw(pt);
    };

    const endStroke = () => {
      if (drawing.current) {
        drawing.current = false;
        lastPt.current = null;
        updateProgress();
      }
    };

    useImperativeHandle(ref, () => ({
      getPaintCanvas: () => paintRef.current,
      getLineCanvas: () => lineRef.current,
      getPaintDataUrl: () => paintRef.current?.toDataURL("image/png") ?? null,
      restorePaintFromDataUrl: (url: string) => {
        const img = new Image();
        img.onload = () => {
          const ctx = paintRef.current?.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, artSize.w, artSize.h);
            ctx.drawImage(img, 0, 0);
            updateProgress();
          }
        };
        img.src = url;
      },
      clearAll: () => {
        pushHistory();
        paintRef.current
          ?.getContext("2d")
          ?.clearRect(0, 0, artSize.w, artSize.h);
        coloredRegionsRef.current = new Set();
        onColoredRegionsChange(new Set());
        onCompletionChange(0);
      },
      undo,
      redo,
    }));

    const cursor =
      tool === "crayon" || tool === "eraser" ? "pointer" : "crosshair";

    return (
      <div
        ref={containerRef}
        className="relative flex h-full w-full items-center justify-center overflow-hidden touch-none"
        style={{ touchAction: "none" }}
      >
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-parchment/80">
            <p className="font-sans text-sm text-stone">{t("color.loadingLine")}</p>
          </div>
        )}

        <div
          ref={viewportRef}
          className="relative shrink-0 shadow-sm"
          style={{
            width: displaySize.w || undefined,
            height: displaySize.h || undefined,
            cursor,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={() => {
            onHoverRegion(null);
            showPreview(null);
            endStroke();
          }}
        >
          <div
            className="relative h-full w-full"
            style={{
              width: displaySize.w || 400,
              height: displaySize.h || 600,
            }}
          >
            <canvas
              ref={paperRef}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            />
            <canvas
              ref={baseRef}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            />
            <canvas
              ref={paintRef}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            />
            <canvas
              ref={previewRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden
            />
            <canvas
              ref={lineRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden
            />
            <canvas
              ref={agingRef}
              className="pointer-events-none absolute inset-0 h-full w-full mix-blend-multiply"
              aria-hidden
            />
          </div>
        </div>

        {!loading && !masksLoaded && (
          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 font-sans text-[10px] text-stone/60">
            {t("color.loadingMask")}
          </p>
        )}
      </div>
    );
  }
);

export default MuralCanvas;
