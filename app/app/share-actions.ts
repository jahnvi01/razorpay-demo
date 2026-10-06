"use server";

import { cookies } from "next/headers";
import { appUrl } from "@/lib/app-url";
import { getCustomerLedger } from "@/lib/data/ledger";
import { todayIST } from "@/lib/dates";
import { buildReminderMessage, buildUpdateMessage, whatsappUrl, type UpdateEvent } from "@/lib/messages";
import { logMessage, MERCHANT_NAME, syncPayLink } from "@/lib/razorpay/pay-links";
import { requireSandbox } from "@/lib/sandbox/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ShareResult = { ok: true; url?: string } | { ok: false };

function parseEvent(kind: unknown, amount: unknown): UpdateEvent {
  const paise = Number(amount);
  if (!Number.isInteger(paise) || paise <= 0) return null;
  if (kind === "udhaar") return { kind: "udhaar", amountPaise: paise };
  if (kind === "cash") return { kind: "payment", amountPaise: paise };
  return null;
}

/**
 * UD-14 WhatsApp update: makes sure the pay link is current (no SMS), then returns a wa.me link
 * that opens the merchant's own WhatsApp with the message prefilled in the customer's language.
 */
export async function whatsappShareAction(customerId: string, savedKind?: string, savedAmount?: string): Promise<ShareResult> {
  if (!UUID.test(customerId)) return { ok: false };
  try {
    const sandboxId = await requireSandbox();
    const base = await appUrl();
    // Keep the pay link current so the statement's Pay button is ready. No SMS.
    const link = await syncPayLink(sandboxId, customerId, { sms: "none", baseUrl: base });
    const ledger = await getCustomerLedger(sandboxId, customerId);
    if (!ledger) return { ok: false };
    const nextDue = ledger.entries
      .filter((e) => e.status === "open")
      .map((e) => e.dueDate)
      .sort()[0] ?? null;
    const event = parseEvent(savedKind, savedAmount);
    const statementUrl = `${base}/s/${link.statementToken}`;
    // Right after a save it is an update. Otherwise, with something due, it is a reminder (UD-21).
    const isReminder = !event && ledger.duePaise > 0;
    const text = isReminder
      ? buildReminderMessage({
          lang: ledger.language,
          customerName: ledger.name,
          merchantName: MERCHANT_NAME,
          duePaise: ledger.duePaise,
          nextDueDate: nextDue,
          today: todayIST(),
          statementUrl,
        })
      : buildUpdateMessage({
          lang: ledger.language,
          customerName: ledger.name,
          merchantName: MERCHANT_NAME,
          event,
          duePaise: ledger.duePaise,
          nextDueDate: nextDue,
          statementUrl,
        });
    await logMessage(sandboxId, customerId, "whatsapp", isReminder ? "manual" : "update");
    return { ok: true, url: whatsappUrl(ledger.phone, text) };
  } catch (err) {
    console.error("whatsapp share failed", err);
    return { ok: false };
  }
}

/** UD-15 Resend the pay link SMS through Razorpay (creates a fresh link first if needed). */
export async function resendSmsAction(customerId: string): Promise<ShareResult> {
  if (!UUID.test(customerId)) return { ok: false };
  try {
    const sandboxId = await requireSandbox();
    if ((await cookies()).get("ud-sms-off")?.value === "1") return { ok: true }; // test runs never text
    const state = await syncPayLink(sandboxId, customerId, { sms: "manual", baseUrl: await appUrl() });
    return { ok: state.smsSent };
  } catch (err) {
    console.error("sms resend failed", err);
    return { ok: false };
  }
}

const BULK_MAX = 50;
const BULK_CONCURRENCY = 3;

/**
 * UD-49 One tap reminders: the pay link SMS for each chosen customer, a few at a time so Razorpay is
 * not hit all at once. Each result stands alone, so one failure never stops the rest. Test runs set
 * the ud-sms-off cookie and get every customer reported as skipped instead of texted.
 */
export async function bulkSmsAction(customerIds: string[]): Promise<{ id: string; ok: boolean }[]> {
  const ids = [...new Set(customerIds)].filter((id) => UUID.test(id)).slice(0, BULK_MAX);
  if (ids.length === 0) return [];
  const sandboxId = await requireSandbox();
  if ((await cookies()).get("ud-sms-off")?.value === "1") return ids.map((id) => ({ id, ok: true }));
  const baseUrl = await appUrl();

  const results: { id: string; ok: boolean }[] = [];
  for (let i = 0; i < ids.length; i += BULK_CONCURRENCY) {
    const batch = ids.slice(i, i + BULK_CONCURRENCY);
    results.push(
      ...(await Promise.all(
        batch.map(async (id) => {
          try {
            const state = await syncPayLink(sandboxId, id, { sms: "manual", baseUrl });
            return { id, ok: state.smsSent };
          } catch (err) {
            console.error("bulk sms failed", id, err);
            return { id, ok: false };
          }
        }),
      )),
    );
  }
  return results;
}
