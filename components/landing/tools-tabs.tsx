"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useI18n } from "@/components/i18n-provider";
import { Reveal } from "./reveal";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  MessageCircleIcon,
  QRCodeIcon,
} from "@/components/icons";
import { Amount, Badge } from "@/components/ui";
import {
  translator,
  type Lang,
  type MessageKey,
  type Translate,
} from "@/lib/i18n/dictionaries";
import { SHOP_QR_ENABLED } from "@/lib/features";
import { buildReminderMessage } from "@/lib/messages";

type Tool = {
  tab: MessageKey;
  eyebrow: MessageKey;
  body: MessageKey;
  ticks: MessageKey[];
  href: string;
  Demo: (p: { t: Translate; lang: Lang }) => ReactNode;
};

const TOOLS: Tool[] = [
  {
    tab: "trust.title",
    eyebrow: "lp.t1.e",
    body: "lp.t1.b",
    ticks: ["lp.t1.k1", "lp.t1.k2", "lp.t1.k3"],
    href: "/app/customers",
    Demo: TrustDemo,
  },
  {
    tab: "lp.t2.t",
    eyebrow: "lp.t2.e",
    body: "lp.t2.b",
    ticks: ["lp.t2.k1", "lp.t2.k2", "lp.t2.k3"],
    href: "/app/dues",
    Demo: OverdueDemo,
  },
  {
    tab: "qr.title",
    eyebrow: "lp.t3.e",
    body: "lp.t3.b",
    ticks: ["lp.t3.k1", "lp.t3.k2", "lp.t3.k3"],
    href: "/app/qr",
    Demo: QrDemo,
  },
  {
    tab: "lp.t4.t",
    eyebrow: "lp.t4.e",
    body: "lp.t4.b",
    ticks: ["lp.t4.k1", "lp.t4.k2", "lp.t4.k3"],
    href: "/app",
    Demo: LangDemo,
  },
];

// Shop QR is hidden for now (see lib/features.ts).
const VISIBLE_TOOLS = TOOLS.filter(
  (tool) => SHOP_QR_ENABLED || tool.tab !== "qr.title",
);

const STICK_REM = 8.5; // header (4rem) + tab bar, plus a little air
const STACK_PX = 14; // each stacked card peeks out this much below the one before

/**
 * UD-38 Merchant tools, like the RazorpayX product cards: a sticky tab bar, and on desktop the cards
 * stack on top of each other as you scroll. Each card plays a short looping demo built in CSS.
 */
export function ToolsTabs() {
  const { t, lang } = useI18n();
  const [active, setActive] = useState(0);
  const anchors = useRef<(HTMLDivElement | null)[]>([]);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      let current = 0;
      cards.current.forEach((el, i) => {
        if (
          el &&
          el.getBoundingClientRect().top <= STICK_REM * rem + i * STACK_PX + 80
        )
          current = i;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const goTo = (i: number) => {
    const el = anchors.current[i];
    if (!el) return;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top:
        el.getBoundingClientRect().top +
        window.scrollY -
        STICK_REM * rem -
        i * STACK_PX,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <div>
      <nav
        aria-label={t("lp.tools.eyebrow")}
        className="sticky top-16 z-20 -mx-4 border-b border-line bg-page/95 px-4 backdrop-blur"
      >
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] md:justify-center md:gap-6 [&::-webkit-scrollbar]:hidden">
          {VISIBLE_TOOLS.map((tool, i) => (
            <button
              key={tool.tab}
              type="button"
              onClick={() => goTo(i)}
              aria-current={active === i ? "true" : undefined}
              className={`relative h-13 shrink-0 px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                active === i ? "text-primary" : "text-ink-muted hover:text-ink"
              }`}
            >
              {t(tool.tab)}
              <span
                className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary transition-opacity duration-200 ${active === i ? "opacity-100" : "opacity-0"}`}
              />
            </button>
          ))}
        </div>
      </nav>

      {/* Anchors and cards are siblings in one container, so each sticky card can pin until the end */}
      <div className="mt-6 md:mt-10">
        {VISIBLE_TOOLS.map(({ tab, eyebrow, body, ticks, href, Demo }, i) => [
          <div
            key={`${tab}-anchor`}
            ref={(el) => {
              anchors.current[i] = el;
            }}
            aria-hidden="true"
          />,
          <div
            key={tab}
            ref={(el) => {
              cards.current[i] = el;
            }}
            className={`md:sticky md:top-(--stick) ${i < VISIBLE_TOOLS.length - 1 ? "mb-6 md:mb-24" : ""}`}
            style={
              {
                "--stick": `calc(${STICK_REM}rem + ${i * STACK_PX}px)`,
              } as CSSProperties
            }
          >
            <Reveal variant="up">
              <article className="grid items-center gap-6 rounded-xl bg-surface p-4 shadow-high ring-1 ring-line md:grid-cols-2 md:gap-12 md:p-8">
                <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-lg bg-[#E8F0FF] p-5 md:min-h-[340px]">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "radial-gradient(#C5D6FA 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                    }}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-xs">
                    <Demo t={t} lang={lang} />
                  </div>
                </div>
                <div>
                  <span className="inline-block rounded-sm bg-page px-2 py-1 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                    {t(eyebrow)}
                  </span>
                  <h3 className="mt-3 font-heading text-[26px] leading-8 font-semibold tracking-tight text-ink md:text-[30px] md:leading-9">
                    {t(tab)}
                  </h3>
                  <p className="mt-2 text-[15px] leading-6 text-ink-subtle">
                    {t(body)}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {ticks.map((k) => (
                      <li
                        key={k}
                        className="flex items-start gap-2 text-sm text-ink"
                      >
                        <CheckCircleIcon
                          size={18}
                          className="mt-px shrink-0 text-positive-intense"
                        />
                        {t(k)}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={href}
                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-sm bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-hover"
                  >
                    {t("lp.tools.cta")}
                    <ArrowRightIcon size={16} />
                  </Link>
                </div>
              </article>
            </Reveal>
          </div>,
        ])}
      </div>
    </div>
  );
}

/** A pointer that glides in and taps the element it sits in. */
function Cursor({ dx = 70, dy = 70 }: { dx?: number; dy?: number }) {
  return (
    <span
      className="pointer-events-none absolute top-1/2 left-1/2 z-10"
      aria-hidden="true"
    >
      <span className="lp-ripple absolute -top-4 -left-4 h-8 w-8 rounded-full bg-primary/30" />
      <svg
        className="lp-cursor block drop-shadow"
        style={{ "--dx": `${dx}px`, "--dy": `${dy}px` } as CSSProperties}
        width="18"
        height="22"
        viewBox="0 0 18 22"
      >
        <path
          d="M1 1 L1 17 L5.5 13 L8.5 20 L11.5 18.6 L8.6 12 L15 12 Z"
          fill="#0A1630"
          stroke="white"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Two layers in one grid cell: the "before" fades out and the "after" fades in at the tap. */
function Swap({ before, after }: { before: ReactNode; after: ReactNode }) {
  return (
    <span className="grid">
      <span className="lp-out2 col-start-1 row-start-1">{before}</span>
      <span className="lp-in2 col-start-1 row-start-1">{after}</span>
    </span>
  );
}

function TrustDemo({ t }: { t: Translate }) {
  const rows = [
    {
      name: "Lakshmi Iyer",
      width: "w-[90%]",
      bar: "bg-positive-intense",
      grow: "lp-grow1",
      show: "lp-in1",
      tone: "positive" as const,
      label: t("trust.usually"),
      rate: t("trust.onTimeValue", { rate: 90, onTime: 9, cleared: 10 }),
    },
    {
      name: "Farhan Qureshi",
      width: "w-[40%]",
      bar: "bg-negative",
      grow: "lp-grow2",
      show: "lp-in2",
      tone: "negative" as const,
      label: t("trust.often"),
      rate: t("trust.onTimeValue", { rate: 40, onTime: 2, cleared: 5 }),
    },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.name} className="rounded-lg bg-white p-3.5 shadow-low">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{r.name}</p>
            <span className={r.show}>
              <Badge tone={r.tone}>{r.label}</Badge>
            </span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-gray-faded">
            <div
              className={`${r.grow} h-full rounded-full ${r.width} ${r.bar}`}
            />
          </div>
          <p className={`${r.show} mt-1.5 text-xs text-ink-muted`}>
            {t("trust.onTime")} · {r.rate}
          </p>
        </div>
      ))}
    </div>
  );
}

function OverdueDemo({ t, lang }: { t: Translate; lang: Lang }) {
  const message = buildReminderMessage({
    lang,
    customerName: "Farhan Qureshi",
    merchantName: "Ramesh Kirana",
    duePaise: 150000,
    nextDueDate: "2026-09-16",
    today: "2026-10-01",
    statementUrl: "udhaar-suite.vercel.app/s/…",
  });
  const remind = (
    <span className="inline-flex h-8 items-center gap-1 rounded-sm bg-[#1DA851] px-2.5 text-xs font-semibold text-white">
      <MessageCircleIcon size={13} /> {t("remind.short")}
    </span>
  );
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-ink-subtle">
        {t("overdue.total", { amount: "₹2,700", count: 2 })}
      </p>
      {[
        ["Farhan Qureshi", 150000, 15, true],
        ["Gurpreet Singh", 120000, 12, false],
      ].map(([name, paise, days, demo]) => (
        <div
          key={name as string}
          className="flex items-center justify-between gap-2 rounded-lg bg-white p-3 shadow-low"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Amount paise={paise as number} size="sm" />
              <Badge tone="negative">
                {t("overdue.daysLate", { days: days as number })}
              </Badge>
            </div>
          </div>
          {demo ? (
            <span className="relative shrink-0">
              <Swap
                before={remind}
                after={
                  <span className="inline-flex h-8 items-center gap-1 rounded-sm bg-positive-subtle px-2.5 text-xs font-semibold text-positive">
                    <CheckCircleIcon size={13} /> {t("overdue.reminded")}
                  </span>
                }
              />
              <Cursor />
            </span>
          ) : (
            <span className="shrink-0">{remind}</span>
          )}
        </div>
      ))}
      <div className="lp-in3 ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#DCF8C6] px-3 py-2 text-[11px] leading-4 whitespace-pre-line text-ink shadow-low line-clamp-4">
        {message}
      </div>
    </div>
  );
}

function QrDemo({ t }: { t: Translate }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex shrink-0 flex-col items-center rounded-lg bg-white p-3 shadow-low">
        <QRCodeIcon size={52} className="text-ink" />
        <p className="mt-1 text-[10px] font-semibold text-ink-muted">
          Ramesh Kirana
        </p>
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="lp-in1 rounded-lg bg-white p-3 shadow-low">
          <p className="text-sm font-semibold text-ink">₹300</p>
          <p className="truncate text-[11px] text-ink-muted">
            {t("qr.from", { vpa: "sunita@okaxis" })}
          </p>
          <p className="mt-1.5 text-xs font-medium text-ink">
            {t("qr.strong", { name: "Sunita" })}
          </p>
          <span className="relative mt-2 block">
            <Swap
              before={
                <span className="flex h-8 items-center justify-center rounded-sm bg-primary px-2 text-xs font-semibold text-white">
                  {t("qr.clearFor", { name: "Sunita" })}
                </span>
              }
              after={
                <span className="flex h-8 items-center justify-center gap-1 rounded-sm bg-positive-subtle px-2 text-xs font-semibold text-positive">
                  <CheckCircleIcon size={13} />{" "}
                  {t("qr.matched", { name: "Sunita" })}
                </span>
              }
            />
            <Cursor dx={60} dy={60} />
          </span>
        </div>
        <div className="lp-in3 flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-low">
          <p className="truncate text-xs font-semibold text-ink">
            Sunita Sharma
          </p>
          <Badge tone="notice">{t("customer.left", { amount: "₹200" })}</Badge>
        </div>
      </div>
    </div>
  );
}

function StatementCard({ lang }: { lang: "en" | "hi" }) {
  const ct = translator(lang);
  return (
    <div lang={lang} className="rounded-lg bg-white p-4 shadow-low">
      <p className="font-heading text-sm font-semibold text-ink">
        {ct("statement.title")}
      </p>
      <p className="text-[11px] text-ink-muted">
        {ct("statement.from", { merchant: "Ramesh Kirana" })}
      </p>
      <p className="mt-3 text-[11px] font-semibold text-ink-subtle">
        {ct("statement.totalDue")}
      </p>
      <Amount paise={50000} size="md" />
      <p className="text-[11px] text-ink-subtle">
        {ct("statement.nextDue", {
          date: lang === "hi" ? "8 अक्टू॰" : "8 Oct",
        })}
      </p>
      <div className="mt-3 flex h-9 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-white">
        {ct("statement.pay", { amount: "₹500" })}
      </div>
    </div>
  );
}

function LangDemo() {
  const pill = (on: "en" | "hi") => (
    <span className="flex h-8 rounded-full bg-white p-0.5 text-xs font-semibold shadow-low">
      <span
        lang="en"
        className={`flex items-center rounded-full px-3 ${on === "en" ? "bg-primary text-white" : "text-ink-muted"}`}
      >
        EN
      </span>
      <span
        lang="hi"
        className={`flex items-center rounded-full px-3 ${on === "hi" ? "bg-primary text-white" : "text-ink-muted"}`}
      >
        हिं
      </span>
    </span>
  );
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <span className="relative">
          <Swap before={pill("en")} after={pill("hi")} />
          <span className="absolute top-0 right-0 bottom-0 w-1/2">
            <Cursor dx={-80} dy={70} />
          </span>
        </span>
      </div>
      <Swap
        before={<StatementCard lang="en" />}
        after={<StatementCard lang="hi" />}
      />
    </div>
  );
}
