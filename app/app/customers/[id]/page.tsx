import Link from "next/link";
import { notFound } from "next/navigation";
import { CashReceived } from "@/components/cash-received";
import { DeletePaymentButton } from "@/components/delete-payment";
import { ButtonLink, SuccessBanner } from "@/components/form";
import { ChevronLeftIcon, PlusIcon } from "@/components/icons";
import { Amount, Badge, Card, SectionHeader } from "@/components/ui";
import { formatPhone } from "@/lib/data/customers";
import { getCustomerLedger } from "@/lib/data/ledger";
import { todayIST } from "@/lib/dates";
import { formatDate, formatRupees } from "@/lib/format";
import type { MessageKey, Translate } from "@/lib/i18n/dictionaries";
import { getLang, getT } from "@/lib/i18n/server";
import { requireSandbox } from "@/lib/sandbox/server";

const SOURCE_LABEL: Record<"cash" | "link" | "qr", MessageKey> = {
  cash: "payment.cash",
  link: "payment.link",
  qr: "payment.qr",
};

function savedMessage(t: Translate, saved: unknown, amount: unknown): string | null {
  const paise = Number(amount);
  const money = Number.isInteger(paise) && paise > 0 ? formatRupees(paise) : "";
  switch (saved) {
    case "udhaar":
      return money ? t("udhaar.saved", { amount: money }) : null;
    case "cash":
      return money ? t("cash.saved", { amount: money }) : null;
    case "customer":
      return t("customers.saved");
    case "deleted":
      return t("payment.deleted");
    default:
      return null;
  }
}

export default async function CustomerDetailPage({ params, searchParams }: PageProps<"/app/customers/[id]">) {
  const [{ id }, query, t, lang, sandboxId] = await Promise.all([params, searchParams, getT(), getLang(), requireSandbox()]);
  const customer = await getCustomerLedger(sandboxId, id);
  if (!customer) notFound();

  const today = todayIST();
  const banner = savedMessage(t, query.saved, query.amount);

  return (
    <div className="space-y-4">
      <Link href="/app/customers" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ChevronLeftIcon size={16} />
        {t("customer.back")}
      </Link>
      {banner && <SuccessBanner message={banner} />}
      <div>
        <SectionHeader title={customer.name} />
        <p className="-mt-2 text-sm text-ink-muted">{formatPhone(customer.phone)}</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink-subtle">{t("customer.due")}</p>
          <span className="flex gap-1.5">
            {customer.advancePaise > 0 && (
              <Badge tone="positive">{t("customer.advance", { amount: formatRupees(customer.advancePaise) })}</Badge>
            )}
            {customer.overdue && <Badge tone="negative">{t("customers.overdue")}</Badge>}
          </span>
        </div>
        <div className="mt-2">
          <Amount paise={customer.duePaise} size="xl" />
        </div>
        <p className="mt-2 text-sm text-ink-subtle">
          {t("customer.openEntries", { count: customer.entries.filter((e) => e.status === "open").length })}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href={`/app/udhaar/new?customer=${customer.id}`}>
          <PlusIcon size={18} />
          {t("udhaar.new")}
        </ButtonLink>
        {/* The cash form expands, so this cell spans both columns while it is open. */}
        <div className="has-[form]:col-span-2">
          <CashReceived customerId={customer.id} duePaise={customer.duePaise} />
        </div>
      </div>

      <section>
        <h3 className="mb-2 font-heading text-base font-semibold text-ink">{t("customer.entries")}</h3>
        <Card className="overflow-hidden">
          {customer.entries.length === 0 ? (
            <p className="p-4 text-sm text-ink-muted">{t("customer.noEntries")}</p>
          ) : (
            <ul>
              {customer.entries.map((e) => {
                const overdue = e.status === "open" && e.dueDate < today;
                return (
                  <li key={e.id} className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
                    <div className="min-w-0">
                      <Amount paise={e.amountPaise} size="sm" />
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {formatDate(e.createdAt, lang)}
                        {e.note ? ` · ${e.note}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      {e.status === "paid" ? (
                        <Badge tone="positive">{t("customer.paid")}</Badge>
                      ) : (
                        <Badge tone={overdue ? "negative" : "notice"}>
                          {t("customer.left", { amount: formatRupees(e.remainingPaise) })}
                        </Badge>
                      )}
                      <span className={`text-xs ${overdue ? "font-semibold text-negative" : "text-ink-muted"}`}>
                        {e.status === "paid" && e.paidAt
                          ? t("customer.paidOn", { date: formatDate(e.paidAt, lang) })
                          : t("customer.dueOn", { date: formatDate(e.dueDate, lang) })}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <h3 className="mb-2 font-heading text-base font-semibold text-ink">{t("customer.payments")}</h3>
        <Card className="overflow-hidden">
          {customer.payments.length === 0 ? (
            <p className="p-4 text-sm text-ink-muted">{t("customer.noPayments")}</p>
          ) : (
            <ul>
              {customer.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <div>
                    <Amount paise={p.amountPaise} size="sm" />
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {t(SOURCE_LABEL[p.source])} · {formatDate(p.receivedAt, lang)}
                    </p>
                  </div>
                  {p.source === "cash" && <DeletePaymentButton paymentId={p.id} />}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
