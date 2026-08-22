"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

type FinishColoringButtonProps = {
  onClick: () => void;
};

export default function FinishColoringButton({
  onClick,
}: FinishColoringButtonProps) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-primary h-12 w-[248px] max-w-full"
    >
      {t("color.finish")}
    </button>
  );
}
