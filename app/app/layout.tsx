import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { LiveRefresh } from "@/components/live-refresh";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-page">
      <AppHeader />
      <main className="flex-1 px-4 pt-5 pb-24">{children}</main>
      <BottomNav />
      <LiveRefresh />
    </div>
  );
}
