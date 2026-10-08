import type { ReactNode } from "react";
import type { MessageKey, Translate } from "@/lib/i18n/dictionaries";
import { CountUp } from "./count-up";
import { CashRing, ShopsGrid, StuckCoins } from "./market-graphics";
import { Reveal } from "./reveal";

type Stat = {
  value: number;
  decimals?: number;
  prefix?: string;
  unit: MessageKey;
  label: MessageKey;
  graphic: ReactNode;
  glow: string;
  source: { name: string; url: string };
};

const MSME_MINISTRY = { name: "Ministry of MSME, via PIB", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2089308&reg=48&lang=2" };
const INVEST_INDIA = { name: "Invest India", url: "https://www.investindia.gov.in/team-india-blogs/modernization-kirana-stores-india" };
const DELAYED_PAYMENTS = { name: "GAME, FISME and C2FO, March 2024", url: "https://smestreet.in/infocus/delayed-payments-report-30-highlights-msme-finance-progress-10816194" };

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
 * UD-39 and UD-60 The market in three figures, each with its source. Each card's graphic is a small
 * chart of its own number that draws as the card scrolls in: shops lighting up for 6.3 crore MSMEs,
 * a ring sweeping to 80% for cash-heavy shops, coins piling up for money stuck in late payments.
 */
export function Market({ t }: { t: Translate }) {
  const stats: Stat[] = [
    { value: 6.3, decimals: 1, unit: "lp.mk.crore", label: "lp.mk.m7", graphic: <ShopsGrid />, glow: "bg-[#6CA0FF]/25", source: MSME_MINISTRY },
    {
      value: 80,
      unit: "lp.mk.pctPlus",
      label: "lp.mk.m3",
      graphic: <CashRing cashLabel={t("lp.mk.cash")} digitalLabel={t("lp.mk.digital")} />,
      glow: "bg-[#F5B544]/20",
      source: INVEST_INDIA,
    },
    { value: 7.34, decimals: 2, prefix: "₹", unit: "lp.mk.lakhCrore", label: "lp.mk.m8", graphic: <StuckCoins />, glow: "bg-[#FF7A6B]/20", source: DELAYED_PAYMENTS },
  ];

  return (
    <Reveal stagger className="mt-10 grid gap-3 md:grid-cols-3 md:gap-4">
      {stats.map((s) => (
        <div key={s.label} className="relative flex flex-col overflow-hidden rounded-xl bg-[#101C38] p-5 ring-1 ring-white/10 md:p-6">
          <div className={`pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full blur-3xl ${s.glow}`} aria-hidden="true" />
          <div className="relative flex h-28 items-end">{s.graphic}</div>
          <div className="relative mt-5">
            <StatNumber s={s} t={t} />
          </div>
          <p className="relative mt-3 text-sm leading-6 text-white/80">{t(s.label)}</p>
          <a href={s.source.url} target="_blank" rel="noopener noreferrer" className="relative mt-auto pt-3 text-[11px] text-white/45 underline-offset-2 hover:text-white/70 hover:underline">
            {t("lp.mk.source", { name: s.source.name })}
          </a>
        </div>
      ))}
    </Reveal>
  );
}
