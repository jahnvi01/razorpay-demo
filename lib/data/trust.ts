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

export type OverdueCustomer = {
  id: string;
  name: string;
  phone: string;
  overduePaise: number;
  duePaise: number;
  daysLate: number;
};

/** UD-24 Customers with udhaar past its due date. Days late counts from the oldest missed due date. */
export async function listOverdue(sandboxId: string, sort: "amount" | "days"): Promise<OverdueCustomer[]> {
  const today = todayIST();
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select("id, name, phone, credit_entries(remaining_paise, due_date, status)")
    .eq("sandbox_id", sandboxId);
  if (error) throw new Error(`overdue: ${error.message}`);

  const rows = (data ?? []) as unknown as {
    id: string;
    name: string;
    phone: string;
    credit_entries: { remaining_paise: number; due_date: string; status: string }[];
  }[];
  const list = rows
    .map((c) => {
      const open = c.credit_entries.filter((e) => e.status === "open");
      const late = open.filter((e) => e.due_date < today);
      const oldest = late.map((e) => e.due_date).sort()[0];
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        overduePaise: late.reduce((s, e) => s + Number(e.remaining_paise), 0),
        duePaise: open.reduce((s, e) => s + Number(e.remaining_paise), 0),
        daysLate: oldest ? Math.round((Date.parse(today) - Date.parse(oldest)) / 86_400_000) : 0,
      };
    })
    .filter((c) => c.overduePaise > 0);

  return list.sort((a, b) =>
    sort === "days" ? b.daysLate - a.daysLate || b.overduePaise - a.overduePaise : b.overduePaise - a.overduePaise || b.daysLate - a.daysLate,
  );
}
