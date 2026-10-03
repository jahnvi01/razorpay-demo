"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { useI18n } from "./i18n-provider";
import { ClockIcon, HomeIcon, UsersIcon } from "./icons";

const tabs: { href: string; label: MessageKey; Icon: typeof HomeIcon; isActive: (p: string) => boolean }[] = [
  { href: "/app", label: "nav.home", Icon: HomeIcon, isActive: (p: string) => p === "/app" },
  { href: "/app/customers", label: "nav.customers", Icon: UsersIcon, isActive: (p: string) => p.startsWith("/app/customers") },
  { href: "/app/dues", label: "nav.dues", Icon: ClockIcon, isActive: (p: string) => p.startsWith("/app/dues") },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface">
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {tabs.map(({ href, label, Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors duration-200 ease-standard ${
                  active ? "font-semibold text-ink" : "font-medium text-ink-muted hover:text-ink-subtle"
                }`}
              >
                {active && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-ink" aria-hidden="true" />}
                <Icon size={22} className={active ? "text-primary" : ""} />
                {t(label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
