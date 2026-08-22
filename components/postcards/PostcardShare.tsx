"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PostcardAsset } from "@/lib/postcards";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { locCollectedTitle } from "@/lib/i18n/localize";

interface PostcardShareProps {
  postcard: PostcardAsset;
  kind?: "postcard" | "sticker";
}

export default function PostcardShare({
  postcard,
  kind = "postcard",
}: PostcardShareProps) {
  const { locale, t } = useLocale();
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [pageUrl, setPageUrl] = useState("/postcards");

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
    setPageUrl(`${window.location.origin}/postcards`);
  }, []);

  const localizedTitle = locCollectedTitle(locale, postcard.id, postcard.title);
  const shareText = t(
    kind === "sticker" ? "postcard.shareSticker" : "postcard.shareCard",
    { brand: t("brand.siteName"), title: localizedTitle }
  );
  const weiboHref = useMemo(
    () =>
      `https://service.weibo.com/share/share.php?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(shareText)}`,
    [pageUrl, shareText]
  );

  const shareNative = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: postcard.title,
        text: shareText,
        url: pageUrl,
      });
    } catch {
      /* user cancelled */
    }
  }, [pageUrl, shareText]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${pageUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [pageUrl, shareText]);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      {canShare && (
        <button
          type="button"
          onClick={shareNative}
          className="btn-secondary min-h-11 px-3"
        >
          {t("postcard.shareNative")}
        </button>
      )}
      <a
        href={weiboHref}
        target="_blank"
        rel="noreferrer"
        className="btn-secondary min-h-11 px-3"
      >
        {t("postcard.weibo")}
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="btn-secondary min-h-11 px-3"
      >
        {copied ? t("postcard.copied") : t("postcard.copy")}
      </button>
      <a
        href={postcard.src}
        download={postcard.fileName}
        className="btn-secondary min-h-11 px-3"
      >
        {t("postcard.download")}
      </a>
    </div>
  );
}
