"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

export default function CulturalHints() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  const hints = [t("color.hint1"), t("color.hint2"), t("color.hint3")];

  return (
    <div className="mt-4 w-full max-w-sm border-t border-ink/10 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="type-ui flex min-h-11 w-full items-center justify-between text-ink/70 transition-colors duration-[180ms] ease-out hover:text-ink"
      >
        {t("color.hints")}
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {hints.map((hint) => (
            <li key={hint} className="type-caption text-left text-ink/70">
              {hint}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
