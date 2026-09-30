import Link from "next/link";
import { ButtonLink } from "@/components/form";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { Amount, Card, SectionHeader } from "@/components/ui";
import { getHomeSummary } from "@/lib/data/ledger";
import { getT } from "@/lib/i18n/server";
import { requireSandbox } from "@/lib/sandbox/server";

/** UD-11 Home summary for this month (IST). */
export default async function HomePage() {
  const [t, summary] = await Promise.all([getT(), requireSandbox().then((id) => getHomeSummary(id))]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("home.title")}
        action={<span className="pb-0.5 text-sm font-semibold text-primary">{t("home.period")}</span>}
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
        <Link href="/app/overdue" className="block rounded-lg transition-shadow duration-200 ease-standard hover:shadow-high">
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
    </div>
  );
}
