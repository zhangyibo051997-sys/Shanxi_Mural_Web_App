"use client";

import StartExploreButton from "./StartExploreButton";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface CoverIntroProps {
  visible: boolean;
  pressed: boolean;
  transitioning: boolean;
  onStart: () => void;
  chromeRef: React.RefObject<HTMLDivElement | null>;
}

export default function CoverIntro({
  visible,
  pressed,
  transitioning,
  onStart,
  chromeRef,
}: CoverIntroProps) {
  const { locale, t } = useLocale();
  const titleLang = locale === "zh" ? "zh-CN" : locale === "it" ? "it" : "en";

  return (
    <div
      ref={chromeRef}
      className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center"
      style={transitioning ? undefined : { opacity: visible ? 1 : 0 }}
      aria-hidden={!visible}
    >
      <div className="relative z-10 flex w-full max-w-[680px] flex-col items-center px-4 text-center md:px-6">
        <h1
          lang={titleLang}
          className="type-display max-w-[680px]"
          aria-label={t("cover.title")}
        >
          {locale === "zh" ? (
            <>
              <span className="text-cinnabar">晋壁画</span>
              <span>博物馆</span>
            </>
          ) : (
            <>
              <span className="text-cinnabar">JIN</span>
              <span className="ml-[0.28em]">MUSEUM</span>
            </>
          )}
        </h1>
        <p
          lang="en"
          className="type-meta-en mt-3 text-[rgb(33_51_56_/_70%)]"
        >
          {t("cover.subtitle")}
        </p>
        <p lang={titleLang} className="type-body mt-4 max-w-[32rem] text-ink/80">
          {t("cover.lead")}
        </p>
        <div
          className={`mt-6 ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
        >
          <StartExploreButton
            onClick={onStart}
            disabled={!visible || pressed}
            pressed={pressed}
          />
        </div>
      </div>
    </div>
  );
}
