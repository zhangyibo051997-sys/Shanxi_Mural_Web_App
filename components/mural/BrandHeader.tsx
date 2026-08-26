"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

interface BrandHeaderProps {
  mode: "cover" | "home";
  onLogoClick?: () => void;
}

export default function BrandHeader({ mode, onLogoClick }: BrandHeaderProps) {
  const { locale, t } = useLocale();
  const coverSrc =
    locale === "zh" ? "/images/cover-logo-zh.png" : "/images/cover-logo-en.png";

  return (
    <button
      type="button"
      data-brand-header=""
      onClick={onLogoClick}
      className="block shrink-0 transition-transform duration-300 ease-out hover:scale-[1.04]"
      aria-label={t("brand.backToCover")}
    >
      {mode === "cover" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverSrc}
          alt={t("brand.logoAlt")}
          width={230}
          height={48}
          className="h-9 w-auto max-w-[180px] object-contain object-left md:h-10"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/Jin_logo.png"
          alt={t("brand.logoAlt")}
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
        />
      )}
    </button>
  );
}
