"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

type ProvenanceBadgeProps = {
  muralTitle: string;
};

export default function ProvenanceBadge({ muralTitle }: ProvenanceBadgeProps) {
  const { t } = useLocale();

  return (
    <div
      className="my-5 flex items-center gap-3"
      aria-label={t("detail.from", { title: muralTitle })}
    >
      <span className="h-px flex-1 bg-stone/20" aria-hidden="true" />
      <div className="flex flex-col items-center text-center">
        <span className="type-meta mt-1 flex items-center gap-1.5 text-gold">
          <span aria-hidden="true">→</span>
          {t("detail.fromMural")}
        </span>
        <span className="type-caption mt-1 max-w-[16rem] text-ink/70">
          {t("detail.from", { title: muralTitle })}
        </span>
      </div>
      <span className="h-px flex-1 bg-stone/20" aria-hidden="true" />
    </div>
  );
}
