import { formatDate } from "./format";
import type { Lang } from "./i18n/dictionaries";
import type { Period } from "./period";

/** UD-67 "September" for last month, "1 Sep – 15 Sep" for a custom range. */
export function periodName(period: Period, lang: Lang): string {
  if (period.kind === "custom") return `${formatDate(period.from, lang)} – ${formatDate(period.to, lang)}`;
  return new Date(`${period.from}T12:00:00+05:30`).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { month: "long", timeZone: "Asia/Kolkata" });
}

/** The query that selects this period, for links that carry it (home to Dues). Empty for this month. */
export function periodQuery(period: Period): string {
  if (period.kind === "last") return "period=last";
  if (period.kind === "custom") return `from=${period.from}&to=${period.to}`;
  return "";
}
