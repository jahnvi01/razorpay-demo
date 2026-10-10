import "server-only";
import { addDays, todayIST } from "@/lib/dates";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { TrustLabel } from "@/lib/trust";
import { listDues } from "./dues";
import { getTrustByCustomer } from "./trust";

// UD-66 Recovery Forecast: who is likely to pay on time, late, or not this month, and how much is
// expected back. Kept simple enough to explain in one sentence on the card.

export type ForecastGroup = "onTime" | "likelyLate" | "atRisk";

export type ForecastCustomer = { id: string; name: string; duePaise: number; daysLate: number };

export type Forecast = {
  totalPaise: number;
  customers: number;
  groups: Record<ForecastGroup, { paise: number; people: ForecastCustomer[] }>;
  expectedPaise: number;
  /** Share of udhaar that fell due in the last 90 days and has been paid back, 0 to 100. Null without history. */
  shopRate: number | null;
};

/**
 * At risk: 30 or more days late, or 7 or more days late and often late before.
 * Likely late: late now, or usually pays late (sometimes or often late). On time: everyone else.
 */
export function groupFor(label: TrustLabel, daysLate: number): ForecastGroup {
  if (daysLate >= 30 || (daysLate >= 7 && label === "often")) return "atRisk";
  if (daysLate > 0 || label === "sometimes" || label === "often") return "likelyLate";
  return "onTime";
}

/** How much of each group's dues we count on getting back. */
const GROUP_WEIGHT: Record<ForecastGroup, number> = { onTime: 1, likelyLate: 0.85, atRisk: 0.5 };

/**
 * Chance of getting a customer's dues back this month: the average of the shop's recent recovery
 * rate and the customer's own on-time rate (either one alone when the other is unknown), scaled down
 * for likely late and at-risk customers.
 */
export function recoveryChance(group: ForecastGroup, onTimeRate: number | null, shopRate: number | null): number {
  const parts = [onTimeRate, shopRate].filter((x): x is number => x !== null);
  const base = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length / 100 : 0.8;
  return Math.min(1, base * GROUP_WEIGHT[group]);
}

async function shopRecoveryRate(sandboxId: string, today: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin()
    .from("credit_entries")
    .select("amount_paise, remaining_paise")
    .eq("sandbox_id", sandboxId)
    .gte("due_date", addDays(today, -90))
    .lt("due_date", today);
  if (error) throw new Error(`forecast: ${error.message}`);
  const rows = (data ?? []) as { amount_paise: number; remaining_paise: number }[];
  const given = rows.reduce((s, r) => s + Number(r.amount_paise), 0);
  if (!given) return null;
  const back = rows.reduce((s, r) => s + Number(r.amount_paise) - Number(r.remaining_paise), 0);
  return Math.round((back / given) * 100);
}

export async function getForecast(sandboxId: string): Promise<Forecast> {
  const today = todayIST();
  const [dues, trust, shopRate] = await Promise.all([
    listDues(sandboxId, { sort: "amount", overdueOnly: false }),
    getTrustByCustomer(sandboxId),
    shopRecoveryRate(sandboxId, today),
  ]);

  const groups: Forecast["groups"] = { onTime: { paise: 0, people: [] }, likelyLate: { paise: 0, people: [] }, atRisk: { paise: 0, people: [] } };
  let expected = 0;
  for (const c of dues) {
    const tr = trust.get(c.id);
    const group = groupFor(tr?.label ?? "notEnough", c.daysLate);
    groups[group].paise += c.duePaise;
    groups[group].people.push({ id: c.id, name: c.name, duePaise: c.duePaise, daysLate: c.daysLate });
    expected += c.duePaise * recoveryChance(group, tr?.onTimeRate ?? null, shopRate);
  }
  const totalPaise = dues.reduce((s, c) => s + c.duePaise, 0);
  // Round to the nearest ₹100: it is an estimate, and exact paise would suggest false precision
  return { totalPaise, customers: dues.length, groups, expectedPaise: Math.round(expected / 10000) * 10000, shopRate };
}
