import Link from "next/link";
import { OneTapReminders } from "@/components/one-tap-reminders";
import { RemindButton } from "@/components/remind-button";
import { Amount, Badge, Card, SectionHeader } from "@/components/ui";
import { listDues, type DuesSort } from "@/lib/data/dues";
import { dateInIST, todayIST } from "@/lib/dates";
import { formatDate, formatRupees } from "@/lib/format";
import { getLang, getT } from "@/lib/i18n/server";
import { requireSandbox } from "@/lib/sandbox/server";

/**
 * UD-47 Dues: everyone who still owes udhaar, with a one-tap reminder per row (replaces Overdue, UD-24).
 * ?sort=amount (default) or recent, and ?filter=overdue. The overdue chip in the strip toggles the filter.
 */
export default async function DuesPage({ searchParams }: PageProps<"/app/dues">) {
  const [query, t, lang, sandboxId] = await Promise.all([searchParams, getT(), getLang(), requireSandbox()]);
  const sort: DuesSort = query.sort === "recent" ? "recent" : "amount";
  const overdueOnly = query.filter === "overdue";

  const all = await listDues(sandboxId, { sort, overdueOnly: false });
  const overdue = all.filter((c) => c.overduePaise > 0);
  const shown = overdueOnly ? overdue : all;
  const totalDue = all.reduce((s, c) => s + c.duePaise, 0);
  const totalOverdue = overdue.reduce((s, c) => s + c.overduePaise, 0);

  // UD-50 "Reminded today (SMS)", "Reminded 3 days ago (WhatsApp)", or "Not reminded yet" when overdue
  const today = todayIST();
  const reminded = (c: (typeof all)[number]) => {
    if (!c.lastReminder) return c.overduePaise > 0 ? t("dues.notReminded") : null;
    const days = Math.round((Date.parse(today) - Date.parse(dateInIST(c.lastReminder.at))) / 86_400_000);
    const when = days <= 0 ? t("dues.today") : days === 1 ? t("dues.yesterday") : t("dues.daysAgo", { count: days });
    return t("dues.reminded", { when, channel: c.lastReminder.channel === "sms" ? "SMS" : "WhatsApp" });
  };

  const href = (next: { sort?: DuesSort; overdueOnly?: boolean }) => {
    const p = new URLSearchParams();
    const s = next.sort ?? sort;
    const f = next.overdueOnly ?? overdueOnly;
    if (s !== "amount") p.set("sort", s);
    if (f) p.set("filter", "overdue");
    const qs = p.toString();
    return `/app/dues${qs ? `?${qs}` : ""}`;
  };

  const pill = (active: boolean, to: string, label: string) => (
    <Link
      href={to}
      aria-current={active ? "true" : undefined}
      scroll={false}
      className={`rounded-sm px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ease-standard ${
        active ? "bg-gray-faded-hover text-ink" : "text-ink-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-4 pb-16">
      <SectionHeader title={t("dues.title")} />
      {all.length === 0 ? (
        <Card className="p-4 text-sm text-ink-subtle">{t("dues.none")}</Card>
      ) : (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-2 p-4">
            <p className="text-sm font-semibold text-ink">{t("dues.total", { amount: formatRupees(totalDue), count: all.length })}</p>
            {overdue.length > 0 && (
              <Link
                href={href({ overdueOnly: !overdueOnly })}
                scroll={false}
                aria-pressed={overdueOnly}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-200 ease-standard ${
                  overdueOnly ? "bg-negative text-white" : "bg-negative-subtle text-negative hover:bg-negative/15"
                }`}
              >
                {t("dues.overdueChip", { amount: formatRupees(totalOverdue), count: overdue.length })}
              </Link>
            )}
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex items-center gap-1">
              {pill(!overdueOnly, href({ overdueOnly: false }), t("dues.all"))}
              {pill(overdueOnly, href({ overdueOnly: true }), t("dues.overdue", { count: overdue.length }))}
            </div>
            <div className="flex items-center gap-1">
              <span className="mr-1 text-xs text-ink-muted">{t("overdue.sortBy")}</span>
              {pill(sort === "amount", href({ sort: "amount" }), t("overdue.sortAmount"))}
              {pill(sort === "recent", href({ sort: "recent" }), t("dues.sortRecent"))}
            </div>
          </div>

          {overdue.length > 0 && (
            <OneTapReminders customers={overdue.map(({ id, name, duePaise, daysLate }) => ({ id, name, duePaise, daysLate }))} />
          )}

          {shown.length === 0 ? (
            <Card className="p-4 text-sm text-ink-subtle">{t("overdue.none")}</Card>
          ) : (
            <Card className="overflow-hidden">
              <ul>
                {shown.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                    <Link href={`/app/customers/${c.id}`} className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{c.name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Amount paise={c.duePaise} size="sm" />
                        {c.overduePaise > 0 ? (
                          <Badge tone="negative">{t("overdue.daysLate", { days: c.daysLate })}</Badge>
                        ) : c.nextDueDate ? (
                          <Badge tone="notice">{t("customer.dueOn", { date: formatDate(c.nextDueDate, lang) })}</Badge>
                        ) : null}
                      </span>
                      {c.overduePaise > 0 && c.duePaise > c.overduePaise && (
                        <span className="mt-0.5 block text-xs text-ink-muted">{t("dues.latePart", { amount: formatRupees(c.overduePaise) })}</span>
                      )}
                      {reminded(c) && (
                        <span className={`mt-0.5 block text-xs ${c.lastReminder ? "text-ink-muted" : "font-medium text-notice"}`}>{reminded(c)}</span>
                      )}
                    </Link>
                    <RemindButton customerId={c.id} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
