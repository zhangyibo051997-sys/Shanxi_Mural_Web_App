"use client";

import ColorSimilarityRating from "./ColorSimilarityRating";
import { useLocale } from "@/components/i18n/LocaleProvider";

type OriginalMuralPanelProps = {
  originalUrl: string;
  figureName: string;
  templeName: string;
  stars: number;
  incomplete: boolean;
  revealStars: boolean;
};

export default function OriginalMuralPanel({
  originalUrl,
  figureName,
  templeName,
  stars,
  incomplete,
  revealStars,
}: OriginalMuralPanelProps) {
  const { t } = useLocale();
  return (
    <section
      data-coloring-original
      className="flex flex-col items-center coloring-original-enter"
    >
      <h2 className="type-section shrink-0">
        {t("color.original")}
      </h2>
      <div className="relative mt-6 aspect-[3/4] w-full max-h-[min(48svh,380px)] overflow-hidden rounded-[2px] border border-[var(--color-border)] bg-rice">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={originalUrl}
          alt={t("color.originalFigAlt", { temple: templeName, figure: figureName })}
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
      <ColorSimilarityRating
        stars={stars}
        incomplete={incomplete}
        reveal={revealStars}
      />
    </section>
  );
}
