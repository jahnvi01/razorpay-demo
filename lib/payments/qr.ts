import "server-only";
import { MERCHANT_NAME } from "@/lib/razorpay/pay-links";
import { razorpay } from "@/lib/razorpay/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ShopQr = { id: string; imageUrl: string };

/**
 * UD-19 The merchant's shop QR: a Razorpay UPI QR that takes any amount, many times.
 * Created once per sandbox and kept through Reset demo (Razorpay cannot close multiple use QRs).
 */
export async function ensureShopQr(sandboxId: string): Promise<ShopQr> {
  const { data } = await supabaseAdmin()
    .from("sandboxes")
    .select("qr_code_id, qr_image_url")
    .eq("id", sandboxId)
    .single();
  if (data?.qr_code_id && data.qr_image_url) return { id: data.qr_code_id, imageUrl: data.qr_image_url };

  const qr = await razorpay().qrCode.create({
    type: "upi_qr",
    name: MERCHANT_NAME,
    usage: "multiple_use",
    fixed_amount: false,
    description: `${MERCHANT_NAME} shop QR (Udhaar Suite)`,
    notes: { sandbox_id: sandboxId },
  });
  // Only set it if nobody else did in the meantime.
  const { data: saved } = await supabaseAdmin()
    .from("sandboxes")
    .update({ qr_code_id: qr.id, qr_image_url: qr.image_url })
    .eq("id", sandboxId)
    .is("qr_code_id", null)
    .select("qr_code_id, qr_image_url");
  if (saved?.length) return { id: qr.id, imageUrl: qr.image_url };
  return ensureShopQr(sandboxId);
}

export type MatchSuggestion =
  | { kind: "strong"; customer: { id: string; name: string } }
  | { kind: "weak"; customers: { id: string; name: string }[] }
  | { kind: "unknown" };

export type QrPayment = {
  id: string;
  amountPaise: number;
  payerVpa: string | null;
  receivedAt: string;
  status: "pending" | "matched" | "sale";
  customerName: string | null;
  suggestion: MatchSuggestion;
};

/**
 * UD-19 Who has paid from this UPI ID before? One customer is a strong match, several is a weak
 * match the merchant must resolve, none is unknown. Nothing is ever cleared without the merchant.
 */
async function suggestFor(sandboxId: string, vpa: string | null): Promise<MatchSuggestion> {
  if (!vpa) return { kind: "unknown" };
  const { data } = await supabaseAdmin()
    .from("payments")
    .select("customer_id, customers(name)")
    .eq("sandbox_id", sandboxId)
    .eq("payer_vpa", vpa.trim().toLowerCase()); // stored lowercase by the database
  const byId = new Map<string, string>();
  for (const row of (data ?? []) as unknown as { customer_id: string; customers: { name: string } }[]) {
    byId.set(row.customer_id, row.customers.name);
  }
  const customers = [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  if (customers.length === 1) return { kind: "strong", customer: customers[0] };
  if (customers.length > 1) return { kind: "weak", customers };
  return { kind: "unknown" };
}

/** Pending QR payments (with suggestions) and the last few decided ones. Newest first. */
export async function listQrPayments(sandboxId: string): Promise<{ pending: QrPayment[]; recent: QrPayment[] }> {
  const { data, error } = await supabaseAdmin()
    .from("qr_payments")
    .select("id, amount_paise, payer_vpa, received_at, status, customers(name)")
    .eq("sandbox_id", sandboxId)
    .order("received_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(`qr payments: ${error.message}`);
  const rows = (data ?? []) as unknown as {
    id: string;
    amount_paise: number;
    payer_vpa: string | null;
    received_at: string;
    status: QrPayment["status"];
    customers: { name: string } | null;
  }[];
  const all = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      amountPaise: Number(r.amount_paise),
      payerVpa: r.payer_vpa,
      receivedAt: r.received_at,
      status: r.status,
      customerName: r.customers?.name ?? null,
      suggestion: r.status === "pending" ? await suggestFor(sandboxId, r.payer_vpa) : ({ kind: "unknown" } as const),
    })),
  );
  return { pending: all.filter((q) => q.status === "pending"), recent: all.filter((q) => q.status !== "pending").slice(0, 5) };
}

export async function countPendingQr(sandboxId: string): Promise<number> {
  const { count } = await supabaseAdmin()
    .from("qr_payments")
    .select("id", { count: "exact", head: true })
    .eq("sandbox_id", sandboxId)
    .eq("status", "pending");
  return count ?? 0;
}

/** Stores a QR payment from the webhook for review. Returns false when the QR is not ours. */
export async function receiveQrPayment(input: {
  qrCodeId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  payerVpa: string | null;
  receivedAt: string;
}): Promise<{ sandboxId: string } | null> {
  const { data, error } = await supabaseAdmin().rpc("receive_qr_payment", {
    p_qr_code_id: input.qrCodeId,
    p_razorpay_payment_id: input.razorpayPaymentId,
    p_amount_paise: input.amountPaise,
    p_payer_vpa: input.payerVpa,
    p_received_at: input.receivedAt,
  });
  if (error) throw new Error(`receive qr payment: ${error.message}`);
  if (!data) return null;
  const { data: row } = await supabaseAdmin().from("qr_payments").select("sandbox_id").eq("id", data).single();
  return row ? { sandboxId: row.sandbox_id } : null;
}

export async function confirmQrPayment(sandboxId: string, qrPaymentId: string, customerId: string): Promise<void> {
  const { error } = await supabaseAdmin().rpc("confirm_qr_payment", {
    p_sandbox_id: sandboxId,
    p_qr_payment_id: qrPaymentId,
    p_customer_id: customerId,
  });
  if (error) throw new Error(`confirm qr payment: ${error.message}`);
}

export async function markQrSale(sandboxId: string, qrPaymentId: string): Promise<void> {
  const { error } = await supabaseAdmin().rpc("mark_qr_sale", { p_sandbox_id: sandboxId, p_qr_payment_id: qrPaymentId });
  if (error) throw new Error(`mark qr sale: ${error.message}`);
}
