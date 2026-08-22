"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

type CanvasControlsProps = {
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
};

export default function CanvasControls({
  canUndo,
  onUndo,
  onClear,
}: CanvasControlsProps) {
  const { t } = useLocale();
  return (
    <div
      className="pointer-events-auto absolute bottom-3 left-3 z-20 flex flex-col gap-2"
      role="toolbar"
      aria-label={t("color.controls")}
    >
      <button
        type="button"
        className="btn-icon"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label={t("color.undo")}
      >
        <span className="text-[18px]" aria-hidden="true">
          ↺
        </span>
      </button>
      <button
        type="button"
        className="btn-icon type-ui"
        onClick={onClear}
        aria-label={t("color.clear")}
      >
        {t("color.clearShort")}
      </button>
    </div>
  );
}
