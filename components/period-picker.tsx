"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Field, TextInput } from "./form";
import { useI18n } from "./i18n-provider";
import { CalendarIcon, CheckIcon, ChevronRightIcon } from "./icons";
import { formatDate } from "@/lib/format";
import type { Period } from "@/lib/period";

/**
 * UD-46 The home summary's period. This month by default, last month, or a custom range of days.
 * The choice lives in the URL (?period=last or ?from=&to=), so it survives a refresh and the back button.
 */
export function PeriodPicker({ period, today }: { period: Period; today: string }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(period.kind === "custom");
  const [from, setFrom] = useState(period.from);
  const [to, setTo] = useState(period.to > today ? today : period.to);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (query: string) => {
    setOpen(false);
    startTransition(() => router.push(`/app${query}`, { scroll: false }));
  };

  const label =
    period.kind === "month"
      ? t("home.period")
      : period.kind === "last"
        ? t("home.lastMonth")
        : `${formatDate(period.from, lang)} – ${formatDate(period.to, lang)}`;

  const rangeInvalid = !from || !to || from > to;
  const item = "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-ink transition-colors duration-200 ease-standard hover:bg-gray-faded";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-sm pb-0.5 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${pending ? "opacity-60" : ""}`}
      >
        <CalendarIcon size={14} />
        {label}
        <ChevronRightIcon size={14} className={`transition-transform duration-200 ${open ? "-rotate-90" : "rotate-90"}`} />
      </button>

      {open && (
        <div role="dialog" aria-label={t("home.periodTitle")} className="absolute top-8 right-0 z-30 w-72 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-high">
          <button type="button" className={item} onClick={() => go("")}>
            {t("home.period")}
            {period.kind === "month" && <CheckIcon size={16} className="text-primary" />}
          </button>
          <button type="button" className={item} onClick={() => go("?period=last")}>
            {t("home.lastMonth")}
            {period.kind === "last" && <CheckIcon size={16} className="text-primary" />}
          </button>
          <button type="button" className={item} aria-expanded={custom} onClick={() => setCustom((c) => !c)}>
            {t("home.custom")}
            {period.kind === "custom" ? <CheckIcon size={16} className="text-primary" /> : <ChevronRightIcon size={16} className={custom ? "rotate-90" : ""} />}
          </button>
          {custom && (
            <form
              className="space-y-3 border-t border-line px-4 pt-3 pb-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!rangeInvalid) go(`?from=${from}&to=${to}`);
              }}
            >
              <div className="grid gap-2">
                <Field label={t("home.from")} htmlFor="period-from">
                  <TextInput id="period-from" type="date" max={today} value={from} onChange={(e) => setFrom(e.target.value)} />
                </Field>
                <Field label={t("home.to")} htmlFor="period-to">
                  <TextInput id="period-to" type="date" max={today} value={to} onChange={(e) => setTo(e.target.value)} />
                </Field>
              </div>
              {from && to && from > to && <p className="text-xs text-negative">{t("home.rangeError")}</p>}
              <button
                type="submit"
                disabled={rangeInvalid}
                className="flex h-10 w-full items-center justify-center rounded-sm bg-primary text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:opacity-50"
              >
                {t("home.apply")}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
