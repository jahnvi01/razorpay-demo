import { NextResponse } from "next/server";
import { requireSandbox } from "@/lib/sandbox/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Body = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown }; lang?: unknown };
const isPushEndpoint = (u: unknown): u is string => typeof u === "string" && /^https:\/\/[^\s]{10,1000}$/.test(u);

/** UD-61 Saves this device's push subscription for the demo shop (turning notifications on). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const { endpoint, keys } = body;
  if (!isPushEndpoint(endpoint) || typeof keys?.p256dh !== "string" || typeof keys?.auth !== "string") {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }
  const sandboxId = await requireSandbox();
  const { error } = await supabaseAdmin()
    .from("push_subscriptions")
    .upsert({ endpoint, sandbox_id: sandboxId, p256dh: keys.p256dh, auth: keys.auth, lang: body.lang === "hi" ? "hi" : "en" }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "could not save" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** UD-61 Removes this device (turning notifications off). */
export async function DELETE(request: Request) {
  const { endpoint } = (await request.json().catch(() => ({}))) as Body;
  if (!isPushEndpoint(endpoint)) return NextResponse.json({ error: "bad endpoint" }, { status: 400 });
  await supabaseAdmin().from("push_subscriptions").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
