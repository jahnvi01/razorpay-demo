"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Forecast, ForecastGroup } from "@/lib/data/forecast";
import { formatRupees } from "@/lib/format";
import { useI18n } from "./i18n-provider";
import { ChevronRightIcon, TrendingUpIcon } from "./icons";
import { OneTapReminders } from "./one-tap-reminders";
import { Amount, Card } from "./ui";

const GROUPS: {
  key: ForecastGroup;
  dot: string;
  bar: string;
  why: "forecast.onTimeWhy" | "forecast.likelyLateWhy" | "forecast.atRiskWhy";
  href: string;
}[] = [
  {
    key: "onTime",
    dot: "bg-positive-intense",
    bar: "bg-positive-intense",
    why: "forecast.onTimeWhy",
    href: "/app/dues",
  },
  {
    key: "likelyLate",
    dot: "bg-[hsl(30_100%_50%)]",
    bar: "bg-[hsl(30_100%_50%)]",
    why: "forecast.likelyLateWhy",
    href: "/app/dues",
  },
  {
    key: "atRisk",
    dot: "bg-negative",
    bar: "bg-negative",
    why: "forecast.atRiskWhy",
    href: "/app/dues?filter=overdue",
  },
];

/** First names, at most three, then "+N". */
function names(
  people: { name: string }[],
  more: (n: number) => string,
): string {
  const first = people.slice(0, 3).map((p) => p.name.split(" ")[0]);
  return people.length > 3
    ? `${first.join(", ")} ${more(people.length - 3)}`
    : first.join(", ");
}

/**
 * UD-66 Recovery Forecast at the bottom of home: dues split into On time, Likely late and At risk,
 * each with its customers and an action, and how much is expected back this month.
 */
export function RecoveryForecast({ forecast }: { forecast: Forecast }) {
  const { t, lang } = useI18n();
  const month = new Date().toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
    month: "long",
    timeZone: "Asia/Kolkata",
  });
  const pct = forecast.totalPaise
    ? Math.round((forecast.expectedPaise / forecast.totalPaise) * 100)
    : 0;
  const more = (count: number) => t("forecast.more", { count });
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const r = 30;
  const c = 2 * Math.PI * r;

  const remindButton = (key: ForecastGroup) => {
    const g = forecast.groups[key];
    if (key === "onTime" || !g.people.length) return null;
    const now = key === "atRisk";
    return (
      <OneTapReminders
        customers={g.people}
        sub={now ? undefined : t("forecast.earlySub")}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            aria-haspopup="dialog"
            className={`mt-2 ml-[22px] h-8 rounded-sm px-3 text-xs font-semibold transition-colors duration-200 ease-standard ${
              now
                ? "bg-primary text-white hover:bg-primary-hover"
                : "border border-line text-primary hover:bg-primary-faded"
            }`}
          >
            {now ? t("forecast.remindNow") : t("forecast.remindEarly")}
          </button>
        )}
      />
    );
  };

  return (
    <section role="region" aria-label={t("forecast.title")} className="pt-2">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-faded text-primary"
          aria-hidden="true"
        >
          <TrendingUpIcon size={20} />
        </span>
        <h2 className="min-w-0 flex-1 font-heading text-xl leading-7 font-semibold tracking-tight text-ink">
          {t("forecast.title")}
        </h2>
        <span className="shrink-0 text-xs font-medium text-ink-muted">
          {month}
        </span>
      </div>

      <Card className="overflow-hidden">
        {/* The number merchants care about first: how much comes back this month */}
        <div className="flex items-center gap-4 bg-linear-to-br from-positive-subtle to-transparent p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-subtle">
              {t("forecast.expected")}
            </p>
            <div className="mt-1.5">
              <Amount paise={forecast.expectedPaise} size="lg" compact />
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {t("forecast.ofDue", {
                pct,
                amount: formatRupees(forecast.totalPaise),
              })}
            </p>
          </div>
          <div
            className="relative h-[76px] w-[76px] shrink-0 text-positive-intense"
            aria-hidden="true"
          >
            <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
              <circle
                cx="38"
                cy="38"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.15"
                strokeWidth="7"
              />
              <circle
                cx="38"
                cy="38"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={drawn ? c * (1 - pct / 100) : c}
                className="transition-[stroke-dashoffset] duration-1000 ease-standard motion-reduce:transition-none"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-heading text-lg font-semibold text-positive">
              {pct}%
            </span>
          </div>
        </div>

        <div className="px-4 pt-3 pb-4">
          <p className="text-xs font-medium text-ink-muted">
            {t("forecast.due", {
              amount: formatRupees(forecast.totalPaise),
              count: forecast.customers,
            })}
          </p>
          <div
            className="mt-2 flex h-3 gap-0.5 overflow-hidden rounded-full"
            aria-hidden="true"
          >
            {GROUPS.map(({ key, bar }) =>
              forecast.groups[key].paise > 0 ? (
                <div
                  key={key}
                  className={bar}
                  style={{
                    width: `${(forecast.groups[key].paise / forecast.totalPaise) * 100}%`,
                  }}
                />
              ) : null,
            )}
          </div>

          <ul className="mt-2 divide-y divide-line">
            {GROUPS.map(({ key, dot, why, href }) => {
              const g = forecast.groups[key];
              if (!g.people.length) return null;
              return (
                <li key={key} className="py-3">
                  <Link href={href} className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">
                        {t(`forecast.${key}`)}
                      </span>
                      <span className="block text-xs text-ink-muted">
                        {names(g.people, more)} · {t(why)}
                      </span>
                    </span>
                    <span
                      className={`text-sm font-semibold ${key === "atRisk" ? "text-negative" : "text-ink"}`}
                    >
                      {formatRupees(g.paise)}
                    </span>
                    <ChevronRightIcon
                      size={16}
                      className="shrink-0 text-ink-muted"
                    />
                  </Link>
                  {remindButton(key)}
                </li>
              );
            })}
          </ul>

          <details className="group mt-2">
            <summary className="cursor-pointer list-none text-xs font-medium text-primary [&::-webkit-details-marker]:hidden">
              {t("forecast.how")} ⓘ
            </summary>
            <p className="mt-1.5 text-xs leading-5 text-ink-muted">
              {forecast.shopRate === null
                ? t("forecast.howBodyNew")
                : t("forecast.howBody", { rate: forecast.shopRate })}
            </p>
          </details>
        </div>
      </Card>
    </section>
  );
}
