import type { ReactNode } from "react";
import { Amount } from "@/components/ui";
import type { Lang, Translate } from "@/lib/i18n/dictionaries";
import { buildUpdateMessage } from "@/lib/messages";

/**
 * UD-38 A phone frame and the app screens the landing page acts out. Pure markup, so both server and
 * client components can use it. Screens animate on mount, so give them a new key to replay.
 */
export function Phone({ label, children, small = false }: { label: string; children: ReactNode; small?: boolean }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-[38px] border-[7px] border-[#0b1221] bg-page shadow-high ${small ? "h-[400px] w-[214px]" : "h-[460px] w-[236px]"}`}
      role="img"
      aria-label={label}
    >
      <div className="absolute top-1.5 left-1/2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-[#0b1221]" />
      <div className="absolute inset-0 flex flex-col">{children}</div>
    </div>
  );
}

export function WhatsAppScreen({ lang }: { lang: Lang }) {
  const message = buildUpdateMessage({
    lang,
    customerName: "Sunita Sharma",
    merchantName: "Ramesh Kirana",
    event: { kind: "udhaar", amountPaise: 50000 },
    duePaise: 50000,
    nextDueDate: "2026-10-08",
    statementUrl: "udhaar-suite.vercel.app/s/…",
  });
  return (
    <>
      <div className="flex h-12 shrink-0 items-end gap-2 bg-[#075E54] px-3 pb-2 text-white">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold">RK</span>
        <span className="text-xs font-semibold">Ramesh Kirana</span>
      </div>
      <div className="flex-1 bg-[#ECE5DD] p-3">
        <div className="lp-pop max-w-[92%] rounded-lg rounded-tl-none bg-white p-2.5 text-[11px] leading-4 whitespace-pre-line text-ink shadow-low">
          {message}
          <p className="mt-1 text-right text-[9px] text-ink-muted">10:31</p>
        </div>
      </div>
    </>
  );
}

export function PayScreen({ t }: { t: Translate }) {
  return (
    <>
      <div className="flex h-12 shrink-0 items-end bg-topbar px-3 pb-2 text-xs font-semibold text-white">Ramesh Kirana</div>
      <div className="flex-1 space-y-2.5 p-3">
        <div className="rounded-md bg-white p-3 shadow-low">
          <p className="text-[10px] font-semibold text-ink-subtle">{t("statement.totalDue")}</p>
          <Amount paise={50000} size="md" />
        </div>
        <p className="text-[10px] font-semibold text-ink-subtle">{t("lp.phone.payWith")}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {["GPay", "PhonePe", "Paytm", "BHIM"].map((app, i) => (
            <div
              key={app}
              className={`rounded-sm border px-2 py-2 text-center text-[11px] font-semibold ${
                i === 0 ? "lp-tap border-primary bg-primary-faded text-primary" : "border-line bg-white text-ink-subtle"
              }`}
            >
              {app}
            </div>
          ))}
        </div>
        <div className="flex h-9 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-white">{t("lp.phone.paying")}</div>
      </div>
    </>
  );
}

