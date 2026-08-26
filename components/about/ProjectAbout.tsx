"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import FixedNavigation from "@/components/FixedNavigation";
import TextureBackground from "@/components/TextureBackground";
import PublicationBooklet from "@/components/about/PublicationBooklet";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  ABOUT_MORPH_OVERLAY_ID,
  createAboutMorphOverlay,
  getAboutButtonFallbackRect,
  markAboutReturnExpand,
  peekAboutButtonRect,
  removeAboutMorphOverlay,
  takeAboutButtonRect,
} from "@/lib/aboutMorph";

type AboutTab = "summary" | "publication";

export default function ProjectAbout() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const lang = locale === "zh" ? "zh-CN" : locale === "it" ? "it" : "en";
  const [tab, setTab] = useState<AboutTab>("summary");
  const [contentReady, setContentReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const isPublication = tab === "publication";
  const articleRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const article = articleRef.current;
    const overlay = document.getElementById(ABOUT_MORPH_OVERLAY_ID);
    const prefersReduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!article) {
      removeAboutMorphOverlay();
      setContentReady(true);
      return;
    }

    if (!overlay || prefersReduce) {
      removeAboutMorphOverlay();
      setContentReady(true);
      return;
    }

    gsap.set(article, { opacity: 0 });
    if (bodyRef.current) gsap.set(bodyRef.current, { opacity: 0 });

    const timeline = gsap.timeline({
      onComplete: () => {
        removeAboutMorphOverlay();
        gsap.set(article, { clearProps: "opacity" });
        setContentReady(true);
      },
    });

    timeline.to(
      article,
      {
        opacity: 1,
        duration: 0.28,
        ease: "power2.out",
      },
      0.02
    );
    timeline.to(
      overlay,
      {
        opacity: 0,
        duration: 0.28,
        ease: "power2.out",
      },
      0.02
    );
    if (bodyRef.current) {
      timeline.to(
        bodyRef.current,
        {
          opacity: 1,
          duration: 0.36,
          ease: "power2.out",
        },
        0.12
      );
    }

    return () => {
      timeline.kill();
    };
  }, []);

  const handleBack = () => {
    if (leaving) return;

    const prefersReduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    markAboutReturnExpand();

    if (prefersReduce) {
      takeAboutButtonRect();
      router.push("/");
      return;
    }

    const article = articleRef.current;
    if (!article) {
      router.push("/");
      return;
    }

    setLeaving(true);
    const from = article.getBoundingClientRect();
    const target =
      peekAboutButtonRect() ?? takeAboutButtonRect() ?? getAboutButtonFallbackRect();

    if (bodyRef.current) {
      gsap.to(bodyRef.current, {
        opacity: 0,
        duration: 0.18,
        ease: "power2.in",
      });
    }

    const overlay = createAboutMorphOverlay({
      left: from.left,
      top: from.top,
      width: from.width,
      height: from.height,
    });
    overlay.style.borderRadius = "16px";
    gsap.set(article, { opacity: 0 });

    let navigated = false;
    const goHome = () => {
      if (navigated) return;
      navigated = true;
      takeAboutButtonRect();
      router.push("/");
    };

    gsap.to(overlay, {
      top: target.top,
      left: target.left,
      width: target.width,
      height: target.height,
      borderRadius: 999,
      duration: 0.62,
      ease: "power3.inOut",
      onUpdate() {
        // Overlap remount with the end of the shrink so expand can start sooner.
        if (this.progress() >= 0.72) goHome();
      },
      onComplete: goHome,
    });
  };

  return (
    <div className="collection-root relative h-svh overflow-hidden">
      <TextureBackground />
      <FixedNavigation variant="collection" hideBack />

      <main
        className={`absolute inset-0 z-10 flex justify-center px-4 pb-6 pt-[4.75rem] md:px-6 md:pt-24 ${
          isPublication ? "items-stretch" : "items-center"
        }`}
      >
        <article
          ref={articleRef}
          className={`flex w-full flex-col overflow-hidden rounded-2xl border border-ink/12 bg-rice shadow-[0_18px_40px_rgb(33_51_56_/_18%)] transition-[max-width] duration-300 ${
            isPublication
              ? "h-full min-h-0 max-w-[92rem]"
              : "max-h-full max-w-2xl"
          }`}
        >
          <div
            ref={bodyRef}
            className="flex min-h-0 flex-1 flex-col"
            style={contentReady ? undefined : { opacity: 0 }}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink/10 px-6 py-4 md:px-8">
              <nav
                className="flex min-w-0 flex-wrap items-center gap-2"
                aria-label={t("nav.about")}
              >
                <button
                  type="button"
                  className={`hud-badge type-ui transition-colors ${
                    tab === "summary"
                      ? "hud-badge--cinnabar"
                      : "hover:border-ink/30"
                  }`}
                  aria-pressed={tab === "summary"}
                  onClick={() => setTab("summary")}
                >
                  {t("about.tabSummary")}
                </button>
                <button
                  type="button"
                  className={`hud-badge type-ui transition-colors ${
                    tab === "publication"
                      ? "hud-badge--cinnabar"
                      : "hover:border-ink/30"
                  }`}
                  aria-pressed={tab === "publication"}
                  onClick={() => setTab("publication")}
                >
                  {t("about.tabPublication")}
                </button>
              </nav>

              <button
                type="button"
                aria-label={t("match.reselect")}
                disabled={leaving}
                onClick={handleBack}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-rice text-ink/75 shadow-[0_8px_24px_rgb(33_51_56_/_12%)] transition-colors hover:border-ink/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M11.2 3.6 5.2 9l6 5.4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div
              className={`flex min-h-0 flex-1 flex-col ${
                isPublication
                  ? "overflow-hidden px-2 py-2 md:px-3 md:py-3"
                  : "overflow-y-auto px-6 py-6 md:px-8 md:py-8"
              }`}
            >
              {tab === "summary" ? (
                <>
                  <p className="type-meta text-cinnabar">{t("about.eyebrow")}</p>
                  <h1 lang={lang} className="type-page mt-2">
                    {t("about.title")}
                  </h1>
                  <p lang={lang} className="type-body mt-4 text-ink/80">
                    {t("about.lead")}
                  </p>

                  <section className="mt-6 border-t border-ink/10 pt-5">
                    <h2 className="type-meta text-gold">
                      {t("about.projectTitle")}
                    </h2>
                    <p lang={lang} className="type-body mt-2 text-ink/80">
                      {t("about.projectBody")}
                    </p>
                  </section>

                  <section className="mt-5">
                    <h2 className="type-meta text-gold">{t("about.playTitle")}</h2>
                    <p lang={lang} className="type-body mt-2 text-ink/80">
                      {t("about.playBody")}
                    </p>
                  </section>

                  <section className="mt-5">
                    <h2 className="type-meta text-gold">
                      {t("about.collectTitle")}
                    </h2>
                    <p lang={lang} className="type-body mt-2 text-ink/80">
                      {t("about.collectBody")}
                    </p>
                  </section>

                  <p
                    lang={lang}
                    className="type-ui mt-6 border-t border-ink/10 pt-5 text-cinnabar"
                  >
                    {t("about.close")}
                  </p>
                </>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-parchment/55 px-1.5 py-1.5 md:px-3 md:py-2">
                  <PublicationBooklet />
                </div>
              )}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
