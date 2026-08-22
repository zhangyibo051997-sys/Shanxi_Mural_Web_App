"use client";

import { useEffect, useRef } from "react";
import { locMural } from "@/lib/i18n/localize";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Mural } from "@/data/murals";

interface MatchingFeedbackProps {
  result: "correct" | "incorrect";
  earnedStar: boolean;
  mural?: Mural | null;
  onDismiss: () => void;
  onLearnMore: () => void;
  onChooseAnother: () => void;
}

export default function MatchingFeedback({
  result,
  earnedStar,
  mural,
  onDismiss,
  onLearnMore,
  onChooseAnother,
}: MatchingFeedbackProps) {
  const { locale, t } = useLocale();
  const cardRef = useRef<HTMLDivElement>(null);
  const isCorrect = result === "correct";
  const localized = mural ? locMural(locale, mural) : null;
  const lang = locale === "zh" ? "zh-CN" : locale === "it" ? "it" : "en";

  useEffect(() => {
    cardRef.current?.focus();
  }, [result]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-parchment/30 px-4 backdrop-contrast-75"
      role="presentation"
      onClick={isCorrect ? undefined : onDismiss}
    >
      <div
        ref={cardRef}
        role={isCorrect ? "dialog" : "status"}
        aria-modal={isCorrect ? true : undefined}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="surface-card relative w-[calc(100vw-32px)] max-w-[400px] rounded p-8 text-center shadow-overlay md:w-[380px]"
      >
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("nav.close")}
          className="btn-icon absolute right-3 top-3 border-0 bg-transparent text-ink/60 hover:text-cinnabar"
        >
          ×
        </button>

        <span
          className={`mx-auto flex h-9 w-9 items-center justify-center border ${
            isCorrect
              ? "border-gold/40 text-gold"
              : "border-cinnabar/35 text-cinnabar"
          }`}
          aria-hidden="true"
        >
          {isCorrect ? "★" : "×"}
        </span>

        <p
          className={`type-meta mt-5 ${
            isCorrect ? "text-gold" : "text-cinnabar"
          }`}
        >
          {isCorrect
            ? earnedStar
              ? t("match.foundLabel")
              : t("match.again")
            : t("match.oops")}
        </p>
        <h2 lang={lang} className="type-page mt-2">
          {isCorrect
            ? t("match.correctTitle", {
                muralTitle: localized?.title || "",
              })
            : t("match.wrongTitle")}
        </h2>
        <p lang={lang} className="type-body mt-2 text-ink">
          {isCorrect
            ? earnedStar
              ? t("match.correctBody")
              : t("match.correctBodyRepeat")
            : t("match.wrongBody")}
        </p>

        {isCorrect && localized && (
          <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4 text-left">
            <p lang={lang} className="type-card">
              {localized.title}
            </p>
            <p className="type-meta mt-2 text-gold">
              {localized.templeName}
              {localized.location ? ` · ${localized.location}` : ""}
              {localized.period ? ` · ${localized.period}` : ""}
            </p>
            {localized.description && (
              <p lang={lang} className="type-body mt-3 text-ink/80">
                {localized.description}
              </p>
            )}
          </div>
        )}

        {isCorrect ? (
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={onLearnMore} className="btn-primary">
              {t("match.viewMural")}
            </button>
            <button
              type="button"
              onClick={onChooseAnother}
              className="btn-secondary"
            >
              {t("match.chooseAnother")}
            </button>
          </div>
        ) : (
          <button type="button" onClick={onDismiss} className="btn-secondary mt-7">
            {t("match.keepLooking")}
          </button>
        )}
      </div>
    </div>
  );
}
