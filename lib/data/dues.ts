import "server-only";
import { todayIST } from "@/lib/dates";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type DuesSort = "amount" | "recent";

export type DueCustomer = {
  id: string;
  name: string;
  phone: string;
  /** Everything still to pay. */
  duePaise: number;
  /** The part of it that is past its due date. */
  overduePaise: number;
  /** Days since the oldest missed due date, 0 when nothing is late. */
  daysLate: number;
  /** Earliest due date among entries not yet late, for the "Due 8 Oct" badge. */
  nextDueDate: string | null;
  /** When the newest open udhaar was given, for the Recent sort. */
  lastUdhaarAt: string;
};

/**
 * UD-47 Everyone who still owes udhaar (replaces the overdue-only list from UD-24).
 * Sort by amount due (default) or most recent udhaar. `overdueOnly` keeps customers with late udhaar.
 */
export async function listDues(sandboxId: string, opts: { sort: DuesSort; overdueOnly: boolean }): Promise<DueCustomer[]> {
  const today = todayIST();
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select("id, name, phone, credit_entries(remaining_paise, due_date, status, created_at)")
    .eq("sandbox_id", sandboxId);
  if (error) throw new Error(`dues: ${error.message}`);

  const rows = (data ?? []) as unknown as {
    id: string;
    name: string;
    phone: string;
    credit_entries: { remaining_paise: number; due_date: string; status: string; created_at: string }[];
  }[];

  const list = rows
    .map((c): DueCustomer | null => {
      const open = c.credit_entries.filter((e) => e.status === "open" && Number(e.remaining_paise) > 0);
      if (open.length === 0) return null;
      const late = open.filter((e) => e.due_date < today);
      const upcoming = open.filter((e) => e.due_date >= today).map((e) => e.due_date).sort();
      const oldestLate = late.map((e) => e.due_date).sort()[0];
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        duePaise: open.reduce((s, e) => s + Number(e.remaining_paise), 0),
        overduePaise: late.reduce((s, e) => s + Number(e.remaining_paise), 0),
        daysLate: oldestLate ? Math.round((Date.parse(today) - Date.parse(oldestLate)) / 86_400_000) : 0,
        nextDueDate: upcoming[0] ?? null,
        lastUdhaarAt: open.map((e) => e.created_at).sort().at(-1)!,
      };
    })
    .filter((c): c is DueCustomer => c !== null && (!opts.overdueOnly || c.overduePaise > 0));

  return list.sort((a, b) =>
    opts.sort === "recent"
      ? b.lastUdhaarAt.localeCompare(a.lastUdhaarAt) || b.duePaise - a.duePaise
      : b.duePaise - a.duePaise || a.name.localeCompare(b.name),
  );
}
