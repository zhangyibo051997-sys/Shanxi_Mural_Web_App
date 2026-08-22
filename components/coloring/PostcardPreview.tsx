"use client";

import { useEffect, useRef } from "react";

type PostcardPreviewProps = {
  imageDataUrl: string;
  title: string;
  stars: number;
  onDownload: () => void;
  onClose: () => void;
};

export default function PostcardPreview({
  imageDataUrl,
  title,
  stars,
  onDownload,
  onClose,
}: PostcardPreviewProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previousFocus.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[92] flex items-center justify-center bg-ink/40 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="postcard-preview-title"
        className="surface-card relative max-h-[90svh] w-[calc(100vw-32px)] max-w-[400px] overflow-y-auto rounded p-8 shadow-overlay"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="btn-icon absolute right-3 top-3 border-0 bg-transparent text-ink/60 hover:text-cinnabar"
        >
          ×
        </button>
        <h2
          id="postcard-preview-title"
          className="type-page"
        >
          收藏明信片
        </h2>
        <p className="type-meta mt-2 text-gold">
          {title} · {stars} / 5
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageDataUrl}
          alt={`${title}明信片预览`}
          className="mt-4 w-full border border-ink/10 object-contain"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            关闭
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="btn-primary"
          >
            下载 PNG
          </button>
        </div>
      </div>
    </div>
  );
}
