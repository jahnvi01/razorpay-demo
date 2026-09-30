// Input rules shared by forms and server actions. Errors are i18n message keys.
import { addDays, todayIST, type IsoDate } from "@/lib/dates";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export const MAX_AMOUNT_PAISE = 10_00_000 * 100; // Rs 10 lakh per entry or payment guards against typos
export const DEFAULT_TERM_DAYS = 7;

type Result<T> = { ok: true; value: T } | { ok: false; error: MessageKey };

/** "1,250.5" or "₹ 499" -> paise. Up to 2 decimals, more than 0, at most Rs 10 lakh. */
export function parseAmount(input: unknown): Result<number> {
  const text = String(input ?? "").replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return { ok: false, error: "form.amountInvalid" };
  const [rupees, paise = ""] = text.split(".");
  const value = Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  if (value <= 0) return { ok: false, error: "form.amountInvalid" };
  if (value > MAX_AMOUNT_PAISE) return { ok: false, error: "form.amountTooLarge" };
  return { ok: true, value };
}

/** Accepts "98765 43210", "+91 9876543210", "09876543210". Returns the 10 digit number. */
export function parsePhone(input: unknown): Result<string> {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? { ok: true, value: digits } : { ok: false, error: "form.phoneInvalid" };
}

export function parseName(input: unknown): Result<string> {
  const name = String(input ?? "").trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "form.nameRequired" };
  if (name.length > 80) return { ok: false, error: "form.nameTooLong" };
  return { ok: true, value: name };
}

/** Due dates cannot be in the past (IST). */
export function parseDueDate(input: unknown, today: IsoDate = todayIST()): Result<IsoDate> {
  const date = String(input ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { ok: false, error: "form.dateInvalid" };
  if (date < today) return { ok: false, error: "form.datePast" };
  if (date > addDays(today, 366)) return { ok: false, error: "form.dateTooFar" };
  return { ok: true, value: date };
}

export function parseNote(input: unknown): Result<string> {
  const note = String(input ?? "").trim();
  return note.length > 200 ? { ok: false, error: "form.noteTooLong" } : { ok: true, value: note };
}

export function defaultDueDate(today: IsoDate = todayIST()): IsoDate {
  return addDays(today, DEFAULT_TERM_DAYS);
}
