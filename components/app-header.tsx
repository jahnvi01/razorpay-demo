"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n-provider";
import { MoreVerticalIcon, RefreshIcon } from "./icons";
import { LanguageToggle } from "./language-toggle";
import { RazorpayLogo } from "./razorpay-logo";

export const MERCHANT_NAME = "Ramesh Kirana";
const MERCHANT_INITIALS = "RK";

const topbarButton =
  "flex h-10 w-10 items-center justify-center rounded-[10px] border border-topbar-border bg-topbar-button text-white transition-colors duration-200 ease-standard hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function AppHeader() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  return (
    <header className="pt-safe sticky top-0 z-20 bg-topbar">
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <RazorpayLogo />
          <span className="truncate pl-[25px] text-xs leading-4 font-semibold text-primary-on-dark">{t("app.name")}</span>
        </div>

        <div ref={menuRef} className="relative flex items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            aria-label={t("header.menu")}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className={topbarButton}
          >
            <MoreVerticalIcon size={18} />
          </button>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[hsl(0_0%_90%)] text-sm font-bold text-ink"
            aria-label={MERCHANT_NAME}
            title={MERCHANT_NAME}
          >
            {MERCHANT_INITIALS}
          </span>

          {menuOpen && (
            <div
              role="menu"
              className="absolute top-12 right-0 w-60 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-high"
            >
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-ink">{MERCHANT_NAME}</p>
                <p className="text-xs text-ink-muted">{t("header.merchantRole")}</p>
              </div>
              {/* Wired up in UD-34 */}
              <button
                type="button"
                role="menuitem"
                disabled
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink disabled:cursor-not-allowed disabled:text-ink-disabled"
              >
                <RefreshIcon size={18} />
                <span className="flex flex-col">
                  <span className="font-medium">{t("header.resetDemo")}</span>
                  <span className="text-xs">{t("header.comingSoon")}</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
