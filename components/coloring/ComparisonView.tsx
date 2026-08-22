"use client";

import Image from "next/image";
import { coloringArtwork } from "@/data/coloringArtwork";
import type { ScoreResult } from "@/utils/colorScoring";
import ScorePanel from "./ScorePanel";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface ComparisonViewProps {
  userPaintUrl: string;
  userCompositeUrl: string;
  score: ScoreResult;
  onRetry: () => void;
  onDownload: () => void;
  onDeityInfo: () => void;
  onBackInteractive: () => void;
}

export default function ComparisonView({
  userCompositeUrl,
  score,
  onRetry,
  onDownload,
  onDeityInfo,
  onBackInteractive,
}: ComparisonViewProps) {
  const { t } = useLocale();

  return (
    <div className="bg-parchment pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8">
          <h2 className="type-page">
            {t("color.yourColor")}
          </h2>
          <p className="type-ui mt-2 text-ink/70">
            {t("color.compareHint")}
          </p>
          <p className="type-caption mt-2 text-ink/70">
            {t("color.comparisonNote")}
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <figure>
            <figcaption className="type-section mb-2">
              {t("color.mine")}
            </figcaption>
            <div className="relative aspect-[3/4] overflow-hidden border border-ink/10 bg-rice">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={userCompositeUrl}
                alt={t("color.mineAlt")}
                className="h-full w-full object-contain"
              />
            </div>
          </figure>
          <figure>
            <figcaption className="type-section mb-2">
              {t("color.original")}
            </figcaption>
            <div className="relative aspect-[3/4] overflow-hidden border border-ink/10 bg-rice">
              <Image
                src={coloringArtwork.originalSrc}
                alt={t("color.originalAlt")}
                fill
                className="object-contain"
                sizes="(max-width:768px) 100vw, 50vw"
              />
            </div>
          </figure>
        </div>

        <div className="mt-8">
          <ScorePanel score={score} />
        </div>

        <p className="mt-6 max-w-2xl font-serif text-sm leading-relaxed text-ink/70">
          {t("color.compareBody")}
        </p>

        <div className="mt-8 flex flex-wrap gap-2 pb-4">
          <ActionBtn onClick={onRetry}>{t("color.retry")}</ActionBtn>
          <ActionBtn onClick={onDownload}>{t("color.saveWork")}</ActionBtn>
          <ActionBtn onClick={onDeityInfo}>{t("color.deityInfo")}</ActionBtn>
          <ActionBtn href="/">{t("color.exploreYongle")}</ActionBtn>
          <ActionBtn onClick={onBackInteractive}>
            {t("color.backInteractive")}
          </ActionBtn>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const cls =
    "btn-secondary";
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
