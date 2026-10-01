"use client";

import { useState, useTransition } from "react";
import { resendSmsAction, whatsappShareAction } from "@/app/app/share-actions";
import { formatDate } from "@/lib/format";
import { FormError, PrimaryButton, SecondaryButton, SuccessBanner } from "./form";
import { useI18n } from "./i18n-provider";
import { CopyIcon, ExternalLinkIcon, MessageCircleIcon, MessageSquareIcon, PaymentLinkIcon } from "./icons";
import { Card } from "./ui";

/** UD-14 and UD-15 Send the customer their balance, pay link and statement. */
export function SendUpdate({
  customerId,
  duePaise,
  payUrl,
  statementUrl,
  lastSmsAt,
  savedKind,
  savedAmount,
  highlight,
  isDemo,
}: {
  customerId: string;
  duePaise: number;
  payUrl: string | null;
  statementUrl: string;
  lastSmsAt: string | null;
  savedKind?: string;
  savedAmount?: string;
  highlight: boolean;
  isDemo: boolean;
}) {
  const { t, lang } = useI18n();
  const [waPending, startWa] = useTransition();
  const [smsPending, startSms] = useTransition();
  const [status, setStatus] = useState<"smsSent" | "smsFailed" | "waFailed" | null>(null);
  const [copied, setCopied] = useState(false);

  const openWhatsApp = () =>
    startWa(async () => {
      setStatus(null);
      const res = await whatsappShareAction(customerId, savedKind, savedAmount);
      if (res.ok && res.url) window.location.href = res.url;
      else setStatus("waFailed");
    });

  const resendSms = () =>
    startSms(async () => {
      setStatus(null);
      const res = await resendSmsAction(customerId);
      setStatus(res.ok ? "smsSent" : "smsFailed");
    });

  const copyLink = async () => {
    if (!payUrl) return;
    await navigator.clipboard.writeText(payUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className={`space-y-3 p-4 ${highlight ? "ring-2 ring-primary" : ""}`}>
      <h3 className="font-heading text-base font-semibold text-ink">{t("share.title")}</h3>

      <div className="space-y-2">
        <PrimaryButton type="button" tone="whatsapp" onClick={openWhatsApp} disabled={waPending}>
          <MessageCircleIcon size={18} />
          {waPending
            ? t("share.opening")
            : savedKind !== "udhaar" && savedKind !== "cash" && duePaise > 0
              ? t("remind.whatsapp")
              : t("share.whatsapp")}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={resendSms} disabled={smsPending || duePaise === 0}>
          <MessageSquareIcon size={18} />
          {smsPending ? t("share.sending") : isDemo ? t("share.smsSend") : t("share.sms")}
        </SecondaryButton>
      </div>
      {isDemo && <p className="text-xs text-ink-muted">{t("share.demoNoAutoSms")}</p>}

      {status === "smsSent" && <SuccessBanner message={t("share.smsSent")} />}
      <FormError
        message={
          status === "smsFailed" ? t("share.smsFailed") : status === "waFailed" ? t("share.whatsappFailed") : undefined
        }
      />

      <div className="flex items-center gap-2 rounded-sm bg-page px-3 py-2.5">
        <PaymentLinkIcon size={18} className="shrink-0 text-ink-muted" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-ink-muted">{t("share.payLink")}</span>
          <span className="block truncate text-sm font-medium text-ink">
            {payUrl ? payUrl.replace("https://", "") : duePaise > 0 ? t("share.linkLater") : t("share.noLink")}
          </span>
        </span>
        {payUrl && (
          <button type="button" onClick={copyLink} className="flex items-center gap-1 text-sm font-semibold text-primary">
            <CopyIcon size={16} />
            {copied ? "✓" : ""}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{lastSmsAt ? t("share.lastSms", { date: formatDate(lastSmsAt, lang) }) : ""}</span>
        <a href={statementUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary">
          {t("share.statement")}
          <ExternalLinkIcon size={14} />
        </a>
      </div>
    </Card>
  );
}
