import type { ReactNode } from "react";
import type { MessageKey, Translate } from "@/lib/i18n/dictionaries";
import { CountUp } from "./count-up";
import { Reveal } from "./reveal";

type Stat = {
  value: number;
  decimals?: number;
  prefix?: string;
  unit: MessageKey;
  label: MessageKey;
  graphic: ReactNode;
  source?: { name: string; url: string };
};

const INVEST_INDIA = { name: "Invest India", url: "https://www.investindia.gov.in/team-india-blogs/modernization-kirana-stores-india" };
const NPCI = { name: "NPCI via Business Standard, Sep 2026", url: "https://www.business-standard.com/finance/news/upi-transactions-august-2026-record-volume-npci-126090100506_1.html" };
const SIDBI = { name: "SIDBI and Crisil, May 2025", url: "https://www.sidbi.in/uploads/Understanding_Indian_MSME_sector_Progress_and_Challenges_13_05_25_Final.pdf" };

/** A thin bar that fills to `pct`, in a colour. */
function Bar({ pct, tone = "bg-primary-on-dark" }: { pct: number; tone?: string }) {
  return (
    <div className="mt-3 h-2 w-24 overflow-hidden rounded-full bg-white/10 md:w-28">
      <div className={`lp-fill h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** A donut for a share, drawn with a conic gradient. */
function Donut({ pct }: { pct: number }) {
  return (
    <div className="relative h-14 w-14 rounded-full" style={{ background: `conic-gradient(#6CA0FF ${pct * 3.6}deg, rgba(255,255,255,0.1) 0)` }}>
      <div className="absolute inset-2 rounded-full bg-[#101C38]" />
    </div>
  );
}

function StatNumber({ s, t }: { s: Stat; t: Translate }) {
  return (
    <p className="font-heading text-[34px] leading-none font-semibold tracking-tight text-white md:text-[40px]">
      {s.prefix}
      <CountUp value={s.value} decimals={s.decimals} />
      <span className="ml-1 text-lg font-semibold text-white/70 md:text-xl">{t(s.unit)}</span>
    </p>
  );
}

/**
 * UD-39 How big udhaar is. Market figures on top, each with its source, then our goals tagged Target
 * with the assumption written on the card. Numbers count up and cards stagger in as they scroll in.
 */
export function Market({ t }: { t: Translate }) {
  const today: Stat[] = [
    {
      value: 1.3,
      decimals: 1,
      unit: "lp.mk.crore",
      label: "lp.mk.m1",
      source: INVEST_INDIA,
      graphic: (
        <div className="grid grid-cols-10 gap-1" aria-hidden="true">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} className="h-3 rounded-[3px] bg-primary-on-dark/70" style={{ opacity: 0.35 + (i % 5) * 0.15 }} />
          ))}
        </div>
      ),
    },
    {
      value: 95,
      unit: "lp.mk.pct",
      label: "lp.mk.m2",
      source: INVEST_INDIA,
      graphic: (
        <div className="flex items-end gap-1" aria-hidden="true">
          {[40, 65, 30, 80, 55, 45, 70, 35, 60, 90].map((h, i) => (
            <span key={i} className="w-3 rounded-t-[3px] bg-[#3BD48E]/80" style={{ height: `${h * 0.4}px` }} />
          ))}
        </div>
      ),
    },
    {
      value: 80,
      unit: "lp.mk.pctPlus",
      label: "lp.mk.m3",
      source: INVEST_INDIA,
      graphic: <Bar pct={80} tone="bg-[#F5B544]" />,
    },
    {
      value: 88,
      unit: "lp.mk.pct",
      label: "lp.mk.m4",
      source: INVEST_INDIA,
      graphic: <Donut pct={88} />,
    },
    {
      value: 24.51,
      decimals: 2,
      unit: "lp.mk.bn",
      label: "lp.mk.m5",
      source: NPCI,
      graphic: (
        <div className="flex items-end gap-2" aria-hidden="true">
          {[
            ["M", 23.2],
            ["J", 22.72],
            ["J", 23.66],
            ["A", 24.51],
          ].map(([m, v], i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className={`w-5 rounded-t-[3px] ${i === 3 ? "bg-primary-on-dark" : "bg-white/25"}`} style={{ height: `${((v as number) - 21) * 12}px` }} />
              <span className="text-[9px] text-white/50">{m}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      value: 30,
      prefix: "₹",
      unit: "lp.mk.lakhCrore",
      label: "lp.mk.m6",
      source: SIDBI,
      graphic: <Bar pct={24} tone="bg-[#FF7A6B]" />,
    },
  ];

  const goals: Stat[] = [
    { value: 1.3, decimals: 1, unit: "lp.mk.lakhShops", label: "lp.mk.g1", graphic: null },
    { value: 260, prefix: "₹", unit: "lp.mk.croreMonth", label: "lp.mk.g2", graphic: null },
    { value: 10, unit: "lp.mk.sec", label: "lp.mk.g3", graphic: null },
  ];

  return (
    <div className="mt-10 space-y-10">
      <div>
        <p className="text-xs font-semibold tracking-widest text-white/50 uppercase">{t("lp.mk.today")}</p>
        <Reveal stagger className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {today.map((s) => (
            <div key={s.label} className="flex flex-col rounded-xl bg-[#101C38] p-5 ring-1 ring-white/10 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <StatNumber s={s} t={t} />
                <div className="shrink-0">{s.graphic}</div>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/80">{t(s.label)}</p>
              {s.source && (
                <a href={s.source.url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-3 text-[11px] text-white/45 underline-offset-2 hover:text-white/70 hover:underline">
                  {t("lp.mk.source", { name: s.source.name })}
                </a>
              )}
            </div>
          ))}
        </Reveal>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-widest text-white/50 uppercase">{t("lp.mk.aim")}</p>
        <Reveal stagger variant="scale" className="mt-4 grid gap-3 md:grid-cols-3 md:gap-4">
          {goals.map((s) => (
            <div key={s.label} className="rounded-xl border border-dashed border-primary-on-dark/50 bg-primary/10 p-5 md:p-6">
              <span className="inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">{t("lp.mk.target")}</span>
              <div className="mt-3">
                <StatNumber s={s} t={t} />
              </div>
              <p className="mt-3 text-sm leading-6 text-white/80">{t(s.label)}</p>
            </div>
          ))}
        </Reveal>
        <p className="mt-3 text-xs text-white/45">{t("lp.mk.note")}</p>
      </div>
    </div>
  );
}
