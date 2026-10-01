"use client";

import { formatRupees } from "@/lib/format";
import type { Trust, TrustLabel } from "@/lib/trust";
import { useI18n } from "./i18n-provider";
import { Badge, Card } from "./ui";

const LABEL: Record<TrustLabel, { key: "trust.usually" | "trust.sometimes" | "trust.often" | "trust.notEnough"; tone: "positive" | "notice" | "negative" | "neutral" }> = {
  usually: { key: "trust.usually", tone: "positive" },
  sometimes: { key: "trust.sometimes", tone: "notice" },
  often: { key: "trust.often", tone: "negative" },
  notEnough: { key: "trust.notEnough", tone: "neutral" },
};

/** UD-23 How this customer usually pays. Shown before saving udhaar and on the customer screen. */
export function TrustMeter({ trust, minCleared }: { trust: Trust; minCleared: number }) {
  const { t } = useI18n();
  const { key, tone } = LABEL[trust.label];

  return (
    <Card role="region" aria-label={t("trust.title")} className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink-subtle">{t("trust.title")}</h3>
        <Badge tone={tone}>{t(key)}</Badge>
      </div>

      {trust.label === "notEnough" ? (
        <p className="text-xs text-ink-muted">{t("trust.notEnoughHint", { count: minCleared, cleared: trust.cleared })}</p>
      ) : (
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-faded" aria-hidden="true">
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
                {t("trust.onTimeValue", { rate: trust.onTimeRate, onTime: trust.onTime, cleared: trust.cleared })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">{t("trust.avgDays")}</dt>
              <dd className="font-semibold text-ink">{t("trust.days", { days: trust.avgDaysToPay ?? 0 })}</dd>
            </div>
          </>
        )}
        <div>
          <dt className="text-xs text-ink-muted">{t("trust.currentDue")}</dt>
          <dd className="font-semibold text-ink">{formatRupees(trust.currentDuePaise)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">{t("trust.oldestUnpaid")}</dt>
          <dd className="font-semibold text-ink">
            {trust.oldestUnpaidDays === null ? t("trust.none") : t("trust.days", { days: trust.oldestUnpaidDays })}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
