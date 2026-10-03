import Link from "next/link";
import { ButtonLink } from "@/components/form";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { countPendingQr } from "@/lib/payments/qr";
import { Amount, Card, SectionHeader } from "@/components/ui";
import { PeriodPicker } from "@/components/period-picker";
import { WelcomeSheet } from "@/components/welcome-sheet";
import { todayIST } from "@/lib/dates";
import { parsePeriod } from "@/lib/period";
import { SHOP_QR_ENABLED } from "@/lib/features";
import { listCustomers } from "@/lib/data/customers";
import { getHomeSummary } from "@/lib/data/ledger";
import { getT } from "@/lib/i18n/server";
import { requireSandbox } from "@/lib/sandbox/server";

/**
 * UD-11 Home summary, for this month by default. UD-46 The period can be last month or a custom range.
 * UD-42 The welcome sheet opens here on a first visit.
 */
export default async function HomePage({ searchParams }: PageProps<"/app">) {
  const [sandboxId, query] = await Promise.all([requireSandbox(), searchParams]);
  const today = todayIST();
  const period = parsePeriod(query, today);
  const [t, summary, pendingQr, customers] = await Promise.all([
    getT(),
    getHomeSummary(sandboxId, period),
    SHOP_QR_ENABLED ? countPendingQr(sandboxId) : 0,
    listCustomers(sandboxId),
  ]);

  return (
    <div className="space-y-4">
      <WelcomeSheet
        customers={customers.map(({ name, duePaise, overdue }) => ({ name, duePaise, overdue }))}
        owedPaise={summary.remainingPaise}
        lateCount={summary.overdueCustomers}
        forceOpen={query.welcome === "1"}
      />
      {pendingQr > 0 && (
        <Link
          href="/app/qr"
          className="flex items-center justify-between rounded-md bg-notice-subtle px-4 py-3 text-sm font-semibold text-notice"
        >
          {t("home.qrReview", { count: pendingQr })}
          <ChevronRightIcon size={16} />
        </Link>
      )}
      <SectionHeader
        title={t("home.title")}
        action={<PeriodPicker key={`${period.from}-${period.to}`} period={period} today={today} />}
      />
      <Card className="p-4">
        <p className="text-sm font-semibold text-ink-subtle">{t("home.given")}</p>
        <div className="mt-2">
          <Amount paise={summary.givenPaise} size="xl" />
        </div>
        <p className="mt-2 text-sm text-ink-subtle">{t("home.fromEntries", { count: summary.givenEntries })}</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink-subtle">{t("home.collected")}</p>
          <div className="mt-2">
            <Amount paise={summary.collectedPaise} size="md" />
          </div>
        </Card>
        <Link href="/app/dues" className="block rounded-lg transition-shadow duration-200 ease-standard hover:shadow-high">
          <Card className="h-full p-4">
            <p className="flex items-center justify-between text-sm font-semibold text-ink-subtle">
              {t("home.remaining")}
              <ChevronRightIcon size={16} className="text-primary" />
            </p>
            <div className="mt-2">
              <Amount paise={summary.remainingPaise} size="md" />
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {t("home.remainingCustomers", { count: summary.customersOwing })}
              {summary.overdueCustomers > 0 && (
                <span className="font-semibold text-negative"> · {t("home.overdueCustomers", { count: summary.overdueCustomers })}</span>
              )}
            </p>
          </Card>
        </Link>
      </div>
      <ButtonLink href="/app/udhaar/new">
        <PlusIcon size={18} />
        {t("udhaar.new")}
      </ButtonLink>
      {SHOP_QR_ENABLED && (
        <ButtonLink href="/app/qr" variant="secondary">
          {t("qr.open")}
        </ButtonLink>
      )}
    </div>
  );
}
