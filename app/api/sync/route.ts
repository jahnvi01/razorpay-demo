import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import { dateInIST } from "@/lib/dates";
import { syncPayLink } from "@/lib/razorpay/pay-links";
import { broadcastLedgerChange } from "@/lib/realtime";
import { requireSandbox } from "@/lib/sandbox/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseAmount, parseDueDate, parseNote } from "@/lib/validation";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_OPS = 50;

type Op = { opId: string; kind: "udhaar" | "cash"; customerId: string; amountPaise: number; dueDate?: string; note?: string; at: string };
export type SyncResult = { opId: string; status: "applied" | "duplicate" | "rejected" };

/**
 * UD-58 Offline sync. A phone sends the changes it queued while offline, oldest first. Each is applied
 * at most once (apply_sync_op keys on the phone's op ID) and keeps the time it happened. Bad input or a
 * customer gone after Reset demo is rejected, so the phone can drop it. Afterwards each changed customer
 * gets one pay link refresh and SMS, not one per change.
 */
export async function POST(request: Request) {
  let body: { ops?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!Array.isArray(body.ops) || body.ops.length === 0 || body.ops.length > MAX_OPS) {
    return NextResponse.json({ error: "ops must be 1 to 50 changes" }, { status: 400 });
  }

  const sandboxId = await requireSandbox();
  const db = supabaseAdmin();
  const results: SyncResult[] = [];
  const touched = new Map<string, "udhaar" | "update">();

  for (const raw of body.ops as Partial<Op>[]) {
    const opId = String(raw?.opId ?? "");
    const at = String(raw?.at ?? "");
    const amount = parseAmount(raw?.amountPaise ? String(Number(raw.amountPaise) / 100) : "");
    const when = Number.isNaN(Date.parse(at)) ? null : at;
    const valid = UUID.test(opId) && UUID.test(String(raw?.customerId ?? "")) && (raw?.kind === "udhaar" || raw?.kind === "cash") && amount.ok && when;
    // A due date is checked against the day the udhaar was given, so an old offline entry still fits
    const due = raw?.kind === "udhaar" && when ? parseDueDate(raw.dueDate, dateInIST(when)) : null;
    const note = parseNote(raw?.note ?? "");
    if (!valid || !amount.ok || (raw.kind === "udhaar" && (!due || !due.ok)) || !note.ok) {
      if (UUID.test(opId)) results.push({ opId, status: "rejected" });
      continue;
    }

    const { data, error } = await db.rpc("apply_sync_op", {
      p_sandbox_id: sandboxId,
      p_op_id: opId,
      p_kind: raw.kind,
      p_customer_id: raw.customerId,
      p_amount_paise: amount.value,
      p_due_date: due && due.ok ? due.value : null,
      p_note: note.value || null,
      p_at: when,
    });
    if (error) {
      console.error("sync op failed", opId, error.message);
      // Customer gone (demo reset) or bad data: the phone should drop it. Anything else: retry later.
      if (/customer not found|invalid_parameter|violates/i.test(error.message)) results.push({ opId, status: "rejected" });
      else return NextResponse.json({ results, error: "retry" }, { status: 503 });
      continue;
    }
    results.push({ opId, status: data === "duplicate" ? "duplicate" : "applied" });
    if (data === "applied") {
      const id = raw.customerId!;
      if (raw.kind === "udhaar" || !touched.has(id)) touched.set(id, raw.kind === "udhaar" ? "udhaar" : "update");
    }
  }

  // One pay link refresh per customer. New udhaar texts the customer, as when online (UD-48).
  const smsOff = (await cookies()).get("ud-sms-off")?.value === "1";
  const baseUrl = await appUrl();
  for (const [customerId, event] of touched) {
    try {
      await syncPayLink(sandboxId, customerId, { sms: smsOff ? "none" : event, baseUrl });
    } catch (err) {
      console.error("pay link after sync failed", customerId, err);
    }
    await broadcastLedgerChange(sandboxId, customerId).catch(() => {});
  }

  return NextResponse.json({ results });
}
