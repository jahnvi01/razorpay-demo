import { isAuthorizedCron } from "@/lib/cron-auth";
import { razorpay } from "@/lib/razorpay/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Issue = { sandbox_id: string; check_name: string; subject_id: string | null; detail: string };
type Missing = { source: "link" | "qr"; razorpayPaymentId: string; amountPaise: number; ref: string };

/**
 * UD-27 Nightly ledger consistency check. Vercel Cron calls it at 02:00 IST with the CRON_SECRET.
 * 1. Ledger rules in the database (ledger_consistency_report): balances, statuses, oldest first, home totals.
 * 2. Money Razorpay received that our ledger does not have: captured payments on our pay links and on
 *    the shop QR. These are flagged for a person to look at, never fixed silently.
 * Returns 200 with ok=false when anything is wrong, and logs it as an error for Vercel's logs.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const db = supabaseAdmin();
  const { data: issues, error } = await db.rpc("ledger_consistency_report");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const missing: Missing[] = [];
  const checked = { payLinks: 0, qrPayments: 0 };

  // Our pay links (they carry sandbox_id and customer_id in notes) that Razorpay says were paid.
  const links = await razorpay().paymentLink.all({ count: 100 } as never);
  const ours = (links.payment_links ?? []).filter(
    (l) => (l.status === "paid" || l.status === "partially_paid") && (l.notes as Record<string, string> | undefined)?.sandbox_id,
  );
  for (const l of ours) {
    const notes = l.notes as unknown as Record<string, string>;
    const { data: customer } = await db.from("customers").select("id").eq("id", notes.customer_id).maybeSingle();
    if (!customer) continue; // customer removed by Reset demo: nothing to reconcile against
    const full = await razorpay().paymentLink.fetch(l.id);
    for (const p of ((full.payments ?? []) as unknown as { payment_id: string; amount: number; status: string }[]).filter(
      (x) => x.status === "captured",
    )) {
      checked.payLinks++;
      const { count } = await db.from("payments").select("id", { count: "exact", head: true }).eq("razorpay_payment_id", p.payment_id);
      if (!count) missing.push({ source: "link", razorpayPaymentId: p.payment_id, amountPaise: Number(p.amount), ref: l.id });
    }
  }

  // Payments on each shop QR that never reached qr_payments.
  const { data: sandboxes } = await db.from("sandboxes").select("id, qr_code_id").not("qr_code_id", "is", null);
  for (const s of sandboxes ?? []) {
    const res = await razorpay().qrCode.fetchAllPayments(s.qr_code_id as string, { count: 100 } as never);
    for (const p of (res.items ?? []) as unknown as { id: string; amount: number; status: string }[]) {
      if (p.status !== "captured") continue;
      checked.qrPayments++;
      const { count } = await db.from("qr_payments").select("id", { count: "exact", head: true }).eq("razorpay_payment_id", p.id);
      if (!count) missing.push({ source: "qr", razorpayPaymentId: p.id, amountPaise: Number(p.amount), ref: s.qr_code_id as string });
    }
  }

  const report = {
    ok: (issues as Issue[]).length === 0 && missing.length === 0,
    checkedAt: new Date().toISOString(),
    ledgerIssues: issues as Issue[],
    missingFromLedger: missing,
    checked,
  };
  if (!report.ok) console.error("LEDGER CHECK FAILED", report);
  else console.info("ledger check ok", report.checked);
  return Response.json(report);
}
