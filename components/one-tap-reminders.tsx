"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { bulkSmsAction } from "@/app/app/share-actions";
import { useI18n } from "./i18n-provider";
import { BellIcon, CheckCircleIcon } from "./icons";
import { Amount, Badge } from "./ui";

export type ReminderTarget = {
  id: string;
  name: string;
  duePaise: number;
  daysLate: number;
};

/**
 * UD-49 One tap reminders on Dues: a floating button opens a sheet of overdue customers, all ticked.
 * Send SMS to N texts each ticked customer the Razorpay pay link, then shows who was sent and who failed.
 */
export function OneTapReminders({
  customers,
}: {
  customers: ReminderTarget[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(customers.map((c) => c.id)),
  );
  const [results, setResults] = useState<{ id: string; ok: boolean }[] | null>(
    null,
  );
  const [pending, startSend] = useTransition();
  const sendRef = useRef<HTMLButtonElement>(null);

  const show = () => {
    setPicked(new Set(customers.map((c) => c.id)));
    setResults(null);
    setOpen(true);
  };
  const close = () => {
    if (pending && !results) return; // never close mid-send
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    sendRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allPicked = picked.size === customers.length;

  const send = () =>
    startSend(async () => {
      setResults(await bulkSmsAction([...picked]));
    });

  // After sending, refresh the page data ("Last SMS", pay links) without blocking the sheet
  useEffect(() => {
    if (results) router.refresh();
  }, [results, router]);

  const sent = results?.filter((r) => r.ok).length ?? 0;
  const failedNames = (results ?? [])
    .filter((r) => !r.ok)
    .map((r) => customers.find((c) => c.id === r.id)?.name)
    .filter(Boolean);

  return (
    <>
      {/* Floating pill above the bottom nav, inside the app column */}
      <div
        className="pointer-events-none fixed inset-x-0 z-10 mx-auto flex max-w-md justify-end px-4"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 16px)" }} // clear of the tab bar and the iPhone home indicator
      >
        <button
          type="button"
          onClick={show}
          aria-haspopup="dialog"
          className="pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-[#FFE8C2] px-5 text-[15px] font-semibold text-ink shadow-high ring-1 ring-[#F5C77E] transition-colors duration-200 ease-standard hover:bg-[#FFDDA3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <BellIcon size={18} />
          {t("bulk.button")}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <button
            type="button"
            aria-label={t("welcome.close")}
            onClick={close}
            className="sheet-fade absolute inset-0 bg-[#0A1630]/55"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-title"
            className="sheet-up pb-safe relative flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl bg-surface shadow-high"
          >
            <div
              className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong"
              aria-hidden="true"
            />
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-4">
              <h2
                id="bulk-title"
                className="font-heading text-xl font-semibold text-ink"
              >
                {t("bulk.title")}
              </h2>
              <p className="mt-1 text-sm text-ink-subtle">{t("bulk.sub")}</p>

              {results ? (
                <div className="mt-5 space-y-3" role="status">
                  {sent > 0 && (
                    <p className="flex items-center gap-2 rounded-md bg-positive-subtle px-3 py-2.5 text-sm font-semibold text-positive">
                      <CheckCircleIcon size={18} />{" "}
                      {t("bulk.sent", { count: sent })}
                    </p>
                  )}
                  {failedNames.length > 0 && (
                    <p className="rounded-md bg-negative-subtle px-3 py-2.5 text-sm text-negative">
                      {t("bulk.failed", { names: failedNames.join(", ") })}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <label className="mt-4 flex items-center gap-3 border-b border-line pb-3 text-sm font-semibold text-ink">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-primary"
                      checked={allPicked}
                      onChange={() =>
                        setPicked(
                          allPicked
                            ? new Set()
                            : new Set(customers.map((c) => c.id)),
                        )
                      }
                    />
                    {t("bulk.selectAll")}
                  </label>
                  <ul className="divide-y divide-line">
                    {customers.map((c) => (
                      <li key={c.id}>
                        <label className="flex items-center gap-3 py-3">
                          <input
                            type="checkbox"
                            className="h-5 w-5 shrink-0 accent-primary"
                            checked={picked.has(c.id)}
                            onChange={() => toggle(c.id)}
                          />
                          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
                            {c.name}
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <Amount paise={c.duePaise} size="sm" />
                            <Badge tone="negative">
                              {t("overdue.daysLate", { days: c.daysLate })}
                            </Badge>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="shrink-0 border-t border-line px-5 pt-3 pb-4">
              {results ? (
                <button
                  type="button"
                  onClick={close}
                  className="flex h-12 w-full items-center justify-center rounded-sm bg-primary text-[15px] font-semibold text-white hover:bg-primary-hover"
                >
                  {t("bulk.done")}
                </button>
              ) : (
                <button
                  ref={sendRef}
                  type="button"
                  onClick={send}
                  disabled={pending || picked.size === 0}
                  className="flex h-12 w-full items-center justify-center rounded-sm bg-primary text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:opacity-50"
                >
                  {pending
                    ? t("share.sending")
                    : t("bulk.send", { count: picked.size })}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
