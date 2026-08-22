"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";

type NavMarkProps = {
  onClick?: () => void;
  href?: string;
};

export default function NavMark({ onClick, href = "/" }: NavMarkProps) {
  const { t } = useLocale();
  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/Jin_logo.png"
      alt={t("brand.logoAlt")}
      width={36}
      height={36}
      className="h-9 w-9 object-contain"
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar"
        aria-label={t("brand.backToCover")}
      >
        {mark}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="block transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar"
      aria-label={t("brand.backToHome")}
    >
      {mark}
    </Link>
  );
}
