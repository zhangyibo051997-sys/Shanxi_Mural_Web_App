"use client";

import type { InteractionMode, PaintSizeId, PaintTool } from "@/utils/drawingTools";
import { useLocale } from "@/components/i18n/LocaleProvider";

type ColoringToolsProps = {
  mode: InteractionMode;
  tool: PaintTool;
  sizeId: PaintSizeId;
  onModeChange: (mode: InteractionMode) => void;
  onToolChange: (tool: PaintTool) => void;
  onSizeChange: (sizeId: PaintSizeId) => void;
  onFit: () => void;
};

const cell =
  "type-ui min-h-11 flex-1 border border-[rgb(33_51_56_/_18%)] bg-rice px-2 transition-colors duration-[180ms] ease-out";

export default function ColoringTools({
  mode,
  tool,
  sizeId,
  onModeChange,
  onToolChange,
  onSizeChange,
  onFit,
}: ColoringToolsProps) {
  const { t } = useLocale();

  return (
    <div className="mb-6 w-full max-w-sm shrink-0 space-y-6">
      <div>
        <p className="type-meta mb-2 font-semibold text-ink/70">
          {t("color.ops")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={mode === "paint"}
            onClick={() => onModeChange("paint")}
            className={`${cell} ${
              mode === "paint" ? "bg-ink text-on-accent" : "text-ink"
            }`}
          >
            {t("color.brush")}
          </button>
          <button
            type="button"
            aria-pressed={mode === "pan"}
            onClick={() => onModeChange("pan")}
            className={`${cell} ${
              mode === "pan" ? "bg-ink text-on-accent" : "text-ink"
            }`}
          >
            {t("color.pan")}
          </button>
        </div>
        <p className="type-caption mt-2 text-ink/70">
          {mode === "pan" ? t("color.panHint") : t("color.paintHint")}
        </p>
      </div>

      <div className={mode === "pan" ? "opacity-40" : ""}>
        <p className="type-meta mb-2 font-semibold text-ink/70">
          {t("color.stroke")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={tool === "crayon"}
            disabled={mode === "pan"}
            onClick={() => onToolChange("crayon")}
            className={`${cell} ${
              tool === "crayon" ? "bg-ink text-on-accent" : "text-ink"
            }`}
          >
            {t("color.crayon")}
          </button>
          <button
            type="button"
            aria-pressed={tool === "spray"}
            disabled={mode === "pan"}
            onClick={() => onToolChange("spray")}
            className={`${cell} ${
              tool === "spray" ? "bg-ink text-on-accent" : "text-ink"
            }`}
          >
            {t("color.airbrush")}
          </button>
        </div>
      </div>

      <div className={mode === "pan" ? "opacity-40" : ""}>
        <p className="type-meta mb-2 font-semibold text-ink/70">
          {t("color.size")}
        </p>
        <div className="flex gap-2">
          {(
            [
              ["fine", "color.fine"],
              ["medium", "color.medium"],
              ["broad", "color.broad"],
            ] as const
          ).map(([id, key]) => (
            <button
              key={id}
              type="button"
              aria-pressed={sizeId === id}
              disabled={mode === "pan"}
              onClick={() => onSizeChange(id)}
              className={`${cell} ${
                sizeId === id ? "bg-ink text-on-accent" : "text-ink"
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={onFit} className="btn-tertiary w-full">
        {t("color.resetView")}
      </button>
    </div>
  );
}
