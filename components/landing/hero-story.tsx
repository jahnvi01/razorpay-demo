"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CheckCircleIcon, ChevronLeftIcon, PlusIcon, WhatsAppIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import type { MessageKey, Translate } from "@/lib/i18n/dictionaries";
import { PayScreen, Phone, WhatsAppScreen } from "./phone";

/** Four scenes, three story steps. Each scene plays for its own time, then the next begins. */
const SCENES: { step: 0 | 1 | 2; ms: number }[] = [
  { step: 0, ms: 2800 }, // udhaar recorded on Sunita's screen
  { step: 1, ms: 2800 }, // the reminder lands on her WhatsApp
  { step: 2, ms: 2400 }, // she pays by UPI
  { step: 2, ms: 3000 }, // the balance clears itself
];
const STEPS: [MessageKey, MessageKey][] = [
  ["lp.hero.s1", "lp.hero.p1"],
  ["lp.hero.s2", "lp.hero.p2"],
  ["lp.hero.s3", "lp.hero.p3"],
];

/**
 * UD-56 Hero in the OkCredit style. The headline is the three steps of the journey and lights up in
 * step with a phone that acts it out: record, remind, get paid. Step pills under the phone follow along
 * and can be tapped. Desktop: text left, phone right. Phones: headline, phone, then `cta` at the bottom.
 * Autoplay pauses off screen and never runs for reduced motion.
 */
export function HeroStory({ cta }: { cta: ReactNode }) {
  const { t, lang } = useI18n();
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const phoneRef = useRef<HTMLDivElement>(null);
  const step = SCENES[scene].step;

  // Only play while the phone is on screen and motion is welcome
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(false); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    const el = phoneRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => setPlaying(entries.some((e) => e.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setScene((s) => (s + 1) % SCENES.length), SCENES[scene].ms);
    return () => clearTimeout(timer);
  }, [scene, playing]);

  const jump = (target: number) => setScene(SCENES.findIndex((s) => s.step === target));

  return (
    <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-8 px-4 pt-8 pb-10 md:grid-cols-[minmax(0,1fr)_auto] md:pt-16 md:pb-16">
      {/* Headline: the journey in three steps */}
      <div className="md:col-start-1 md:row-start-1 md:self-end">
        <p className="lp-rise text-xs font-semibold tracking-widest text-primary uppercase">
          {t("lp.hero.title1")} {t("lp.hero.title2")}
        </p>
        <h1 className="lp-rise mt-4 font-heading text-[38px] leading-[46px] font-semibold tracking-tight md:text-[60px] md:leading-[70px]" style={{ animationDelay: "120ms" }}>
          {STEPS.map(([line], i) => (
            <span
              key={line}
              className={`block w-fit transition-colors duration-500 ease-standard ${
                i === step ? "text-ink [background:linear-gradient(transparent_62%,#DCE8FF_62%)]" : "text-ink/20"
              }`}
            >
              {t(line)}
            </span>
          ))}
        </h1>
      </div>

      {/* Phone acting out the journey, with step pills */}
      <div ref={phoneRef} className="lp-rise flex flex-col items-center md:col-start-2 md:row-span-2 md:row-start-1 md:self-center" style={{ animationDelay: "300ms" }}>
        <div className="relative">
          <div className="absolute -inset-10 -z-10 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
          <Phone label={t(STEPS[step][0])}>
            <div key={scene} className="lp-fade-up flex flex-1 flex-col">
              {scene === 0 && <LedgerScreen t={t} cleared={false} />}
              {scene === 1 && <WhatsAppScreen lang={lang} />}
              {scene === 2 && <PayScreen t={t} />}
              {scene === 3 && <LedgerScreen t={t} cleared />}
            </div>
          </Phone>
        </div>
        <div className="mt-5 flex rounded-full bg-white p-1 shadow-low ring-1 ring-line" role="group" aria-label={t("lp.hero.steps")}>
          {STEPS.map(([, pill], i) => (
            <button
              key={pill}
              type="button"
              onClick={() => jump(i)}
              aria-current={i === step ? "step" : undefined}
              className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-colors duration-300 ${
                i === step ? "bg-primary text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${i === step ? "bg-white/25" : "bg-gray-faded"}`}>{i + 1}</span>
              {t(pill)}
            </button>
          ))}
        </div>
      </div>

      {/* Paragraph and App Demo: under the headline on desktop, at the bottom on phones */}
      <div className="lp-rise md:col-start-1 md:row-start-2 md:self-start" style={{ animationDelay: "240ms" }}>{cta}</div>
    </div>
  );
}

/** Sunita's ledger, like a chat: udhaar on the right, payments on the left, balance at the bottom. */
function LedgerScreen({ t, cleared }: { t: Translate; cleared: boolean }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-end gap-2 bg-topbar px-3 pb-2 text-white">
        <ChevronLeftIcon size={16} className="mb-1 shrink-0 opacity-80" />
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8A0BF] text-xs font-semibold text-ink">S</span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold">Sunita Sharma</span>
          <span className="block text-[10px] text-white/70">{t("trust.usually")}</span>
        </span>
      </div>

      <div className="flex-1 space-y-2 bg-page p-3">
        <p className="mx-auto w-fit rounded-full bg-gray-faded px-2 py-0.5 text-[9px] font-semibold text-ink-subtle">{t("lp.phone.today")}</p>
        <div className={`ml-auto w-fit rounded-lg rounded-tr-none bg-white px-3 py-2 text-right shadow-low ${cleared ? "" : "lp-pop"}`} style={cleared ? undefined : { animationDelay: "900ms" }}>
          <p className="text-sm font-semibold text-negative">↑ ₹500</p>
          <p className="text-[9px] text-ink-muted">{t("lp.phone.udhaar")} · 10:42</p>
        </div>
        {cleared && (
          <div className="lp-pop w-fit rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-low" style={{ animationDelay: "700ms" }}>
            <p className="text-sm font-semibold text-positive">↓ ₹500</p>
            <p className="text-[9px] text-ink-muted">{t("lp.phone.paidUpi")} · 18:15</p>
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2 border-t border-line bg-surface p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-ink-subtle">{t("lp.phone.balance")}</span>
          {cleared ? (
            <span className="lp-pop flex items-center gap-1 text-sm font-semibold text-positive" style={{ animationDelay: "900ms" }}>
              ₹0 <CheckCircleIcon size={14} />
            </span>
          ) : (
            <span className="lp-pop text-sm font-semibold text-negative" style={{ animationDelay: "900ms" }}>
              ₹500
            </span>
          )}
        </div>
        {cleared ? (
          <div className="lp-pop flex justify-center" style={{ animationDelay: "1100ms" }}>
            <Badge tone="positive">{t("lp.phone.cleared")}</Badge>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <span className="flex h-8 items-center justify-center gap-1 rounded-sm bg-[#25D366] text-[10px] font-semibold text-white">
              <WhatsAppIcon size={12} /> {t("remind.short")}
            </span>
            <span className="lp-tap flex h-8 items-center justify-center gap-1 rounded-sm bg-primary text-[10px] font-semibold text-white">
              <PlusIcon size={12} /> {t("udhaar.new")}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
