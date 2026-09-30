import type { Lang } from "@/lib/i18n/dictionaries";

/** "9000000101" -> "+91 90000 00101" */
export function formatPhone(phone: string): string {
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

/** 125050 -> "₹1,250.50", 125000 -> "₹1,250". Indian digit grouping. */
export function formatRupees(paise: number): string {
  const whole = paise % 100 === 0;
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Paise to the plain number an input shows: 125050 -> "1250.50". */
export function paiseToInput(paise: number): string {
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

/** "2026-10-07" or a timestamp -> "7 Oct" (English) or "7 अक्टू॰" (Hindi), in IST. */
export function formatDate(value: string, lang: Lang, withYear = false): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+05:30`) : new Date(value);
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "Asia/Kolkata",
  }).format(date);
}
