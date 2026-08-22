"use client";

import { forwardRef } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface StartExploreButtonProps {
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}

const StartExploreButton = forwardRef<HTMLButtonElement, StartExploreButtonProps>(
  function StartExploreButton({ onClick, disabled = false, pressed = false }, ref) {
    const { locale, t } = useLocale();
    const isZh = locale === "zh";

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        data-pressed={pressed ? "true" : "false"}
        className="btn-primary h-[52px] w-[248px] flex-col gap-0.5 rounded-[2px] px-6 data-[pressed=true]:brightness-[0.82] disabled:pointer-events-none"
      >
        <span
          lang={isZh ? "zh-CN" : locale === "it" ? "it" : "en"}
          className="type-ui text-on-accent"
        >
          {t("cover.start")}
        </span>
        {isZh ? (
          <span lang="en" className="type-btn-en text-on-accent/80">
            {t("cover.startHint")}
          </span>
        ) : null}
      </button>
    );
  }
);

export default StartExploreButton;
