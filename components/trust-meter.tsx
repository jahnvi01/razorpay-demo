"use client";

import { useEffect, useState } from "react";
import { TRUST_RING_ENABLED } from "@/lib/features";
import { formatRupees } from "@/lib/format";
import type { Trust, TrustLabel } from "@/lib/trust";
import { useI18n } from "./i18n-provider";
import { Badge, Card } from "./ui";

const LABEL: Record<
  TrustLabel,
  {
    key:
      "trust.usually" | "trust.sometimes" | "trust.often" | "trust.notEnough";
    tone: "positive" | "notice" | "negative" | "neutral";
  }
> = {
  usually: { key: "trust.usually", tone: "positive" },
  sometimes: { key: "trust.sometimes", tone: "notice" },
  often: { key: "trust.often", tone: "negative" },
  notEnough: { key: "trust.notEnough", tone: "neutral" },
};

type Props = { trust: Trust; minCleared: number };

/** UD-23 How this customer usually pays. Shown before saving udhaar and on the customer screen. */
export function TrustMeter(props: Props) {
  return TRUST_RING_ENABLED ? (
    <TrustMeterRing {...props} />
  ) : (
    <TrustMeterBar {...props} />
  );
}

const RING_COLOR = {
  positive: "text-positive-intense",
  notice: "text-notice",
  negative: "text-negative",
  neutral: "text-ink-muted",
} as const;
const CARD_TINT = {
  positive: "bg-positive-subtle",
  notice: "bg-notice-subtle",
  negative: "bg-negative-subtle",
  neutral: "",
} as const;

/**
 * UD-62 Trial: the score as a ring that sweeps in when the card appears, with the verdict as the
 * heading and the card tinted to match. Turn off with TRUST_RING_ENABLED to get the bar back.
 */
function TrustMeterRing({ trust, minCleared }: Props) {
  const { t } = useI18n();
  const { key, tone } = LABEL[trust.label];
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rate = trust.onTimeRate ?? 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  const known = trust.label !== "notEnough";

  return (
    <Card
      role="region"
      aria-label={t("trust.title")}
      className="overflow-hidden"
    >
      <div className={`p-4 ${CARD_TINT[tone]}`}>
        <h3 className="text-xs font-semibold text-ink-subtle">
          {t("trust.title")}
        </h3>
        <div className="mt-3 flex items-center gap-5">
          <div
            className={`relative h-24 w-24 shrink-0 ${RING_COLOR[tone]}`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.15"
                strokeWidth="6"
                strokeDasharray={known ? undefined : "3 5"}
              />
              {known && (
                <circle
                  cx="48"
                  cy="48"
                  r={r}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={drawn ? c * (1 - rate / 100) : c}
                  className="transition-[stroke-dashoffset] duration-1000 ease-standard motion-reduce:transition-none"
                />
              )}
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="font-heading text-xl font-semibold">
                {known ? `${rate}%` : "?"}
              </span>
              {known && (
                <span className="mt-1 text-[10px] text-ink-muted">
                  {t("trust.ringOnTime")}
                </span>
              )}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`font-heading text-lg leading-6 font-semibold ${tone === "neutral" ? "text-ink" : RING_COLOR[tone].replace("-intense", "")}`}
            >
              {t(key)}
            </p>
            {known ? (
              <p className="mt-0.5 text-sm text-ink-subtle">
                {t("trust.paidOnTime", {
                  onTime: trust.onTime,
                  cleared: trust.cleared,
                })}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-ink-muted">
                {t("trust.notEnoughHint", {
                  count: minCleared,
                  cleared: trust.cleared,
                })}
              </p>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {known && (
                <div>
                  <dt className="text-xs text-ink-muted">
                    {t("trust.ringAvg")}
                  </dt>
                  <dd className="font-semibold text-ink">
                    {t("trust.days", { days: trust.avgDaysToPay ?? 0 })}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-ink-muted">
                  {t("trust.ringOldest")}
                </dt>
                <dd className="font-semibold text-ink">
                  {trust.oldestUnpaidDays === null
                    ? t("trust.none")
                    : t("trust.days", { days: trust.oldestUnpaidDays })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** UD-23 Original card with a progress bar. Kept as is for rollback (TRUST_RING_ENABLED = false). */
function TrustMeterBar({ trust, minCleared }: Props) {
  const { t } = useI18n();
  const { key, tone } = LABEL[trust.label];

  return (
    <Card role="region" aria-label={t("trust.title")} className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink-subtle">
          {t("trust.title")}
        </h3>
        <Badge tone={tone}>{t(key)}</Badge>
      </div>

      {trust.label === "notEnough" ? (
        <p className="text-xs text-ink-muted">
          {t("trust.notEnoughHint", {
            count: minCleared,
            cleared: trust.cleared,
          })}
        </p>
      ) : (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-gray-faded"
          aria-hidden="true"
        >
          <div
            className={`h-full rounded-full ${tone === "positive" ? "bg-positive-intense" : tone === "notice" ? "bg-notice" : "bg-negative"}`}
            style={{ width: `${trust.onTimeRate}%` }}
          />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {trust.onTimeRate !== null && (
          <>
            <div>
              <dt className="text-xs text-ink-muted">{t("trust.onTime")}</dt>
              <dd className="font-semibold text-ink">
                {t("trust.onTimeValue", {
                  rate: trust.onTimeRate,
                  onTime: trust.onTime,
                  cleared: trust.cleared,
                })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">{t("trust.avgDays")}</dt>
              <dd className="font-semibold text-ink">
                {t("trust.days", { days: trust.avgDaysToPay ?? 0 })}
              </dd>
            </div>
          </>
        )}
        <div>
          <dt className="text-xs text-ink-muted">{t("trust.currentDue")}</dt>
          <dd className="font-semibold text-ink">
            {formatRupees(trust.currentDuePaise)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">{t("trust.oldestUnpaid")}</dt>
          <dd className="font-semibold text-ink">
            {trust.oldestUnpaidDays === null
              ? t("trust.none")
              : t("trust.days", { days: trust.oldestUnpaidDays })}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
