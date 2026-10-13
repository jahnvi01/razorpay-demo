import { describe, expect, it } from "vitest";
import { dateInIST } from "@/lib/dates";
import { buildDemoSeed, type SeedCustomer } from "@/lib/seed/demo-seed";

const TODAY = "2026-09-30";
const seed = buildDemoSeed(TODAY);
const byName = (name: string) => seed.customers.find((c) => c.name === name)!;

/** Replays payments in time order with the oldest-first rule and returns remaining paise per entry. */
function replayOldestFirst(c: SeedCustomer) {
  const remaining = c.entries.map((e) => e.amount_paise);
  const order = c.entries.map((e, i) => ({ i, at: Date.parse(e.created_at) })).sort((a, b) => a.at - b.at);
  const payments = [...c.payments].sort((a, b) => Date.parse(a.received_at) - Date.parse(b.received_at));
  const allocations: { payment: number; entry: number; amount: number }[] = [];
  for (const p of payments) {
    let left = p.amount_paise;
    for (const { i, at } of order) {
      if (left === 0) break;
      if (remaining[i] === 0 || at > Date.parse(p.received_at)) continue;
      const take = Math.min(left, remaining[i]);
      remaining[i] -= take;
      left -= take;
      allocations.push({ payment: c.payments.indexOf(p), entry: i, amount: take });
    }
    expect(left, `${c.name}: payment left unallocated`).toBe(0);
  }
  return { remaining, allocations };
}

function onTimeStats(c: SeedCustomer) {
  const { remaining } = replayOldestFirst(c);
  const cleared = c.entries
    .map((e, i) => ({ e, i }))
    .filter(({ i }) => remaining[i] === 0)
    .map(({ e, i }) => {
      const paidAt = c.payments
        .filter((p) => p.allocations.some((a) => a.entry === i))
        .map((p) => p.received_at)
        .sort()
        .at(-1)!;
      return dateInIST(paidAt) <= e.due_date;
    });
  return { cleared: cleared.length, onTime: cleared.filter(Boolean).length };
}

describe("demo seed", () => {
  it("has 5 customers with valid, unique Indian mobile numbers", () => {
    expect(seed.customers).toHaveLength(5);
    const phones = seed.customers.map((c) => c.phone);
    expect(new Set(phones).size).toBe(5);
    for (const phone of phones) expect(phone).toMatch(/^[6-9][0-9]{9}$/);
  });

  it("uses positive whole-paise amounts everywhere", () => {
    for (const c of seed.customers) {
      for (const n of [...c.entries.map((e) => e.amount_paise), ...c.payments.map((p) => p.amount_paise)]) {
        expect(Number.isInteger(n) && n > 0).toBe(true);
      }
    }
  });

  it("never puts anything in the future, and payments come after the entry they pay", () => {
    for (const c of seed.customers) {
      expect(dateInIST(c.created_at) < dateInIST(c.entries[0].created_at)).toBe(true);
      for (const e of c.entries) expect(dateInIST(e.created_at) <= TODAY).toBe(true);
      for (const p of c.payments) {
        expect(dateInIST(p.received_at) <= TODAY).toBe(true);
        for (const a of p.allocations) {
          expect(Date.parse(p.received_at)).toBeGreaterThan(Date.parse(c.entries[a.entry].created_at));
        }
      }
    }
  });

  it("follows the oldest-first rule exactly", () => {
    for (const c of seed.customers) {
      const { allocations } = replayOldestFirst(c);
      const declared = c.payments.flatMap((p, payment) =>
        p.allocations.map((a) => ({ payment, entry: a.entry, amount: a.amount_paise })),
      );
      expect(allocations, c.name).toEqual(declared);
    }
  });

  it("hits the designed on-time rates for the Trust Meter", () => {
    expect(onTimeStats(byName("Sunita Sharma"))).toEqual({ cleared: 11, onTime: 10 }); // 91%
    expect(onTimeStats(byName("Arjun Mehta"))).toEqual({ cleared: 6, onTime: 4 }); // 67%
    expect(onTimeStats(byName("Farhan Qureshi"))).toEqual({ cleared: 10, onTime: 3 }); // 30%
    expect(onTimeStats(byName("Lakshmi Iyer")).cleared).toBeLessThan(3); // not enough history
  });

  it("has mixed paid and unpaid history, including overdue and part-paid entries", () => {
    const open = seed.customers.flatMap((c) => {
      const { remaining } = replayOldestFirst(c);
      return c.entries.filter((_, i) => remaining[i] > 0);
    });
    expect(open.length).toBeGreaterThanOrEqual(5);
    expect(open.some((e) => e.due_date < TODAY)).toBe(true); // overdue
    expect(open.some((e) => e.due_date >= TODAY)).toBe(true); // not yet due
    const farhan = replayOldestFirst(byName("Farhan Qureshi")).remaining;
    expect(farhan.filter((r) => r > 0)).toEqual([34000, 75000, 103500]); // one part-paid, two untouched
  });

  it("shows the same month on any date: ₹12,010 given, ₹5,775 collected, ₹9,835 remaining (UD-68)", () => {
    for (const day of [TODAY, "2026-10-01", "2026-10-03", "2026-10-13", "2026-10-28", "2026-10-31"]) {
      const s = buildDemoSeed(day);
      const month = day.slice(0, 7);
      const given = s.customers.flatMap((c) => c.entries).filter((e) => dateInIST(e.created_at).startsWith(month));
      const collected = s.customers.flatMap((c) => c.payments).filter((p) => dateInIST(p.received_at).startsWith(month));
      expect(given.reduce((n, e) => n + e.amount_paise, 0), day).toBe(1201000);
      expect(collected.reduce((n, p) => n + p.amount_paise, 0), day).toBe(577500);
      const remaining = s.customers.flatMap((c) => replayOldestFirst(c).remaining).reduce((n, r) => n + r, 0);
      expect(remaining, day).toBe(983500);
      for (const c of s.customers) {
        const declared = c.payments.flatMap((p, payment) => p.allocations.map((a) => ({ payment, entry: a.entry, amount: a.amount_paise })));
        expect(replayOldestFirst(c).allocations, `${c.name} ${day}`).toEqual(declared); // oldest-first on every day
        for (const p of c.payments) {
          expect(dateInIST(p.received_at) <= day, `${c.name} ${day} future payment`).toBe(true);
          for (const a of p.allocations) expect(Date.parse(p.received_at)).toBeGreaterThan(Date.parse(c.entries[a.entry].created_at));
        }
        expect(dateInIST(c.created_at) < dateInIST(c.entries[0].created_at)).toBe(true);
      }
    }
  });

  it("is deterministic for a given day and moves with the calendar", () => {
    expect(buildDemoSeed(TODAY)).toEqual(seed);
    const later = buildDemoSeed("2026-10-15");
    expect(later.customers[0].entries[0].due_date).not.toBe(seed.customers[0].entries[0].due_date);
  });
});
