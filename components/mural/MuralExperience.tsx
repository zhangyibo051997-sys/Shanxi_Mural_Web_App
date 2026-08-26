"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import CoverIntro from "./CoverIntro";
import CoverElementField from "./CoverElementField";
import ConvergencePaths from "./ConvergencePaths";
import ElementSelection from "./ElementSelection";
import CanvasInstruction from "./CanvasInstruction";
import CanvasViewControls, { CANVAS_ZOOM_STEP } from "./CanvasViewControls";
import {
  coverPositionToCanvas,
  getCanvasPoint,
  getCanvasTilePeriod,
  getCanvasWidth,
  getCoverWidth,
  getViewportTier,
  getVisibleCoverElements,
  type CoverElement,
} from "@/data/coverElements";
import { loadCoverElements, reloadCoverElements } from "@/lib/coverSession";
import { elementCanvasLayout } from "@/data/canvasLayout";
import { computeContentZoomRange } from "@/lib/canvasZoom";
import { useDraggableCanvas } from "@/hooks/useDraggableCanvas";
import { useCoverTransition } from "@/hooks/useCoverTransition";
import { useElementSelection } from "@/hooks/useElementSelection";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ElementPose } from "@/hooks/useCoverTransition";
import {
  ABOUT_MORPH_OVERLAY_ID,
  beginAboutReturnExpand,
  clearAboutReturnExpand,
  createAboutMorphOverlay,
  getAboutCardTargetRect,
  isAboutReturnExpandActive,
  removeAboutMorphOverlay,
  shouldAboutReturnExpand,
  storeAboutButtonRect,
} from "@/lib/aboutMorph";
import { playJinMarkMorph } from "@/lib/jinMarkMorph";

export type ExperienceMode = "cover" | "home";

interface MuralExperienceProps {
  hidden: boolean;
  mode: ExperienceMode;
  coverGeneration?: number;
  onCoverComplete: () => void;
  onContinueFigure: (element: CoverElement, sourceRect: DOMRect) => void;
  onBackToCover?: () => void;
  detailOpen: boolean;
}

export default function MuralExperience({
  hidden,
  mode,
  coverGeneration = 0,
  onCoverComplete,
  onContinueFigure,
  onBackToCover,
  detailOpen,
}: MuralExperienceProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { t } = useLocale();
  const [transitioning, setTransitioning] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [layoutWidth, setLayoutWidth] = useState(1280);
  const [layoutHeight, setLayoutHeight] = useState(800);
  const [focusingId, setFocusingId] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [sessionElements, setSessionElements] = useState<CoverElement[] | null>(
    null
  );
  const chromeRef = useRef<HTMLDivElement>(null);
  const pathsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeMapRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const didPanRef = useRef(false);
  const openTimerRef = useRef<number | null>(null);
  const openingIdRef = useRef<string | null>(null);
  const focusingIdRef = useRef<string | null>(null);

  useEffect(() => {
    const update = () => {
      setLayoutWidth(window.innerWidth);
      setLayoutHeight(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPlaced(false);
    if (coverGeneration > 0) {
      setSessionElements(null);
    }
    const task =
      coverGeneration === 0 ? loadCoverElements() : reloadCoverElements();
    task.then((elements) => {
      if (!cancelled) setSessionElements(elements);
    });
    return () => {
      cancelled = true;
    };
  }, [coverGeneration]);

  const canvasConfig = useMemo(
    () => elementCanvasLayout[getViewportTier(layoutWidth)],
    [layoutWidth]
  );

  const visibleElements = useMemo(
    () =>
      sessionElements
        ? getVisibleCoverElements(layoutWidth, sessionElements)
        : [],
    [layoutWidth, sessionElements]
  );

  const zoomRange = useMemo(() => {
    const canvasSize = {
      width: canvasConfig.width,
      height: canvasConfig.height,
    };
    const rects = visibleElements.map((element) => {
      const point = getCanvasPoint(element, layoutWidth, canvasSize);
      const width = getCanvasWidth(element, layoutWidth);
      return {
        x: point.x,
        y: point.y,
        width,
        height: width / element.coverPosition.aspectRatio,
      };
    });
    const range = computeContentZoomRange(rects, {
      width: layoutWidth,
      height: layoutHeight,
    });
    const tile = getCanvasTilePeriod(layoutWidth, canvasSize);
    const coverZoom = Math.max(
      layoutWidth / (tile.x * 2.6),
      layoutHeight / (tile.y * 2.6)
    );
    return {
      minZoom: Math.max(range.minZoom, coverZoom),
      maxZoom: range.maxZoom,
    };
  }, [
    canvasConfig.height,
    canvasConfig.width,
    layoutHeight,
    layoutWidth,
    visibleElements,
  ]);

  const tilePeriod = useMemo(
    () =>
      getCanvasTilePeriod(layoutWidth, {
        width: canvasConfig.width,
        height: canvasConfig.height,
      }),
    [canvasConfig.height, canvasConfig.width, layoutWidth]
  );

  const wrapPeriod = useMemo(
    () =>
      mode === "home"
        ? {
            x: tilePeriod.x,
            y: tilePeriod.y,
            center: canvasConfig.center,
          }
        : null,
    [canvasConfig.center, mode, tilePeriod.x, tilePeriod.y]
  );

  const {
    position,
    zoom,
    isDragging,
    initialized,
    viewportSize,
    bind,
    layerRef,
    positionRef,
    zoomRef,
    applyWheelZoom,
    navigateTo,
    cancelPan,
    resetView,
    setZoomLevel,
    minZoom,
    maxZoom,
  } = useDraggableCanvas({
    canvasWidth: canvasConfig.width,
    canvasHeight: canvasConfig.height,
    initialCenter: canvasConfig.center,
    enabled:
      !hidden &&
      mode === "home" &&
      !detailOpen &&
      !transitioning &&
      !focusingId,
    allowDragFromInteractive: true,
    minZoom: zoomRange.minZoom,
    maxZoom: zoomRange.maxZoom,
    wrapPeriod,
  });

  const elementById = useMemo(() => {
    const map = new Map<string, CoverElement>();
    (sessionElements ?? []).forEach((element) => map.set(element.id, element));
    return map;
  }, [sessionElements]);

  const getTargets = useCallback(() => {
    return visibleElements
      .map((element) => {
        const el = nodeMapRef.current.get(element.id);
        return el ? { id: element.id, el } : null;
      })
      .filter((item): item is { id: string; el: HTMLDivElement } => item !== null);
  }, [visibleElements]);

  const getCoverPose = useCallback(
    (id: string): ElementPose | null => {
      const element = elementById.get(id);
      const width = viewportSize.width || layoutWidth;
      const height = viewportSize.height || (typeof window !== "undefined" ? window.innerHeight : 800);
      if (!element || width === 0) return null;
      const coverWidth = getCoverWidth(element, width);
      const mapped = coverPositionToCanvas(
        element,
        { width, height },
        canvasConfig.center,
        coverWidth
      );
      return {
        x: mapped.x,
        y: mapped.y,
        scale: mapped.scale,
        rotation: element.coverPosition.rotation ?? 0,
      };
    },
    [canvasConfig.center, elementById, layoutWidth, viewportSize.height, viewportSize.width]
  );

  const getCanvasPose = useCallback(
    (id: string): ElementPose | null => {
      const element = elementById.get(id);
      if (!element) return null;
      const point = getCanvasPoint(element, viewportSize.width || layoutWidth, {
        width: canvasConfig.width,
        height: canvasConfig.height,
      });
      return {
        x: point.x,
        y: point.y,
        scale: 1,
        rotation: element.canvasPosition.rotation ?? 0,
      };
    },
    [
      canvasConfig.height,
      canvasConfig.width,
      elementById,
      layoutWidth,
      viewportSize.width,
    ]
  );

  const getElement = useCallback(
    (id: string) => elementById.get(id),
    [elementById]
  );

  const getViewport = useCallback(
    () => ({
      width: viewportSize.width || layoutWidth,
      height:
        viewportSize.height ||
        (typeof window !== "undefined" ? window.innerHeight : 800),
    }),
    [layoutWidth, viewportSize.height, viewportSize.width]
  );

  const getCanvasCenter = useCallback(
    () => canvasConfig.center,
    [canvasConfig.center]
  );

  const {
    placeAtCover,
    placeAtCanvas,
    startDrift,
    playToCanvas,
    convergeToCenter,
    expandFromCenter,
    killDrift,
  } = useCoverTransition({
    reducedMotion,
    getTargets,
    getCoverPose,
    getCanvasPose,
    getElement,
    getViewport,
    getCanvasCenter,
  });

  const selection = useElementSelection({
    enabled: !hidden && mode === "home" && !detailOpen,
  });

  const registerRef = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) nodeMapRef.current.set(id, node);
    else nodeMapRef.current.delete(id);
  }, []);

  const motionApiRef = useRef({
    placeAtCover,
    placeAtCanvas,
    startDrift,
    expandFromCenter,
    killDrift,
  });
  motionApiRef.current = {
    placeAtCover,
    placeAtCanvas,
    startDrift,
    expandFromCenter,
    killDrift,
  };

  useLayoutEffect(() => {
    if (hidden || !initialized || !sessionElements) return;

    if (mode !== "cover") {
      // During cover→home brand morph, playToCanvas owns element motion.
      if (!transitioning) {
        motionApiRef.current.placeAtCanvas();
      }
      setPlaced(true);
      return;
    }

    // Cover→about / cover→home transitions own motion; do not reset mid-flight.
    // (Including `transitioning` in deps used to re-enter here and clear the flag.)
    if (transitioning) {
      return;
    }

    motionApiRef.current.killDrift();
    resetView(1);
    setPressed(false);
    openingIdRef.current = null;
    focusingIdRef.current = null;
    setFocusingId(null);
    selection.clear();
    const chrome = [chromeRef.current, pathsRef.current].filter(
      (node): node is HTMLDivElement => node !== null
    );

    // Pending return: wait for nodes, then claim + expand.
    // Claim only when starting the timeline so effect re-runs can retry
    // if cleanup cancelled the wait RAF before expand began.
    if (shouldAboutReturnExpand() || isAboutReturnExpandActive()) {
      setPlaced(true);
      if (chrome.length) {
        gsap.set(chrome, { opacity: 0, scale: 1, clearProps: "transform" });
      }

      if (isAboutReturnExpandActive()) {
        return;
      }

      let raf = 0;
      let attempts = 0;
      const run = () => {
        if (!nodeMapRef.current.size && attempts < 24) {
          attempts += 1;
          raf = requestAnimationFrame(run);
          return;
        }
        if (!beginAboutReturnExpand()) return;

        // Reveal clustered elements under the morph pill, then spread out.
        const overlay = document.getElementById(ABOUT_MORPH_OVERLAY_ID);
        if (overlay) {
          gsap.to(overlay, {
            opacity: 0,
            duration: 0.28,
            delay: 0.06,
            ease: "power2.out",
            onComplete: removeAboutMorphOverlay,
          });
        }
        motionApiRef.current.expandFromCenter({
          onComplete: () => {
            motionApiRef.current.startDrift();
            clearAboutReturnExpand();
            if (chrome.length) {
              gsap.to(chrome, {
                opacity: 1,
                duration: 0.5,
                ease: "power2.out",
              });
            }
          },
        });
      };
      run();
      return () => cancelAnimationFrame(raf);
    }

    if (chrome.length) {
      gsap.set(chrome, { opacity: 1, scale: 1, clearProps: "transform" });
    }

    let raf = 0;
    let attempts = 0;
    const run = () => {
      motionApiRef.current.placeAtCover();
      const started = motionApiRef.current.startDrift();
      setPlaced(true);
      if (!started && attempts < 8) {
        attempts += 1;
        raf = requestAnimationFrame(run);
      }
    };
    run();
    return () => cancelAnimationFrame(raf);
  }, [
    hidden,
    initialized,
    mode,
    transitioning,
    viewportSize.width,
    viewportSize.height,
    visibleElements.length,
    sessionElements,
    resetView,
  ]);

  const cancelPendingOpen = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    openingIdRef.current = null;
    focusingIdRef.current = null;
    setFocusingId(null);
    cancelPan();
  }, [cancelPan]);

  const handleStart = useCallback(() => {
    if (mode !== "cover" || transitioning) return;
    setPressed(true);
    setTransitioning(true);

    const chrome = [chromeRef.current, pathsRef.current].filter(
      (node): node is HTMLDivElement => node !== null
    );

    const cta = ctaRef.current;
    if (!cta || reducedMotion) {
      playToCanvas({
        chrome,
        onComplete: () => {
          setTransitioning(false);
          onCoverComplete();
        },
      });
      return;
    }

    const source = cta.getBoundingClientRect();
    let disperseDone = false;
    let morphDone = false;
    const tryFinish = () => {
      if (!disperseDone || !morphDone) return;
      setTransitioning(false);
      onCoverComplete();
    };

    playJinMarkMorph({
      source,
      reducedMotion,
      fadeChrome: (duration) => {
        const root = chromeRef.current;
        if (!root) return;
        const copy = root.querySelectorAll("[data-cover-copy]");
        const about = root.querySelectorAll("[data-cover-about]");
        const labels = root.querySelectorAll("[data-explore-label]");
        const paths = pathsRef.current;

        gsap.to(gsap.utils.toArray(copy), {
          opacity: 0,
          y: 10,
          duration,
          ease: "power2.inOut",
        });
        gsap.to(gsap.utils.toArray(about), {
          opacity: 0,
          y: 10,
          duration,
          ease: "power2.inOut",
        });
        gsap.to(gsap.utils.toArray(labels), {
          opacity: 0,
          duration: Math.min(0.22, duration),
          ease: "power2.inOut",
        });
        gsap.to(cta, {
          opacity: 0,
          duration: 0.12,
          delay: 0.06,
          ease: "power1.out",
        });
        if (paths) {
          gsap.to(paths, {
            opacity: 0,
            duration,
            ease: "power2.inOut",
          });
        }
      },
      onDisperse: () => {
        playToCanvas({
          chrome: [],
          onComplete: () => {
            disperseDone = true;
            tryFinish();
          },
        });
      },
      onComplete: () => {
        morphDone = true;
        tryFinish();
      },
    });
  }, [
    mode,
    onCoverComplete,
    playToCanvas,
    reducedMotion,
    transitioning,
  ]);

  const handleAboutRequest = useCallback(
    (aboutLink: HTMLAnchorElement) => {
      if (mode !== "cover" || transitioning) return;

      const source = aboutLink.getBoundingClientRect();
      storeAboutButtonRect(source);
      setTransitioning(true);
      // Clear any leftover start-explore morph layer that could block navigation.
      document.getElementById("jin-mark-morph-overlay")?.remove();

      const chrome = [chromeRef.current, pathsRef.current].filter(
        (node): node is HTMLDivElement => node !== null
      );

      if (reducedMotion) {
        router.push("/about");
        return;
      }

      if (chrome.length) {
        gsap.to(chrome, {
          opacity: 0,
          scale: 0.97,
          duration: 0.28,
          ease: "power2.in",
        });
      }

      convergeToCenter({
        onComplete: () => {
          const overlay = createAboutMorphOverlay({
            left: source.left,
            top: source.top,
            width: source.width,
            height: source.height,
          });
          const target = getAboutCardTargetRect();
          gsap.to(overlay, {
            top: target.top,
            left: target.left,
            width: target.width,
            height: target.height,
            borderRadius: 16,
            duration: 0.62,
            ease: "power3.out",
            onComplete: () => {
              router.push("/about");
            },
          });
        },
      });
    },
    [convergeToCenter, mode, reducedMotion, router, transitioning]
  );

  const handleSelect = useCallback(
    (id: string, node: HTMLDivElement) => {
      if (mode !== "home" || didPanRef.current) return;
      if (openingIdRef.current) return;
      if (focusingIdRef.current === id || selection.selectedId === id) return;

      cancelPendingOpen();
      focusingIdRef.current = id;
      node.style.zIndex = "40";
      setFocusingId(id);

      const scale = zoomRef.current || 1;
      const origin = positionRef.current;
      const rect = node.getBoundingClientRect();

      navigateTo(
        (rect.left + rect.width / 2 - origin.x) / scale,
        (rect.top + rect.height / 2 - origin.y) / scale,
        !reducedMotion,
        () => {
          if (focusingIdRef.current !== id) return;
          selection.select(id);
        },
        false
      );
    },
    [
      cancelPendingOpen,
      mode,
      navigateTo,
      positionRef,
      reducedMotion,
      selection,
      zoomRef,
    ]
  );

  const openFigure = useCallback(
    (id: string) => {
      if (openingIdRef.current === id) return;
      const element = elementById.get(id);
      const node = nodeMapRef.current.get(id);
      if (!element || !node) return;
      openingIdRef.current = id;
      focusingIdRef.current = null;
      setFocusingId(null);
      onContinueFigure(element, node.getBoundingClientRect());
    },
    [elementById, onContinueFigure]
  );

  const handleOutlineComplete = useCallback(
    (id: string) => {
      if (selection.selectedId !== id || openingIdRef.current) return;
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current);
      }
      openTimerRef.current = window.setTimeout(
        () => {
          openTimerRef.current = null;
          if (selection.selectedId === id) openFigure(id);
        },
        reducedMotion ? 0 : 180
      );
    },
    [openFigure, reducedMotion, selection.selectedId]
  );

  const handleCancelSelection = useCallback(() => {
    cancelPendingOpen();
    const id = focusingIdRef.current ?? selection.selectedId;
    if (id) {
      const node = nodeMapRef.current.get(id);
      if (node) node.style.zIndex = "";
    }
    focusingIdRef.current = null;
    setFocusingId(null);
    selection.clear();
  }, [cancelPendingOpen, selection]);

  const handleBack = useCallback(() => {
    if (focusingIdRef.current || selection.selectedId) {
      handleCancelSelection();
      return;
    }
    onBackToCover?.();
  }, [handleCancelSelection, onBackToCover, selection.selectedId]);

  const zoomByStep = useCallback(
    (direction: 1 | -1) => {
      const factor = direction > 0 ? CANVAS_ZOOM_STEP : 1 / CANVAS_ZOOM_STEP;
      setZoomLevel(zoom * factor);
    },
    [setZoomLevel, zoom]
  );

  const handleResetView = useCallback(() => {
    handleCancelSelection();
    resetView(1);
  }, [handleCancelSelection, resetView]);

  const dismissHint = useCallback(() => {
    setHintVisible(false);
  }, []);

  useEffect(() => {
    if (hidden || mode !== "home" || transitioning || detailOpen) {
      setHintVisible(false);
      return;
    }
    setHintVisible(true);
    const timer = window.setTimeout(() => setHintVisible(false), 3000);
    return () => window.clearTimeout(timer);
  }, [coverGeneration, detailOpen, hidden, mode, transitioning]);

  useEffect(() => {
    if (hidden || mode !== "home" || detailOpen || transitioning) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) {
          return;
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (hintVisible) {
          dismissHint();
          return;
        }
        handleBack();
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomByStep(1);
        return;
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomByStep(-1);
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        handleResetView();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    detailOpen,
    dismissHint,
    handleBack,
    handleResetView,
    hidden,
    hintVisible,
    mode,
    transitioning,
    zoomByStep,
  ]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
      didPanRef.current = false;
    },
    []
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const start = pointerStartRef.current;
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) {
        didPanRef.current = true;
      }
    },
    []
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (!start || mode !== "home") return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.hypot(dx, dy) > 6) return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-element-interactive]")) return;
      cancelPendingOpen();
      selection.clear();
    },
    [cancelPendingOpen, mode, selection]
  );

  useEffect(() => {
    const node = canvasRef.current;
    if (!node || hidden || mode !== "home" || detailOpen || transitioning) {
      return;
    }
    node.addEventListener("wheel", applyWheelZoom, { passive: false });
    return () => node.removeEventListener("wheel", applyWheelZoom);
  }, [applyWheelZoom, detailOpen, hidden, mode, transitioning]);

  useEffect(() => {
    if (!hidden && mode === "home") {
      openingIdRef.current = null;
      focusingIdRef.current = null;
      setFocusingId(null);
    }
  }, [hidden, mode]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current);
      }
    };
  }, []);

  const selectedElement = selection.selectedId
    ? elementById.get(selection.selectedId) ?? null
    : null;

  return (
    <div
      className={`cover-root fixed inset-0 z-10 overflow-hidden ${
        hidden ? "hidden" : ""
      }`}
      data-canvas-mode={mode === "home" || transitioning ? "explore" : "cover"}
      data-camera={focusingId ? "true" : undefined}
      aria-hidden={hidden}
    >
      {(mode === "cover" || transitioning) && (
        <div ref={pathsRef} className="pointer-events-none absolute inset-0 z-[1]">
          <ConvergencePaths
            visible={mode === "cover"}
            reduced={reducedMotion}
          />
        </div>
      )}

      <div
        {...bind()}
        ref={canvasRef}
        onPointerDownCapture={handlePointerDown}
        onPointerMoveCapture={handlePointerMove}
        onPointerUpCapture={handlePointerUp}
        className={`absolute inset-0 z-10 touch-none overflow-hidden ${
          mode === "home"
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default"
        }`}
        style={{
          touchAction: "none",
          overscrollBehavior: "none",
          opacity: placed ? 1 : 0,
        }}
      >
        <div
          ref={layerRef}
          className="absolute origin-top-left"
          style={{
            width: canvasConfig.width,
            height: canvasConfig.height,
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
            willChange: isDragging || focusingId ? "transform" : "auto",
          }}
        >
          <CoverElementField
            key={coverGeneration}
            elements={visibleElements}
            viewportWidth={viewportSize.width || layoutWidth}
            canvasSize={{
              width: canvasConfig.width,
              height: canvasConfig.height,
            }}
            tilePeriod={
              mode === "home" && !transitioning ? tilePeriod : null
            }
            phase={
              mode === "home" && !transitioning ? "explore" : "cover"
            }
            interactive={mode === "home" && !detailOpen && !transitioning}
            selectedId={selection.selectedId}
            reducedMotion={reducedMotion}
            registerRef={registerRef}
            onSelect={handleSelect}
            onOutlineComplete={handleOutlineComplete}
          />
        </div>
      </div>

      {(mode === "cover" || transitioning) && (
        <CoverIntro
          visible={mode === "cover"}
          pressed={pressed}
          transitioning={transitioning}
          onStart={handleStart}
          onAboutRequest={handleAboutRequest}
          chromeRef={chromeRef}
          ctaRef={ctaRef}
        />
      )}

      {mode === "home" && !detailOpen && !transitioning ? (
        <>
          {mode === "home" && !detailOpen && !transitioning ? (
            <CanvasInstruction
              messageKey="home.instruction"
              floating
              visible={hintVisible}
              onClose={dismissHint}
            />
          ) : null}
          <CanvasViewControls
            onBack={handleBack}
            backPlacement="top-left"
            backLabel={
              focusingId || selectedElement
                ? t("home.cancelSelect")
                : t("home.backCover")
            }
            onZoomIn={() => zoomByStep(1)}
            onZoomOut={() => zoomByStep(-1)}
            onReset={handleResetView}
            canZoomIn={zoom < maxZoom - 0.001}
            canZoomOut={zoom > minZoom + 0.001}
          />
        </>
      ) : null}

      <ElementSelection element={selectedElement} />
    </div>
  );
}
