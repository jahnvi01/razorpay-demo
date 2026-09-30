// Sends a correctly signed Razorpay webhook to your local server, so the webhook code path can be
// tested without a tunnel. Real webhooks go to the Vercel deployment.
//
//   npm run webhook:send                                   payment_link.paid to localhost:3000
//   npm run webhook:send -- payment_link.partially_paid
//   npm run webhook:send -- qr_code.credited --url http://localhost:3100
//   npm run webhook:send -- payment_link.paid --bad-signature
import { createHmac, randomBytes } from "node:crypto";

const args = process.argv.slice(2);
const urlIndex = args.indexOf("--url");
const base = urlIndex >= 0 ? args[urlIndex + 1] : "http://localhost:3000";
const event = args.find((a, i) => !a.startsWith("--") && i !== urlIndex + 1) ?? "payment_link.paid";
const badSignature = args.includes("--bad-signature");
const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
if (!secret) {
  console.error("RAZORPAY_WEBHOOK_SECRET is not set (.env.local)");
  process.exit(1);
}

const id = (prefix: string) => `${prefix}_${randomBytes(7).toString("base64url")}`;
const now = Math.floor(Date.now() / 1000);
const amount = 50_000; // Rs 500
const payment = {
  entity: { id: id("pay"), entity: "payment", amount, currency: "INR", status: "captured", method: "upi", vpa: "demo@okaxis", contact: "+919000000101", created_at: now },
};

// Shapes follow Razorpay's documented webhook payloads (trimmed to the fields the app reads).
const payloads: Record<string, object> = {
  "payment_link.paid": {
    payment_link: { entity: { id: id("plink"), amount, amount_paid: amount, status: "paid", reference_id: "demo", notes: {} } },
    payment,
  },
  "payment_link.partially_paid": {
    payment_link: { entity: { id: id("plink"), amount: amount * 2, amount_paid: amount, status: "partially_paid", reference_id: "demo", notes: {} } },
    payment,
  },
  "qr_code.credited": {
    qr_code: { entity: { id: id("qr"), entity: "qr_code", usage: "multiple_use", status: "active", notes: {} } },
    payment,
  },
};
if (!payloads[event]) {
  console.error(`Unknown event ${event}. Use one of: ${Object.keys(payloads).join(", ")}`);
  process.exit(1);
}

const body = JSON.stringify({ entity: "event", account_id: "acc_local_demo", event, contains: Object.keys(payloads[event]), payload: payloads[event], created_at: now });
const signature = createHmac("sha256", badSignature ? "wrong-secret" : secret).update(body).digest("hex");
const eventId = id("evt");

const res = await fetch(`${base}/api/razorpay/webhook`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-razorpay-signature": signature, "x-razorpay-event-id": eventId },
  body,
});
console.log(`${event} ${eventId} -> ${res.status} ${await res.text()}`);
process.exit(res.ok === !badSignature ? 0 : 1);
