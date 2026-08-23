"use client";

import { useState } from "react";
import Link from "next/link";
import { useGameProgress } from "@/hooks/useGameProgress";
import type { CollectedPostcard, CollectedSticker } from "@/hooks/useGameProgress";
import PostcardShare from "./PostcardShare";
import FixedNavigation from "@/components/FixedNavigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { locCollectedTitle } from "@/lib/i18n/localize";

type ActiveItem =
  | { kind: "postcard"; item: CollectedPostcard }
  | { kind: "sticker"; item: CollectedSticker };

function fileNameFromSrc(src: string, fallback: string) {
  const raw = src.split("/").pop() ?? fallback;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function PostcardAlbum() {
  const { locale, t } = useLocale();
  const { progress, clearPostcards, clearStickers } = useGameProgress();
  const [active, setActive] = useState<ActiveItem | null>(null);
  const [confirming, setConfirming] = useState<"postcard" | "sticker" | null>(
    null
  );
  const cards = progress.collectedPostcards;
  const stickers = progress.collectedStickers;

  return (
    <div className="collection-root h-svh overflow-y-auto bg-parchment">
      <FixedNavigation />

      <main className="page-shell pb-16 pt-24 md:pt-28">
        <p className="type-meta font-semibold tracking-[0.04em] text-cinnabar">
          {t("postcard.albumEyebrow")}
        </p>
        <h1 className="type-page mt-2">
          {t("postcard.albumTitle")}
        </h1>
        <p className="type-body mt-4 max-w-[680px] text-ink/80">
          {t("postcard.albumLead")}
        </p>

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-12">
          <section
            className="md:pr-6 lg:pr-12"
            aria-labelledby="postcards-heading"
          >
            <p className="type-meta text-gold">
              {t("postcard.section")}
            </p>
            <h2
              id="postcards-heading"
              className="type-section mt-2"
            >
              {t("postcard.section")}
            </h2>
            {cards.length === 0 ? (
              <div className="surface-card mt-6 px-8 py-8 text-center">
                <p className="type-card">{t("postcard.empty")}</p>
                <p className="type-body mt-2 text-ink/80">
                  {t("postcard.emptyHint")}
                </p>
              </div>
            ) : (
              <ul className="mt-6 grid grid-cols-1 gap-5">
                {cards.map((card) => (
                  <li key={card.id}>
                    <button
                      type="button"
                      onClick={() => setActive({ kind: "postcard", item: card })}
                      className="group w-full overflow-hidden border border-[var(--color-border)] bg-rice text-left shadow-none transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-hover"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.src}
                        alt={locCollectedTitle(locale, card.id, card.title)}
                        className={`w-full bg-parchment/80 object-contain ${
                          card.orientation === "portrait"
                            ? "mx-auto max-h-[320px] aspect-[3/4]"
                            : "aspect-[3/2]"
                        }`}
                      />
                      <span className="type-card block px-4 py-3">
                        {locCollectedTitle(locale, card.id, card.title)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            className="md:border-l md:border-[rgb(33_51_56_/_18%)] md:pl-6 lg:pl-12"
            aria-labelledby="stickers-heading"
          >
            <p className="type-meta text-gold">
              {t("postcard.stickers")}
            </p>
            <h2
              id="stickers-heading"
              className="type-section mt-2"
            >
              {t("postcard.stickers")}
            </h2>
            {stickers.length === 0 ? (
              <div className="surface-card mt-6 px-8 py-8 text-center">
                <p className="type-card">{t("postcard.stickersEmpty")}</p>
                <p className="type-body mt-2 text-ink/80">
                  {t("postcard.stickersHint")}
                </p>
              </div>
            ) : (
              <ul className="mt-6 grid grid-cols-2 gap-4">
                {stickers.map((sticker) => (
                  <li key={sticker.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setActive({ kind: "sticker", item: sticker })
                      }
                      className="w-full overflow-hidden border border-[rgb(33_51_56_/_18%)] bg-rice text-left shadow-none transition-[box-shadow] duration-200 ease-out hover:shadow-hover"
                    >
                      <span className="flex aspect-square items-center justify-center bg-parchment/80 p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sticker.src}
                        alt={locCollectedTitle(locale, sticker.id, sticker.title)}
                        className="max-h-full max-w-full object-contain"
                      />
                    </span>
                    <span className="type-ui block px-3 py-2.5">
                      {locCollectedTitle(locale, sticker.id, sticker.title)}
                    </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {stickers.length === 0 && cards.length === 0 && (
          <div className="mt-10 text-center">
            <Link
              href="/"
              className="btn-primary"
            >
              {t("postcard.backCover")}
            </Link>
          </div>
        )}

        <div className="mt-16 flex flex-col items-center gap-3 border-t border-[rgb(33_51_56_/_18%)] pt-8 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={cards.length === 0}
            onClick={() => {
              if (confirming === "postcard") {
                clearPostcards();
                setActive(null);
                setConfirming(null);
                return;
              }
              setConfirming("postcard");
            }}
            className="btn-danger min-w-[12rem]"
          >
            {confirming === "postcard" ? t("postcard.clearConfirm") : t("postcard.clear")}
          </button>
          <button
            type="button"
            disabled={stickers.length === 0}
            onClick={() => {
              if (confirming === "sticker") {
                clearStickers();
                setActive(null);
                setConfirming(null);
                return;
              }
              setConfirming("sticker");
            }}
            className="btn-danger min-w-[12rem]"
          >
            {confirming === "sticker" ? t("postcard.clearStickersConfirm") : t("postcard.clearStickers")}
          </button>
        </div>
        {confirming && (
          <p className="type-caption mt-3 text-center text-ink/70">
            {t("postcard.clearHint")}
          </p>
        )}
      </main>

      {active && (
        <div
          className="fixed inset-0 z-[90] overflow-y-auto bg-ink/40 px-5 py-8"
          role="presentation"
          onClick={() => setActive(null)}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-label={active.item.title}
              className={`surface-card relative my-auto w-[calc(100vw-32px)] max-h-[calc(100svh-4rem)] overflow-y-auto rounded px-6 py-6 text-center shadow-overlay md:px-8 md:py-7 ${
                active.kind === "postcard" &&
                active.item.orientation === "portrait"
                  ? "max-w-[360px]"
                  : "max-w-[min(92vw,520px)]"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label={t("nav.close")}
                className="btn-icon absolute right-3 top-3 border-0 bg-transparent text-ink/60 hover:text-cinnabar"
              >
                ×
              </button>
              <div
                className={
                  active.kind === "sticker"
                    ? "mt-6 flex items-center justify-center border border-stone/15 bg-parchment/80 p-4"
                    : "mt-6"
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.item.src}
                  alt={active.item.title}
                  className={
                    active.kind === "sticker"
                      ? "max-h-[min(36svh,240px)] w-auto max-w-full object-contain"
                      : active.item.orientation === "portrait"
                        ? "mx-auto max-h-[min(52svh,420px)] w-auto max-w-full border border-stone/15 object-contain"
                        : "mx-auto max-h-[min(40svh,280px)] w-auto max-w-full border border-stone/15 object-contain"
                  }
                />
              </div>
              <p className="type-card mt-4">
                {locCollectedTitle(locale, active.item.id, active.item.title)}
              </p>
              <p className="type-meta mt-2 text-gold">
                {active.kind === "sticker"
                  ? t("postcard.kindSticker")
                  : t("postcard.kindPostcard")}
              </p>
              <PostcardShare
                kind={active.kind}
                postcard={{
                  id: active.item.id,
                  src: active.item.src,
                  title: active.item.title,
                  fileName:
                    active.kind === "sticker"
                      ? active.item.fileName
                      : fileNameFromSrc(active.item.src, `${active.item.id}.png`),
                }}
              />
              <button
                type="button"
                onClick={() => setActive(null)}
                className="btn-secondary mt-5"
              >
                {t("nav.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
