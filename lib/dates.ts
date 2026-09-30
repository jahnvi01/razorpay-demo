// Calendar dates in India Standard Time. Dates are plain "YYYY-MM-DD" strings.
// IST has no daylight saving, so a fixed +05:30 offset is exact.

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type IsoDate = string;

export function todayIST(now: Date = new Date()): IsoDate {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** ISO timestamp for a wall-clock time on an IST date, e.g. at("2026-09-30", "18:15"). */
export function atIST(date: IsoDate, time: string): string {
  return `${date}T${time}:00+05:30`;
}

/** IST calendar date of an instant. */
export function dateInIST(instant: string | Date): IsoDate {
  return todayIST(typeof instant === "string" ? new Date(instant) : instant);
}
