import { appUrl } from "@/lib/app-url";
import { recordOnlinePayment } from "@/lib/payments/online";
import { receiveQrPayment } from "@/lib/payments/qr";
import { isValidWebhookSignature } from "@/lib/razorpay/server";
import { broadcastLedgerChange } from "@/lib/realtime";
import { supabaseAdmin } from "@/lib/supabase/admin";

type PaymentEntity = { id: string; amount: number; vpa?: string | null; created_at: number; status?: string };
type WebhookEvent = {
  event?: string;
  payload?: {
    payment?: { entity: PaymentEntity };
    payment_link?: { entity: { id: string; notes?: Record<string, string> } };
    qr_code?: { entity: { id: string } };
  };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Razorpay webhook endpoint (UD-04). Registered in Razorpay Dashboard > Webhooks:
 *   URL     https://<host>/api/razorpay/webhook
 *   Secret  RAZORPAY_WEBHOOK_SECRET
 * UD-18 payment_link.paid / partially_paid record the payment and clear udhaar oldest first.
 * UD-19 qr_code.credited waits for the merchant to say who paid.
 * Every step is idempotent, so Razorpay retries and duplicates are safe.
 */
export async function POST(request: Request) {
  // The signature covers the exact bytes Razorpay sent, so read the raw body before parsing.
  const rawBody = await request.text();
  if (!isValidWebhookSignature(rawBody, request.headers.get("x-razorpay-signature"))) {
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const eventId = request.headers.get("x-razorpay-event-id");
  console.info("razorpay webhook", { id: eventId, event: event.event });

  try {
    const payment = event.payload?.payment?.entity;
    switch (event.event) {
      case "payment_link.paid":
      case "payment_link.partially_paid": {
        const notes = event.payload?.payment_link?.entity.notes ?? {};
        if (!payment || !UUID.test(notes.sandbox_id ?? "") || !UUID.test(notes.customer_id ?? "")) break;
        const { data: customer } = await supabaseAdmin()
          .from("customers")
          .select("id")
          .eq("sandbox_id", notes.sandbox_id)
          .eq("id", notes.customer_id)
          .maybeSingle();
        if (!customer) break; // e.g. the customer was removed by Reset demo
        await recordOnlinePayment(
          {
            sandboxId: notes.sandbox_id,
            customerId: notes.customer_id,
            razorpayPaymentId: payment.id,
            amountPaise: Number(payment.amount),
            source: "link",
            payerVpa: payment.vpa ?? null,
            receivedAt: new Date(Number(payment.created_at) * 1000).toISOString(),
          },
          await appUrl(),
        );
        break;
      }
      case "qr_code.credited": {
        const qrId = event.payload?.qr_code?.entity.id;
        if (!payment || !qrId) break;
        const stored = await receiveQrPayment({
          qrCodeId: qrId,
          razorpayPaymentId: payment.id,
          amountPaise: Number(payment.amount),
          payerVpa: payment.vpa ?? null,
          receivedAt: new Date(Number(payment.created_at) * 1000).toISOString(),
        });
        if (stored) await broadcastLedgerChange(stored.sandboxId);
        break;
      }
      default:
        break; // other events are acknowledged and ignored
    }
  } catch (err) {
    // 500 makes Razorpay retry later. Safe, because every step is idempotent.
    console.error("webhook processing failed", { id: eventId, event: event.event, err });
    return Response.json({ error: "processing failed" }, { status: 500 });
  }

  // Always 2xx for a handled or ignored event, or Razorpay keeps retrying it.
  return Response.json({ received: true });
}
