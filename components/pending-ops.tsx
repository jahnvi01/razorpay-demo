"use client";

import { useEffect, useState } from "react";
import { useI18n } from "./i18n-provider";
import { ClockIcon } from "./icons";
import { Card } from "./ui";
import { formatRupees } from "@/lib/format";
import { onOutboxChange, pending, type OutboxOp } from "@/lib/offline/outbox";

export const QUEUED_FLAG = "ud-queued";

/**
 * UD-58 On a customer's screen: udhaar and cash saved on this phone while offline, not yet synced.
 * The rest of the screen is the last synced copy, so these show apart with a clock until they sync.
 */
export function PendingOps({ customerId }: { customerId: string }) {
  const { t, lang } = useI18n();
  const [ops, setOps] = useState<OutboxOp[]>([]);
  const [justQueued, setJustQueued] = useState(false);

  useEffect(() => {
    const load = async () => setOps((await pending().catch(() => [])).filter((o) => o.customerId === customerId));
    void load();
    try {
      if (sessionStorage.getItem(QUEUED_FLAG)) {
        sessionStorage.removeItem(QUEUED_FLAG);
        setJustQueued(true); // eslint-disable-line react-hooks/set-state-in-effect
      }
    } catch {}
    return onOutboxChange(() => void load());
  }, [customerId]);

  if (!ops.length) return null;
  const time = (iso: string) => new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));

  return (
    <Card className="border-dashed p-4">
      {justQueued && <p className="mb-2 text-sm font-semibold text-ink">{t("offline.queued")}</p>}
      <p className="flex items-center gap-1.5 text-xs font-semibold text-notice">
        <ClockIcon size={14} /> {t("offline.pendingTitle")}
      </p>
      <ul className="mt-2 space-y-1.5">
        {ops.map((o) => (
          <li key={o.opId} className="flex items-center justify-between text-sm">
            <span className="text-ink">{t(o.kind === "udhaar" ? "offline.pendingUdhaar" : "offline.pendingCash", { amount: formatRupees(o.amountPaise) })}</span>
            <span className="text-xs text-ink-muted">{time(o.at)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
