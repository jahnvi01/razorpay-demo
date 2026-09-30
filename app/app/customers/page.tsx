import Link from "next/link";
import { ButtonLink } from "@/components/form";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { Amount, Badge, Card, SectionHeader } from "@/components/ui";
import { formatPhone, listCustomers } from "@/lib/data/customers";
import { getT } from "@/lib/i18n/server";
import { requireSandbox } from "@/lib/sandbox/server";

export default async function CustomersPage() {
  const [t, customers] = await Promise.all([getT(), requireSandbox().then(listCustomers)]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("customers.title")}
        action={<span className="pb-0.5 text-sm text-ink-muted">{t("customers.count", { count: customers.length })}</span>}
      />
      {customers.length === 0 ? (
        <Card className="p-4 text-sm text-ink-subtle">{t("customers.empty")}</Card>
      ) : (
        <Card className="overflow-hidden">
          <ul>
            {customers.map((c) => (
              <li key={c.id} className="border-line not-last:border-b">
                <Link
                  href={`/app/customers/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-200 ease-standard hover:bg-gray-faded"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-faded text-sm font-semibold text-primary">
                    {c.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-ink">{c.name}</span>
                    <span className="block text-xs text-ink-muted">{formatPhone(c.phone)}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    {c.duePaise > 0 ? (
                      <Amount paise={c.duePaise} size="sm" />
                    ) : (
                      <span className="text-sm text-ink-muted">{t("customers.nothingDue")}</span>
                    )}
                    {c.overdue && <Badge tone="negative">{t("customers.overdue")}</Badge>}
                  </span>
                  <ChevronRightIcon size={16} className="shrink-0 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <ButtonLink href="/app/customers/new" variant="secondary">
        <PlusIcon size={18} />
        {t("customers.add")}
      </ButtonLink>
    </div>
  );
}
