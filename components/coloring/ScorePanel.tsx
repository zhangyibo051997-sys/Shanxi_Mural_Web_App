"use client";

import type { ScoreResult } from "@/utils/colorScoring";
import { coloringArtwork } from "@/data/coloringArtwork";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { locColoringRegion } from "@/lib/i18n/localize";

interface ScorePanelProps {
  score: ScoreResult;
}

export default function ScorePanel({ score }: ScorePanelProps) {
  const { locale, t } = useLocale();
  const lowCompletion =
    score.completion < coloringArtwork.completionThreshold * 100;

  return (
    <div className="rounded-sm border border-ink/10 bg-rice/80 p-5 backdrop-blur-sm">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={t("color.statSim")} value={score.colorSimilarity} />
        <Stat label={t("color.statFill")} value={score.completion} suffix="%" />
        <Stat label={t("color.statFinal")} value={score.finalScore} highlight />
      </div>

      {lowCompletion && (
        <p className="type-caption mt-4 text-gold">
          {t("color.scoreNote")}
        </p>
      )}

      <p className="type-body mt-4 text-ink/80">
        {t(
          score.colorSimilarity >= 75
            ? "color.evalHigh"
            : score.colorSimilarity >= 50
              ? "color.evalMid"
              : "color.evalLow"
        )}
      </p>

      {score.bestRegion && (
        <p className="type-caption mt-3 text-ink/70">
          {t("color.best", {
            name: locColoringRegion(
              locale,
              score.bestRegion.id,
              score.bestRegion.name
            ),
            sim: score.bestRegion.similarity,
          })}
        </p>
      )}
      {score.worstRegion && score.worstRegion.id !== score.bestRegion?.id && (
        <p className="type-caption text-ink/70">
          {t("color.worst", {
            name: locColoringRegion(
              locale,
              score.worstRegion.id,
              score.worstRegion.name
            ),
            sim: score.worstRegion.similarity,
          })}
        </p>
      )}

      <p className="type-caption mt-4 border-t border-[var(--color-border-subtle)] pt-4 text-ink/70">
        {t("color.scoreFoot")}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix = "",
  highlight = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="type-meta text-ink/70">{label}</p>
      <p
        className={`mt-1 font-serif text-2xl ${
          highlight ? "text-cinnabar" : "text-ink"
        }`}
      >
        {value}
        {suffix}
      </p>
    </div>
  );
}
