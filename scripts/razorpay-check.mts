// UD-04 test-mode check: creates a Rs 1 test payment link with the configured keys, then cancels it.
//   npm run razorpay:check
import Razorpay from "razorpay";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const keyId = process.env.RAZORPAY_API_KEY ?? fail("RAZORPAY_API_KEY is not set");
const keySecret = process.env.RAZORPAY_API_SECRET ?? fail("RAZORPAY_API_SECRET is not set");
if (!keyId.startsWith("rzp_test_")) fail("Refusing to run: RAZORPAY_API_KEY is not a test-mode key (rzp_test_...).");
if (!process.env.RAZORPAY_WEBHOOK_SECRET) console.warn("warning: RAZORPAY_WEBHOOK_SECRET is not set");

const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

try {
  const link = await rzp.paymentLink.create({
    amount: 100,
    currency: "INR",
    description: "Udhaar Suite test mode check",
    reference_id: `ud04-check-${Date.now()}`,
    customer: { name: "Udhaar Suite check" },
    notify: { sms: false, email: false },
    notes: { purpose: "ud04-check" },
  });
  console.log(`created ${link.id} (${link.status}) ${link.short_url}`);
  const cancelled = await rzp.paymentLink.cancel(link.id);
  console.log(`cancelled ${cancelled.id} (${cancelled.status})`);
  console.log("Razorpay test mode OK");
} catch (err) {
  const e = err as { statusCode?: number; error?: { description?: string } };
  fail(`Razorpay error ${e.statusCode ?? ""}: ${e.error?.description ?? String(err)}`);
}
