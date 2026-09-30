import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import { Placeholder } from "@/components/placeholder";
import { getT } from "@/lib/i18n/server";

export default async function AppNotFound() {
  const t = await getT();
  return (
    <div className="space-y-4">
      <Link href="/app/customers" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ChevronLeftIcon size={16} />
        {t("customer.back")}
      </Link>
      <Placeholder body={t("customer.notFound")} />
    </div>
  );
}
