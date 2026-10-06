"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appUrl } from "@/lib/app-url";
import {
  createCustomer,
  createEntry,
  deleteCashPayment,
  LedgerError,
  PG_UNIQUE_VIOLATION,
  recordCashPayment,
} from "@/lib/data/ledger";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { syncPayLink } from "@/lib/razorpay/pay-links";
import { requireSandbox } from "@/lib/sandbox/server";
import { parseAmount, parseDueDate, parseName, parseNote, parsePhone } from "@/lib/validation";

// Every action re-validates its input and only ever touches the caller's own sandbox (cookie).

export type FormState = {
  error?: MessageKey;
  fieldErrors?: Partial<Record<"name" | "phone" | "amount" | "dueDate" | "note" | "customer", MessageKey>>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const lang = (v: FormDataEntryValue | null): "en" | "hi" => (v === "hi" ? "hi" : "en");
const isDuplicatePhone = (err: unknown) => err instanceof LedgerError && err.code === PG_UNIQUE_VIOLATION;

/** Test runs set this cookie so automated journeys never text real numbers. */
const SMS_OFF_COOKIE = "ud-sms-off";

/**
 * UD-13 and UD-15 After a balance change: refresh the pay link and let Razorpay SMS it.
 * UD-48 A new udhaar entry texts demo customers too; other changes follow the usual rules.
 * A Razorpay failure never undoes the ledger change. It only shows a warning on the next screen.
 */
async function afterBalanceChange(sandboxId: string, customerId: string, event: "udhaar" | "update" = "update"): Promise<string> {
  try {
    const smsOff = (await cookies()).get(SMS_OFF_COOKIE)?.value === "1";
    const state = await syncPayLink(sandboxId, customerId, { sms: smsOff ? "none" : event, baseUrl: await appUrl() });
    return state.smsSent ? "&sms=sent" : "";
  } catch (err) {
    console.error("pay link update failed", err);
    return "&link=failed";
  }
}

function newCustomerFrom(form: FormData, fieldErrors: FormState["fieldErrors"] & object) {
  const name = parseName(form.get("name"));
  const phone = parsePhone(form.get("phone"));
  if (!name.ok) fieldErrors.name = name.error;
  if (!phone.ok) fieldErrors.phone = phone.error;
  return name.ok && phone.ok ? { name: name.value, phone: phone.value, language: lang(form.get("language")) } : null;
}

/** UD-07 Add customer manually. */
export async function createCustomerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const fieldErrors: NonNullable<FormState["fieldErrors"]> = {};
  const customer = newCustomerFrom(form, fieldErrors);
  if (!customer) return { fieldErrors };

  const sandboxId = await requireSandbox();
  let id: string;
  try {
    id = await createCustomer(sandboxId, customer);
  } catch (err) {
    if (isDuplicatePhone(err)) return { fieldErrors: { phone: "form.phoneTaken" } };
    console.error(err);
    return { error: "form.saveFailed" };
  }
  redirect(`/app/customers/${id}?saved=customer`);
}

/** UD-08 Record udhaar for an existing or a new customer. */
export async function createEntryAction(_prev: FormState, form: FormData): Promise<FormState> {
  const fieldErrors: NonNullable<FormState["fieldErrors"]> = {};
  const isNew = form.get("mode") === "new";
  const customerId = String(form.get("customerId") ?? "");
  const newCustomer = isNew ? newCustomerFrom(form, fieldErrors) : null;
  if (!isNew && !UUID.test(customerId)) fieldErrors.customer = "form.customerRequired";

  const amount = parseAmount(form.get("amount"));
  const dueDate = parseDueDate(form.get("dueDate"));
  const note = parseNote(form.get("note"));
  if (!amount.ok) fieldErrors.amount = amount.error;
  if (!dueDate.ok) fieldErrors.dueDate = dueDate.error;
  if (!note.ok) fieldErrors.note = note.error;
  if (Object.keys(fieldErrors).length || !amount.ok || !dueDate.ok || !note.ok) return { fieldErrors };

  const sandboxId = await requireSandbox();
  let result: { customerId: string };
  try {
    result = await createEntry(sandboxId, {
      customerId: isNew ? null : customerId,
      newCustomer,
      amountPaise: amount.value,
      dueDate: dueDate.value,
      note: note.value,
    });
  } catch (err) {
    if (isDuplicatePhone(err)) return { fieldErrors: { phone: "form.phoneTaken" } };
    console.error(err);
    return { error: "form.saveFailed" };
  }
  const linkStatus = await afterBalanceChange(sandboxId, result.customerId, "udhaar");
  redirect(`/app/customers/${result.customerId}?saved=udhaar&amount=${amount.value}${linkStatus}`);
}

/** UD-10 Cash received: full or part payment, extra becomes advance credit. */
export async function recordCashAction(_prev: FormState, form: FormData): Promise<FormState> {
  const customerId = String(form.get("customerId") ?? "");
  const amount = parseAmount(form.get("amount"));
  if (!amount.ok) return { fieldErrors: { amount: amount.error } };
  if (!UUID.test(customerId)) return { error: "form.saveFailed" };

  const sandboxId = await requireSandbox();
  try {
    await recordCashPayment(sandboxId, customerId, amount.value);
  } catch (err) {
    console.error(err);
    return { error: "form.saveFailed" };
  }
  const linkStatus = await afterBalanceChange(sandboxId, customerId);
  redirect(`/app/customers/${customerId}?saved=cash&amount=${amount.value}${linkStatus}`);
}

/** UD-09 Delete a mistaken cash payment. Clearing re-runs for that customer. */
export async function deletePaymentAction(form: FormData): Promise<void> {
  const paymentId = String(form.get("paymentId") ?? "");
  if (!UUID.test(paymentId)) return;
  const sandboxId = await requireSandbox();
  const customerId = await deleteCashPayment(sandboxId, paymentId);
  const linkStatus = await afterBalanceChange(sandboxId, customerId);
  redirect(`/app/customers/${customerId}?saved=deleted${linkStatus}`);
}
