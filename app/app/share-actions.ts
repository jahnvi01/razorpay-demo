"use server";

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
    const state = await syncPayLink(sandboxId, customerId, { sms: "manual", baseUrl: await appUrl() });
    return { ok: state.smsSent };
  } catch (err) {
    console.error("sms resend failed", err);
    return { ok: false };
  }
}
