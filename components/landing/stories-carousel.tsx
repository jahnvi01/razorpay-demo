"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { MessageKey } from "@/lib/i18n/dictionaries";

type Story = { name: string; initials: string; color: string; quote: MessageKey; shop: MessageKey; tool: MessageKey };

const STORIES: Story[] = [
  { name: "Mukesh Goyal", initials: "MG", color: "bg-[#2563eb]", quote: "lp.st.q1", shop: "lp.st.s1", tool: "lp.st.k1" },
  { name: "Sukhwinder Singh", initials: "SS", color: "bg-[#5b4ee6]", quote: "lp.st.q2", shop: "lp.st.s2", tool: "trust.title" },
  { name: "Aparna Nair", initials: "AN", color: "bg-[#2f8f5b]", quote: "lp.st.q3", shop: "lp.st.s3", tool: "lp.st.k3" },
  { name: "Fatima Shaikh", initials: "FS", color: "bg-[#c2410c]", quote: "lp.st.q4", shop: "lp.st.s4", tool: "lp.st.k4" },
  { name: "Rajesh Soni", initials: "RS", color: "bg-[#0e7490]", quote: "lp.st.q5", shop: "lp.st.s5", tool: "lp.st.k5" },
  { name: "Lakshmi Raman", initials: "LR", color: "bg-[#9d174d]", quote: "lp.st.q6", shop: "lp.st.s6", tool: "lp.t2.t" },
];

const AUTO_MS = 5000;

/**
 * UD-39 Merchant stories as a card carousel, like the RazorpayX customer stories. Swipe, arrows or dots.
 * Advances on its own, pauses on hover, focus or touch, and not at all for reduced motion. The stories
 * are illustrative and say so above the cards.
 */
export function StoriesCarousel() {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const last = Math.max(0, Math.round((el.scrollWidth - el.clientWidth) / ((el.firstElementChild as HTMLElement).offsetWidth + 16)));
    const target = el.children[i > last ? 0 : i < 0 ? last : i] as HTMLElement | undefined;
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: target.getBoundingClientRect().left - el.getBoundingClientRect().left, behavior: reduce ? "auto" : "smooth" });
  };

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => goTo(index + 1), AUTO_MS);
    return () => clearTimeout(timer);
  }, [index, paused]);

  const onScroll = () => {
    const el = trackRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    setIndex(Math.round(el.scrollLeft / (first.offsetWidth + 16)));
  };

  const arrow = "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/20";

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      aria-roledescription="carousel"
    >
      <div ref={trackRef} onScroll={onScroll} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STORIES.map((s, i) => (
          <figure
            key={s.name}
            aria-roledescription="slide"
            aria-label={t("lp.slide", { n: i + 1, total: STORIES.length })}
            className="flex w-[86%] shrink-0 snap-start flex-col rounded-xl bg-[#0F1A33] p-6 ring-1 ring-white/10 sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] md:p-7"
          >
            <span className="w-fit rounded-full bg-primary/20 px-2.5 py-1 text-[11px] font-semibold text-primary-on-dark">{t(s.tool)}</span>
            <blockquote className="mt-4 flex-1 text-[15px] leading-7 text-white/85">“{t(s.quote)}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${s.color}`}>{s.initials}</span>
              <span className="min-w-0">
                <span className="block font-semibold text-white">{s.name}</span>
                <span className="block text-sm text-white/55">{t(s.shop)}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Centred controls: previous, the dots, next */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button type="button" onClick={() => goTo(index - 1)} aria-label={t("lp.prev")} className={arrow}>
          <ChevronLeftIcon size={18} />
        </button>
        <div className="flex gap-1">
          {STORIES.map((s, i) => (
            <button key={s.name} type="button" onClick={() => goTo(i)} aria-label={t("lp.slide", { n: i + 1, total: STORIES.length })} aria-current={index === i ? "true" : undefined} className="flex h-6 items-center px-1">
              <span className={`h-2 rounded-full transition-all duration-300 ${index === i ? "w-6 bg-primary-on-dark" : "w-2 bg-white/25"}`} />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => goTo(index + 1)} aria-label={t("lp.next")} className={arrow}>
          <ChevronRightIcon size={18} />
        </button>
      </div>
    </div>
  );
}
