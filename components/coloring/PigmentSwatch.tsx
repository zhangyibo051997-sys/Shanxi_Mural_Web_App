"use client";

import type { PigmentColor } from "@/data/coloringPalette";

type PigmentSwatchProps = {
  color: PigmentColor;
  selected: boolean;
  dimmed?: boolean;
  interactive?: boolean;
  onSelect?: (color: PigmentColor) => void;
};

export default function PigmentSwatch({
  color,
  selected,
  dimmed = false,
  interactive = true,
  onSelect,
}: PigmentSwatchProps) {
  const isWhite = color.id === "wall-white";

  return (
    <button
      type="button"
      disabled={!interactive}
      aria-pressed={selected}
      aria-label={`${color.nameZh} ${color.nameEn} ${color.value}`}
      onClick={() => onSelect?.(color)}
      className={`flex min-h-11 min-w-11 flex-col items-center gap-1 transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cinnabar disabled:cursor-default ${
        selected ? "-translate-y-0.5" : ""
      } ${dimmed ? "opacity-30" : "opacity-100"}`}
    >
      <span
        className={`block h-8 w-8 rounded-full md:h-9 md:w-9 ${
          selected ? "ring-2 ring-offset-2 ring-on-accent ring-offset-ink" : ""
        }`}
        style={{
          backgroundColor: color.value,
          boxShadow: selected
            ? "0 3px 8px rgba(0,0,0,0.28)"
            : "inset 0 1px 2px rgba(255,255,255,0.18), 0 1px 2px rgba(0,0,0,0.25)",
          border: isWhite ? "1px solid rgba(238,232,220,0.55)" : "1px solid rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
