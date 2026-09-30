import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import { Placeholder } from "@/components/placeholder";
import { SectionHeader } from "@/components/ui";

export default async function CustomerDetailPage({ params }: PageProps<"/app/customers/[id]">) {
  const { id } = await params;
  return (
    <div>
      <Link href="/app/customers" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ChevronLeftIcon size={16} />
        Customers
      </Link>
      <SectionHeader title={`Customer ${id}`} />
      <Placeholder body="Entries, payments and reminders for this customer will show here." />
    </div>
  );
}
