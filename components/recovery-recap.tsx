"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Recap } from "@/lib/data/forecast";
import { formatRupees } from "@/lib/format";
import { useI18n } from "./i18n-provider";
import { ChevronRightIcon, TrendingUpIcon } from "./icons";
import { OneTapReminders } from "./one-tap-reminders";
import { Amount, Badge, Card } from "./ui";

/**
 * UD-67 In place of the Recovery Forecast when home shows a past or custom period: how much of the
 * udhaar given in it came back, and who still owes it, with one button to remind them.
 */
export function RecoveryRecap({
  recap,
  periodName,
}: {
  recap: Recap;
  periodName: string;
}) {
  const { t } = useI18n();
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const pct = recap.givenPaise
    ? Math.round((recap.backPaise / recap.givenPaise) * 100)
    : 0;
  const r = 30;
  const c = 2 * Math.PI * r;
  const owing = recap.owing;

  return (
    <section role="region" aria-label={t("recap.title")} className="pt-2">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-faded text-primary"
          aria-hidden="true"
        >
          <TrendingUpIcon size={20} />
        </span>
        <h2 className="min-w-0 flex-1 font-heading text-xl leading-7 font-semibold tracking-tight text-ink">
          {t("recap.title")}
        </h2>
        <span className="shrink-0 text-xs font-medium text-ink-muted">
          {periodName}
        </span>
      </div>

      <Card className="overflow-hidden">
        {recap.givenPaise === 0 ? (
          <p className="p-4 text-sm text-ink-subtle">
            {t("recap.none", { period: periodName })}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4 bg-linear-to-br from-positive-subtle to-transparent p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-subtle">
                  {t("recap.cameBack", { period: periodName })}
                </p>
                <div className="mt-1.5">
                  <Amount paise={recap.backPaise} size="lg" compact />
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {t("recap.ofGiven", {
                    amount: formatRupees(recap.givenPaise),
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
              {owing.length === 0 ? (
                <p className="text-sm font-medium text-positive">
                  {t("recap.allBack")}
                </p>
              ) : (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      {t("recap.stillUnpaid")}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {t("recap.unpaidFrom", {
                        amount: formatRupees(recap.unpaidPaise),
                        count: owing.length,
                      })}
                    </p>
                  </div>
                  <ul className="mt-1 divide-y divide-line">
                    {owing.slice(0, 5).map((o) => (
                      <li key={o.id}>
                        <Link
                          href={`/app/customers/${o.id}`}
                          className="flex items-center gap-3 py-2.5"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                            {o.name}
                          </span>
                          {o.daysLate > 0 && (
                            <Badge tone="negative">
                              {t("overdue.daysLate", { days: o.daysLate })}
                            </Badge>
                          )}
                          <span className="text-sm font-semibold text-ink">
                            {formatRupees(o.duePaise)}
                          </span>
                          <ChevronRightIcon
                            size={16}
                            className="shrink-0 text-ink-muted"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <OneTapReminders
                    customers={owing.map(
                      ({ id, name, duePaise, daysLate }) => ({
                        id,
                        name,
                        duePaise,
                        daysLate,
                      }),
                    )}
                    sub={t("recap.remindSub", { period: periodName })}
                    trigger={(open) => (
                      <button
                        type="button"
                        onClick={open}
                        aria-haspopup="dialog"
                        className="mt-2 h-10 w-full rounded-sm bg-primary text-sm font-semibold text-white transition-colors duration-200 ease-standard hover:bg-primary-hover"
                      >
                        {t("recap.remind", { count: owing.length })}
                      </button>
                    )}
                  />
                </>
              )}
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
