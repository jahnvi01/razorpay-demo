"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { resetDemo } from "@/app/app/actions";
import { useI18n } from "./i18n-provider";
import Link from "next/link";
import { InfoIcon, RefreshIcon } from "./icons";
import { LanguageToggle } from "./language-toggle";
import { OfflineSync } from "./offline-sync";
import { PushSettings } from "./push-settings";
import { RazorpayLogo } from "./razorpay-logo";

export const MERCHANT_NAME = "Ramesh Kirana";
const MERCHANT_INITIALS = "RK";

export function AppHeader() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetting, startReset] = useTransition();
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
          {/* The merchant avatar opens the menu (Demo guide, Reset demo) */}
          <button
            type="button"
            aria-label={`${MERCHANT_NAME}: ${t("header.menu")}`}
            title={MERCHANT_NAME}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className={`flex h-10 w-10 items-center justify-center rounded-[10px] bg-[hsl(0_0%_90%)] text-sm font-bold text-ink transition-colors duration-200 ease-standard hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-on-dark ${
              menuOpen ? "ring-2 ring-primary-on-dark" : ""
            }`}
          >
            {MERCHANT_INITIALS}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute top-12 right-0 w-72 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-high"
            >
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-ink">{MERCHANT_NAME}</p>
                <p className="text-xs text-ink-muted">{t("header.merchantRole")}</p>
              </div>
              <Link
                href="/app?welcome=1"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink transition-colors duration-200 ease-standard hover:bg-gray-faded"
              >
                <InfoIcon size={18} />
                <span className="flex flex-col">
                  <span className="font-medium">{t("welcome.guide")}</span>
                  <span className="text-xs text-ink-muted">{t("welcome.guideHint")}</span>
                </span>
              </Link>
              <button
                type="button"
                role="menuitem"
                disabled={resetting}
                onClick={() =>
                  startReset(async () => {
                    await resetDemo();
                    setMenuOpen(false);
                  })
                }
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink transition-colors duration-200 ease-standard hover:bg-gray-faded disabled:cursor-wait disabled:text-ink-muted"
              >
                <RefreshIcon size={18} className={resetting ? "animate-spin" : ""} />
                <span className="flex flex-col">
                  <span className="font-medium">{resetting ? t("header.resetting") : t("header.resetDemo")}</span>
                  <span className="text-xs text-ink-muted">{t("header.resetHint")}</span>
                </span>
              </button>
              <PushSettings />
            </div>
          )}
        </div>
      </div>
      <OfflineSync />
    </header>
  );
}
