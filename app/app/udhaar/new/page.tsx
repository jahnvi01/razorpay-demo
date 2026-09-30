import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import { SectionHeader } from "@/components/ui";
import { UdhaarForm } from "@/components/udhaar-form";
import { listCustomers } from "@/lib/data/customers";
import { todayIST } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { requireSandbox } from "@/lib/sandbox/server";
import { defaultDueDate } from "@/lib/validation";

/** UD-08 Record udhaar. ?customer=<id> preselects a customer. */
export default async function NewUdhaarPage({ searchParams }: PageProps<"/app/udhaar/new">) {
  const [{ customer }, t, customers] = await Promise.all([
    searchParams,
    getT(),
    requireSandbox().then(listCustomers),
  ]);
  const preselectedId = typeof customer === "string" ? customer : null;
  const today = todayIST();

  return (
    <div className="space-y-4">
      <Link
        href={preselectedId ? `/app/customers/${preselectedId}` : "/app"}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeftIcon size={16} />
        {t("form.cancel")}
      </Link>
      <SectionHeader title={t("udhaar.title")} />
      <UdhaarForm
        customers={customers.map(({ id, name, phone, duePaise }) => ({ id, name, phone, duePaise }))}
        preselectedId={preselectedId}
        defaultDue={defaultDueDate(today)}
        today={today}
      />
    </div>
  );
}
