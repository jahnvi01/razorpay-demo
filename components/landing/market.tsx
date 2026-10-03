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
const SIDBI = { name: "SIDBI and Crisil, May 2025", url: "https://www.sidbi.in/uploads/Understanding_Indian_MSME_sector_Progress_and_Challenges_13_05_25_Final.pdf" };

/** A thin bar that fills to `pct`, in a colour. */
function Bar({ pct, tone = "bg-primary-on-dark" }: { pct: number; tone?: string }) {
  return (
    <div className="mt-3 h-2 w-24 overflow-hidden rounded-full bg-white/10 md:w-28">
      <div className={`lp-fill h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
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
 * UD-39 How big udhaar is: three market figures, each with its source. Numbers count up and the
 * cards stagger in as they scroll in.
 */
export function Market({ t }: { t: Translate }) {
  const stats: Stat[] = [
    {
      value: 1.3,
      decimals: 1,
      unit: "lp.mk.crore",
      label: "lp.mk.m1",
      source: INVEST_INDIA,
      graphic: (
        <div className="mt-3 grid w-24 grid-cols-10 gap-1 md:w-28" aria-hidden="true">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} className="h-3 rounded-[3px] bg-primary-on-dark/70" style={{ opacity: 0.35 + (i % 5) * 0.15 }} />
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
      value: 30,
      prefix: "₹",
      unit: "lp.mk.lakhCrore",
      label: "lp.mk.m6",
      source: SIDBI,
      graphic: <Bar pct={24} tone="bg-[#FF7A6B]" />,
    },
  ];

  return (
    <Reveal stagger className="mt-10 grid gap-3 md:grid-cols-3 md:gap-4">
      {stats.map((s) => (
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
  );
}
