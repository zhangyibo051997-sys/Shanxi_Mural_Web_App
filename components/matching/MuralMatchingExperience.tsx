"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  getMatchingLayout,
  muralMatchingCanvas,
  pickMatchingMuralIds,
} from "@/data/muralMatchingLayout";
import { figureFromCoverElement, getFigure, getFigureAwardIdentity, muralMap } from "@/data/murals";
import type { CoverElement } from "@/data/coverElements";
import {
  availableMurals,
  isCorrectMatch,
  muralById,
} from "@/data/muralData";
import { useDraggableCanvas } from "@/hooks/useDraggableCanvas";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { computeContentZoomRange } from "@/lib/canvasZoom";
import MatchingFeedback from "./MatchingFeedback";
import MuralDetailOverlay from "./MuralDetailOverlay";
import MuralInspectWindow from "./MuralInspectWindow";
import MuralOption from "./MuralOption";
import SelectedFigureCard from "./SelectedFigureCard";

export type ExperienceStage =
  | "figure-exploration"
  | "figure-selected"
  | "mural-matching"
  | "mural-selected"
  | "answer-correct"
  | "answer-incorrect"
  | "mural-detail";

interface MuralMatchingExperienceProps {
  figureId: string;
  coverElement?: CoverElement | null;
  sourceRect: DOMRect | null;
  isMobile: boolean;
  onOpenTemple: (templeId: string) => void;
  onReturnHome: () => void;
}

export default function MuralMatchingExperience({
  figureId,
  coverElement = null,
  sourceRect,
  isMobile,
  onOpenTemple,
  onReturnHome,
}: MuralMatchingExperienceProps) {
  const reducedMotion = useReducedMotion();
  const figure = useMemo(
    () =>
      coverElement
        ? figureFromCoverElement(coverElement)
        : getFigure(figureId),
    [coverElement, figureId]
  );
  const muralIds = useMemo(
    () =>
      pickMatchingMuralIds(
        availableMurals.map((mural) => mural.id),
        (figure.sourceMuralId ?? figure.correctMuralId) || undefined
      ),
    [figure.correctMuralId, figure.sourceMuralId]
  );
  const layout = useMemo(
    () => getMatchingLayout(isMobile, muralIds),
    [isMobile, muralIds]
  );
  const canvas = isMobile
    ? muralMatchingCanvas.mobile
    : muralMatchingCanvas.desktop;

  const [stage, setStage] = useState<ExperienceStage>("mural-matching");
  const [selectedMuralId, setSelectedMuralId] = useState<string | null>(null);
  const [focusingId, setFocusingId] = useState<string | null>(null);
  const [earnedStar, setEarnedStar] = useState(false);
  const [outlineNonce, setOutlineNonce] = useState(0);
  const [inspectOpen, setInspectOpen] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const didPanRef = useRef(false);
  const focusingIdRef = useRef<string | null>(null);
  const selectedMuralIdRef = useRef<string | null>(null);
  const starFlightRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { awardFigure, collectSticker } = useGameProgress();

  useEffect(() => {
    const src = figure.image || coverElement?.src;
    if (!src) return;
    const rawName =
      coverElement?.fileName || src.split("/").pop() || `${figure.id}.png`;
    let fileName = rawName;
    try {
      fileName = decodeURIComponent(rawName);
    } catch {
      fileName = rawName;
    }
    collectSticker({
      id: figure.elementId ?? figure.id,
      src,
      title: figure.name,
      fileName,
      collectedAt: new Date().toISOString(),
    });
  }, [collectSticker, coverElement, figure]);

  const zoomRange = useMemo(() => {
    const vw = isMobile ? 390 : 1440;
    const vh = isMobile ? 844 : 900;
    return computeContentZoomRange(
      layout.map((item) => ({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.width / item.aspectRatio,
      })),
      { width: vw, height: vh }
    );
  }, [isMobile, layout]);

  const {
    position,
    zoom,
    isDragging,
    initialized,
    bind,
    applyWheelZoom,
    navigateTo,
    cancelPan,
    resetView,
  } = useDraggableCanvas({
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    initialCenter: canvas.initialCenter,
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
    if (!initialized || reducedMotion) return;
    const options = rootRef.current?.querySelectorAll("[data-mural-option]");
    if (!options?.length) return;
    const tween = gsap.fromTo(
      options,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.55,
        stagger: 0.055,
        delay: 0.24,
        ease: "power2.out",
      }
    );
    return () => {
      tween.kill();
      gsap.set(options, { opacity: 1, clearProps: "opacity" });
    };
  }, [initialized, reducedMotion]);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        (stage === "mural-selected" || stage === "mural-matching")
      ) {
        setInspectOpen(false);
        selectedMuralIdRef.current = null;
        setSelectedMuralId(null);
        setFocusingId(null);
        focusingIdRef.current = null;
        cancelPan();
        setStage("mural-matching");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelPan, stage]);

  const selectMural = useCallback(
    (muralId: string, force = false) => {
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
      setFocusingId(muralId);
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
    const elementForJudge = sourceMuralId
      ? { sourceMuralId }
      : null;
    if (!selected || !elementForJudge || !isCorrectMatch(elementForJudge, selected)) {
      setStage("answer-incorrect");
      return;
    }
    const award = getFigureAwardIdentity(figure, coverElement);
    const earned = awardFigure(award.id, award.aliases);
    setEarnedStar(earned);
    setStage("answer-correct");
  }, [
    awardFigure,
    coverElement,
    figure,
    selectedMuralId,
  ]);

  const dismissIncorrect = useCallback(() => {
    focusingIdRef.current = null;
    setFocusingId(null);
    selectedMuralIdRef.current = null;
    setInspectOpen(false);
    setSelectedMuralId(null);
    setStage("mural-matching");
    if (correctMuralId) {
      window.setTimeout(() => {
        selectMural(correctMuralId, true);
      }, 50);
      return;
    }
    resetView();
  }, [correctMuralId, resetView, selectMural]);

  const clearSelectionFromCanvas = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6)
        return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-mural-option]")) return;
      focusingIdRef.current = null;
      setFocusingId(null);
      cancelPan();
      selectedMuralIdRef.current = null;
      setInspectOpen(false);
      setSelectedMuralId(null);
      setStage("mural-matching");
    },
    [cancelPan]
  );

  useEffect(() => {
    const node = canvasRef.current;
    if (!node || (stage !== "mural-matching" && stage !== "mural-selected")) {
      return;
    }
    node.addEventListener("wheel", applyWheelZoom, { passive: false });
    return () => node.removeEventListener("wheel", applyWheelZoom);
  }, [applyWheelZoom, stage]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-10 overflow-hidden bg-parchment"
      data-matching-stage={stage}
    >
      <SelectedFigureCard
        figure={figure}
        sourceRect={sourceRect}
        reducedMotion={reducedMotion}
        onClose={onReturnHome}
      />

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
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute origin-top-left"
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

      {inspectOpen &&
        selectedMural &&
        stage === "mural-selected" && (
          <MuralInspectWindow
            mural={selectedMural}
            isMobile={isMobile}
            onConfirm={submitAnswer}
          />
        )}

      {stage === "answer-incorrect" && (
        <MatchingFeedback
          result="incorrect"
          earnedStar={false}
          onDismiss={dismissIncorrect}
          onLearnMore={() => undefined}
          onChooseAnother={onReturnHome}
        />
      )}

      {stage === "answer-correct" && (
        <MatchingFeedback
          result="correct"
          earnedStar={earnedStar}
          mural={selectedMural}
          onDismiss={() => undefined}
          onLearnMore={() => setStage("mural-detail")}
          onChooseAnother={onReturnHome}
        />
      )}

      {stage === "mural-detail" && selectedMural && (
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
    </div>
  );
}
