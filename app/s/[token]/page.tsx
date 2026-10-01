import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircleIcon } from "@/components/icons";
import { RazorpayLogo } from "@/components/razorpay-logo";
import { Amount, Badge, Card } from "@/components/ui";
import { appUrl } from "@/lib/app-url";
import { getStatement } from "@/lib/data/statement";
import { todayIST } from "@/lib/dates";
import { formatDate, formatRupees } from "@/lib/format";
import { translator } from "@/lib/i18n/dictionaries";
import { LiveRefresh } from "@/components/live-refresh";
import { getCustomerLedger } from "@/lib/data/ledger";
import { syncLinkPaymentsOnOpen } from "@/lib/payments/online";
import { MERCHANT_NAME, syncPayLink } from "@/lib/razorpay/pay-links";

// Private per-customer page: keep it out of search engines and never cache it.
export const metadata: Metadata = { title: "Udhaar statement", robots: { index: false, follow: false } };

/** UD-16 Customer statement: no login, no app, in the customer's language. */
export default async function StatementPage({ params, searchParams }: PageProps<"/s/[token]">) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const statement = await getStatement(token);
  if (!statement) notFound();
  const { sandboxId } = statement;
  // UD-18 Sync on open: a customer returning from Razorpay sees their payment straight away.
  const recorded = await syncLinkPaymentsOnOpen(sandboxId, statement.ledger.id, await appUrl());
  const ledger = recorded ? ((await getCustomerLedger(sandboxId, statement.ledger.id)) ?? statement.ledger) : statement.ledger;
  const t = translator(ledger.language);
  const lang = ledger.language;
  const today = todayIST();

  // The pay link must always match the balance, even if nothing refreshed it yet. No SMS here.
  let payUrl = ledger.payUrl;
  if (ledger.duePaise > 0) {
    try {
      payUrl = (await syncPayLink(sandboxId, ledger.id, { sms: "none", baseUrl: await appUrl() })).payUrl;
    } catch (err) {
      console.error("statement pay link", err);
    }
  }

  const open = ledger.entries.filter((e) => e.status === "open");
  const nextDue = open.map((e) => e.dueDate).sort()[0];
  const justPaid = query.razorpay_payment_link_status === "paid" || query.razorpay_payment_link_status === "partially_paid";

  return (
    <div lang={lang} className="mx-auto flex min-h-dvh max-w-md flex-col bg-page">
      <header className="bg-topbar px-4 pt-safe">
        <div className="flex h-16 items-center justify-between">
          <RazorpayLogo />
          <span className="text-sm font-semibold text-white">{MERCHANT_NAME}</span>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-4 py-5">
        <div>
          <h1 className="font-heading text-xl font-semibold text-ink">{t("statement.title")}</h1>
          <p className="text-sm text-ink-muted">
            {t("statement.for", { name: ledger.name })} · {t("statement.from", { merchant: MERCHANT_NAME })}
          </p>
        </div>

        {justPaid && (
          <p role="status" className="flex items-center gap-2 rounded-sm bg-positive-subtle px-3 py-2.5 text-sm font-medium text-positive">
            <CheckCircleIcon size={18} />
            {t("statement.paymentReceived")}
          </p>
        )}

        <Card className="p-4">
          <p className="text-sm font-semibold text-ink-subtle">{t("statement.totalDue")}</p>
          <div className="mt-2">
            <Amount paise={ledger.duePaise} size="xl" />
          </div>
          {ledger.duePaise > 0 ? (
            <>
              {nextDue && (
                <p className={`mt-2 text-sm ${nextDue < today ? "font-semibold text-negative" : "text-ink-subtle"}`}>
                  {t("statement.nextDue", { date: formatDate(nextDue, lang, true) })}
                </p>
              )}
              {payUrl && (
                <a
                  href={payUrl}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-sm bg-primary text-[15px] font-semibold text-white transition-colors duration-200 ease-standard hover:bg-primary-hover"
                >
                  {t("statement.pay", { amount: formatRupees(ledger.duePaise) })}
                </a>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm font-medium text-positive">{t("statement.allClear")}</p>
          )}
        </Card>

        <section>
          <h2 className="mb-2 font-heading text-base font-semibold text-ink">{t("statement.entries")}</h2>
          <Card className="overflow-hidden">
            <ul>
              {ledger.entries.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <Amount paise={e.amountPaise} size="sm" />
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {formatDate(e.createdAt, lang)}
                      {e.note ? ` · ${e.note}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {e.status === "paid" ? (
                      <Badge tone="positive">{t("customer.paid")}</Badge>
                    ) : (
                      <Badge tone={e.dueDate < today ? "negative" : "notice"}>
                        {t("customer.left", { amount: formatRupees(e.remainingPaise) })}
                      </Badge>
                    )}
                    <span className="text-xs text-ink-muted">
                      {e.status === "paid" && e.paidAt
                        ? t("customer.paidOn", { date: formatDate(e.paidAt, lang) })
                        : t("customer.dueOn", { date: formatDate(e.dueDate, lang) })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {ledger.payments.length > 0 && (
          <section>
            <h2 className="mb-2 font-heading text-base font-semibold text-ink">{t("statement.payments")}</h2>
            <Card className="overflow-hidden">
              <ul>
                {ledger.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0">
                    <Amount paise={p.amountPaise} size="sm" />
                    <span className="text-xs text-ink-muted">
                      {t(p.source === "cash" ? "payment.cash" : p.source === "link" ? "payment.link" : "payment.qr")} ·{" "}
                      {formatDate(p.receivedAt, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}
      </main>

      <footer className="pb-safe px-4 py-4 text-center text-xs text-ink-muted">{t("statement.securedBy")}</footer>
      <LiveRefresh />
    </div>
  );
}
