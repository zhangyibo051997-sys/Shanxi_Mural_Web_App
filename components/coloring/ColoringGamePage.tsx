"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import FixedNavigation from "@/components/FixedNavigation";
import TextureBackground from "@/components/TextureBackground";
import CanvasControls from "@/components/coloring/CanvasControls";
import CollectPostcardButton from "@/components/coloring/CollectPostcardButton";
import ColoringHeader from "@/components/coloring/ColoringHeader";
import ColoringTools from "@/components/coloring/ColoringTools";
import ConfirmDialog from "@/components/coloring/ConfirmDialog";
import CulturalHints from "@/components/coloring/CulturalHints";
import FinishColoringButton from "@/components/coloring/FinishColoringButton";
import LineArtCanvas, {
  type LineArtCanvasHandle,
} from "@/components/coloring/LineArtCanvas";
import OriginalMuralPanel from "@/components/coloring/OriginalMuralPanel";
import PigmentPalette from "@/components/coloring/PigmentPalette";
import PostcardPreview from "@/components/coloring/PostcardPreview";
import {
  buildArtworkFromPair,
  FALLBACK_ARTWORK,
  type ColoringArtwork,
  type ColoringArtworkPair,
} from "@/data/coloringArtworks";
import { defaultColorId, getPigmentById } from "@/data/coloringPalette";
import {
  listColoringAutosaves,
  useColoringAutosave,
} from "@/hooks/coloring/useColoringAutosave";
import { usePostcardCollection } from "@/hooks/coloring/usePostcardCollection";
import { useRegionColoring } from "@/hooks/coloring/useRegionColoring";
import { Flip } from "@/hooks/coloring/useColoringTransition";
import { useColorSimilarity } from "@/hooks/useColorSimilarity";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  coloringDataHash,
  usedPigmentValues,
} from "@/utils/coloringScore";
import { downloadDataUrl } from "@/utils/coloringExport";
import { exportColoringPostcard } from "@/utils/postcardExport";
import type {
  InteractionMode,
  PaintSizeId,
  PaintTool,
} from "@/utils/drawingTools";

type ColoringStage = "coloring" | "comparison";

export default function ColoringGamePage() {
  const { t, locale } = useLocale();
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<LineArtCanvasHandle>(null);
  const [artwork, setArtwork] = useState<ColoringArtwork | null>(null);
  const [stage, setStage] = useState<ColoringStage>("coloring");
  const [selectedColorId, setSelectedColorId] = useState(defaultColorId);
  const [customColor, setCustomColor] = useState("#A64B3C");
  const [mode, setMode] = useState<InteractionMode>("paint");
  const [tool, setTool] = useState<PaintTool>("crayon");
  const [sizeId, setSizeId] = useState<PaintSizeId>("medium");
  const [paintHistory, setPaintHistory] = useState({
    canUndo: false,
    canRedo: false,
  });
  const [confirmIncomplete, setConfirmIncomplete] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [revealStars, setRevealStars] = useState(false);
  const [showCollect, setShowCollect] = useState(false);
  const [postcardPreview, setPostcardPreview] = useState<string | null>(null);
  const [generatingPostcard, setGeneratingPostcard] = useState(false);
  const [paintSnapshot, setPaintSnapshot] = useState<string | null>(null);

  const regions = artwork?.regions ?? [];
  const selectedColor =
    selectedColorId === "custom"
      ? customColor
      : getPigmentById(selectedColorId)?.value ??
        artwork?.palette[0]?.value ??
        "#A64B3C";

  const {
    regionColors,
    fillRegion,
    restoreColors,
    completion,
  } = useRegionColoring(regions);

  const { restorePrompt, setRestorePrompt, clearSave } = useColoringAutosave(
    artwork?.id ?? null,
    regionColors,
    selectedColorId
  );

  const similarity = useColorSimilarity(
    regionColors,
    regions,
    stage === "comparison"
  );

  const postcardId = artwork
    ? coloringDataHash(artwork.id, regionColors)
    : null;
  const { isCollected, collect } = usePostcardCollection(postcardId);
  const usedValues = useMemo(
    () => usedPigmentValues(regionColors),
    [regionColors]
  );

  const pendingFlip = useRef<Flip.FlipState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/coloring-artworks.json")
      .then((response) => response.json())
      .then((data: { pairs?: ColoringArtworkPair[] }) => {
        if (cancelled) return;
        const pairs = data.pairs?.length ? data.pairs : null;
        const saved = listColoringAutosaves()[0];
        const savedPair = saved
          ? pairs?.find((pair) => pair.id === saved.artworkId)
          : undefined;
        const pool = pairs ?? [];
        const randomPair =
          pool[Math.floor(Math.random() * Math.max(pool.length, 1))];
        const chosen = savedPair ?? randomPair;
        setArtwork(chosen ? buildArtworkFromPair(chosen) : FALLBACK_ARTWORK);
      })
      .catch(() => {
        if (!cancelled) setArtwork(FALLBACK_ARTWORK);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;
      if (event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        canvasRef.current?.redo();
      } else if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        canvasRef.current?.undo();
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        canvasRef.current?.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useLayoutEffect(() => {
    const state = pendingFlip.current;
    if (!state || reducedMotion) return;
    pendingFlip.current = null;
    Flip.from(state, {
      duration: 0.85,
      ease: "power2.inOut",
      scale: true,
      fade: true,
      nested: true,
    });
  }, [reducedMotion, stage]);

  useEffect(() => {
    if (stage !== "comparison") {
      setRevealStars(false);
      setShowCollect(false);
      return;
    }
    if (reducedMotion) {
      setRevealStars(true);
      setShowCollect(true);
      return;
    }
    const starTimer = window.setTimeout(() => setRevealStars(true), 450);
    const collectTimer = window.setTimeout(() => setShowCollect(true), 880);
    return () => {
      window.clearTimeout(starTimer);
      window.clearTimeout(collectTimer);
    };
  }, [reducedMotion, stage]);

  const persistPaint = useCallback(() => {
    const snapshot = canvasRef.current?.snapshotPaint();
    if (snapshot) setPaintSnapshot(snapshot);
  }, []);

  const enterComparison = useCallback(() => {
    persistPaint();
    if (!reducedMotion) {
      pendingFlip.current = Flip.getState(
        "[data-coloring-canvas], [data-coloring-palette]"
      );
    }
    setStage("comparison");
  }, [persistPaint, reducedMotion]);

  const handleFinish = () => {
    if (completion < 0.6) {
      setConfirmIncomplete(true);
      return;
    }
    enterComparison();
  };

  const handleEditAgain = () => {
    persistPaint();
    if (!reducedMotion) {
      pendingFlip.current = Flip.getState(
        "[data-coloring-canvas], [data-coloring-palette]"
      );
    }
    setStage("coloring");
    setRevealStars(false);
    setShowCollect(false);
    setPostcardPreview(null);
  };

  const handleCollect = async () => {
    if (!artwork || !similarity || generatingPostcard || isCollected) return;
    setGeneratingPostcard(true);
    try {
      const artworkCanvas = await canvasRef.current?.exportComposite();
      if (!artworkCanvas) return;
      const createdAt = new Date();
      const imageDataUrl = await exportColoringPostcard({
        artworkCanvas,
        title: artwork.title,
        figureName: artwork.figureName,
        templeName: artwork.templeName,
        stars: similarity.stars,
        createdAt,
        locale,
        heading: t("color.header"),
        siteLabel: t("brand.siteSubtitle").toLowerCase(),
      });
      collect({
        id: coloringDataHash(artwork.id, regionColors),
        artworkId: artwork.id,
        imageDataUrl,
        stars: similarity.stars,
        createdAt: createdAt.toISOString(),
        title: `${artwork.templeName} · ${artwork.figureName}`,
      });
      setPostcardPreview(imageDataUrl);
    } finally {
      setGeneratingPostcard(false);
    }
  };

  const isColoring = stage === "coloring";
  const locked = isColoring;

  if (!artwork) {
    return (
      <div className="coloring-root coloring-root--locked relative min-h-svh bg-parchment">
        <TextureBackground />
        <FixedNavigation />
        <p className="type-body pt-32 text-center text-ink/70">
          {t("color.loading")}
        </p>
      </div>
    );
  }

  const canvasNode = (
    <div
      data-coloring-canvas
      className={`relative rounded-[2px] border border-[var(--color-border)] bg-rice ${
        isColoring
          ? "h-[min(42svh,320px)] md:absolute md:inset-0 md:h-auto"
          : "h-[min(48svh,420px)] min-h-[240px] w-full shrink-0"
      }`}
    >
      <LineArtCanvas
        ref={canvasRef}
        lineArtUrl={artwork.lineArtUrl}
        figureName={artwork.figureName}
        templeName={artwork.templeName}
        regions={regions}
        regionColors={regionColors}
        selectedColor={selectedColor}
        interactive={isColoring}
        paintSnapshot={paintSnapshot}
        mode={mode}
        tool={tool}
        sizeId={sizeId}
        onFillRegion={(regionId) => fillRegion(regionId, selectedColor)}
        onRegionColorsChange={restoreColors}
        onHistoryChange={setPaintHistory}
      />
      {isColoring ? (
        <CanvasControls
          canUndo={paintHistory.canUndo}
          onUndo={() => canvasRef.current?.undo()}
          onClear={() => setConfirmClear(true)}
        />
      ) : null}
    </div>
  );

  const renderTools = () => (
    <ColoringTools
      mode={mode}
      tool={tool}
      sizeId={sizeId}
      onModeChange={setMode}
      onToolChange={setTool}
      onSizeChange={setSizeId}
      onFit={() => canvasRef.current?.fitView()}
    />
  );

  return (
    <div
      className={`coloring-root relative flex bg-parchment ${
        locked
          ? "coloring-root--locked h-svh flex-col overflow-hidden"
          : "min-h-svh flex-col overflow-y-auto"
      }`}
    >
      <TextureBackground />
      <FixedNavigation />
      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col ${
          locked ? "overflow-hidden" : ""
        }`}
      >
        <div className="h-16 shrink-0 md:h-[72px]" aria-hidden />
        <ColoringHeader stage={stage} />

        {isColoring ? (
          <main className="relative mx-auto min-h-0 w-full max-w-[1600px] flex-1">
            <div className="absolute inset-0 flex flex-col overflow-y-auto px-4 pb-3 pt-1 md:overflow-hidden md:px-8">
              <div className="grid min-h-0 flex-none grid-cols-1 gap-4 md:h-0 md:flex-1 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.85fr)] md:gap-x-[6%] md:overflow-hidden">
                <section className="relative h-[min(42svh,320px)] md:h-auto md:min-h-0">
                  {canvasNode}
                </section>
                <section
                  data-coloring-palette
                  className="hidden min-h-0 flex-col items-center overflow-y-auto overscroll-contain border-[rgb(33_51_56_/_18%)] md:flex md:border-l md:px-6 md:py-2"
                >
                  <p className="type-meta mb-2 w-full max-w-sm text-ink/70">
                    {t("color.pigments")}
                  </p>
                  <PigmentPalette
                    palette={artwork.palette}
                    selectedId={selectedColorId}
                    interactive
                    compact
                    showList
                    onSelect={(color) => setSelectedColorId(color.id)}
                  />
                  <label className="type-ui mt-2 flex min-h-11 items-center gap-2 text-ink/70">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(event) => {
                        setCustomColor(event.target.value);
                        setSelectedColorId("custom");
                      }}
                      className="h-7 w-7 cursor-pointer border border-ink/15 bg-transparent p-0"
                      aria-label={t("color.custom")}
                    />
                    {t("color.custom")}
                  </label>
                  {renderTools()}
                  <CulturalHints />
                </section>
              </div>
              <div className="mt-3 shrink-0 border-t border-ink/10 pt-3 md:hidden">
                <p className="type-meta mb-2 text-ink/70">{t("color.pigments")}</p>
                <PigmentPalette
                  palette={artwork.palette}
                  selectedId={selectedColorId}
                  interactive
                  compact
                  showList
                  onSelect={(color) => setSelectedColorId(color.id)}
                />
                {renderTools()}
                <CulturalHints />
              </div>
              <div className="flex shrink-0 justify-center pb-1 pt-2 md:pt-3">
                <FinishColoringButton onClick={handleFinish} />
              </div>
            </div>
          </main>
        ) : (
          <main className="relative mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col px-4 pb-8 pt-1 md:px-8">
            <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-x-6 lg:grid-cols-[minmax(0,0.37fr)_minmax(0,0.37fr)_minmax(0,0.22fr)] lg:gap-x-0">
              {similarity ? (
                <div className="border-ink/10 lg:border-r lg:px-6">
                  <OriginalMuralPanel
                    originalUrl={artwork.originalUrl}
                    figureName={artwork.figureName}
                    templeName={artwork.templeName}
                    stars={similarity.stars}
                    incomplete={similarity.incomplete}
                    revealStars={revealStars}
                  />
                </div>
              ) : null}
              <section className="relative flex min-h-0 flex-col lg:px-6">
                <h2 className="type-section mb-6 text-center">
                  {t("color.yourColoring")}
                </h2>
                {canvasNode}
                <div
                  className={`flex shrink-0 flex-col items-center pb-2 transition-opacity duration-500 ${
                    showCollect ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <CollectPostcardButton
                    collected={isCollected}
                    onClick={() => {
                      void handleCollect();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleEditAgain}
                    className="btn-tertiary mt-2"
                  >
                    {t("color.editAgain")}
                  </button>
                </div>
              </section>
              <section
                data-coloring-palette
                className="flex min-h-0 flex-col items-center justify-start md:col-span-2 lg:col-span-1 lg:border-l lg:border-[rgb(33_51_56_/_18%)] lg:px-6"
              >
                <h2 className="type-section mb-6">{t("color.yourPalette")}</h2>
                <PigmentPalette
                  palette={artwork.palette}
                  selectedId={selectedColorId}
                  usedValues={usedValues}
                  interactive={false}
                  showList
                  onSelect={(color) => setSelectedColorId(color.id)}
                />
              </section>
            </div>
          </main>
        )}
      </div>

      {restorePrompt && (
        <ConfirmDialog
          title={t("color.resumeTitle")}
          body={t("color.resumeBody")}
          cancelLabel={t("color.restart")}
          confirmLabel={t("color.resume")}
          onCancel={() => {
            clearSave();
            restoreColors({});
            setPaintSnapshot(null);
            canvasRef.current?.restoreFromRegionColors({});
          }}
          onConfirm={() => {
            restoreColors(restorePrompt.regionColors);
            if (restorePrompt.selectedColorId) {
              setSelectedColorId(restorePrompt.selectedColorId);
            }
            canvasRef.current?.restoreFromRegionColors(restorePrompt.regionColors);
            setRestorePrompt(null);
          }}
        />
      )}

      {confirmIncomplete && (
        <ConfirmDialog
          title={t("color.unfinishedTitle")}
          body={t("color.unfinishedBody")}
          cancelLabel={t("color.keepColoring")}
          confirmLabel={t("color.stillFinish")}
          onCancel={() => setConfirmIncomplete(false)}
          onConfirm={() => {
            setConfirmIncomplete(false);
            enterComparison();
          }}
        />
      )}

      {confirmClear && (
        <ConfirmDialog
          title={t("color.clearTitle")}
          body={t("color.clearBody")}
          cancelLabel={t("color.cancel")}
          confirmLabel={t("color.clear")}
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            canvasRef.current?.clearPaint();
            setConfirmClear(false);
          }}
        />
      )}

      {postcardPreview && (
        <PostcardPreview
          imageDataUrl={postcardPreview}
          title={`${artwork.templeName} · ${artwork.figureName}`}
          stars={similarity?.stars ?? 1}
          onClose={() => setPostcardPreview(null)}
          onDownload={() =>
            downloadDataUrl(
              postcardPreview,
              `${artwork.figureName}-postcard.png`
            )
          }
        />
      )}
    </div>
  );
}
