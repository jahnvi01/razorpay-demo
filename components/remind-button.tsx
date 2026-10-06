"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { resendSmsAction, whatsappShareAction } from "@/app/app/share-actions";
import { useI18n } from "./i18n-provider";
import { CheckIcon, MessageSquareIcon, WhatsAppIcon } from "./icons";

const iconButton =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";

/**
 * UD-21, UD-24 and UD-51 One-tap reminders for list rows, as two icon buttons: WhatsApp opens the
 * merchant's WhatsApp with the reminder written, SMS sends the Razorpay pay link SMS right away.
 */
export function RemindButton({ customerId }: { customerId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [waPending, startWa] = useTransition();
  const [smsPending, startSms] = useTransition();
  const [status, setStatus] = useState<"smsSent" | "smsFailed" | "waFailed" | null>(null);

  const whatsapp = () =>
    startWa(async () => {
      setStatus(null);
      const res = await whatsappShareAction(customerId);
      if (res.ok && res.url) {
        router.refresh(); // so "Reminded today" is there when the merchant comes back
        window.location.href = res.url;
      } else setStatus("waFailed");
    });

  const sms = () =>
    startSms(async () => {
      setStatus(null);
      const res = await resendSmsAction(customerId);
      setStatus(res.ok ? "smsSent" : "smsFailed");
    });

  // Refresh "Reminded today (SMS)" outside the transition, so the tick shows straight away
  useEffect(() => {
    if (status === "smsSent") router.refresh();
  }, [status, router]);

  const message = status === "smsSent" ? t("share.smsSent") : status === "smsFailed" ? t("share.smsFailed") : status === "waFailed" ? t("share.whatsappFailed") : "";

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={whatsapp}
        disabled={waPending}
        aria-label={t("remind.whatsapp")}
        title={status === "waFailed" ? message : t("remind.whatsapp")}
        className={`${iconButton} bg-[#25D366] text-white hover:bg-[#1DA851] ${status === "waFailed" ? "ring-2 ring-negative" : ""}`}
      >
        <WhatsAppIcon size={20} />
      </button>
      <button
        type="button"
        onClick={sms}
        disabled={smsPending}
        aria-label={t("remind.sms")}
        title={message && status !== "waFailed" ? message : t("remind.sms")}
        className={`${iconButton} border bg-surface ${
          status === "smsSent"
            ? "border-positive text-positive"
            : status === "smsFailed"
              ? "border-negative text-negative"
              : "border-line-strong text-primary hover:bg-primary-faded"
        }`}
      >
        {smsPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
        ) : status === "smsSent" ? (
          <CheckIcon size={18} />
        ) : (
          <MessageSquareIcon size={18} />
        )}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {message}
      </span>
    </div>
  );
}
