"use client";

import { useState, useTransition } from "react";
import { whatsappShareAction } from "@/app/app/share-actions";
import { useI18n } from "./i18n-provider";
import { MessageCircleIcon } from "./icons";

/** UD-21 and UD-24 One-tap WhatsApp reminder, for list rows. */
export function RemindButton({ customerId }: { customerId: string }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={t("remind.whatsapp")}
      onClick={() =>
        start(async () => {
          setFailed(false);
          const res = await whatsappShareAction(customerId);
          if (res.ok && res.url) window.location.href = res.url;
          else setFailed(true);
        })
      }
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm bg-[#1DA851] px-3 text-xs font-semibold text-white transition-colors duration-200 ease-standard hover:bg-[#178a43] disabled:opacity-60"
    >
      <MessageCircleIcon size={15} />
      {pending ? "…" : failed ? t("error.retry") : t("remind.short")}
    </button>
  );
}
