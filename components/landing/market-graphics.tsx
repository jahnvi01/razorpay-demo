"use client";

import { useEffect, useRef, useState } from "react";

/** True once the element has scrolled into view (or straight away for reduced motion / no observer). */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setOn(true);
        io.disconnect();
      }
    }, { rootMargin: "0px 0px -15% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on] as const;
}

const motion = "transition-all duration-700 ease-standard motion-reduce:transition-none";

/**
 * UD-60 6.3 crore MSMEs: a crowd of little shops lighting up one after another. Each tile is a tiny
 * storefront with an awning, so the grid reads as "lots and lots of shops".
 */
export function ShopsGrid() {
  const [ref, on] = useInView<HTMLDivElement>();
  const cells = 48;
  return (
    <div ref={ref} className="relative grid w-fit grid-cols-12 gap-1.5" aria-hidden="true">
      {Array.from({ length: cells }, (_, i) => (
        <span
          key={i}
          className={`${motion} block h-4 w-4 overflow-hidden rounded-[4px] ${on ? "scale-100 bg-[#8FB6FF]/90 opacity-100" : "scale-50 bg-white/20 opacity-0"}`}
          style={{ transitionDelay: on ? `${(i % 12) * 35 + Math.floor(i / 12) * 90}ms` : "0ms" }}
        >
          <span className="block h-1.5 bg-[#3D6FE0]" />
        </span>
      ))}
    </div>
  );
}

/** 80%+ cash-heavy: a ring that sweeps to 80% in amber, the remaining slice in blue for digital. */
export function CashRing({ cashLabel, digitalLabel }: { cashLabel: string; digitalLabel: string }) {
  const [ref, on] = useInView<HTMLDivElement>();
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div ref={ref} className="flex items-center gap-5" aria-hidden="true">
      <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
        <circle cx="46" cy="46" r={r} fill="none" stroke="#6CA0FF" strokeOpacity="0.55" strokeWidth="10" />
        <circle
          cx="46"
          cy="46"
          r={r}
          fill="none"
          stroke="#F5B544"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={on ? c * 0.2 : c}
          className="transition-[stroke-dashoffset] duration-[1400ms] ease-standard motion-reduce:transition-none"
        />
      </svg>
      <div className="space-y-2 text-xs text-white/75">
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F5B544]" /> {cashLabel}
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#6CA0FF]/70" /> {digitalLabel}
        </p>
      </div>
    </div>
  );
}

/** ₹7.34 lakh crore paid late: stacks of coins piling up while a clock keeps ticking. */
export function StuckCoins() {
  const [ref, on] = useInView<HTMLDivElement>();
  const stacks = [3, 5, 7, 6, 8];
  return (
    <div ref={ref} className="flex items-end gap-4" aria-hidden="true">
      <span className="relative mb-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#FF9A8E]">
        <span className="absolute h-1.5 w-1.5 rounded-full bg-[#FF9A8E]" />
        <span className={`absolute bottom-1/2 left-1/2 h-4 w-0.5 origin-bottom -translate-x-1/2 rounded-full bg-[#FF9A8E] ${on ? "lp-clock" : ""}`} />
        <span className="absolute bottom-1/2 left-1/2 h-3 w-0.5 origin-bottom -translate-x-1/2 rotate-90 rounded-full bg-[#FF9A8E]/70" />
      </span>
      <div className="flex items-end gap-1.5">
        {stacks.map((n, s) => (
          <div key={s} className="flex flex-col-reverse gap-0.5">
            {Array.from({ length: n }, (_, k) => (
              <span
                key={k}
                className={`${motion} block h-2 w-7 rounded-full border border-[#FF7A6B] bg-[#FF7A6B]/35 ${on ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`}
                style={{ transitionDelay: on ? `${s * 120 + k * 70}ms` : "0ms" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
