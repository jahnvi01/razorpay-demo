// UD-14 WhatsApp update text, in the customer's language. Plain text, sent from the merchant's own WhatsApp.
// It links to the statement page, which never expires and always carries a Pay button for today's balance.
import { formatDate, formatRupees } from "@/lib/format";
import type { Lang } from "@/lib/i18n/dictionaries";

export type UpdateEvent = { kind: "udhaar" | "payment"; amountPaise: number } | null;

export type UpdateMessageInput = {
  lang: Lang;
  customerName: string;
  merchantName: string;
  event: UpdateEvent;
  duePaise: number;
  nextDueDate: string | null;
  statementUrl: string;
};

export function buildUpdateMessage(m: UpdateMessageInput): string {
  const firstName = m.customerName.split(" ")[0];
  const due = formatRupees(m.duePaise);
  const date = m.nextDueDate ? formatDate(m.nextDueDate, m.lang) : null;

  if (m.lang === "hi") {
    const lines = [`नमस्ते ${firstName} जी, ${m.merchantName} की तरफ से।`];
    if (m.event?.kind === "udhaar") lines.push(`${formatRupees(m.event.amountPaise)} का उधार जोड़ा गया।`);
    if (m.event?.kind === "payment") lines.push(`${formatRupees(m.event.amountPaise)} का भुगतान मिला, धन्यवाद!`);
    if (m.duePaise > 0) {
      lines.push(`कुल बाकी: ${due}${date ? `, ${date} तक` : ""}।`);
      lines.push(`पूरा हिसाब देखें और भुगतान करें: ${m.statementUrl}`);
    } else {
      lines.push("आपका सारा उधार चुक गया है। धन्यवाद!");
      lines.push(`पूरा हिसाब: ${m.statementUrl}`);
    }
    return lines.join("\n");
  }

  const lines = [`Namaste ${firstName}, this is ${m.merchantName}.`];
  if (m.event?.kind === "udhaar") lines.push(`Udhaar of ${formatRupees(m.event.amountPaise)} added.`);
  if (m.event?.kind === "payment") lines.push(`Payment of ${formatRupees(m.event.amountPaise)} received. Thank you!`);
  if (m.duePaise > 0) {
    lines.push(`Total due: ${due}${date ? `, by ${date}` : ""}.`);
    lines.push(`See your statement and pay: ${m.statementUrl}`);
  } else {
    lines.push("You have nothing due. Thank you!");
    lines.push(`Your statement: ${m.statementUrl}`);
  }
  return lines.join("\n");
}

/** UD-21 A gentle reminder of what is due, in the customer's language. Says so if it is already overdue. */
export function buildReminderMessage(m: {
  lang: Lang;
  customerName: string;
  merchantName: string;
  duePaise: number;
  nextDueDate: string | null;
  today: string;
  statementUrl: string;
}): string {
  const firstName = m.customerName.split(" ")[0];
  const due = formatRupees(m.duePaise);
  const date = m.nextDueDate ? formatDate(m.nextDueDate, m.lang) : null;
  const overdue = !!m.nextDueDate && m.nextDueDate < m.today;

  if (m.lang === "hi") {
    return [
      `नमस्ते ${firstName} जी, ${m.merchantName} की तरफ से याद दिला रहे हैं।`,
      `${due} बाकी है${date ? (overdue ? `, जो ${date} को देय था` : `, ${date} तक`) : ""}।`,
      `हिसाब देखें और भुगतान करें: ${m.statementUrl}`,
    ].join("\n");
  }
  return [
    `Namaste ${firstName}, a gentle reminder from ${m.merchantName}.`,
    `${due} is due${date ? (overdue ? ` (it was due on ${date})` : ` by ${date}`) : ""}.`,
    `See your statement and pay: ${m.statementUrl}`,
  ].join("\n");
}

/** Opens a chat with the customer in the merchant's own WhatsApp, message prefilled. */
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
}
