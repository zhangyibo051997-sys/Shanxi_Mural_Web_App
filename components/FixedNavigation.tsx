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
      <div className="border-b border-[var(--color-border-subtle)] bg-parchment px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 md:h-[72px]">
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

          <div className="pointer-events-auto flex min-w-0 max-w-[min(100%,40rem)] flex-wrap items-center justify-end gap-2">
            <StarCounter />
            <LanguageSwitcher />
            {variant !== "cover" ? (
              <Link
                href="/postcards"
                aria-current={isPostcards ? "page" : undefined}
                className="nav-chip type-ui"
              >
                <span className="md:hidden">{t("nav.postcardsShort")}</span>
                <span className="hidden md:inline">{t("nav.postcards")}</span>
              </Link>
            ) : null}
            {showSectionNav && (
              <nav
                className={variant === "matching" ? "hidden md:block" : ""}
                aria-label={t("nav.main")}
              >
                <ul className="flex flex-wrap items-center justify-end gap-2">
                  <li>
                    <Link
                      href="/interactive/color-the-mural"
                      aria-current={isInteractive ? "page" : undefined}
                      className="nav-chip type-ui"
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
                            className="nav-chip type-ui"
                          >
                            {label}
                          </button>
                        </li>
                      );
                    }
                    return (
                      <li key={item.id}>
                        <Link href="/?view=map" className="nav-chip type-ui">
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
          <div className="flex justify-center px-1 pb-3">
            <CanvasInstruction messageKey={instructionKey} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
