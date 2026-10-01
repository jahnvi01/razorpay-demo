import type { ReactNode } from "react";
import { ClockIcon, MessageCircleIcon } from "@/components/icons";
import type { MessageKey, Translate } from "@/lib/i18n/dictionaries";
import { Reveal } from "./reveal";

/** UD-39 The everyday problem, as three picture cards that come in one after another. */
export function Problem({ t }: { t: Translate }) {
  const cards: [MessageKey, MessageKey, ReactNode][] = [
    [
      "lp.pb.t1",
      "lp.pb.b1",
      <div key="1" className="w-48 rotate-[-2deg] rounded-md bg-[#FBF7EE] p-3 shadow-low ring-1 ring-[#EFE6D2]">
        <p className="font-serif text-sm text-[#5B4A2A] italic">Arjun · ₹1,500</p>
        <p className="mt-1 font-serif text-sm text-[#5B4A2A] italic">
          Farhan · <span className="line-through decoration-negative">₹800</span> ₹1,050?
        </p>
        <span className="mt-2 inline-flex rounded-full bg-negative-subtle px-2 py-0.5 text-[11px] font-semibold text-negative">{t("lp.pb.v1")}</span>
      </div>,
    ],
    [
      "lp.pb.t2",
      "lp.pb.b2",
      <div key="2" className="w-52 space-y-2">
        <p className="ml-auto w-fit max-w-[85%] rounded-lg rounded-tr-none bg-[#DCF8C6] px-3 py-1.5 text-xs text-ink shadow-low">{t("lp.pb.v2a")}</p>
        <p className="w-fit max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-1.5 text-xs text-ink shadow-low">{t("lp.pb.v2b")}</p>
        <p className="flex items-center gap-1 text-[11px] text-ink-muted">
          <MessageCircleIcon size={12} /> {t("lp.pb.v2c")}
        </p>
      </div>,
    ],
    [
      "lp.pb.t3",
      "lp.pb.b3",
      <div key="3" className="flex items-center gap-3">
        <div className="flex h-20 w-20 flex-col overflow-hidden rounded-md bg-white text-center shadow-low">
          <span className="bg-negative py-0.5 text-[10px] font-semibold text-white">{t("lp.pb.v3a")}</span>
          <span className="flex flex-1 items-center justify-center font-heading text-2xl font-semibold text-ink">45</span>
        </div>
        <div className="space-y-1.5">
          <span className="flex items-center gap-1 text-xs font-semibold text-negative">
            <ClockIcon size={14} /> {t("lp.pb.v3b")}
          </span>
          <span className="block text-sm font-semibold text-ink">₹1,500</span>
        </div>
      </div>,
    ],
  ];

  return (
    <Reveal stagger className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
      {cards.map(([title, body, art], i) => (
        <div key={title} className="overflow-hidden rounded-xl bg-surface shadow-low ring-1 ring-line">
          <div className="flex h-44 items-center justify-center bg-linear-to-br from-[#FFF4F2] to-[#FDF8F0] p-5">{art}</div>
          <div className="p-5 md:p-6">
            <p className="text-xs font-semibold text-negative">0{i + 1}</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">{t(title)}</h3>
            <p className="mt-1.5 text-sm leading-6 text-ink-subtle">{t(body)}</p>
          </div>
        </div>
      ))}
    </Reveal>
  );
}
