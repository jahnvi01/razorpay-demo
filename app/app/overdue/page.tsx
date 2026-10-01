import Link from "next/link";
import { RemindButton } from "@/components/remind-button";
import { Amount, Badge, Card, SectionHeader } from "@/components/ui";
import { listOverdue } from "@/lib/data/trust";
import { formatPhone, formatRupees } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { requireSandbox } from "@/lib/sandbox/server";

/** UD-24 Everyone past their due date, with a one-tap reminder per row. ?sort=amount (default) or days. */
export default async function OverduePage({ searchParams }: PageProps<"/app/overdue">) {
  const [{ sort: sortParam }, t, sandboxId] = await Promise.all([searchParams, getT(), requireSandbox()]);
  const sort = sortParam === "days" ? "days" : "amount";
  const overdue = await listOverdue(sandboxId, sort);
  const total = overdue.reduce((s, c) => s + c.overduePaise, 0);

  const tab = (value: "amount" | "days", label: string) => (
    <Link
      href={`/app/overdue?sort=${value}`}
      aria-current={sort === value ? "true" : undefined}
      className={`rounded-sm px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ease-standard ${
        sort === value ? "bg-gray-faded-hover text-ink" : "text-ink-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-4">
      <SectionHeader title={t("overdue.title")} />
      {overdue.length === 0 ? (
        <Card className="p-4 text-sm text-ink-subtle">{t("overdue.none")}</Card>
      ) : (
        <>
          <Card className="p-4">
            <p className="text-sm font-semibold text-negative">
              {t("overdue.total", { amount: formatRupees(total), count: overdue.length })}
            </p>
          </Card>
          <div className="flex items-center gap-1">
            <span className="mr-1 text-xs text-ink-muted">{t("overdue.sortBy")}</span>
            {tab("amount", t("overdue.sortAmount"))}
            {tab("days", t("overdue.sortDays"))}
          </div>
          <Card className="overflow-hidden">
            <ul>
              {overdue.map((c) => (
                <li key={c.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <Link href={`/app/customers/${c.id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-ink">{c.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Amount paise={c.overduePaise} size="sm" />
                      <Badge tone="negative">{t("overdue.daysLate", { days: c.daysLate })}</Badge>
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {formatPhone(c.phone)}
                      {c.duePaise > c.overduePaise ? ` · ${t("overdue.ofDue", { amount: formatRupees(c.duePaise) })}` : ""}
                    </span>
                  </Link>
                  <RemindButton customerId={c.id} />
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
