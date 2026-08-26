"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavMark from "./NavMark";
import BrandHeader from "./mural/BrandHeader";
import CanvasInstruction from "./mural/CanvasInstruction";
import StarCounter from "./StarCounter";
import LanguageSwitcher from "./LanguageSwitcher";
import GameMenu from "./GameMenu";
import { BgmToggle } from "./BgmPlayer";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { NavSection } from "./NavPanel";
import type { MessageKey } from "@/lib/i18n/messages";

interface FixedNavigationProps {
  compact?: boolean;
  variant?: "cover" | "home" | "matching" | "explore" | "map" | "collection" | "site";
  activeSection?: NavSection | null;
  onNavClick?: (section: NavSection) => void;
  onLogoClick?: () => void;
  instructionKey?: MessageKey;
  /** Hide the collection-style top-left back control */
  hideBack?: boolean;
}

export default function FixedNavigation({
  compact = true,
  variant = "site",
  onLogoClick,
  instructionKey,
  hideBack = false,
}: FixedNavigationProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const isHud = variant !== "site";
  const isPlay =
    variant === "home" ||
    variant === "matching" ||
    variant === "explore" ||
    variant === "map" ||
    variant === "collection";
  const hasCenteredLogo =
    variant === "home" ||
    variant === "matching" ||
    variant === "explore" ||
    variant === "map" ||
    variant === "collection";
  const showCollectionBack = variant === "collection" && !hideBack;

  if (!isHud) {
    return (
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[85]">
        <div className="bg-parchment px-4 md:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3 md:h-[72px]">
            <div className="pointer-events-auto min-w-0 shrink-0">
              <NavMark onClick={onLogoClick} href="/" />
            </div>
            <div className="pointer-events-auto flex min-w-0 items-center justify-end gap-2">
              <StarCounter />
              <LanguageSwitcher />
              <Link
                href="/postcards"
                aria-current={pathname === "/postcards" ? "page" : undefined}
                className="nav-chip type-ui"
              >
                <span className="md:hidden">{t("nav.postcardsShort")}</span>
                <span className="hidden md:inline">{t("nav.postcards")}</span>
              </Link>
              <Link
                href="/interactive/color-the-mural"
                aria-current={pathname.startsWith("/interactive") ? "page" : undefined}
                className="nav-chip type-ui"
              >
                {t("nav.interactive")}
              </Link>
              <BgmToggle className="nav-chip h-11 w-11 px-0" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[85]">
      <div className="bg-gradient-to-b from-parchment/80 via-parchment/25 to-transparent px-4 pb-10 pt-4 md:px-6">
        <div className="relative flex items-start justify-between gap-3">
          {showCollectionBack ? (
            <div className="pointer-events-auto shrink-0">
              <Link
                href="/"
                aria-label={t("match.reselect")}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-rice text-ink/75 shadow-[0_8px_24px_rgb(33_51_56_/_12%)] transition-colors hover:border-ink/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M11.2 3.6 5.2 9l6 5.4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          ) : variant === "cover" ? (
            <div
              className={`pointer-events-auto shrink-0 ${
                compact ? "origin-left scale-90" : "scale-100"
              }`}
            >
              <BrandHeader mode="cover" onLogoClick={onLogoClick} />
            </div>
          ) : hasCenteredLogo ? (
            <div className="h-11 w-[7.5rem] shrink-0 md:w-[9rem]" />
          ) : (
            <div
              className={`pointer-events-auto shrink-0 ${
                compact ? "origin-left scale-90" : "scale-100"
              }`}
            >
              <NavMark onClick={onLogoClick} href="/" />
            </div>
          )}

          {hasCenteredLogo ? (
            <div className="pointer-events-auto absolute left-1/2 top-0 -translate-x-1/2">
              <NavMark onClick={onLogoClick} href="/" />
            </div>
          ) : instructionKey ? (
            <div className="pointer-events-none hidden min-w-0 flex-1 justify-center px-3 pt-1 md:flex">
              <CanvasInstruction messageKey={instructionKey} tone="quest" />
            </div>
          ) : (
            <div className="hidden flex-1 md:block" />
          )}

          <div className="pointer-events-auto flex shrink-0 items-center gap-2">
            <StarCounter className="hud-badge gap-2" />
            {isPlay ? (
              <GameMenu />
            ) : (
              <div className="flex items-center gap-2 [&_.nav-chip]:rounded-full">
                <LanguageSwitcher />
                <BgmToggle />
              </div>
            )}
          </div>
        </div>

        {instructionKey ? (
          <div className="mt-3 flex justify-center md:hidden">
            <CanvasInstruction messageKey={instructionKey} tone="quest" />
          </div>
        ) : null}
      </div>
    </header>
  );
}
