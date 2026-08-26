"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Open A5 spread: 296 × 210 mm — stage always uses this so cover/back match spread scale */
const SPREAD_RATIO = 296 / 210;
const FLIP_MS = 780;
const MIN_ZOOM = 1;
const MAX_ZOOM = 7;
const ZOOM_STEP = 1.35;
/** Swap to HD assets once zoomed past this */
const HD_ZOOM_THRESHOLD = 1.18;
/** Keep book clear of clipped edges + right zoom rail */
const FIT_PAD_X = 56;
const FIT_PAD_Y = 16;

export type PublicationPage = {
  id: string;
  /** Fast preview for fit view */
  src?: string;
  /** High-res art loaded when zooming in */
  srcHd?: string;
};

/** Cover (libretto) … interior … back (libretto20) */
export const DEFAULT_PUBLICATION_PAGES: PublicationPage[] = Array.from(
  { length: 20 },
  (_, i) => {
    const n = i + 1;
    const file = n === 1 ? "libretto.webp" : `libretto${n}.webp`;
    return {
      id: n === 1 ? "cover" : n === 20 ? "back" : String(n).padStart(2, "0"),
      src: `/images/libretto/preview/${file}`,
      srcHd: `/images/libretto/hd/${file}`,
    };
  }
);

function sheetCount(pageCount: number) {
  if (pageCount <= 1) return 1;
  if (pageCount === 2) return 2;
  return 1 + Math.ceil((pageCount - 2) / 2) + 1;
}

type SheetView =
  | { mode: "single"; page: PublicationPage; kind: "cover" | "back" }
  | { mode: "spread"; left?: PublicationPage; right?: PublicationPage };

function sheetView(pages: PublicationPage[], sheet: number): SheetView {
  const last = sheetCount(pages.length) - 1;
  if (sheet <= 0) {
    return { mode: "single", page: pages[0], kind: "cover" };
  }
  if (sheet >= last) {
    return { mode: "single", page: pages[pages.length - 1], kind: "back" };
  }
  const i = (sheet - 1) * 2;
  return {
    mode: "spread",
    left: pages[1 + i],
    right: pages[2 + i],
  };
}

function halfPage(
  view: SheetView,
  side: "left" | "right"
): PublicationPage | undefined {
  if (view.mode === "spread") {
    return side === "left" ? view.left : view.right;
  }
  if (view.kind === "cover" && side === "right") return view.page;
  if (view.kind === "back" && side === "left") return view.page;
  return undefined;
}

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function PageFace({
  page,
  label,
  className = "",
  preferHd = false,
}: {
  page?: PublicationPage;
  label: string;
  className?: string;
  preferHd?: boolean;
}) {
  const preview = page?.src;
  const hd = page?.srcHd;
  const [hdReady, setHdReady] = useState(false);
  const [hdFailed, setHdFailed] = useState(false);

  useEffect(() => {
    setHdReady(false);
    setHdFailed(false);
  }, [hd]);

  useEffect(() => {
    if (!preferHd || !hd || hdFailed) return;
    let cancelled = false;
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => {
      if (!cancelled) setHdReady(true);
    };
    img.onerror = () => {
      if (!cancelled) setHdFailed(true);
    };
    img.src = hd;
    return () => {
      cancelled = true;
    };
  }, [preferHd, hd, hdFailed]);

  const showHd = preferHd && hdReady && !!hd && !hdFailed;

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-rice ${className}`}
      aria-label={label}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          draggable={false}
          className={`pointer-events-none absolute inset-0 h-full w-full select-none object-contain transition-opacity duration-200 ${
            showHd ? "opacity-0" : "opacity-100"
          }`}
        />
      ) : null}
      {preferHd && hd && !hdFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hd}
          alt=""
          draggable={false}
          className={`pointer-events-none absolute inset-0 h-full w-full select-none object-contain transition-opacity duration-200 ${
            showHd ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </div>
  );
}

type FlipState = {
  dir: "next" | "prev";
  from: number;
  to: number;
};

type PublicationBookletProps = {
  pages?: PublicationPage[];
};

export default function PublicationBooklet({
  pages = DEFAULT_PUBLICATION_PAGES,
}: PublicationBookletProps) {
  const { t } = useLocale();
  const reducedMotion = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
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
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);
  const tapTimerRef = useRef<number | null>(null);
  const [sheet, setSheet] = useState(0);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [flip, setFlip] = useState<FlipState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const totalSheets = sheetCount(pages.length);
  const view = sheetView(pages, sheet);
  const busy = !!flip;
  const canPrev = !busy && sheet > 0;
  const canNext = !busy && sheet < totalSheets - 1;
  const canZoomIn = zoom < MAX_ZOOM - 0.001;
  const canZoomOut = zoom > MIN_ZOOM + 0.001;
  /** Always open-spread size so cover/back don't shrink the stage */
  const layoutRatio = SPREAD_RATIO;

  const clampPan = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !box.width || !box.height) return;
    const viewW = viewport.clientWidth;
    const viewH = viewport.clientHeight;
    const z = zoomRef.current;
    const stageW = box.width * z;
    const stageH = box.height * z;
    const maxX = Math.max(0, (stageW - viewW) / 2 + 24);
    const maxY = Math.max(0, (stageH - viewH) / 2 + 24);
    panRef.current = {
      x: Math.min(maxX, Math.max(-maxX, panRef.current.x)),
      y: Math.min(maxY, Math.max(-maxY, panRef.current.y)),
    };
  }, [box.height, box.width]);

  const applyTransform = useCallback(() => {
    const book = bookRef.current;
    if (!book) return;
    clampPan();
    const { x, y } = panRef.current;
    book.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoomRef.current})`;
  }, [clampPan]);

  const clearTransformTransition = useCallback(() => {
    const book = bookRef.current;
    if (!book) return;
    book.style.transition = "";
  }, []);

  const fitView = useCallback(
    (animated = false) => {
      const book = bookRef.current;
      const alreadyFit =
        zoomRef.current <= MIN_ZOOM + 0.001 &&
        Math.abs(panRef.current.x) < 0.5 &&
        Math.abs(panRef.current.y) < 0.5;

      if (alreadyFit) {
        clearTransformTransition();
        zoomRef.current = 1;
        panRef.current = { x: 0, y: 0 };
        setZoom(1);
        applyTransform();
        return;
      }

      const useMotion = animated && !reducedMotion;
      if (book) {
        if (useMotion) {
          book.style.transition =
            "transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)";
        } else {
          book.style.transition = "";
        }
      }

      zoomRef.current = 1;
      panRef.current = { x: 0, y: 0 };
      setZoom(1);
      applyTransform();

      if (!useMotion || !book) return;

      const onEnd = (event: TransitionEvent) => {
        if (event.propertyName !== "transform") return;
        book.style.transition = "";
        book.removeEventListener("transitionend", onEnd);
      };
      book.addEventListener("transitionend", onEnd);
      window.setTimeout(() => {
        if (book.style.transition) book.style.transition = "";
      }, 600);
    },
    [applyTransform, clearTransformTransition, reducedMotion]
  );

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      clearTransformTransition();
      const viewport = viewportRef.current;
      const prev = zoomRef.current;
      const next = clampZoom(prev * factor);
      if (Math.abs(next - prev) < 0.001) return;
      if (viewport && clientX != null && clientY != null) {
        const rect = viewport.getBoundingClientRect();
        const cx = clientX - rect.left - rect.width / 2;
        const cy = clientY - rect.top - rect.height / 2;
        const k = next / prev;
        panRef.current = {
          x: cx - (cx - panRef.current.x) * k,
          y: cy - (cy - panRef.current.y) * k,
        };
      } else if (next <= MIN_ZOOM + 0.001) {
        panRef.current = { x: 0, y: 0 };
      }
      zoomRef.current = next;
      setZoom(next);
      applyTransform();
    },
    [applyTransform, clearTransformTransition]
  );

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const measure = () => {
      const width = Math.max(0, node.clientWidth - FIT_PAD_X);
      const height = Math.max(0, node.clientHeight - FIT_PAD_Y);
      if (!width || !height) return;
      let nextW = width;
      let nextH = nextW / layoutRatio;
      if (nextH > height) {
        nextH = height;
        nextW = nextH * layoutRatio;
      }
      setBox((prev) =>
        Math.abs(prev.width - nextW) < 0.5 && Math.abs(prev.height - nextH) < 0.5
          ? prev
          : { width: nextW, height: nextH }
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [layoutRatio]);

  useEffect(() => {
    applyTransform();
  }, [applyTransform, box.height, box.width]);

  const go = useCallback(
    (dir: "next" | "prev") => {
      if (busy) return;
      const to =
        dir === "next"
          ? Math.min(totalSheets - 1, sheet + 1)
          : Math.max(0, sheet - 1);
      if (to === sheet) return;

      fitView(false);

      if (reducedMotion) {
        setSheet(to);
        return;
      }

      setFlip({ dir, from: sheet, to });
    },
    [busy, fitView, reducedMotion, sheet, totalSheets]
  );

  useEffect(() => {
    if (!flip) return;
    const timer = window.setTimeout(() => {
      setSheet(flip.to);
      setFlip(null);
    }, FLIP_MS);
    return () => window.clearTimeout(timer);
  }, [flip]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      if (busy) return;
      event.preventDefault();
      const factor = event.deltaY > 0 ? 1 / 1.12 : 1.12;
      zoomAt(factor, event.clientX, event.clientY);
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [busy, zoomAt]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || busy) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      pinchRef.current = {
        distance: Math.hypot(dx, dy) || 1,
        zoom: zoomRef.current,
        panX: panRef.current.x,
        panY: panRef.current.y,
        midX: (pts[0].x + pts[1].x) / 2,
        midY: (pts[0].y + pts[1].y) / 2,
      };
      dragRef.current = null;
      setPanning(false);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
      moved: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    }

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const pts = [...pointersRef.current.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const distance = Math.hypot(dx, dy) || 1;
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const factor = distance / pinchRef.current.distance;
      const next = clampZoom(pinchRef.current.zoom * factor);
      const viewport = viewportRef.current;
      if (viewport) {
        const rect = viewport.getBoundingClientRect();
        const cx = midX - rect.left - rect.width / 2;
        const cy = midY - rect.top - rect.height / 2;
        const k = next / pinchRef.current.zoom;
        panRef.current = {
          x: cx - (cx - pinchRef.current.panX) * k,
          y: cy - (cy - pinchRef.current.panY) * k,
        };
      }
      zoomRef.current = next;
      setZoom(next);
      applyTransform();
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;

    if (zoomRef.current <= MIN_ZOOM + 0.001) return;

    clearTransformTransition();
    setPanning(true);
    panRef.current = {
      x: drag.panX + dx,
      y: drag.panY + dy,
    };
    applyTransform();
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      setPanning(false);
      return;
    }
    const wasTap = !drag.moved;
    const clientX = event.clientX;
    const bounds = event.currentTarget.getBoundingClientRect();
    dragRef.current = null;
    setPanning(false);

    if (!wasTap || busy) return;
    if (zoomRef.current > MIN_ZOOM + 0.02) return;

    if (tapTimerRef.current != null) {
      window.clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
    tapTimerRef.current = window.setTimeout(() => {
      tapTimerRef.current = null;
      const mid = bounds.left + bounds.width / 2;
      if (clientX < mid) go("prev");
      else go("next");
    }, 260);
  };

  const onDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (busy) return;
    event.preventDefault();
    if (tapTimerRef.current != null) {
      window.clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
    fitView(true);
  };

  useEffect(() => {
    return () => {
      if (tapTimerRef.current != null) window.clearTimeout(tapTimerRef.current);
    };
  }, []);

  const fromView = flip ? sheetView(pages, flip.from) : view;
  const toView = flip ? sheetView(pages, flip.to) : view;

  const staticLeft = flip
    ? flip.dir === "next"
      ? halfPage(fromView, "left")
      : halfPage(toView, "left")
    : halfPage(view, "left");
  const staticRight = flip
    ? flip.dir === "next"
      ? halfPage(toView, "right")
      : halfPage(fromView, "right")
    : halfPage(view, "right");

  const blankPage: PublicationPage = { id: "blank" };
  const leafFront = flip
    ? (flip.dir === "next"
        ? halfPage(fromView, "right")
        : halfPage(fromView, "left")) ?? blankPage
    : null;
  const leafBack = flip
    ? (flip.dir === "next"
        ? halfPage(toView, "left")
        : halfPage(toView, "right")) ?? blankPage
    : null;

  const displaySheet = flip?.to ?? sheet;
  const displayView = sheetView(pages, displaySheet);
  const sheetLabel =
    displayView.mode === "single"
      ? displayView.kind === "cover"
        ? t("about.bookCover")
        : t("about.bookBack")
      : (() => {
          const leftNum = (displaySheet - 1) * 2 + 1;
          return `${leftNum}-${leftNum + 1}`;
        })();

  const cursorClass =
    zoom > MIN_ZOOM + 0.001
      ? panning
        ? "cursor-grabbing"
        : "cursor-grab"
      : "cursor-default";
  const preferHd = zoom >= HD_ZOOM_THRESHOLD;

  useEffect(() => {
    if (!preferHd) return;
    const urls = [staticLeft?.srcHd, staticRight?.srcHd, leafFront?.srcHd, leafBack?.srcHd]
      .filter((url): url is string => Boolean(url));
    for (const url of urls) {
      const img = new window.Image();
      img.decoding = "async";
      img.src = url;
    }
  }, [preferHd, staticLeft?.srcHd, staticRight?.srcHd, leafFront?.srcHd, leafBack?.srcHd]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div
        ref={viewportRef}
        className={`publication-book-viewport relative flex min-h-0 flex-1 items-center justify-center overflow-hidden ${cursorClass}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={onDoubleClick}
      >
        <div
          ref={bookRef}
          role="region"
          aria-label={t("about.tabPublication")}
          aria-live="polite"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "PageUp") {
              event.preventDefault();
              go("prev");
            } else if (event.key === "ArrowRight" || event.key === "PageDown") {
              event.preventDefault();
              go("next");
            } else if (event.key === "+" || event.key === "=") {
              event.preventDefault();
              zoomAt(ZOOM_STEP);
            } else if (event.key === "-" || event.key === "_") {
              event.preventDefault();
              zoomAt(1 / ZOOM_STEP);
            } else if (event.key === "0") {
              event.preventDefault();
              fitView(true);
            } else if (event.key === "Home") {
              event.preventDefault();
              if (!busy) {
                fitView(false);
                setSheet(0);
              }
            } else if (event.key === "End") {
              event.preventDefault();
              if (!busy) {
                fitView(false);
                setSheet(totalSheets - 1);
              }
            }
          }}
          className={`publication-book relative touch-none outline-none focus-visible:ring-2 focus-visible:ring-cinnabar ${
            flip ? "publication-book--flipping" : ""
          }`}
          style={{
            width: box.width || undefined,
            height: box.height || undefined,
            transformOrigin: "center center",
            willChange: "transform",
          }}
        >
          <div className="publication-book-base">
            <div className="publication-book-half publication-book-half--left">
              {staticLeft ? (
                <PageFace
                  page={staticLeft}
                  label={
                    view.mode === "single" && view.kind === "back"
                      ? t("about.bookBack")
                      : t("about.bookLeftPage")
                  }
                  preferHd={preferHd}
                  className="rounded-l-[2px] border border-ink/12 border-r-ink/8 shadow-[0_10px_28px_rgb(33_51_56_/_10%)]"
                />
              ) : (
                <div className="h-full w-full bg-transparent" aria-hidden />
              )}
            </div>
            <div className="publication-book-half publication-book-half--right">
              {staticRight ? (
                <PageFace
                  page={staticRight}
                  label={
                    view.mode === "single" && view.kind === "cover"
                      ? t("about.bookCover")
                      : t("about.bookRightPage")
                  }
                  preferHd={preferHd}
                  className="rounded-r-[2px] border border-ink/12 border-l-ink/8 shadow-[0_10px_28px_rgb(33_51_56_/_10%)]"
                />
              ) : (
                <div className="h-full w-full bg-transparent" aria-hidden />
              )}
            </div>
            <div className="publication-book-spine" aria-hidden />
          </div>

          {flip && leafFront && leafBack ? (
            <div
              key={`${flip.from}-${flip.to}-${flip.dir}`}
              className={`publication-leaf ${
                flip.dir === "next"
                  ? "publication-leaf--turn-next"
                  : "publication-leaf--turn-prev"
              }`}
              aria-hidden
            >
              <div className="publication-leaf-face publication-leaf-face--front">
                <PageFace
                  page={leafFront}
                  label=""
                  preferHd={preferHd}
                  className="border border-ink/12 shadow-[0_14px_32px_rgb(33_51_56_/_18%)]"
                />
                <div className="publication-leaf-shade publication-leaf-shade--front" />
              </div>
              <div className="publication-leaf-face publication-leaf-face--back">
                <PageFace
                  page={leafBack}
                  label=""
                  preferHd={preferHd}
                  className="border border-ink/12 shadow-[0_14px_32px_rgb(33_51_56_/_18%)]"
                />
                <div className="publication-leaf-shade publication-leaf-shade--back" />
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="pointer-events-auto absolute right-1 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2 md:right-2"
          role="toolbar"
          aria-label={t("home.controls")}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="hud-badge type-ui flex h-10 w-10 items-center justify-center disabled:opacity-35"
            aria-label={t("map.zoomIn")}
            disabled={!canZoomIn || busy}
            onClick={() => zoomAt(ZOOM_STEP)}
          >
            +
          </button>
          <button
            type="button"
            className="hud-badge type-ui flex h-10 w-10 items-center justify-center disabled:opacity-35"
            aria-label={t("map.zoomOut")}
            disabled={!canZoomOut || busy}
            onClick={() => zoomAt(1 / ZOOM_STEP)}
          >
            −
          </button>
          <button
            type="button"
            className="hud-badge type-ui flex h-10 w-10 items-center justify-center disabled:opacity-35"
            aria-label={t("map.reset")}
            disabled={zoom <= MIN_ZOOM + 0.001 || busy}
            onClick={() => fitView(true)}
          >
            <svg
              width="16"
              height="16"
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
          </button>
        </div>
      </div>

      <div className="mt-2 flex shrink-0 items-center justify-center gap-3">
        <button
          type="button"
          className="hud-badge type-ui disabled:opacity-35"
          aria-label={t("about.bookPrev")}
          disabled={!canPrev}
          onClick={() => go("prev")}
        >
          {t("about.bookPrev")}
        </button>
        <p className="type-caption min-w-[5.5rem] text-center text-ink/55">
          {sheetLabel}
        </p>
        <button
          type="button"
          className="hud-badge type-ui disabled:opacity-35"
          aria-label={t("about.bookNext")}
          disabled={!canNext}
          onClick={() => go("next")}
        >
          {t("about.bookNext")}
        </button>
      </div>
      <p className="type-caption mt-1.5 shrink-0 text-center text-ink/45">
        {t("about.bookHint")}
      </p>
    </div>
  );
}
