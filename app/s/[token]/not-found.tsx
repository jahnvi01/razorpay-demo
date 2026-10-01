import { RazorpayLogo } from "@/components/razorpay-logo";
import { Card } from "@/components/ui";
import { dictionaries } from "@/lib/i18n/dictionaries";

export default function StatementNotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-page">
      <header className="flex h-16 items-center bg-topbar px-4">
        <RazorpayLogo />
      </header>
      <main className="px-4 py-6">
        <Card className="space-y-2 p-4 text-sm text-ink-subtle">
          <p>{dictionaries.en["statement.invalid"]}</p>
          <p lang="hi">{dictionaries.hi["statement.invalid"]}</p>
        </Card>
      </main>
    </div>
  );
}
