import { isAuthorizedCron } from "@/lib/cron-auth";
import { addDays, todayIST } from "@/lib/dates";
import { syncPayLink } from "@/lib/razorpay/pay-links";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * UD-20 Day-before reminder. Vercel Cron calls this daily at 10:00 IST (vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`. Sends one Razorpay SMS per customer with udhaar due tomorrow.
 * Demo customers are skipped (they never get automatic SMS), and so is anyone already reminded today.
 * `?date=YYYY-MM-DD` runs it as if that were today, for testing.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const param = new URL(request.url).searchParams.get("date");
  const today = param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : todayIST();
  const tomorrow = addDays(today, 1);

  const { data, error } = await supabaseAdmin()
    .from("credit_entries")
    .select("sandbox_id, customer_id, customers(name, is_demo)")
    .eq("status", "open")
    .eq("due_date", tomorrow);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const customers = new Map<string, { sandboxId: string; name: string; isDemo: boolean }>();
  for (const row of (data ?? []) as unknown as { sandbox_id: string; customer_id: string; customers: { name: string; is_demo: boolean } }[]) {
    customers.set(row.customer_id, { sandboxId: row.sandbox_id, name: row.customers.name, isDemo: row.customers.is_demo });
  }

  const baseUrl = process.env.APP_URL ?? new URL(request.url).origin;
  const result = { today, dueTomorrow: customers.size, sent: [] as string[], skippedDemo: [] as string[], skippedAlreadyReminded: [] as string[], failed: [] as string[] };

  for (const [customerId, c] of customers) {
    if (c.isDemo) {
      result.skippedDemo.push(c.name);
      continue;
    }
    const { count } = await supabaseAdmin()
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("kind", "day_before")
      .gte("sent_at", `${today}T00:00:00+05:30`);
    if (count) {
      result.skippedAlreadyReminded.push(c.name);
      continue;
    }
    try {
      const state = await syncPayLink(c.sandboxId, customerId, { sms: "day_before", baseUrl });
      (state.smsSent ? result.sent : result.failed).push(c.name);
    } catch (err) {
      console.error("day-before reminder failed", customerId, err);
      result.failed.push(c.name);
    }
  }

  console.info("day-before reminders", result);
  return Response.json(result);
}
