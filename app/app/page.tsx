import { Placeholder } from "@/components/placeholder";
import { Amount, Card, SectionHeader } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function HomePage() {
  const t = await getT();
  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("home.title")}
        action={<span className="pb-0.5 text-sm font-semibold text-primary">{t("home.period")}</span>}
      />
      <Card className="p-4">
        <p className="text-sm font-semibold text-ink-subtle">{t("home.given")}</p>
        <div className="mt-2">
          <Amount paise={0} size="xl" />
        </div>
        <p className="mt-2 text-sm text-ink-subtle">{t("home.fromEntries", { count: 0 })}</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink-subtle">{t("home.collected")}</p>
          <div className="mt-2">
            <Amount paise={0} size="md" />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink-subtle">{t("home.remaining")}</p>
          <div className="mt-2">
            <Amount paise={0} size="md" />
          </div>
        </Card>
      </div>
      <Placeholder body={t("home.placeholder")} />
    </div>
  );
}
