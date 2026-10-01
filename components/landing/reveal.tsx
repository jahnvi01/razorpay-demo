"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Variant = "up" | "left" | "right" | "scale";

/**
 * Brings a block in as it scrolls into view, like razorpay.com/x: a fade with a lift, slide or zoom,
 * and with `stagger` each direct child follows the one before. Visible by default: only blocks that
 * start below the fold are hidden, and only by this script, so slow or no JavaScript never leaves a
 * blank page. Reduced motion skips it entirely.
 */
export function Reveal({
  children,
  className = "",
  variant = "up",
  stagger = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  stagger?: boolean;
  as?: "div" | "ul" | "ol";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return; // already on screen
    el.classList.add("lp-reveal", `lp-reveal-${variant}`);
    if (stagger) {
      el.classList.add("lp-reveal-group");
      [...el.children].forEach((child, i) => {
        (child as HTMLElement).style.transitionDelay = `${i * 110}ms`;
      });
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("is-visible");
          io.disconnect();
          // Drop the stagger delays once in, so later hover transitions are not delayed
          if (stagger) setTimeout(() => [...el.children].forEach((c) => ((c as HTMLElement).style.transitionDelay = "")), 1600);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [variant, stagger]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
