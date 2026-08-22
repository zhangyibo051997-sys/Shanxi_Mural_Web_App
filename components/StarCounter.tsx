"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAX_STARS, useGameProgress } from "@/hooks/useGameProgress";
import { useLocale } from "@/components/i18n/LocaleProvider";

export default function StarCounter() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { progress } = useGameProgress();
  const stars = Math.min(MAX_STARS, progress.stars);
  const label = t("nav.starsAria", { stars, max: MAX_STARS });
  const className = "nav-chip gap-2";

  const content = Array.from({ length: MAX_STARS }, (_, index) => (
    <span
      key={index}
      className={index < stars ? "text-gold" : "text-ink/20"}
      aria-hidden="true"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
        <path d="M9 1.6 11.1 6l4.9.7-3.5 3.4.8 4.9L9 12.7 4.7 15l.8-4.9L2 6.7 6.9 6 9 1.6Z" />
      </svg>
    </span>
  ));

  if (pathname === "/postcards") {
    return (
      <div id="star-hud" className={className} aria-current="page" aria-label={label}>
        {content}
      </div>
    );
  }

  return (
    <Link id="star-hud" href="/postcards" className={className} aria-label={label}>
      {content}
    </Link>
  );
}
