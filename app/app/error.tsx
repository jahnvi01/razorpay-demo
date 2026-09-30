"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Card } from "@/components/ui";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="p-5">
      <h2 className="font-heading text-lg font-semibold text-ink">{t("error.title")}</h2>
      <p className="mt-1 text-sm text-ink-subtle">{t("error.body")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 h-10 rounded-sm bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 ease-standard hover:bg-primary-hover"
      >
        {t("error.retry")}
      </button>
    </Card>
  );
}
