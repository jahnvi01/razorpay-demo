import "server-only";
import { todayIST } from "@/lib/dates";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeTrust, type Trust, type TrustEntry } from "@/lib/trust";

type Row = {
  customer_id: string;
  amount_paise: number;
  remaining_paise: number;
  due_date: string;
  status: "open" | "paid";
  created_at: string;
  paid_at: string | null;
};

/** UD-23 Trust Meter for every customer in the sandbox, from one query. */
export async function getTrustByCustomer(sandboxId: string): Promise<Map<string, Trust>> {
  const { data, error } = await supabaseAdmin()
    .from("credit_entries")
    .select("customer_id, amount_paise, remaining_paise, due_date, status, created_at, paid_at")
    .eq("sandbox_id", sandboxId);
  if (error) throw new Error(`trust: ${error.message}`);

  const byCustomer = new Map<string, TrustEntry[]>();
  for (const r of (data ?? []) as Row[]) {
    const list = byCustomer.get(r.customer_id) ?? [];
    list.push({
      amountPaise: Number(r.amount_paise),
      remainingPaise: Number(r.remaining_paise),
      dueDate: r.due_date,
      status: r.status,
      createdAt: r.created_at,
      paidAt: r.paid_at,
    });
    byCustomer.set(r.customer_id, list);
  }
  const today = todayIST();
  return new Map([...byCustomer].map(([id, entries]) => [id, computeTrust(entries, today)]));
}
