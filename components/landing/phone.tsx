import type { ReactNode } from "react";
import { CheckCircleIcon, MessageCircleIcon, PlusIcon } from "@/components/icons";
import { RazorpayLogo } from "@/components/razorpay-logo";
import { Amount, Badge } from "@/components/ui";
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

function AppBar() {
  return (
    <div className="flex h-12 shrink-0 items-end bg-topbar px-3 pb-2">
      <RazorpayLogo className="origin-left scale-75" />
    </div>
  );
}

export function HomeScreen({ t }: { t: Translate }) {
  const rows: [string, number, ReactNode][] = [
    ["Sunita Sharma", 50000, <Badge key="s" tone="notice">{t("customer.dueOn", { date: "8 Oct" })}</Badge>],
    ["Farhan Qureshi", 150000, <Badge key="f" tone="negative">{t("customers.overdue")}</Badge>],
    ["Lakshmi Iyer", 0, <Badge key="l" tone="positive">{t("customers.nothingDue")}</Badge>],
  ];
  return (
    <>
      <AppBar />
      <div className="flex-1 space-y-2.5 p-3">
        <p className="font-heading text-sm font-semibold text-ink">{t("home.title")}</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-white p-2.5 shadow-low">
            <p className="text-[10px] text-ink-muted">{t("home.given")}</p>
            <p className="text-sm font-semibold text-ink">₹12,450</p>
          </div>
          <div className="rounded-md bg-white p-2.5 shadow-low">
            <p className="text-[10px] text-ink-muted">{t("home.collected")}</p>
            <p className="text-sm font-semibold text-positive">₹8,200</p>
          </div>
        </div>
        <div className="divide-y divide-line rounded-md bg-white shadow-low">
          {rows.map(([name, paise, badge]) => (
            <div key={name} className="flex items-center justify-between gap-2 px-2.5 py-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-ink">{name}</p>
                <div className="mt-0.5 origin-left scale-90">{badge}</div>
              </div>
              <Amount paise={paise} size="sm" />
            </div>
          ))}
        </div>
        <div className="flex h-9 items-center justify-center gap-1 rounded-sm bg-primary text-xs font-semibold text-white">
          <PlusIcon size={14} /> {t("udhaar.new")}
        </div>
      </div>
    </>
  );
}

export function RecordScreen({ t }: { t: Translate }) {
  return (
    <>
      <AppBar />
      <div className="flex-1 space-y-2.5 p-3">
        <p className="font-heading text-sm font-semibold text-ink">{t("udhaar.title")}</p>
        <div className="lp-fade-up flex items-center gap-2 rounded-md border border-primary bg-primary-faded px-2.5 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-primary">S</span>
          <span className="text-xs font-semibold text-ink">Sunita Sharma</span>
        </div>
        <div className="lp-fade-up rounded-sm border border-line-strong bg-white px-2.5 py-2" style={{ animationDelay: "150ms" }}>
          <p className="text-[10px] text-ink-muted">{t("form.amount")}</p>
          <p className="text-lg font-semibold text-ink">₹500</p>
        </div>
        <div className="lp-fade-up rounded-sm border border-line-strong bg-white px-2.5 py-2" style={{ animationDelay: "300ms" }}>
          <p className="text-[10px] text-ink-muted">{t("form.dueDate")}</p>
          <p className="text-xs font-medium text-ink">8 Oct · {t("udhaar.dueHint", { days: 7 })}</p>
        </div>
        <div className="lp-tap flex h-9 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-white">{t("udhaar.save")}</div>
      </div>
    </>
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

export function ClearedScreen({ t }: { t: Translate }) {
  return (
    <>
      <AppBar />
      <div className="flex-1 space-y-2.5 p-3">
        <div className="lp-pop flex flex-col items-center rounded-md bg-white p-4 text-center shadow-low">
          <CheckCircleIcon size={34} className="text-positive-intense" />
          <p className="mt-2 text-xs font-semibold text-ink">{t("lp.phone.received")}</p>
          <p className="text-[11px] text-positive">{t("lp.phone.cleared")}</p>
        </div>
        <div className="rounded-md bg-white p-3 shadow-low">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-ink-subtle">{t("trust.title")}</p>
            <Badge tone="positive">{t("trust.usually")}</Badge>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-faded">
            <div className="lp-fill h-full w-[90%] rounded-full bg-positive-intense" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-white p-2.5 text-[11px] text-ink-subtle shadow-low">
          <MessageCircleIcon size={14} className="text-[#1DA851]" />
          {t("lp.phone.today")} · UPI · ₹500
        </div>
      </div>
    </>
  );
}
