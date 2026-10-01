"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { Lang, MessageKey, Translate } from "@/lib/i18n/dictionaries";
import { ClearedScreen, PayScreen, Phone, RecordScreen, WhatsAppScreen } from "./phone";

const STEPS: [MessageKey, MessageKey][] = [
  ["landing.s1Title", "landing.s1Body"],
  ["landing.s2Title", "landing.s2Body"],
  ["landing.s3Title", "landing.s3Body"],
  ["landing.s4Title", "landing.s4Body"],
];

function Screen({ step, t, lang }: { step: number; t: Translate; lang: Lang }) {
  if (step === 0) return <RecordScreen t={t} />;
  if (step === 1) return <WhatsAppScreen lang={lang} />;
  if (step === 2) return <PayScreen t={t} />;
  return <ClearedScreen t={t} />;
}

/**
 * UD-38 The flow, told like the RazorpayX layer stack. Desktop: the phone stays pinned while the steps
 * scroll past, and the step nearest the middle of the screen drives the phone. Phones: a swipe carousel.
 */
export function FlowStory() {
  const { t, lang } = useI18n();
  const [active, setActive] = useState(0);
  const [slide, setSlide] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  // Desktop: the step whose centre is closest to the middle of the viewport is the active one
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      stepRefs.current.forEach((el, i) => {
        if (!el || !el.offsetParent) return;
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bestDist) [best, bestDist] = [i, dist];
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const onTrackScroll = () => {
    const el = trackRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    setSlide(Math.min(STEPS.length - 1, Math.round(el.scrollLeft / (first.offsetWidth + 16))));
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    const target = el?.children[i] as HTMLElement | undefined;
    if (el && target) {
      const box = el.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      el.scrollBy({ left: r.left + r.width / 2 - (box.left + box.width / 2), behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Desktop: pinned phone and scrolling steps */}
      <div className="hidden gap-16 md:grid md:grid-cols-2">
        <div className="relative">
          <div className="sticky top-[calc(50vh-230px+2rem)] flex justify-center">
            <div className="absolute top-1/2 left-1/2 -z-10 h-80 w-80 -translate-1/2 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
            <Phone label={t(STEPS[active][0])}>
              <div key={active} className="lp-fade-up flex flex-1 flex-col">
                <Screen step={active} t={t} lang={lang} />
              </div>
            </Phone>
          </div>
        </div>
        <ol className="relative">
          <span className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-line" aria-hidden="true" />
          <span
            className="absolute top-0 left-[19px] w-0.5 bg-primary transition-[height] duration-500 ease-standard"
            style={{ height: `${((active + 0.5) / STEPS.length) * 100}%` }}
            aria-hidden="true"
          />
          {STEPS.map(([title, body], i) => (
            <li
              key={title}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              aria-current={i === active ? "step" : undefined}
              className={`relative flex min-h-[62vh] items-center gap-6 transition-opacity duration-500 ease-standard ${i === active ? "opacity-100" : "opacity-35"}`}
            >
              <span
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-500 ${
                  i <= active ? "border-primary bg-primary text-white" : "border-line-strong bg-surface text-ink-muted"
                }`}
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-heading text-[26px] leading-8 font-semibold tracking-tight text-ink">{t(title)}</h3>
                <p className="mt-2 max-w-sm text-base leading-7 text-ink-subtle">{t(body)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Phones: swipe carousel with dots */}
      <div className="md:hidden">
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[9%] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {STEPS.map(([title, body], i) => (
            <div key={title} className="w-[82%] shrink-0 snap-center rounded-lg bg-surface p-4 shadow-low ring-1 ring-line">
              <p className="text-xs font-semibold text-primary">{t("lp.flow.step", { n: i + 1, total: STEPS.length })}</p>
              <h3 className="mt-1 text-lg leading-6 font-semibold text-ink">{t(title)}</h3>
              <p className="mt-1 min-h-12 text-sm leading-6 text-ink-subtle">{t(body)}</p>
              <div className="mt-4 flex justify-center">
                <Phone label={t(title)} small>
                  <div key={`${i}-${slide === i}`} className="flex flex-1 flex-col">
                    <Screen step={i} t={t} lang={lang} />
                  </div>
                </Phone>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {STEPS.map(([title], i) => (
            <button
              key={title}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t("lp.flow.step", { n: i + 1, total: STEPS.length })}
              aria-current={slide === i ? "step" : undefined}
              className="flex h-6 items-center justify-center px-1"
            >
              <span className={`h-2 rounded-full transition-all duration-300 ${slide === i ? "w-6 bg-primary" : "w-2 bg-line-strong"}`} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
