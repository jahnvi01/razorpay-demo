"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import { LANG_COOKIE, translator, type Lang, type Translate } from "@/lib/i18n/dictionaries";

type I18n = { lang: Lang; t: Translate; setLang: (lang: Lang) => void; pending: boolean };

const I18nContext = createContext<I18n | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState(initialLang);
  const [pending, startTransition] = useTransition();

  const value = useMemo<I18n>(
    () => ({
      lang,
      t: translator(lang),
      pending,
      setLang: (next) => {
        if (next === lang) return;
        // Saved on the device so the choice survives closing the app.
        document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
        document.documentElement.lang = next;
        setLangState(next);
        // Re-render server components in the new language without a page reload.
        startTransition(() => router.refresh());
      },
    }),
    [lang, pending, router],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
