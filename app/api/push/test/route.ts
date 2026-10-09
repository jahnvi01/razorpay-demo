import { NextResponse } from "next/server";
import { listDues } from "@/lib/data/dues";
import { digestFacts, digestMessage, paymentMessage, sendPush, type StoredSubscription } from "@/lib/push";
import { requireSandbox } from "@/lib/sandbox/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * UD-61 Demo: send the digest or a payment alert to this device only, so both can be shown on stage
 * without waiting for 10 am or a real payment. The digest uses today's real dues; the payment alert
 * uses a real customer with a sample ₹500 payment (nothing is recorded).
 */
export async function POST(request: Request) {
  const { endpoint, kind } = (await request.json().catch(() => ({}))) as { endpoint?: string; kind?: string };
  if (typeof endpoint !== "string" || (kind !== "digest" && kind !== "payment")) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const sandboxId = await requireSandbox();
  const { data } = await supabaseAdmin().from("push_subscriptions").select("endpoint, p256dh, auth, lang").eq("endpoint", endpoint).eq("sandbox_id", sandboxId).maybeSingle();
  if (!data) return NextResponse.json({ error: "not subscribed" }, { status: 404 });
  const sub = data as StoredSubscription;

  if (kind === "digest") {
    const facts = (await digestFacts(sandboxId)) ?? { customers: 2, late: 2, amountPaise: 526500 };
    return NextResponse.json({ ok: await sendPush(sub, digestMessage(facts, sub.lang)) });
  }
  const dues = await listDues(sandboxId, { sort: "amount", overdueOnly: false });
  const who = dues[0];
  if (!who) return NextResponse.json({ error: "no customer with dues" }, { status: 409 });
  const msg = paymentMessage({ customerId: who.id, name: who.name, amountPaise: 50000, remainingPaise: Math.max(0, who.duePaise - 50000) }, sub.lang);
  return NextResponse.json({ ok: await sendPush(sub, msg) });
}
