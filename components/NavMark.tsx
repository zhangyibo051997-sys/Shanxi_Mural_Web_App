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
      data-nav-mark=""
      src="/images/Jin_logo.png"
      alt={t("brand.logoAlt")}
      width={36}
      height={36}
      className="h-9 w-9 object-contain md:h-10 md:w-10"
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block min-h-11 min-w-11 transition-transform duration-300 ease-out hover:scale-110"
        aria-label={t("brand.backToCover")}
      >
        {mark}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="block min-h-11 min-w-11 transition-transform duration-300 ease-out hover:scale-110"
      aria-label={t("brand.backToHome")}
    >
      {mark}
    </Link>
  );
}
