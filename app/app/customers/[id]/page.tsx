import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import { Placeholder } from "@/components/placeholder";
import { SectionHeader } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function CustomerDetailPage({ params }: PageProps<"/app/customers/[id]">) {
  const [{ id }, t] = await Promise.all([params, getT()]);
  return (
    <div>
      <Link href="/app/customers" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ChevronLeftIcon size={16} />
        {t("customer.back")}
      </Link>
      <SectionHeader title={t("customer.title", { id })} />
      <Placeholder body={t("customer.placeholder")} />
    </div>
  );
}
