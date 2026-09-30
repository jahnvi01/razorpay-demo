import "server-only";
import { todayIST } from "@/lib/dates";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  language: "en" | "hi";
  duePaise: number;
  openEntries: number;
  overdue: boolean;
};

type Row = {
  id: string;
  name: string;
  phone: string;
  language: "en" | "hi";
  credit_entries: { remaining_paise: number; status: "open" | "paid"; due_date: string }[];
};

const SELECT = "id, name, phone, language, credit_entries(remaining_paise, status, due_date)";

function summarise(row: Row, today: string): CustomerSummary {
  const open = row.credit_entries.filter((e) => e.status === "open");
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    language: row.language,
    duePaise: open.reduce((sum, e) => sum + Number(e.remaining_paise), 0),
    openEntries: open.length,
    overdue: open.some((e) => e.due_date < today),
  };
}

export async function listCustomers(sandboxId: string): Promise<CustomerSummary[]> {
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select(SELECT)
    .eq("sandbox_id", sandboxId)
    .order("name");
  if (error) throw new Error(`Could not load customers: ${error.message}`);
  const today = todayIST();
  return (data as Row[]).map((row) => summarise(row, today));
}

/** One customer, only if it belongs to this sandbox. */
export async function getCustomer(sandboxId: string, customerId: string): Promise<CustomerSummary | null> {
  if (!/^[0-9a-f-]{36}$/i.test(customerId)) return null;
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select(SELECT)
    .eq("sandbox_id", sandboxId)
    .eq("id", customerId)
    .maybeSingle();
  if (error) throw new Error(`Could not load customer: ${error.message}`);
  return data ? summarise(data as Row, todayIST()) : null;
}

export { formatPhone } from "@/lib/format";
