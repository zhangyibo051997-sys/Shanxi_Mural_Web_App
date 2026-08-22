"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

type CollectPostcardButtonProps = {
  collected: boolean;
  onClick: () => void;
};

export default function CollectPostcardButton({
  collected,
  onClick,
}: CollectPostcardButtonProps) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={collected}
      className="btn-primary mx-auto mt-4 h-12 w-[248px] max-w-full disabled:border-cinnabar disabled:bg-cinnabar disabled:text-on-accent disabled:opacity-100"
    >
      {collected ? t("color.collected") : t("color.collectAs")}
    </button>
  );
}
