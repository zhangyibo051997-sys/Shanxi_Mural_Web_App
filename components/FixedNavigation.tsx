"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavMark from "./NavMark";
import BrandHeader from "./mural/BrandHeader";
import CanvasInstruction from "./mural/CanvasInstruction";
import StarCounter from "./StarCounter";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { NavSection } from "./NavPanel";
import type { MessageKey } from "@/lib/i18n/messages";

interface FixedNavigationProps {
  compact?: boolean;
  variant?: "cover" | "home" | "matching" | "site";
  activeSection?: NavSection | null;
  onNavClick?: (section: NavSection) => void;
  onLogoClick?: () => void;
  instructionKey?: MessageKey;
}

const navItems: { id: NavSection; labelKey: "nav.temples" }[] = [
  { id: "temples", labelKey: "nav.temples" },
];

export default function FixedNavigation({
  compact = true,
  variant = "site",
  activeSection = null,
  onNavClick,
  onLogoClick,
  instructionKey,
}: FixedNavigationProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const showSectionNav = variant !== "cover";
  const isPostcards = pathname === "/postcards";
  const isInteractive = pathname.startsWith("/interactive");

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[85]">
      <div className="bg-gradient-to-b from-parchment/90 via-parchment/55 to-transparent px-5 pb-3 pt-4 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div
            className={`pointer-events-auto min-w-0 shrink-0 transition-all duration-700 ease-out ${
              compact ? "origin-left scale-90" : "scale-100"
            }`}
          >
            {variant === "cover" ? (
              <BrandHeader mode="cover" onLogoClick={onLogoClick} />
            ) : (
              <NavMark onClick={onLogoClick} href="/" />
            )}
          </div>

          <div className="pointer-events-auto flex min-w-0 max-w-[min(100%,32rem)] flex-wrap items-center justify-end gap-x-3 gap-y-2 md:gap-x-5">
            <StarCounter />
            <LanguageSwitcher />
            <Link
              href="/postcards"
              aria-current={isPostcards ? "page" : undefined}
              className={`whitespace-nowrap font-sans text-[11px] tracking-wide transition-colors hover:text-ink focus:outline-none focus-visible:underline md:text-xs ${
                isPostcards
                  ? "text-ink underline underline-offset-4"
                  : "text-ink/60"
              }`}
            >
              <span className="md:hidden">{t("nav.postcardsShort")}</span>
              <span className="hidden md:inline">{t("nav.postcards")}</span>
            </Link>
            {showSectionNav && (
              <nav
                className={variant === "matching" ? "hidden md:block" : ""}
                aria-label={t("nav.main")}
              >
                <ul className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 md:gap-x-6">
                  <li>
                    <Link
                      href="/interactive/color-the-mural"
                      aria-current={isInteractive ? "page" : undefined}
                      className={`whitespace-nowrap font-sans text-[11px] tracking-wide transition-colors hover:text-ink focus:outline-none focus-visible:underline md:text-xs ${
                        isInteractive
                          ? "text-ink underline underline-offset-4"
                          : "text-ink/60"
                      }`}
                    >
                      {t("nav.interactive")}
                    </Link>
                  </li>
                  {navItems.map((item) => {
                    const isActive = activeSection === item.id;
                    const label = t(item.labelKey);
                    if (onNavClick) {
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => onNavClick(item.id)}
                            aria-current={isActive ? "true" : undefined}
                            className={`whitespace-nowrap font-sans text-[11px] tracking-wide transition-colors focus:outline-none focus-visible:underline md:text-xs ${
                              isActive
                                ? "text-ink underline underline-offset-4"
                                : "text-ink/60 hover:text-ink focus-visible:text-ink"
                            }`}
                          >
                            {label}
                          </button>
                        </li>
                      );
                    }
                    return (
                      <li key={item.id}>
                        <Link
                          href="/?view=map"
                          className="whitespace-nowrap font-sans text-[11px] tracking-wide text-ink/60 transition-colors hover:text-ink focus:outline-none focus-visible:underline md:text-xs"
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </div>
        </div>

        {instructionKey ? (
          <div className="mt-2 flex justify-center px-1 md:mt-3">
            <CanvasInstruction messageKey={instructionKey} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
