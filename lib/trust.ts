// UD-23 Trust Meter: how a customer usually pays. Pure functions, so the numbers are easy to check.
import { dateInIST, type IsoDate } from "@/lib/dates";

export const MIN_CLEARED_FOR_TRUST = 3;

export type TrustLabel = "usually" | "sometimes" | "often" | "notEnough";

export type TrustEntry = {
  amountPaise: number;
  remainingPaise: number;
  dueDate: IsoDate;
  status: "open" | "paid";
  createdAt: string;
  /** When the final payment cleared it (set by the database from allocations). */
  paidAt: string | null;
};

export type Trust = {
  label: TrustLabel;
  cleared: number;
  onTime: number;
  /** 0 to 100, null until there is enough history. */
  onTimeRate: number | null;
  /** Days from udhaar given to fully paid, averaged over cleared entries. Null until enough history. */
  avgDaysToPay: number | null;
  currentDuePaise: number;
  /** Days since the oldest still-open udhaar was given. Null when nothing is open. */
  oldestUnpaidDays: number | null;
};

const DAY_MS = 86_400_000;
const daysBetween = (from: IsoDate, to: IsoDate) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

/** 80% or more on time: usually on time. 50 to 79%: sometimes late. Under 50%: often late. */
export function labelFor(onTimeRate: number): Exclude<TrustLabel, "notEnough"> {
  if (onTimeRate >= 80) return "usually";
  if (onTimeRate >= 50) return "sometimes";
  return "often";
}

export function computeTrust(entries: TrustEntry[], today: IsoDate): Trust {
  const cleared = entries.filter((e) => e.status === "paid" && e.paidAt);
  const open = entries.filter((e) => e.status === "open");
  const onTime = cleared.filter((e) => dateInIST(e.paidAt!) <= e.dueDate).length;
  const enough = cleared.length >= MIN_CLEARED_FOR_TRUST;
  const onTimeRate = enough ? Math.round((onTime / cleared.length) * 100) : null;
  const avgDaysToPay = enough
    ? Math.round(
        (cleared.reduce((sum, e) => sum + daysBetween(dateInIST(e.createdAt), dateInIST(e.paidAt!)), 0) / cleared.length) * 10,
      ) / 10
    : null;
  const oldestOpen = open.map((e) => dateInIST(e.createdAt)).sort()[0];

  return {
    label: onTimeRate === null ? "notEnough" : labelFor(onTimeRate),
    cleared: cleared.length,
    onTime,
    onTimeRate,
    avgDaysToPay,
    currentDuePaise: open.reduce((sum, e) => sum + e.remainingPaise, 0),
    oldestUnpaidDays: oldestOpen ? daysBetween(oldestOpen, today) : null,
  };
}
