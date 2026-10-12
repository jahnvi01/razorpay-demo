import "server-only";
import { todayIST, type IsoDate } from "@/lib/dates";
import { parsePeriod, periodBounds, type Period } from "@/lib/period";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Postgres error codes the UI turns into friendly messages. */
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_NOT_FOUND = "P0002";

export class LedgerError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabaseAdmin().rpc(fn, args);
  if (error) throw new LedgerError(`${fn}: ${error.message}`, error.code);
  return data as T;
}

export async function createCustomer(
  sandboxId: string,
  input: { name: string; phone: string; language: "en" | "hi" },
): Promise<string> {
  return rpc<string>("create_customer", {
    p_sandbox_id: sandboxId,
    p_name: input.name,
    p_phone: input.phone,
    p_language: input.language,
  });
}

export async function createEntry(
  sandboxId: string,
  input: {
    customerId: string | null;
    newCustomer: { name: string; phone: string; language: "en" | "hi" } | null;
    amountPaise: number;
    dueDate: IsoDate;
    note: string;
  },
): Promise<{ customerId: string; entryId: string }> {
  const rows = await rpc<{ customer_id: string; entry_id: string }[]>("create_entry", {
    p_sandbox_id: sandboxId,
    p_customer_id: input.customerId,
    p_new_name: input.newCustomer?.name ?? null,
    p_new_phone: input.newCustomer?.phone ?? null,
    p_new_language: input.newCustomer?.language ?? null,
    p_amount_paise: input.amountPaise,
    p_due_date: input.dueDate,
    p_note: input.note || null,
  });
  return { customerId: rows[0].customer_id, entryId: rows[0].entry_id };
}

export async function recordCashPayment(sandboxId: string, customerId: string, amountPaise: number) {
  const rows = await rpc<{ payment_id: string; advance_paise: number }[]>("record_payment", {
    p_sandbox_id: sandboxId,
    p_customer_id: customerId,
    p_amount_paise: amountPaise,
    p_source: "cash",
  });
  return { paymentId: rows[0].payment_id, advancePaise: Number(rows[0].advance_paise) };
}

/** Deletes a cash payment in this sandbox and re-runs clearing. Returns the customer ID. */
export async function deleteCashPayment(sandboxId: string, paymentId: string): Promise<string> {
  return rpc<string>("delete_payment", { p_sandbox_id: sandboxId, p_payment_id: paymentId });
}

export type HomeSummary = {
  givenPaise: number;
  givenEntries: number;
  collectedPaise: number;
  remainingPaise: number;
  customersOwing: number;
  overdueCustomers: number;
};

/** UD-11 and UD-46 Given and collected in the chosen period (IST days). Remaining is always all time. */
export async function getHomeSummary(sandboxId: string, period: Period = parsePeriod({})): Promise<HomeSummary> {
  const bounds = periodBounds(period);
  const rows = await rpc<Record<string, number>[]>("home_summary", {
    p_sandbox_id: sandboxId,
    p_from: bounds.from,
    p_to: bounds.to,
  });
  const r = rows[0];
  const summary = {
    givenPaise: Number(r.given_paise),
    givenEntries: Number(r.given_entries),
    collectedPaise: Number(r.collected_paise),
    remainingPaise: Number(r.remaining_paise),
    customersOwing: Number(r.customers_owing),
    overdueCustomers: Number(r.overdue_customers),
  };
  if (period.kind === "month") return summary;

  // UD-67 A past or custom period: Remaining is what is still unpaid from udhaar given in it
  const { data, error } = await supabaseAdmin()
    .from("credit_entries")
    .select("customer_id, remaining_paise, due_date")
    .eq("sandbox_id", sandboxId)
    .eq("status", "open")
    .gte("created_at", bounds.from)
    .lt("created_at", bounds.to);
  if (error) throw new Error(`home summary: ${error.message}`);
  const open = (data ?? []) as { customer_id: string; remaining_paise: number; due_date: string }[];
  const today = todayIST();
  return {
    ...summary,
    remainingPaise: open.reduce((s, e) => s + Number(e.remaining_paise), 0),
    customersOwing: new Set(open.map((e) => e.customer_id)).size,
    overdueCustomers: new Set(open.filter((e) => e.due_date < today).map((e) => e.customer_id)).size,
  };
}

export type LedgerEntry = {
  id: string;
  amountPaise: number;
  remainingPaise: number;
  dueDate: IsoDate;
  note: string | null;
  status: "open" | "paid";
  createdAt: string;
  paidAt: string | null;
};

export type LedgerPayment = {
  id: string;
  amountPaise: number;
  source: "cash" | "link" | "qr";
  receivedAt: string;
};

export type CustomerLedger = {
  id: string;
  name: string;
  phone: string;
  language: "en" | "hi";
  entries: LedgerEntry[];
  payments: LedgerPayment[];
  duePaise: number;
  advancePaise: number;
  overdue: boolean;
  payUrl: string | null;
  statementToken: string;
  lastSmsAt: string | null;
  isDemo: boolean;
};

/** Full ledger for one customer, only if it belongs to this sandbox. Newest first. */
export async function getCustomerLedger(sandboxId: string, customerId: string): Promise<CustomerLedger | null> {
  if (!/^[0-9a-f-]{36}$/i.test(customerId)) return null;
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select(
      `id, name, phone, language, pay_link_url, statement_token, is_demo,
       reminders(channel, sent_at),
       credit_entries(id, amount_paise, remaining_paise, due_date, note, status, created_at, paid_at),
       payments(id, amount_paise, source, received_at, allocations(amount_paise))`,
    )
    .eq("sandbox_id", sandboxId)
    .eq("id", customerId)
    .maybeSingle();
  if (error) throw new LedgerError(`customer ledger: ${error.message}`, error.code);
  if (!data) return null;

  const today = todayIST();
  const entries: LedgerEntry[] = data.credit_entries
    .map((e) => ({
      id: e.id,
      amountPaise: Number(e.amount_paise),
      remainingPaise: Number(e.remaining_paise),
      dueDate: e.due_date,
      note: e.note,
      status: e.status,
      createdAt: e.created_at,
      paidAt: e.paid_at,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const payments: LedgerPayment[] = data.payments
    .map((p) => ({ id: p.id, amountPaise: Number(p.amount_paise), source: p.source, receivedAt: p.received_at }))
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  const allocated = data.payments.reduce(
    (sum, p) => sum + p.allocations.reduce((s, a) => s + Number(a.amount_paise), 0),
    0,
  );
  const open = entries.filter((e) => e.status === "open");

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    language: data.language,
    entries,
    payments,
    duePaise: open.reduce((s, e) => s + e.remainingPaise, 0),
    advancePaise: payments.reduce((s, p) => s + p.amountPaise, 0) - allocated,
    overdue: open.some((e) => e.dueDate < today),
    payUrl: data.pay_link_url,
    statementToken: data.statement_token,
    isDemo: data.is_demo,
    lastSmsAt:
      data.reminders
        .filter((r: { channel: string }) => r.channel === "sms")
        .map((r: { sent_at: string }) => r.sent_at)
        .sort()
        .at(-1) ?? null,
  };
}
