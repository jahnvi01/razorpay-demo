import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import Link from "next/link";

// Razorpay Blade style form controls.

const control =
  "h-12 w-full rounded-sm border bg-surface px-3 text-[15px] text-ink placeholder:text-ink-muted transition-colors duration-200 ease-standard focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-faded-hover disabled:bg-page";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-subtle">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-negative">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  invalid,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; ref?: React.Ref<HTMLInputElement> }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
      className={`${control} ${invalid ? "border-negative" : "border-line-strong"} ${className}`}
    />
  );
}

/** Rupee amount input with a fixed ₹ prefix and a numeric keypad on phones. */
export function AmountInput({
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; ref?: React.Ref<HTMLInputElement> }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg font-semibold text-ink-subtle">
        ₹
      </span>
      <TextInput {...props} invalid={invalid} inputMode="decimal" autoComplete="off" className="pl-8 text-lg font-semibold tabular-nums" />
    </div>
  );
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${control} border-line-strong ${className}`} />;
}

const PRIMARY_TONES = {
  primary: "bg-primary hover:bg-primary-hover disabled:bg-primary/60",
  whatsapp: "bg-[#1DA851] hover:bg-[#178a43] disabled:bg-[#1DA851]/60",
};

export function PrimaryButton({
  children,
  className = "",
  tone = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof PRIMARY_TONES }) {
  return (
    <button
      {...props}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-sm px-4 text-[15px] font-semibold text-white transition-colors duration-200 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait ${PRIMARY_TONES[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-sm border border-line-strong bg-surface px-4 text-[15px] font-semibold text-ink transition-colors duration-200 ease-standard hover:bg-gray-faded disabled:cursor-wait disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary-hover"
      : "border border-line-strong bg-surface text-ink hover:bg-gray-faded";
  return (
    <Link
      href={href}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-sm px-4 text-[15px] font-semibold transition-colors duration-200 ease-standard ${styles}`}
    >
      {children}
    </Link>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-sm bg-negative-subtle px-3 py-2.5 text-sm font-medium text-negative">
      {message}
    </p>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <p role="status" className="rounded-sm bg-positive-subtle px-3 py-2.5 text-sm font-medium text-positive">
      {message}
    </p>
  );
}
