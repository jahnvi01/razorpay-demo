"use client";

import type { Lang } from "@/lib/i18n/dictionaries";
import { useI18n } from "./i18n-provider";

const options: { lang: Lang; label: string; name: string }[] = [
  { lang: "en", label: "EN", name: "English" },
  { lang: "hi", label: "हिं", name: "हिंदी" },
];

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="radiogroup"
      aria-label={t("lang.switch")}
      className="flex h-10 items-center rounded-[10px] border border-topbar-border bg-topbar-button p-1"
    >
      {options.map((option) => {
        const active = option.lang === lang;
        return (
          <button
            key={option.lang}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.name}
            lang={option.lang}
            onClick={() => setLang(option.lang)}
            className={`h-full min-w-9 rounded-[7px] px-2 text-[13px] font-semibold transition-colors duration-200 ease-standard focus-visible:outline-2 focus-visible:outline-primary ${
              active ? "bg-white text-ink" : "text-white/70 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
