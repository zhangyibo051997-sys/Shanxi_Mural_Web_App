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
  const isZh = locale === "zh";

  return (
    <div
      ref={chromeRef}
      className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center"
      style={transitioning ? undefined : { opacity: visible ? 1 : 0 }}
      aria-hidden={!visible}
    >
      <div className="relative z-10 flex w-full max-w-2xl translate-y-2 flex-col items-center px-6 text-center md:translate-y-3">
        <h1
          className="font-sans text-[2.15rem] font-bold leading-none tracking-[0.12em] md:text-[3.15rem] lg:text-[3.45rem]"
          aria-label={isZh ? "晋壁画博物馆" : "JIN MUSEUM"}
        >
          {isZh ? (
            <>
              <span className="text-cinnabar">晋壁画</span>
              <span className="text-stone">博物馆</span>
            </>
          ) : (
            <>
              <span className="text-cinnabar">JIN</span>
              <span className="ml-[0.28em] text-stone">MUSEUM</span>
            </>
          )}
        </h1>
        <p className="mt-5 max-w-[28rem] font-serif text-[13px] leading-relaxed text-ink/60 md:mt-6 md:max-w-[32rem] md:text-sm">
          {t("cover.lead")}
        </p>
        <div
          className={`mt-6 md:mt-7 ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
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
