import Link from "next/link";
import { OneTapReminders } from "@/components/one-tap-reminders";
import { RemindButton } from "@/components/remind-button";
import { BellIcon, CheckIcon, ChevronRightIcon, MessageSquareIcon, WhatsAppIcon } from "@/components/icons";
import { Amount, Badge, Card } from "@/components/ui";
import { listDues, type DuesSort } from "@/lib/data/dues";
import { parsePeriod, periodBounds } from "@/lib/period";
import { periodName, periodQuery } from "@/lib/period-label";
import { dateInIST, todayIST } from "@/lib/dates";
import { formatDate, formatRupees } from "@/lib/format";
import { getLang, getT } from "@/lib/i18n/server";
import { requireSandbox } from "@/lib/sandbox/server";

/**
 * UD-47 Dues: everyone who still owes udhaar, with a one-tap reminder per row (replaces Overdue, UD-24).
 * ?sort=amount (default) or recent, and ?filter=overdue. The overdue chip in the strip toggles the filter.
 * UD-67 ?period=last or ?from=&to= (from home's Remaining) keeps only udhaar given in that period.
 */
export default async function DuesPage({ searchParams }: PageProps<"/app/dues">) {
  const [query, t, lang, sandboxId] = await Promise.all([searchParams, getT(), getLang(), requireSandbox()]);
  const sort: DuesSort = query.sort === "recent" ? "recent" : "amount";
  const overdueOnly = query.filter === "overdue";

  const scoped = query.period === "last" || (typeof query.from === "string" && typeof query.to === "string");
  const period = scoped ? parsePeriod(query) : null;
  const all = await listDues(sandboxId, { sort, overdueOnly: false, created: period ? periodBounds(period) : undefined });
  const overdue = all.filter((c) => c.overduePaise > 0);
  const shown = overdueOnly ? overdue : all;
  const totalDue = all.reduce((s, c) => s + c.duePaise, 0);
  const totalOverdue = overdue.reduce((s, c) => s + c.overduePaise, 0);

  // UD-50 "Reminded today (SMS)", "Reminded 3 days ago (WhatsApp)", or "Not reminded yet" when overdue
  const today = todayIST();
  const reminded = (c: (typeof all)[number]) => {
    if (!c.lastReminder) return c.overduePaise > 0 ? { short: t("dues.notReminded"), full: t("dues.notReminded") } : null;
    const days = Math.round((Date.parse(today) - Date.parse(dateInIST(c.lastReminder.at))) / 86_400_000);
    const when = days <= 0 ? t("dues.today") : days === 1 ? t("dues.yesterday") : t("dues.daysAgo", { count: days });
    const channel = c.lastReminder.channel === "sms" ? "SMS" : "WhatsApp";
    // On the row the channel icon says "reminder", so English shows just the day; screen readers get it all
    return { short: t("dues.remindedShort", { when }), full: `${t("dues.reminded", { when })} (${channel})` };
  };

  const href = (next: { sort?: DuesSort; overdueOnly?: boolean }) => {
    const p = new URLSearchParams();
    const s = next.sort ?? sort;
    const f = next.overdueOnly ?? overdueOnly;
    if (s !== "amount") p.set("sort", s);
    if (f) p.set("filter", "overdue");
    const qs = [p.toString(), period ? periodQuery(period) : ""].filter(Boolean).join("&");
    return `/app/dues${qs ? `?${qs}` : ""}`;
  };

  const chip = "flex h-8 shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 ease-standard";

  return (
    <div className="space-y-4 pb-24">
      {/* UD-54 The total sits in the title, counts live in the chips, sort is a small menu */}
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="flex items-baseline gap-2 font-heading text-[22px] leading-7 font-semibold text-ink">
          {t("dues.title")}
          {all.length > 0 && <span className="text-ink-subtle tabular-nums">{formatRupees(totalDue)}</span>}
        </h2>
        {all.length > 0 && <span className="text-sm text-ink-muted">· {t("customers.count", { count: all.length })}</span>}
      </div>
      {period && (
        <div className="flex items-center justify-between gap-3 rounded-md bg-primary-faded px-3 py-2 text-sm">
          <span className="font-semibold text-primary">{t("dues.fromPeriod", { period: periodName(period, lang) })}</span>
          <Link href="/app/dues" className="shrink-0 text-xs font-semibold text-primary underline-offset-2 hover:underline">
            {t("dues.clearPeriod")}
          </Link>
        </div>
      )}
      {all.length === 0 ? (
        <Card className="p-4 text-sm text-ink-subtle">{t("dues.none")}</Card>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Link
              href={href({ overdueOnly: false })}
              scroll={false}
              aria-current={!overdueOnly ? "true" : undefined}
              className={`${chip} ${!overdueOnly ? "border-ink bg-ink text-white" : "border-line-strong text-ink-subtle hover:text-ink"}`}
            >
              {t("dues.allCount", { count: all.length })}
            </Link>
            {overdue.length > 0 && (
              <Link
                href={href({ overdueOnly: !overdueOnly })}
                scroll={false}
                aria-pressed={overdueOnly}
                aria-current={overdueOnly ? "true" : undefined}
                className={`${chip} ${overdueOnly ? "border-negative bg-negative text-white" : "border-negative/30 bg-negative-subtle text-negative hover:border-negative/60"}`}
              >
                {t("dues.overdueCount", { amount: formatRupees(totalOverdue), count: overdue.length })}
              </Link>
            )}
            <details key={sort} className="group relative ml-auto">
              <summary
                aria-label={`${t("overdue.sortBy")}: ${sort === "recent" ? t("dues.sortRecent") : t("overdue.sortAmount")}`}
                className="flex h-8 cursor-pointer list-none items-center gap-1 rounded-full px-2 text-sm font-semibold text-ink-subtle hover:text-ink [&::-webkit-details-marker]:hidden"
              >
                {sort === "recent" ? t("dues.sortRecent") : t("overdue.sortAmount")}
                <ChevronRightIcon size={14} className="rotate-90 transition-transform group-open:-rotate-90" />
              </summary>
              <div className="absolute top-9 right-0 z-20 w-40 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-high">
                <p className="px-3 pt-1 pb-1.5 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{t("overdue.sortBy")}</p>
                {(["amount", "recent"] as const).map((value) => (
                  <Link
                    key={value}
                    href={href({ sort: value })}
                    scroll={false}
                    aria-current={sort === value ? "true" : undefined}
                    className="flex items-center justify-between px-3 py-2 text-sm text-ink hover:bg-gray-faded"
                  >
                    {value === "amount" ? t("overdue.sortAmount") : t("dues.sortRecent")}
                    {sort === value && <CheckIcon size={14} className="text-primary" />}
                  </Link>
                ))}
              </div>
            </details>
          </div>

          {overdue.length > 0 && (
            <OneTapReminders customers={overdue.map(({ id, name, duePaise, daysLate }) => ({ id, name, duePaise, daysLate }))} />
          )}

          {shown.length === 0 ? (
            <Card className="p-4 text-sm text-ink-subtle">{t("overdue.none")}</Card>
          ) : (
            <Card className="overflow-hidden">
              <ul>
                {shown.map((c) => {
                  // UD-55 Two lines for every row: name with the last reminder, then amount with its status
                  const late = c.overduePaise > 0;
                  const reminder = reminded(c);
                  const lateLabel =
                    late && c.duePaise > c.overduePaise
                      ? t("dues.lateBadge", { amount: formatRupees(c.overduePaise), days: c.daysLate })
                      : t("overdue.daysLate", { days: c.daysLate });
                  return (
                    <li key={c.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
                      <Link href={`/app/customers/${c.id}`} className="min-w-0 flex-1">
                        <span className="flex h-6 min-w-0 items-center gap-2">
                          <span className="truncate text-[15px] font-semibold text-ink">{c.name}</span>
                          {reminder && (
                            <span
                              aria-label={reminder.full}
                              className={`flex shrink-0 items-center gap-1 text-[11px] ${c.lastReminder ? "text-ink-muted" : "font-medium text-notice"}`}
                            >
                              {!c.lastReminder ? (
                                <BellIcon size={11} className="shrink-0" />
                              ) : c.lastReminder.channel === "whatsapp" ? (
                                <WhatsAppIcon size={12} className="shrink-0 text-[#25D366]" />
                              ) : (
                                <MessageSquareIcon size={12} className="shrink-0 text-primary" />
                              )}
                              <span aria-hidden="true">{reminder.short}</span>
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 flex h-6 items-center gap-2">
                          <Amount paise={c.duePaise} size="sm" compact />
                          {late ? (
                            <Badge tone="negative">{lateLabel}</Badge>
                          ) : c.nextDueDate ? (
                            <span className="text-xs font-medium text-positive">{t("dues.dueOn", { date: formatDate(c.nextDueDate, lang) })}</span>
                          ) : null}
                        </span>
                      </Link>
                      <RemindButton customerId={c.id} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
