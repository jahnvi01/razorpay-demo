import "server-only";
import { getCustomer } from "@/lib/data/customers";
import { paymentMessage, sendToShop } from "@/lib/push";
import { broadcastLedgerChange } from "@/lib/realtime";
import { syncPayLink } from "@/lib/razorpay/pay-links";
import { razorpay } from "@/lib/razorpay/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RecordInput = {
  sandboxId: string;
  customerId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  source: "link" | "qr";
  payerVpa: string | null;
  receivedAt: string;
};

/**
 * UD-18 Records an online payment once (idempotent on the Razorpay payment ID), clears udhaar oldest
 * first, refreshes the pay link (SMS follows the usual rules) and tells open screens.
 * Returns true when this call recorded it, false when it was already recorded.
 */
export async function recordOnlinePayment(input: RecordInput, baseUrl: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin().rpc("record_payment", {
    p_sandbox_id: input.sandboxId,
    p_customer_id: input.customerId,
    p_amount_paise: input.amountPaise,
    p_source: input.source,
    p_razorpay_payment_id: input.razorpayPaymentId,
    p_payer_vpa: input.payerVpa,
    p_received_at: input.receivedAt,
  });
  if (error) throw new Error(`record online payment: ${error.message}`);
  const created = Boolean((data as { created: boolean }[])[0]?.created);
  if (created) {
    await afterOnlinePayment(input.sandboxId, input.customerId, baseUrl);
    await notifyPaid(input.sandboxId, input.customerId, input.amountPaise);
  }
  return created;
}

/** UD-61 #2 Tells the merchant's phones that a customer paid and what is left. Never throws. */
async function notifyPaid(sandboxId: string, customerId: string, amountPaise: number): Promise<void> {
  try {
    const c = await getCustomer(sandboxId, customerId);
    if (!c) return;
    await sendToShop(sandboxId, (lang) => paymentMessage({ customerId, name: c.name, amountPaise, remainingPaise: c.duePaise }, lang));
  } catch (err) {
    console.error("payment push failed", err);
  }
}

/** Refresh the pay link for the new balance, then tell open screens. Never throws. */
export async function afterOnlinePayment(sandboxId: string, customerId: string, baseUrl: string): Promise<void> {
  try {
    await syncPayLink(sandboxId, customerId, { sms: "update", baseUrl });
  } catch (err) {
    console.error("pay link refresh after payment failed", err);
  }
  await broadcastLedgerChange(sandboxId, customerId);
}

/**
 * UD-18 Sync on open: asks Razorpay about the customer's current pay link and records any captured
 * payment the webhook has not delivered yet. Makes local testing work without a tunnel.
 * Returns how many payments were newly recorded. Never throws.
 */
export async function syncLinkPaymentsOnOpen(sandboxId: string, customerId: string, baseUrl: string): Promise<number> {
  try {
    const { data: c } = await supabaseAdmin()
      .from("customers")
      .select("pay_link_id")
      .eq("sandbox_id", sandboxId)
      .eq("id", customerId)
      .maybeSingle();
    if (!c?.pay_link_id) return 0;

    const link = await razorpay().paymentLink.fetch(c.pay_link_id);
    // The SDK types `payments` as an object, but the API returns an array of these.
    const linkPayments = (link.payments ?? []) as unknown as { payment_id: string; status: string }[];
    const captured = linkPayments.filter((p) => p.status === "captured");
    if (!captured.length) return 0;

    const { data: known } = await supabaseAdmin()
      .from("payments")
      .select("razorpay_payment_id")
      .in(
        "razorpay_payment_id",
        captured.map((p) => p.payment_id),
      );
    const seen = new Set((known ?? []).map((k) => k.razorpay_payment_id));

    let recorded = 0;
    for (const p of captured.filter((x) => !seen.has(x.payment_id))) {
      const full = await razorpay().payments.fetch(p.payment_id);
      const created = await recordOnlinePayment(
        {
          sandboxId,
          customerId,
          razorpayPaymentId: p.payment_id,
          amountPaise: Number(full.amount),
          source: "link",
          payerVpa: full.vpa ?? null,
          receivedAt: new Date(Number(full.created_at) * 1000).toISOString(),
        },
        baseUrl,
      );
      if (created) recorded++;
    }
    return recorded;
  } catch (err) {
    console.error("sync on open failed", err);
    return 0;
  }
}
