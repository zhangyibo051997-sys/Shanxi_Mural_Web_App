"use client";

import { useCallback, useMemo } from "react";
import type { Temple } from "@/data/temples";
import type { StoryCardData } from "@/data/muralCards";
import type { CoverElement } from "@/data/coverElements";
import { COVER_CATEGORY_LABELS } from "@/data/coverElements";
import { templeMap } from "@/data/temples";
import { elements, type ManifestMural } from "@/data/muralData";
import Image from "next/image";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  locCoverAlt,
  locCoverCategory,
  locTemple,
} from "@/lib/i18n/localize";
import BoundedMuralViewer from "@/components/matching/BoundedMuralViewer";
import MuralInfoPanel from "@/components/annotations/MuralInfoPanel";

export interface DetailContent {
  type: "temple" | "story" | "element" | "mural";
  temple?: Temple;
  story?: StoryCardData;
  element?: CoverElement;
  mural?: ManifestMural;
}

interface DetailOverlayProps {
  content: DetailContent | null;
  onClose: () => void;
  isMobile: boolean;
}

export default function DetailOverlay({
  content,
  onClose,
  isMobile,
}: DetailOverlayProps) {
  const reducedMotion = useReducedMotion();
  const { locale, t } = useLocale();

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!content) return null;

  if (content.type === "mural" && content.mural) {
    return (
      <MuralExploreOverlay
        mural={content.mural}
        isMobile={isMobile}
        onClose={onClose}
      />
    );
  }

  const isElement = content.type === "element" && content.element;
  const isTemple = content.type === "temple" && content.temple;
  const isStory = content.type === "story" && content.story;
  const temple = isTemple ? locTemple(locale, content.temple!) : undefined;
  const elementAlt = isElement
    ? locCoverAlt(locale, content.element!.id, content.element!.alt)
    : "";

  const title = isElement
    ? content.element!.alt
    : isTemple
      ? `${content.temple!.name}壁画`
      : content.story!.title;

  const description = isElement
    ? "人物资料尚在整理中"
    : isTemple
      ? content.temple!.description
      : content.story!.description;

  const keywords = isElement
    ? [COVER_CATEGORY_LABELS[content.element!.category], content.element!.id]
    : isTemple
      ? content.temple!.keywords
      : content.story!.keywords;

  const image = isElement
    ? null
    : isTemple
      ? content.temple!.detailImage
      : content.story!.detailImage;

  const imageAlt = isElement
    ? elementAlt
    : isTemple
      ? temple!.detailImageAlt
      : content.story!.detailImageAlt;

  const storyTemple = isStory
    ? templeMap[content.story!.templeId]
    : undefined;
  const templeName = storyTemple
    ? locTemple(locale, storyTemple).name
    : undefined;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={handleBackdropClick}
    >
      {/* 嵌入式 entry 弹出放大特效 CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes postcardPop {
          0% {
            opacity: 0;
            transform: scale(0.35) rotate(-6deg) translateY(50px);
          }
          65% {
            transform: scale(1.025) rotate(1deg) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg) translateY(0);
          }
        }
        .postcard-container {
          animation: postcardPop 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}} />

      {/* 遮罩背景 */}
      <div
        className="absolute inset-0 bg-ink/65 backdrop-blur-[4px]"
        style={{
          transition: reducedMotion ? "none" : "opacity 0.4s ease",
        }}
        aria-hidden="true"
      />

      {/* 竖向明信片卡片 - 高度固定为 540px，宽度为 360px/380px，无内部滚动条，一页纸布局 */}
      <div
        className={`relative z-10 flex flex-col justify-between bg-[#F4EFE6] text-ink p-4 border border-ink/10 shadow-2xl rounded-sm postcard-container overflow-hidden ${
          isMobile
            ? "h-[500px] w-[330px]"
            : "h-[540px] w-[370px]"
        }`}
        style={{
          boxShadow: "0 20px 50px rgba(38, 36, 31, 0.3), inset 0 0 40px rgba(139, 53, 46, 0.04)",
        }}
      >
        {/* 顶部经典双细线明信片边框装饰 */}
        <div className="absolute inset-2 pointer-events-none border border-ink/5 rounded-sm" />
        <div className="absolute inset-2.5 pointer-events-none border border-dashed border-cinnabar/10 rounded-sm" />

        {/* 关闭按钮 - 设计成一个古风的小圆盖戳记 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-sm text-ink/60 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar"
          aria-label={t("detail.close")}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 3L13 13M13 3L3 13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {image ? (
          <div className={`relative w-full ${isMobile ? "h-48" : "h-72"} shrink-0 overflow-hidden ${isMobile ? "rounded-t-md" : "rounded-t-sm"}`}>
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className={`flex w-full shrink-0 items-center justify-center bg-[#C5BDB1] ${
              isMobile ? "h-36 rounded-t-md" : "h-48 rounded-t-sm"
            }`}
            aria-hidden="true"
          />
        )}

        <div className="overflow-y-auto px-6 py-5 md:px-8 md:py-6">
          {isTemple && (
            <p className="type-meta text-gold">
              {temple!.region} · {temple!.era}
            </p>
          )}
          {isElement && (
            <p className="type-meta text-gold">
              {locCoverCategory(locale, content.element!.category)} · {content.element!.id}
            </p>
          )}
          <h2 className="type-page mt-2">
            {title}
          </h2>
          <p className="type-body mt-4 text-ink">
            {description}
          </p>
          {isElement && (
            <p className="type-meta mt-2 text-ink/70">
              CONTENT IN PREPARATION
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="type-meta bg-parchment px-2.5 py-1 text-gold"
              >
                {kw}
              </span>
            ))}
          </div>

          {!isElement && (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <ActionButton primary>查看壁画故事</ActionButton>
              {isTemple && <ActionButton>进入寺庙</ActionButton>}
              <ActionButton>{isTemple ? "规划现场参观" : "开始读画"}</ActionButton>
            </div>
          )}

          {isStory && templeName && (
            <p className="type-caption mt-4 text-ink/70">
              {t("detail.belongsTo", { id: templeName })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MuralExploreOverlay({
  mural,
  isMobile,
  onClose,
}: {
  mural: ManifestMural;
  isMobile: boolean;
  onClose: () => void;
}) {
  const relatedElements = useMemo(
    () => elements.filter((element) => element.sourceMuralId === mural.id),
    [mural.id]
  );
  const image = mural.imageSrc;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[80] flex ${
        isMobile
          ? "top-[4.75rem] items-end"
          : "top-24 items-center justify-center p-6"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={mural.displayTitle}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        className={`relative flex w-full overflow-hidden bg-rice shadow-2xl ${
          isMobile
            ? "max-h-[calc(100%-0.5rem)] flex-col rounded-t-md"
            : "h-full max-h-[40rem] max-w-5xl flex-row"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭壁画详情"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center bg-rice/90 text-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar"
        >
          ×
        </button>

        <div
          className={`shrink-0 bg-[#B8B0A4] ${
            isMobile ? "h-52 w-full" : "h-full w-[54%]"
          }`}
        >
          {image ? (
            <BoundedMuralViewer
              src={image}
              alt={mural.displayTitle}
            />
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <MuralInfoPanel mural={mural} relatedElements={relatedElements} />
        </div>
      </article>
    </div>
  );
}

function ActionButton({
  children,
  primary = false,
  className = "",
}: {
  children: React.ReactNode;
  primary?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`${primary ? "btn-primary" : "btn-secondary"} ${className}`}
    >
      {children}
    </button>
  );
}
