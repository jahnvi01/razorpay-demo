import { Placeholder } from "@/components/placeholder";
import { SectionHeader } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function CustomersPage() {
  const t = await getT();
  return (
    <div>
      <SectionHeader title={t("customers.title")} />
      <Placeholder body={t("customers.placeholder")} />
    </div>
  );
}
