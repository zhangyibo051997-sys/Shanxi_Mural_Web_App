"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

type ColoringHeaderProps = {
  stage: "coloring" | "comparison";
};

export default function ColoringHeader({ stage }: ColoringHeaderProps) {
  const { locale, t } = useLocale();
  const isCompare = stage === "comparison";
  const lang = locale === "zh" ? "zh-CN" : locale === "it" ? "it" : "en";

  return (
    <div className="relative z-10 flex shrink-0 flex-col items-center px-4 pb-1 pt-1 text-center md:pb-2 md:pt-2">
      <p lang={lang} className="type-meta text-ink/70">
        {t("interactive.colorHint")}
      </p>
      <h1 lang={lang} className="type-page mt-1 md:mt-2">
        {isCompare ? t("color.compareHeader") : t("color.header")}
      </h1>
      <p lang={lang} className="type-ui mt-1 max-w-2xl text-balance text-ink/70 md:mt-2">
        {isCompare ? t("color.compareHint") : t("color.intro")}
      </p>
      {isCompare ? (
        <p lang={lang} className="type-caption mt-2 max-w-2xl text-balance text-ink/70">
          {t("color.compareBody")}
        </p>
      ) : null}
    </div>
  );
}
