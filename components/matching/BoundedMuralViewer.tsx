"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4.2;
const ZOOM_STEP = 1.22;

type BoundedMuralViewerProps = {
  src: string;
  alt: string;
  describedBy?: string;
  resetKey?: string;
  onFitSize?: (size: { naturalWidth: number; naturalHeight: number }) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ZoomButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(event) => event.stopPropagation()}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-rice text-[16px] leading-none text-ink/75 shadow-[0_8px_24px_rgb(33_51_56_/_12%)] transition-colors hover:border-ink/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function HomeIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.2 8.1 9 3.2l5.8 4.9V14.6c0 .6-.5 1.1-1.1 1.1H10.4v-4.2H7.6v4.2H4.3c-.6 0-1.1-.5-1.1-1.1V8.1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BoundedMuralViewer({
  src,
  alt,
  describedBy,
  resetKey,
  onFitSize,
}: BoundedMuralViewerProps) {
  const { t } = useLocale();
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const onFitSizeRef = useRef(onFitSize);
  onFitSizeRef.current = onFitSize;
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({ dw: 0, dh: 0, vw: 0, vh: 0 });
  const dragRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    distance: number;
    zoom: number;
    panX: number;
    panY: number;
    midX: number;
    midY: number;
  } | null>(null);

  const applyTransform = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const { x, y } = panRef.current;
    stage.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${zoomRef.current})`;
  }, []);

  const clampPan = useCallback(() => {
    const { dw, dh, vw, vh } = sizeRef.current;
    const zoom = zoomRef.current;
    const maxX = Math.max(0, (dw * zoom - vw) / 2);
    const maxY = Math.max(0, (dh * zoom - vh) / 2);
    panRef.current = {
      x: clamp(panRef.current.x, -maxX, maxX),
      y: clamp(panRef.current.y, -maxY, maxY),
    };
  }, []);

  const layoutImage = useCallback(() => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!viewport || !stage || !image || !image.naturalWidth) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const scale = Math.min(vw / image.naturalWidth, vh / image.naturalHeight);
    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;
    sizeRef.current = { dw, dh, vw, vh };
    stage.style.width = `${dw}px`;
    stage.style.height = `${dh}px`;
    clampPan();
    applyTransform();
  }, [applyTransform, clampPan]);

  const fitView = useCallback(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    layoutImage();
    setZoom(1);
  }, [layoutImage]);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, nextZoom: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const cx = clientX - rect.left - rect.width / 2;
      const cy = clientY - rect.top - rect.height / 2;
      const prev = zoomRef.current;
      const next = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const k = next / Math.max(prev, 0.001);
      panRef.current = {
        x: cx - (cx - panRef.current.x) * k,
        y: cy - (cy - panRef.current.y) * k,
      };
      zoomRef.current = next;
      clampPan();
      applyTransform();
      setZoom(next);
    },
    [applyTransform, clampPan]
  );

  const zoomFromCenter = useCallback(
    (factor: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      zoomAt(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        zoomRef.current * factor
      );
    },
    [zoomAt]
  );

  useEffect(() => {
    fitView();
  }, [fitView, resetKey, src]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!viewport) return;

    const resize = new ResizeObserver(() => layoutImage());
    resize.observe(viewport);

    const onLoad = () => layoutImage();
    image?.addEventListener("load", onLoad);
    const reportNatural = () => {
      if (!image?.naturalWidth) return;
      onFitSizeRef.current?.({
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      });
    };
    image?.addEventListener("load", reportNatural);
    if (image?.complete) {
      reportNatural();
      layoutImage();
    }

    return () => {
      resize.disconnect();
      image?.removeEventListener("load", onLoad);
      image?.removeEventListener("load", reportNatural);
    };
  }, [layoutImage, src]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const factor = event.deltaY > 0 ? 1 / 1.08 : 1.08;
      zoomAt(event.clientX, event.clientY, zoomRef.current * factor);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if ((event.target as Element | null)?.closest("[data-zoom-toolbar]")) {
        return;
      }
      event.stopPropagation();
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      viewport.setPointerCapture(event.pointerId);
      if (pointersRef.current.size === 2) {
        const pts = [...pointersRef.current.values()];
        pinchRef.current = {
          distance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
          zoom: zoomRef.current,
          panX: panRef.current.x,
          panY: panRef.current.y,
          midX: (pts[0].x + pts[1].x) / 2,
          midY: (pts[0].y + pts[1].y) / 2,
        };
        dragRef.current = null;
        return;
      }
      dragRef.current = {
        x: event.clientX,
        y: event.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
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
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        zoomRef.current = clamp(
          pinchRef.current.zoom * (distance / pinchRef.current.distance),
          MIN_ZOOM,
          MAX_ZOOM
        );
        panRef.current = {
          x: pinchRef.current.panX + (midX - pinchRef.current.midX),
          y: pinchRef.current.panY + (midY - pinchRef.current.midY),
        };
        clampPan();
        applyTransform();
        return;
      }

      if (!dragRef.current) return;
      panRef.current = {
        x: dragRef.current.panX + event.clientX - dragRef.current.x,
        y: dragRef.current.panY + event.clientY - dragRef.current.y,
      };
      clampPan();
      applyTransform();
    };

    const onPointerUp = (event: PointerEvent) => {
      pointersRef.current.delete(event.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;
      dragRef.current = null;
      clampPan();
      applyTransform();
      setZoom(zoomRef.current);
      try {
        viewport.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const step = 28;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        const rect = viewport.getBoundingClientRect();
        zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoomRef.current * 1.12);
        return;
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        const rect = viewport.getBoundingClientRect();
        zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoomRef.current / 1.12);
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        fitView();
        return;
      }
      const moves: Record<string, { x: number; y: number }> = {
        ArrowLeft: { x: step, y: 0 },
        ArrowRight: { x: -step, y: 0 },
        ArrowUp: { x: 0, y: step },
        ArrowDown: { x: 0, y: -step },
      };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      panRef.current = {
        x: panRef.current.x + move.x,
        y: panRef.current.y + move.y,
      };
      clampPan();
      applyTransform();
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    viewport.addEventListener("keydown", onKeyDown);
    return () => {
      for (const pointerId of pointersRef.current.keys()) {
        try {
          if (viewport.hasPointerCapture(pointerId)) {
            viewport.releasePointerCapture(pointerId);
          }
        } catch {
          /* ignore */
        }
      }
      pointersRef.current.clear();
      dragRef.current = null;
      pinchRef.current = null;
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
      viewport.removeEventListener("keydown", onKeyDown);
    };
  }, [applyTransform, clampPan, fitView, zoomAt]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#B8B0A4] [contain:paint]">
      <div
        ref={viewportRef}
        tabIndex={0}
        role="region"
        aria-label={t("detail.panZoom", { alt })}
        className="relative h-full w-full cursor-grab touch-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-cinnabar focus-visible:ring-inset active:cursor-grabbing [clip-path:inset(0)]"
      >
        <div
          ref={stageRef}
          className="absolute left-1/2 top-1/2 origin-center will-change-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            aria-describedby={describedBy}
            draggable={false}
            className="h-full w-full select-none object-fill"
          />
        </div>
      </div>
      <div
        data-zoom-toolbar
        className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5"
        role="toolbar"
        aria-label={t("home.controls")}
      >
        <ZoomButton
          label={t("map.zoomIn")}
          onClick={() => zoomFromCenter(ZOOM_STEP)}
          disabled={zoom >= MAX_ZOOM - 0.001}
        >
          +
        </ZoomButton>
        <ZoomButton
          label={t("map.zoomOut")}
          onClick={() => zoomFromCenter(1 / ZOOM_STEP)}
          disabled={zoom <= MIN_ZOOM + 0.001}
        >
          −
        </ZoomButton>
        <ZoomButton label={t("map.reset")} onClick={fitView}>
          <HomeIcon />
        </ZoomButton>
      </div>
    </div>
  );
}
