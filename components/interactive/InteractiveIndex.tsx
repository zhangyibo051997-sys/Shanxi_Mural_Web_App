"use client";

import Link from "next/link";
import FixedNavigation from "@/components/FixedNavigation";
import { useLocale } from "@/components/i18n/LocaleProvider";

export default function InteractiveIndex() {
  const { t } = useLocale();

  return (
    <div className="coloring-page relative min-h-screen bg-parchment">
      <FixedNavigation />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 pt-24">
        <h1 className="type-page">{t("interactive.title")}</h1>
        <p className="type-body mt-4 max-w-md text-center text-ink/80">
          {t("interactive.lead")}
        </p>
        <ul className="mt-8 space-y-3">
          <li>
            <Link
              href="/interactive/color-the-mural"
              className="surface-card block px-6 py-6 text-ink transition-[box-shadow,border-color] duration-200 hover:shadow-hover"
            >
              <span className="type-card block">{t("interactive.color")}</span>
              <span className="type-caption mt-2 block text-ink/70">
                {t("interactive.colorHint")}
              </span>
            </Link>
          </li>
        </ul>
        <Link
          href="/"
          className="btn-tertiary mt-10"
        >
          {t("interactive.home")}
        </Link>
      </main>
    </div>
  );
}
