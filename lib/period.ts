import { addDays, todayIST, type IsoDate } from "./dates.ts";

/** UD-46 The home summary's period: this month (default), last month, or a custom range of days. */
export type Period = { kind: "month" | "last" | "custom"; from: IsoDate; to: IsoDate };

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isRealDate = (d: unknown): d is IsoDate => typeof d === "string" && ISO.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().startsWith(d);

const monthStart = (d: IsoDate): IsoDate => `${d.slice(0, 7)}-01`;
const monthEnd = (d: IsoDate): IsoDate => addDays(monthStart(addDays(monthStart(d), 32)), -1);

/**
 * Reads ?period=last or ?from=YYYY-MM-DD&to=YYYY-MM-DD. Anything missing or invalid falls back to
 * this month. A custom range ending in the future is cut at today, and from after to is swapped.
 */
export function parsePeriod(query: Record<string, string | string[] | undefined>, today: IsoDate = todayIST()): Period {
  if (query.period === "last") {
    const lastMonthDay = addDays(monthStart(today), -1);
    return { kind: "last", from: monthStart(lastMonthDay), to: lastMonthDay };
  }
  const { from, to } = query;
  if (isRealDate(from) && isRealDate(to)) {
    let [a, b] = from <= to ? [from, to] : [to, from];
    if (b > today) b = today;
    if (a > b) a = b;
    return { kind: "custom", from: a, to: b };
  }
  return { kind: "month", from: monthStart(today), to: monthEnd(today) };
}

/** The half-open instant range [from 00:00, day after `to` 00:00) in IST, for the database. */
export function periodBounds(p: Period): { from: string; to: string } {
  return { from: `${p.from}T00:00:00+05:30`, to: `${addDays(p.to, 1)}T00:00:00+05:30` };
}
