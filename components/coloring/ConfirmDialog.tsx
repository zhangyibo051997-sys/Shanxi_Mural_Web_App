"use client";

import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previousFocus.current?.focus();
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/35 px-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coloring-dialog-title"
        className="surface-card relative w-[calc(100vw-32px)] max-w-[400px] rounded p-8 shadow-overlay"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label={cancelLabel}
          className="btn-icon absolute right-3 top-3 border-0 bg-transparent text-ink/60 hover:text-cinnabar"
        >
          ×
        </button>
        <h2 id="coloring-dialog-title" className="type-page pr-10">
          {title}
        </h2>
        <p className="type-body mt-4 text-ink/80">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
