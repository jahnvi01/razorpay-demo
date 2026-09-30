import { Placeholder } from "@/components/placeholder";
import { Amount, Card, SectionHeader } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Overview"
        action={<span className="pb-0.5 text-sm font-semibold text-primary">This month</span>}
      />
      <Card className="p-4">
        <p className="text-sm font-semibold text-ink-subtle">Udhaar given</p>
        <div className="mt-2">
          <Amount paise={0} size="xl" />
        </div>
        <p className="mt-2 text-sm text-ink-subtle">from 0 entries</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink-subtle">Collected</p>
          <div className="mt-2">
            <Amount paise={0} size="md" />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink-subtle">Remaining</p>
          <div className="mt-2">
            <Amount paise={0} size="md" />
          </div>
        </Card>
      </div>
      <Placeholder body="Live totals arrive with the home summary." />
    </div>
  );
}
