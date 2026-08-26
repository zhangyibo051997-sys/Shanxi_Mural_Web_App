"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  getMatchingInsets,
  getMatchingLayout,
  getMatchingViewCenter,
} from "@/data/muralMatchingLayout";
import {
  getFigureAwardIdentity,
  muralMap,
  type Figure,
} from "@/data/murals";
import type { CoverElement } from "@/data/coverElements";
import { isCorrectMatch, muralById } from "@/data/muralData";
import { useDraggableCanvas } from "@/hooks/useDraggableCanvas";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { computeContentZoomRange } from "@/lib/canvasZoom";
import CanvasViewControls, {
  CANVAS_ZOOM_STEP,
} from "@/components/mural/CanvasViewControls";
import MatchingFeedback from "./MatchingFeedback";
import MuralDetailOverlay from "./MuralDetailOverlay";
import MuralInspectWindow from "./MuralInspectWindow";
import MuralOption from "./MuralOption";
import { useLocale } from "@/components/i18n/LocaleProvider";

export type ExperienceStage =
  | "figure-exploration"
  | "figure-selected"
  | "mural-matching"
  | "mural-selected"
  | "answer-correct"
  | "answer-incorrect"
  | "mural-detail";

type MatchingBoardProps = {
  figure: Figure;
  coverElement: CoverElement | null;
  muralIds: string[];
  isMobile: boolean;
  hideCards: boolean;
  hintVisible?: boolean;
  onOpenTemple: (templeId: string) => void;
  onReturnHome: () => void;
};

export default function MatchingBoard({
  figure,
  coverElement,
  muralIds,
  isMobile,
  hideCards,
  hintVisible = false,
  onOpenTemple,
  onReturnHome,
}: MatchingBoardProps) {
  const reducedMotion = useReducedMotion();
  const { t } = useLocale();
  const [stage, setStage] = useState<ExperienceStage>("mural-matching");
  const [selectedMuralId, setSelectedMuralId] = useState<string | null>(null);
  const [focusingId, setFocusingId] = useState<string | null>(null);
  const [earnedStar, setEarnedStar] = useState(false);
  const [outlineNonce, setOutlineNonce] = useState(0);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [viewport, setViewport] = useState(() =>
    typeof window === "undefined"
      ? { width: 1280, height: 800 }
      : { width: window.innerWidth, height: window.innerHeight }
  );
  const layout = useMemo(
    () => getMatchingLayout(isMobile, muralIds, viewport),
    [isMobile, muralIds, viewport]
  );
  const canvas = useMemo(
    () => ({
      width: Math.max(1, viewport.width),
      height: Math.max(1, viewport.height),
    }),
    [viewport.height, viewport.width]
  );
  const viewCenter = useMemo(
    () => getMatchingViewCenter(viewport),
    [viewport]
  );
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const didPanRef = useRef(false);
  const suppressCanvasPointerRef = useRef(false);
  const focusingIdRef = useRef<string | null>(null);
  const selectedMuralIdRef = useRef<string | null>(null);
  const starFlightRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { awardFigure } = useGameProgress();

  useEffect(() => {
    setWrongAttempts(0);
  }, [figure.id]);

  useEffect(() => {
    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const zoomRange = useMemo(() => {
    const insets = getMatchingInsets(isMobile);
    return computeContentZoomRange(
      layout.map((item) => ({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.width / item.aspectRatio,
      })),
      {
        width: Math.max(1, viewport.width - insets.left - insets.right),
        height: Math.max(1, viewport.height - insets.top - insets.bottom),
      },
      24
    );
  }, [isMobile, layout, viewport.height, viewport.width]);

  const {
    position,
    zoom,
    isDragging,
    bind,
    layerRef,
    applyWheelZoom,
    navigateTo,
    cancelPan,
    resetView,
    setZoomLevel,
    minZoom,
    maxZoom,
  } = useDraggableCanvas({
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    initialCenter: viewCenter,
    allowDragFromInteractive: true,
    minZoom: zoomRange.minZoom,
    maxZoom: zoomRange.maxZoom,
    enabled: true,
  });

  const selectedMural = selectedMuralId
    ? muralMap.get(selectedMuralId) ?? null
    : null;
  const correctMuralId = useMemo(() => {
    const sourceId = figure.sourceMuralId ?? figure.correctMuralId;
    if (!sourceId) return undefined;
    return layout.some((item) => item.muralId === sourceId)
      ? sourceId
      : undefined;
  }, [figure.correctMuralId, figure.sourceMuralId, layout]);

  useEffect(() => {
    if (!earnedStar || reducedMotion) return;
    if (stage !== "answer-correct") return;
    const star = starFlightRef.current;
    const hud = document.getElementById("star-hud");
    if (!star || !hud) return;
    const hudRect = hud.getBoundingClientRect();
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    const endX = hudRect.left + hudRect.width / 2;
    const endY = hudRect.top + hudRect.height / 2;
    const timeline = gsap.timeline();
    timeline
      .set(star, { x: startX, y: startY, opacity: 1, scale: 0.7 })
      .to(star, {
        x: (startX + endX) / 2,
        y: Math.min(startY, endY) - 90,
        scale: 1.15,
        duration: 0.42,
        ease: "power2.out",
      })
      .to(star, {
        x: endX,
        y: endY,
        scale: 0.55,
        opacity: 0,
        duration: 0.48,
        ease: "power2.in",
      });
    return () => {
      timeline.kill();
    };
  }, [earnedStar, reducedMotion, stage]);

  const selectMural = useCallback(
    (muralId: string, force = false) => {
      if (!force && suppressCanvasPointerRef.current) return;
      if (!force && (isDragging || didPanRef.current)) return;
      if (!force && selectedMuralId === muralId && !focusingId) {
        setInspectOpen(true);
        return;
      }

      const item = layout.find((entry) => entry.muralId === muralId);
      if (!item) return;

      const height = item.width / item.aspectRatio;
      didPanRef.current = false;
      focusingIdRef.current = muralId;
      selectedMuralIdRef.current = null;
      setInspectOpen(false);
      setSelectedMuralId(null);
      setStage("mural-matching");

      navigateTo(
        item.x + item.width / 2,
        item.y + height / 2,
        !reducedMotion,
        () => {
          if (focusingIdRef.current !== muralId) return;
          selectedMuralIdRef.current = muralId;
          setSelectedMuralId(muralId);
          setStage("mural-selected");
          setFocusingId(null);
          if (force) setOutlineNonce((value) => value + 1);
        },
        true
      );
    },
    [focusingId, isDragging, layout, navigateTo, reducedMotion, selectedMuralId]
  );

  const handleOutlineComplete = useCallback((muralId: string) => {
    if (selectedMuralIdRef.current !== muralId) return;
    setInspectOpen(true);
  }, []);

  const submitAnswer = useCallback(() => {
    if (!selectedMuralId) return;
    setInspectOpen(false);
    const selected = muralById[selectedMuralId];
    const sourceMuralId = figure.sourceMuralId ?? figure.correctMuralId;
    const elementForJudge = sourceMuralId ? { sourceMuralId } : null;
    if (!selected || !elementForJudge || !isCorrectMatch(elementForJudge, selected)) {
      setWrongAttempts((count) => count + 1);
      setStage("answer-incorrect");
      return;
    }
    const award = getFigureAwardIdentity(figure, coverElement);
    const earned = awardFigure(award.id, award.aliases);
    setEarnedStar(earned);
    setStage("answer-correct");
  }, [awardFigure, coverElement, figure, selectedMuralId]);

  const beginPointerSuppress = useCallback(() => {
    suppressCanvasPointerRef.current = true;
    window.setTimeout(() => {
      suppressCanvasPointerRef.current = false;
    }, 320);
  }, []);

  const clearMatchingSelection = useCallback(() => {
    focusingIdRef.current = null;
    setFocusingId(null);
    selectedMuralIdRef.current = null;
    setInspectOpen(false);
    setSelectedMuralId(null);
    setStage("mural-matching");
    pointerStartRef.current = null;
    didPanRef.current = false;
    cancelPan();
  }, [cancelPan]);

  const dismissIncorrect = useCallback(() => {
    beginPointerSuppress();
    clearMatchingSelection();
    if (wrongAttempts >= 2 && correctMuralId) {
      window.setTimeout(() => {
        selectMural(correctMuralId, true);
      }, 50);
    }
  }, [
    beginPointerSuppress,
    clearMatchingSelection,
    correctMuralId,
    selectMural,
    wrongAttempts,
  ]);

  const dismissCorrect = useCallback(() => {
    beginPointerSuppress();
    clearMatchingSelection();
  }, [beginPointerSuppress, clearMatchingSelection]);

  const closeInspectWithoutChoice = useCallback(() => {
    beginPointerSuppress();
    clearMatchingSelection();
  }, [beginPointerSuppress, clearMatchingSelection]);

  const clearSelectionFromCanvas = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (suppressCanvasPointerRef.current) {
        pointerStartRef.current = null;
        return;
      }
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6)
        return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-mural-option]")) return;
      clearMatchingSelection();
    },
    [clearMatchingSelection]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (hintVisible) return;
      if (
        inspectOpen ||
        stage === "mural-selected" ||
        stage === "mural-matching"
      ) {
        clearMatchingSelection();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearMatchingSelection, hintVisible, inspectOpen, stage]);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node || (stage !== "mural-matching" && stage !== "mural-selected")) {
      return;
    }
    node.addEventListener("wheel", applyWheelZoom, { passive: false });
    return () => node.removeEventListener("wheel", applyWheelZoom);
  }, [applyWheelZoom, stage]);

  return (
    <>
      {!hideCards ? (
        <CanvasViewControls
          onBack={
            stage === "mural-detail"
              ? undefined
              : inspectOpen
                ? closeInspectWithoutChoice
                : onReturnHome
          }
          backLabel={t("match.reselect")}
          backPlacement="top-left"
          onZoomIn={() => setZoomLevel(zoom * CANVAS_ZOOM_STEP)}
          onZoomOut={() => setZoomLevel(zoom / CANVAS_ZOOM_STEP)}
          onReset={() => resetView(1)}
          canZoomIn={zoom < maxZoom - 0.001}
          canZoomOut={zoom > minZoom + 0.001}
          showZoom={
            stage === "mural-matching" ||
            (stage === "mural-selected" && !inspectOpen)
          }
        />
      ) : null}

      <div
        {...bind()}
        ref={canvasRef}
        onPointerDownCapture={(event) => {
          pointerStartRef.current = { x: event.clientX, y: event.clientY };
          didPanRef.current = false;
        }}
        onPointerMoveCapture={(event) => {
          const start = pointerStartRef.current;
          if (
            start &&
            Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
          ) {
            didPanRef.current = true;
          }
        }}
        onPointerUpCapture={clearSelectionFromCanvas}
        className={`absolute inset-0 touch-none overflow-hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ touchAction: "none", overscrollBehavior: "none" }}
      >
        <div
          ref={layerRef}
          className="matching-mural-layer absolute origin-top-left"
          style={{
            width: canvas.width,
            height: canvas.height,
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
            willChange: isDragging ? "transform" : "auto",
          }}
        >
          {layout.map((item) => {
            const mural = muralMap.get(item.muralId);
            if (!mural) return null;
            return (
              <MuralOption
                key={mural.id}
                mural={mural}
                layout={item}
                selected={selectedMuralId === mural.id}
                focusing={focusingId === mural.id}
                outlineKey={selectedMuralId === mural.id ? outlineNonce : 0}
                muted={
                  (Boolean(selectedMuralId) && selectedMuralId !== mural.id) ||
                  (Boolean(focusingId) && focusingId !== mural.id)
                }
                reducedMotion={reducedMotion}
                onSelect={selectMural}
                onOutlineComplete={handleOutlineComplete}
              />
            );
          })}
        </div>
      </div>

      {!hideCards &&
        inspectOpen &&
        selectedMural &&
        stage === "mural-selected" && (
          <MuralInspectWindow
            mural={selectedMural}
            isMobile={isMobile}
            onConfirm={submitAnswer}
            onClose={closeInspectWithoutChoice}
            onOpenTemple={onOpenTemple}
          />
        )}

      {!hideCards && stage === "answer-incorrect" && (
        <MatchingFeedback
          result="incorrect"
          earnedStar={false}
          revealAnswer={wrongAttempts >= 2}
          onDismiss={dismissIncorrect}
          onLearnMore={() => undefined}
          onChooseAnother={onReturnHome}
        />
      )}

      {!hideCards && stage === "answer-correct" && (
        <MatchingFeedback
          result="correct"
          earnedStar={earnedStar}
          mural={selectedMural}
          onDismiss={dismissCorrect}
          onLearnMore={() => setStage("mural-detail")}
          onChooseAnother={onReturnHome}
        />
      )}

      {!hideCards && stage === "mural-detail" && selectedMural && (
        <MuralDetailOverlay
          mural={selectedMural}
          figure={figure}
          isMobile={isMobile}
          onClose={() => setStage("mural-selected")}
          onOpenTemple={onOpenTemple}
        />
      )}

      <span
        ref={starFlightRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] text-2xl text-[#B88A2D] opacity-0"
        aria-hidden="true"
      >
        ★
      </span>
    </>
  );
}
