import "server-only";
import webpush from "web-push";
import { listDues } from "@/lib/data/dues";
import { todayIST } from "@/lib/dates";
import { formatRupees } from "@/lib/format";
import { translator, type Lang } from "@/lib/i18n/dictionaries";
import { supabaseAdmin } from "@/lib/supabase/admin";

// UD-61 Merchant push notifications through Web Push (VAPID). The service worker shows them.

export type PushMessage = {
  title: string;
  body: string;
  /** Where a tap goes. */
  url: string;
  /** Same tag replaces an older notification instead of stacking. */
  tag: string;
  actions?: { action: string; title: string; url: string }[];
};

export type StoredSubscription = { endpoint: string; p256dh: string; auth: string; lang: Lang };

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:demo@udhaar-suite.app", pub, priv);
  configured = true;
  return true;
}

/** Sends one message to one device. Removes the subscription if the push service says it is gone. */
export async function sendPush(sub: StoredSubscription, msg: PushMessage): Promise<boolean> {
  if (!configure()) return false;
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(msg), { TTL: 6 * 3600 });
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) await supabaseAdmin().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    else console.error("push failed", status, (err as Error).message);
    return false;
  }
}

export async function subscriptionsFor(sandboxId: string): Promise<StoredSubscription[]> {
  const { data, error } = await supabaseAdmin().from("push_subscriptions").select("endpoint, p256dh, auth, lang").eq("sandbox_id", sandboxId);
  if (error) throw new Error(`push subscriptions: ${error.message}`);
  return (data ?? []) as StoredSubscription[];
}

/** Sends to every device of this shop, each in its own language. Returns how many got it. */
export async function sendToShop(sandboxId: string, build: (lang: Lang) => PushMessage | null): Promise<number> {
  const subs = await subscriptionsFor(sandboxId);
  const sent = await Promise.all(
    subs.map((s) => {
      const msg = build(s.lang);
      return msg ? sendPush(s, msg) : Promise.resolve(false);
    }),
  );
  return sent.filter(Boolean).length;
}

/** Where the digest leads: Dues, overdue filter on, One tap reminders open. */
export const REMIND_ALL_URL = "/app/dues?filter=overdue&remind=1";

export type DigestFacts = { customers: number; late: number; amountPaise: number };

/** Customers who are late or due today, and what they owe. Null when there is nothing to act on. */
export async function digestFacts(sandboxId: string): Promise<DigestFacts | null> {
  const today = todayIST();
  const dues = await listDues(sandboxId, { sort: "amount", overdueOnly: false });
  const act = dues.filter((c) => c.overduePaise > 0 || c.nextDueDate === today);
  if (!act.length) return null;
  return { customers: act.length, late: act.filter((c) => c.overduePaise > 0).length, amountPaise: act.reduce((s, c) => s + c.duePaise, 0) };
}

/** UD-61 #1 The 10 am digest: who to chase today, with Remind all. */
export function digestMessage(facts: DigestFacts, lang: Lang): PushMessage {
  const t = translator(lang);
  return {
    title: t("push.digestTitle", { count: facts.customers, amount: formatRupees(facts.amountPaise) }),
    body: facts.late > 0 ? t("push.digestLate", { count: facts.late }) : t("push.digestDueToday"),
    url: REMIND_ALL_URL,
    tag: "ud-digest",
    actions: [{ action: "remind", title: t("push.remindAll"), url: REMIND_ALL_URL }],
  };
}

/** UD-61 #2 A customer paid online. */
export function paymentMessage(p: { customerId: string; name: string; amountPaise: number; remainingPaise: number }, lang: Lang): PushMessage {
  const t = translator(lang);
  const first = p.name.split(" ")[0];
  return {
    title: t("push.paidTitle", { name: first, amount: formatRupees(p.amountPaise) }),
    body: p.remainingPaise > 0 ? t("push.paidLeft", { amount: formatRupees(p.remainingPaise) }) : t("push.paidCleared"),
    url: `/app/customers/${p.customerId}`,
    tag: `ud-paid-${p.customerId}`,
  };
}
