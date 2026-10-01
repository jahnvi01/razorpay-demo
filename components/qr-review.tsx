"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { confirmQrAction, markSaleAction } from "@/app/app/qr-actions";
import { formatDate } from "@/lib/format";
import type { MatchSuggestion } from "@/lib/payments/qr";
import { FormError, PrimaryButton, Select, SecondaryButton } from "./form";
import { useI18n } from "./i18n-provider";
import { Amount, Card } from "./ui";

type Item = { id: string; amountPaise: number; payerVpa: string | null; receivedAt: string; suggestion: MatchSuggestion };

/** UD-19 One pending shop QR payment. Nothing clears until the merchant taps. */
export function QrReviewItem({ item, customers }: { item: Item; customers: { id: string; name: string }[] }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  const [other, setOther] = useState(item.suggestion.kind === "unknown");
  const [picked, setPicked] = useState("");

  const run = (fn: () => Promise<{ ok: boolean }>) =>
    start(async () => {
      setFailed(false);
      const res = await fn();
      if (res.ok) router.refresh();
      else setFailed(true);
    });
  const clearFor = (customerId: string) => run(() => confirmQrAction(item.id, customerId));

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Amount paise={item.amountPaise} size="md" />
          <p className="mt-1 truncate text-xs text-ink-muted">
            {item.payerVpa ? t("qr.from", { vpa: item.payerVpa }) : t("qr.unknownVpa")} · {formatDate(item.receivedAt, lang)}
          </p>
        </div>
      </div>

      {item.suggestion.kind === "strong" && !other && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">{t("qr.strong", { name: item.suggestion.customer.name })}</p>
          <PrimaryButton type="button" disabled={pending} onClick={() => item.suggestion.kind === "strong" && clearFor(item.suggestion.customer.id)}>
            {t("qr.clearFor", { name: item.suggestion.customer.name })}
          </PrimaryButton>
          <button type="button" onClick={() => setOther(true)} className="text-sm font-semibold text-primary">
            {t("qr.someoneElse")}
          </button>
        </div>
      )}

      {item.suggestion.kind === "weak" && !other && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">{t("qr.weak")}</p>
          <div className="grid grid-cols-2 gap-2">
            {item.suggestion.customers.map((c) => (
              <SecondaryButton key={c.id} type="button" disabled={pending} onClick={() => clearFor(c.id)}>
                {c.name}
              </SecondaryButton>
            ))}
          </div>
          <button type="button" onClick={() => setOther(true)} className="text-sm font-semibold text-primary">
            {t("qr.someoneElse")}
          </button>
        </div>
      )}

      {other && (
        <div className="space-y-2">
          {item.suggestion.kind === "unknown" && <p className="text-sm font-medium text-ink">{t("qr.unknown")}</p>}
          <Select aria-label={t("qr.pickCustomer")} value={picked} onChange={(e) => setPicked(e.target.value)}>
            <option value="">{t("qr.pickCustomer")}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <PrimaryButton type="button" disabled={pending || !picked} onClick={() => clearFor(picked)}>
            {t("qr.clear")}
          </PrimaryButton>
        </div>
      )}

      <SecondaryButton type="button" disabled={pending} onClick={() => run(() => markSaleAction(item.id))}>
        {t("qr.sale")}
      </SecondaryButton>
      <FormError message={failed ? t("qr.failed") : undefined} />
    </Card>
  );
}
