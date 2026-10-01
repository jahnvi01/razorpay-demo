"use server";

import { createHmac, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { appUrl } from "@/lib/app-url";
import { serverEnv } from "@/lib/env";
import { afterOnlinePayment } from "@/lib/payments/online";
import { confirmQrPayment, ensureShopQr, markQrSale } from "@/lib/payments/qr";
import { broadcastLedgerChange } from "@/lib/realtime";
import { requireSandbox } from "@/lib/sandbox/server";
import { parseAmount } from "@/lib/validation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VPA = /^[a-z0-9._-]{2,80}@[a-z0-9]{2,40}$/i;

export type QrActionResult = { ok: boolean };

/** UD-19 The merchant confirms who paid on the shop QR. Clears oldest first, then refreshes the pay link. */
export async function confirmQrAction(qrPaymentId: string, customerId: string): Promise<QrActionResult> {
  if (!UUID.test(qrPaymentId) || !UUID.test(customerId)) return { ok: false };
  try {
    const sandboxId = await requireSandbox();
    await confirmQrPayment(sandboxId, qrPaymentId, customerId);
    await afterOnlinePayment(sandboxId, customerId, await appUrl());
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (err) {
    console.error("confirm QR failed", err);
    return { ok: false };
  }
}

/** UD-19 Not udhaar: keep the QR payment as a normal sale. No balance changes. */
export async function markSaleAction(qrPaymentId: string): Promise<QrActionResult> {
  if (!UUID.test(qrPaymentId)) return { ok: false };
  try {
    const sandboxId = await requireSandbox();
    await markQrSale(sandboxId, qrPaymentId);
    await broadcastLedgerChange(sandboxId);
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (err) {
    console.error("mark sale failed", err);
    return { ok: false };
  }
}

/**
 * Demo only: test mode QRs cannot be paid from a real UPI app, so this sends the same signed
 * qr_code.credited webhook Razorpay would, to this app's own webhook endpoint.
 */
export async function simulateQrPaymentAction(form: FormData): Promise<QrActionResult> {
  const amount = parseAmount(form.get("amount"));
  const vpa = String(form.get("vpa") ?? "").trim().toLowerCase();
  if (!amount.ok || !VPA.test(vpa)) return { ok: false };
  try {
    const sandboxId = await requireSandbox();
    const qr = await ensureShopQr(sandboxId);
    const now = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      entity: "event",
      account_id: "acc_demo_simulated",
      event: "qr_code.credited",
      contains: ["payment", "qr_code"],
      payload: {
        payment: {
          entity: { id: `pay_sim${randomBytes(7).toString("hex")}`, entity: "payment", amount: amount.value, currency: "INR", status: "captured", method: "upi", vpa, created_at: now },
        },
        qr_code: { entity: { id: qr.id, entity: "qr_code", usage: "multiple_use", status: "active" } },
      },
      created_at: now,
    });
    const signature = createHmac("sha256", serverEnv.razorpayWebhookSecret).update(body).digest("hex");
    // Post to this same deployment, so local testing stays local.
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const origin = host ? `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}` : await appUrl();
    const res = await fetch(`${origin}/api/razorpay/webhook`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-razorpay-signature": signature, "x-razorpay-event-id": `evt_sim${now}` },
      body,
    });
    revalidatePath("/app", "layout");
    return { ok: res.ok };
  } catch (err) {
    console.error("simulate QR failed", err);
    return { ok: false };
  }
}
