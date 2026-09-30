import Link from "next/link";
import { CustomerForm } from "@/components/customer-form";
import { ChevronLeftIcon } from "@/components/icons";
import { SectionHeader } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

/** UD-07 Add customer manually. */
export default async function NewCustomerPage() {
  const t = await getT();
  return (
    <div className="space-y-4">
      <Link href="/app/customers" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ChevronLeftIcon size={16} />
        {t("customer.back")}
      </Link>
      <SectionHeader title={t("customers.add")} />
      <CustomerForm />
    </div>
  );
}
