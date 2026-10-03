"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n-provider";
import { StorefrontIcon } from "./icons";
import { Amount, Badge } from "./ui";
import { formatRupees } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n/dictionaries";

const SEEN_KEY = "ud-welcome-seen";

/** One line about each seeded customer, so the visitor knows who is who. */
const ABOUT: Record<string, MessageKey> = {
  "Sunita Sharma": "welcome.about.sunita",
  "Arjun Mehta": "welcome.about.arjun",
  "Farhan Qureshi": "welcome.about.farhan",
  "Lakshmi Iyer": "welcome.about.lakshmi",
  "Gurpreet Singh": "welcome.about.gurpreet",
};

export type WelcomeCustomer = {
  name: string;
  duePaise: number;
  overdue: boolean;
};

/**
 * UD-42 First visit to the demo: who you are playing, which customers are already set up and what
 * they owe (live, since the demo is shared). Shown once per browser, and
 * again from Demo guide in the header menu (which links to /app?welcome=1).
 */
export function WelcomeSheet({
  customers,
  owedPaise,
  lateCount,
  forceOpen,
}: {
  customers: WelcomeCustomer[];
  owedPaise: number;
  lateCount: number;
  forceOpen: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const startRef = useRef<HTMLButtonElement>(null);

  // Decide after mount: localStorage is per browser and may be blocked
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    if (forceOpen || !seen) setOpen(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, [forceOpen]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    if (forceOpen) window.history.replaceState(null, "", "/app");
  };

  useEffect(() => {
    if (!open) return;
    startRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label={t("welcome.close")}
        onClick={close}
        className="sheet-fade absolute inset-0 bg-[#0A1630]/55"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="sheet-up pb-safe relative flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-2xl bg-surface shadow-high"
      >
        <div
          className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong"
          aria-hidden="true"
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <StorefrontIcon size={24} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                {t("welcome.eyebrow")}
              </p>
              <h2
                id="welcome-title"
                className="font-heading text-xl leading-7 font-semibold text-ink"
              >
                {t("welcome.title")}
              </h2>
            </div>
          </div>

          <p className="mt-4 text-[15px] leading-6 text-ink">
            {t("welcome.customers", { count: customers.length })}{" "}
            {lateCount > 0
              ? t("welcome.owe", {
                  amount: formatRupees(owedPaise),
                  count: lateCount,
                })
              : t("welcome.oweNone", { amount: formatRupees(owedPaise) })}
          </p>

          <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
            {customers.map((c) => (
              <li key={c.name} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-faded text-sm font-semibold text-primary">
                  {c.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {c.name}
                  </span>
                  {ABOUT[c.name] && (
                    <span className="block text-xs leading-4 text-ink-muted">
                      {t(ABOUT[c.name])}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {c.duePaise > 0 ? (
                    <Amount paise={c.duePaise} size="sm" />
                  ) : (
                    <span className="text-xs text-ink-muted">
                      {t("customers.nothingDue")}
                    </span>
                  )}
                  {c.overdue && (
                    <Badge tone="negative">{t("customers.overdue")}</Badge>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* The action stays in view while the content scrolls */}
        <div className="shrink-0 border-t border-line px-5 pt-3 pb-4">
          <button
            ref={startRef}
            type="button"
            onClick={close}
            className="flex h-12 w-full items-center justify-center rounded-sm bg-primary text-[15px] font-semibold text-white transition-colors duration-200 ease-standard hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("welcome.start")}
          </button>
        </div>
      </div>
    </div>
  );
}
