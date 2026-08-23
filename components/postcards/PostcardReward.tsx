"use client";

import { useEffect, useRef } from "react";
import type { PostcardAsset } from "@/lib/postcards";
import PostcardShare from "./PostcardShare";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { locCollectedTitle } from "@/lib/i18n/localize";

interface PostcardRewardProps {
  postcard: PostcardAsset;
  alreadyCollected: boolean;
  onCollect: () => void;
}

export default function PostcardReward({
  postcard,
  alreadyCollected,
  onCollect,
}: PostcardRewardProps) {
  const { locale, t } = useLocale();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-ink/40 px-5 py-8">
      <div className="flex min-h-full items-center justify-center">
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("postcard.congratsAria")}
        tabIndex={-1}
        className="surface-card relative my-auto w-[calc(100vw-32px)] max-h-[calc(100svh-4rem)] max-w-[400px] overflow-y-auto rounded px-6 py-6 text-center shadow-overlay md:px-8 md:py-7"
      >
        <p className="type-meta text-gold">
          {t("postcard.rewardEyebrow")}
        </p>
        <h2 className="type-page mt-2">{t("postcard.congrats")}</h2>
        <p className="type-body mt-4 text-ink">
          {t("postcard.congratsBody")}
        </p>

        <div className="mt-5 overflow-hidden border border-stone/15 bg-parchment/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={postcard.src}
            alt={locCollectedTitle(locale, postcard.id, postcard.title)}
            className="mx-auto max-h-[min(42svh,280px)] w-auto max-w-full object-contain"
          />
        </div>
        <p className="type-card mt-3">
          {locCollectedTitle(locale, postcard.id, postcard.title)}
        </p>

        <PostcardShare postcard={postcard} />

        <button
          type="button"
          onClick={onCollect}
          className="btn-primary mt-6 w-full"
        >
          {alreadyCollected ? t("postcard.continue") : t("postcard.collect")}
        </button>
      </div>
      </div>
    </div>
  );
}
