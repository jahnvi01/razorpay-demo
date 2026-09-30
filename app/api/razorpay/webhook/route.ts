import { isValidWebhookSignature } from "@/lib/razorpay/server";

/**
 * Razorpay webhook endpoint (UD-04). Register in Razorpay Dashboard > Webhooks:
 *   URL     https://<host>/api/razorpay/webhook
 *   Secret  RAZORPAY_WEBHOOK_SECRET
 * Only verifies and acknowledges for now. Payments are applied in UD-18 (pay link) and UD-19 (QR).
 */
export async function POST(request: Request) {
  // The signature covers the exact bytes Razorpay sent, so read the raw body before parsing.
  const rawBody = await request.text();
  if (!isValidWebhookSignature(rawBody, request.headers.get("x-razorpay-signature"))) {
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: { event?: string; account_id?: string };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }

  console.info("razorpay webhook", {
    id: request.headers.get("x-razorpay-event-id"),
    event: event.event,
  });

  // Always 2xx for a verified event, or Razorpay keeps retrying it.
  return Response.json({ received: true });
}
