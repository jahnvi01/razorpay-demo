import { Placeholder } from "@/components/placeholder";
import { SectionHeader } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function OverduePage() {
  const t = await getT();
  return (
    <div>
      <SectionHeader title={t("overdue.title")} />
      <Placeholder body={t("overdue.placeholder")} />
    </div>
  );
}
