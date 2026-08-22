"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import type { Figure } from "@/data/murals";
import { locFigure } from "@/lib/i18n/localize";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface SelectedFigureCardProps {
  figure: Figure;
  sourceRect: DOMRect | null;
  reducedMotion: boolean;
  onClose: () => void;
}

export default function SelectedFigureCard({
  figure,
  sourceRect,
  reducedMotion,
  onClose,
}: SelectedFigureCardProps) {
  const { locale, t } = useLocale();
  const copy = locFigure(locale, figure);
  const cardRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (reducedMotion || !sourceRect) {
      gsap.set(card, { opacity: 1, clearProps: "transform" });
      gsap.set(bodyRef.current, { opacity: 1 });
      return;
    }

    const target = card.getBoundingClientRect();
    const scaleX = sourceRect.width / Math.max(target.width, 1);
    const scaleY = sourceRect.height / Math.max(target.height, 1);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        card,
        {
          x: sourceRect.left - target.left,
          y: sourceRect.top - target.top,
          scaleX,
          scaleY,
          transformOrigin: "0 0",
          opacity: 1,
        },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.78,
          ease: "power3.inOut",
          clearProps: "transform",
        }
      );
      gsap.fromTo(
        bodyRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, delay: 0.5, ease: "power2.out" }
      );
    }, card);

    return () => ctx.revert();
  }, [figure.id, reducedMotion, sourceRect]);

  return (
    <aside
      ref={cardRef}
      className="fixed left-4 right-4 top-[4.5rem] z-40 flex max-h-[26svh] border border-[var(--color-border)] bg-rice shadow-figure md:bottom-auto md:left-10 md:right-auto md:top-28 md:block md:max-h-none md:w-[288px]"
      aria-label={t("match.figureAria", { name: copy.displayName })}
    >
      <div className="flex h-24 w-[38%] shrink-0 items-center justify-center bg-parchment/70 p-4 md:h-60 md:w-full md:p-4">
        {figure.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={figure.image}
            alt={copy.imageAlt ?? copy.displayName}
            draggable={false}
            className="h-full w-full select-none object-contain"
          />
        ) : (
          <div
            className="h-full max-h-52 w-[42%] min-w-10 bg-[#B7AFA3]"
            aria-hidden="true"
          />
        )}
      </div>

      <div ref={bodyRef} className="min-w-0 flex-1 overflow-y-auto px-4 py-3 md:p-6">
        <p className="type-meta text-cinnabar">
          {t("detail.selectedFigure")}
        </p>
        <h2 className="type-card mt-2">
          {copy.displayName}
        </h2>
        {copy.category && (
          <p className="type-meta mt-2 text-gold">
            {copy.category}
          </p>
        )}
        <p className="type-body mt-3 line-clamp-4 text-ink/80 md:line-clamp-none">
          {copy.shortDescription}
        </p>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label={t("match.backHome")}
        className="btn-icon absolute bottom-1 right-1 z-10 border-0 bg-transparent text-ink/60 hover:text-cinnabar"
      >
        ×
      </button>
    </aside>
  );
}
