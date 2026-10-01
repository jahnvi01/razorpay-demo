import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { razorpay } from "./server";

export const MERCHANT_NAME = "Ramesh Kirana";

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  language: "en" | "hi";
  statement_token: string;
  pay_link_id: string | null;
  pay_link_url: string | null;
  pay_link_amount_paise: number | null;
  is_demo: boolean;
  credit_entries: { remaining_paise: number; status: string }[];
};

export type PayLinkState = {
  customerId: string;
  name: string;
  phone: string;
  language: "en" | "hi";
  statementToken: string;
  duePaise: number;
  payUrl: string | null;
  /** True when this call sent an SMS through Razorpay. */
  smsSent: boolean;
};

async function loadCustomer(sandboxId: string, customerId: string): Promise<CustomerRow> {
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select(
      "id, name, phone, language, statement_token, pay_link_id, pay_link_url, pay_link_amount_paise, is_demo, credit_entries(remaining_paise, status)",
    )
    .eq("sandbox_id", sandboxId)
    .eq("id", customerId)
    .single();
  if (error) throw new Error(`pay link: ${error.message}`);
  return data as CustomerRow;
}

/** Cancels a link if Razorpay still lets us (created or partially paid). Never throws. */
async function cancelQuietly(linkId: string): Promise<void> {
  try {
    await razorpay().paymentLink.cancel(linkId);
  } catch {
    // Already paid, cancelled or expired: nothing to do.
  }
}

/** "update" after a balance change, "manual" on a tap, "day_before" from the reminder job (UD-20). */
export type SmsMode = "none" | "update" | "manual" | "day_before";

async function logMessage(
  sandboxId: string,
  customerId: string,
  channel: "sms" | "whatsapp",
  kind: "update" | "manual" | "day_before",
) {
  const { error } = await supabaseAdmin()
    .from("reminders")
    .insert({ sandbox_id: sandboxId, customer_id: customerId, channel, kind });
  if (error) console.error("message log failed", error.message);
}

/**
 * UD-13 Makes the customer's pay link match their current balance.
 * - Nothing due: cancels any open link.
 * - Link already for the right amount: keeps it, unless an SMS is wanted (see below).
 * - Otherwise, or when sending an SMS: cancels the old link and creates a new one with the SMS on.
 * UD-15 SMS goes through Razorpay's own payment link SMS. Seed customers get SMS only on a manual tap.
 */
export async function syncPayLink(
  sandboxId: string,
  customerId: string,
  options: { sms: SmsMode; baseUrl: string },
): Promise<PayLinkState> {
  const c = await loadCustomer(sandboxId, customerId);
  const duePaise = c.credit_entries
    .filter((e) => e.status === "open")
    .reduce((sum, e) => sum + Number(e.remaining_paise), 0);
  const base = {
    customerId: c.id,
    name: c.name,
    phone: c.phone,
    language: c.language,
    statementToken: c.statement_token,
    duePaise,
  };
  // Demo (seed) customers never get automatic SMS. A manual Send SMS still goes out.
  const wantSms = options.sms === "manual" || (options.sms !== "none" && !c.is_demo);
  const smsKind = options.sms === "none" ? "update" : options.sms;

  if (duePaise === 0) {
    if (c.pay_link_id) {
      await cancelQuietly(c.pay_link_id);
      await supabaseAdmin()
        .from("customers")
        .update({ pay_link_id: null, pay_link_url: null, pay_link_amount_paise: null })
        .eq("id", c.id)
        .eq("pay_link_id", c.pay_link_id);
    }
    return { ...base, payUrl: null, smsSent: false };
  }

  // A link already for the right amount is kept, unless an SMS is wanted. Razorpay's resend endpoint
  // (notify_by) answers success but did not deliver in test mode, while an SMS sent when a link is
  // created does arrive. So an SMS always goes out on a fresh link, and the old one is cancelled.
  if (c.pay_link_id && c.pay_link_url && Number(c.pay_link_amount_paise) === duePaise && !wantSms) {
    return { ...base, payUrl: c.pay_link_url, smsSent: false };
  }

  const link = await razorpay().paymentLink.create({
    amount: duePaise,
    currency: "INR",
    accept_partial: true,
    description: c.language === "hi" ? `${MERCHANT_NAME} पर उधार का बकाया` : `Udhaar due to ${MERCHANT_NAME}`,
    reference_id: `ud-${c.id.slice(0, 8)}-${Date.now().toString(36)}`,
    customer: { name: c.name, contact: `+91${c.phone}` },
    notify: { sms: wantSms, email: false },
    reminder_enable: false,
    notes: { sandbox_id: sandboxId, customer_id: c.id },
    callback_url: `${options.baseUrl}/s/${c.statement_token}`,
    callback_method: "get",
  });

  // Only replace the link we started from. If another request replaced it meanwhile, ours loses.
  let update = supabaseAdmin()
    .from("customers")
    .update({ pay_link_id: link.id, pay_link_url: link.short_url, pay_link_amount_paise: duePaise })
    .eq("id", c.id);
  update = c.pay_link_id ? update.eq("pay_link_id", c.pay_link_id) : update.is("pay_link_id", null);
  const { data: updated, error } = await update.select("id");
  if (error || !updated?.length) {
    await cancelQuietly(link.id);
    return syncPayLink(sandboxId, customerId, { ...options, sms: "none" });
  }

  if (c.pay_link_id) await cancelQuietly(c.pay_link_id);
  if (wantSms) await logMessage(sandboxId, c.id, "sms", smsKind);
  return { ...base, payUrl: link.short_url, smsSent: wantSms };
}

/** Before Reset demo: cancel the demo's open links so old links cannot be paid. */
export async function cancelAllPayLinks(sandboxId: string): Promise<void> {
  const { data } = await supabaseAdmin()
    .from("customers")
    .select("pay_link_id")
    .eq("sandbox_id", sandboxId)
    .not("pay_link_id", "is", null);
  await Promise.all((data ?? []).map((r) => cancelQuietly(r.pay_link_id as string)));
}

export { logMessage };
