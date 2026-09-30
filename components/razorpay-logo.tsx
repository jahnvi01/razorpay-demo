import { RazorpayIcon } from "./icons";

// Razorpay mark (from Blade) with the wordmark set in type, as on the dashboard top bar.
export function RazorpayLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-white ${className}`} aria-label="Razorpay">
      <RazorpayIcon size={22} className="text-primary" />
      <span className="font-sans text-[19px] font-extrabold italic tracking-tight" aria-hidden="true">
        Razorpay
      </span>
    </span>
  );
}
