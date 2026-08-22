"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";

type CanvasInstructionProps = {
  messageKey: MessageKey;
};

export default function CanvasInstruction({
  messageKey,
}: CanvasInstructionProps) {
  const { locale, t } = useLocale();
  const lang = locale === "zh" ? "zh-CN" : locale === "it" ? "it" : "en";

  return (
    <p
      lang={lang}
      className="type-body max-w-[min(40rem,100%)] text-balance text-center text-ink"
    >
      {t(messageKey)}
    </p>
  );
}
