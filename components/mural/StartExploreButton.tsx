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
        data-explore-cta=""
        data-pressed={pressed ? "true" : "false"}
        className="explore-cta btn-primary h-[52px] w-[248px] flex-col gap-0.5 !rounded-full px-6 data-[pressed=true]:brightness-[0.82] disabled:pointer-events-none"
      >
        <span
          data-explore-label=""
          lang={isZh ? "zh-CN" : locale === "it" ? "it" : "en"}
          className="type-ui text-on-accent"
        >
          {t("cover.start")}
        </span>
        {isZh ? (
          <span
            data-explore-label=""
            lang="en"
            className="type-btn-en text-on-accent/80"
          >
            {t("cover.startHint")}
          </span>
        ) : null}
      </button>
    );
  }
);

export default StartExploreButton;
