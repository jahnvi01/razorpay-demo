import type { ReactNode } from "react";

// Shared Razorpay-style building blocks.

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-line bg-surface shadow-low ${className}`}>{children}</div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="font-heading text-xl leading-7 font-semibold tracking-tight text-ink">{title}</h2>
      {action}
    </div>
  );
}

// Amount in Razorpay's style: small rupee sign, large rupees, small muted paise.
export function Amount({ paise, size = "lg" }: { paise: number; size?: "sm" | "md" | "lg" | "xl" }) {
  const rupees = Math.trunc(paise / 100).toLocaleString("en-IN");
  const fraction = String(Math.abs(paise) % 100).padStart(2, "0");
  const big = { sm: "text-base", md: "text-xl", lg: "text-[28px]", xl: "text-[40px]" }[size];
  const small = { sm: "text-xs", md: "text-sm", lg: "text-lg", xl: "text-2xl" }[size];
  return (
    <span className="inline-flex items-baseline font-semibold text-ink tabular-nums">
      <span className={`${small} mr-0.5 font-medium text-ink-subtle`}>₹</span>
      <span className={`${big} leading-none`}>{rupees}</span>
      <span className={`${small} font-medium text-ink-muted`}>.{fraction}</span>
    </span>
  );
}

type BadgeTone = "positive" | "negative" | "notice" | "information" | "neutral";

const badgeTones: Record<BadgeTone, string> = {
  positive: "bg-positive-subtle text-positive",
  negative: "bg-negative-subtle text-negative",
  notice: "bg-notice-subtle text-notice",
  information: "bg-information-subtle text-information",
  neutral: "bg-gray-faded text-ink-subtle",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}
