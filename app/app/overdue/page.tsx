import { Placeholder } from "@/components/placeholder";
import { SectionHeader } from "@/components/ui";

export default function OverduePage() {
  return (
    <div>
      <SectionHeader title="Overdue" />
      <Placeholder body="Customers who are past their due date will show here." />
    </div>
  );
}
