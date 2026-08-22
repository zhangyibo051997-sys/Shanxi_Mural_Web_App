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
    <div className="pointer-events-none relative z-10 flex flex-col items-center px-4 pt-20 text-center md:pt-[5.25rem]">
      <h1 lang={lang} className="type-page">
        {isCompare ? t("color.compareHeader") : t("color.header")}
      </h1>
    </div>
  );
}
