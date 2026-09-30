"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { createEntryAction, type FormState } from "@/app/app/ledger-actions";
import { formatPhone, formatRupees } from "@/lib/format";
import { CustomerFields } from "./customer-fields";
import { AmountInput, Field, FormError, PrimaryButton, TextInput } from "./form";
import { useI18n } from "./i18n-provider";
import { PlusIcon, SearchIcon } from "./icons";

export type PickerCustomer = { id: string; name: string; phone: string; duePaise: number };

/** UD-08 Record udhaar: pick or add a customer, type the amount, save. */
export function UdhaarForm({
  customers,
  preselectedId,
  defaultDue,
  today,
}: {
  customers: PickerCustomer[];
  preselectedId: string | null;
  defaultDue: string;
  today: string;
}) {
  const { t, lang } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(createEntryAction, {});
  const [mode, setMode] = useState<"existing" | "new">(customers.length ? "existing" : "new");
  const [selectedId, setSelectedId] = useState<string | null>(
    customers.some((c) => c.id === preselectedId) ? preselectedId : null,
  );
  const [query, setQuery] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", language: lang });
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(defaultDue);
  const [note, setNote] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  const selected = customers.find((c) => c.id === selectedId) ?? null;
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return customers.filter((c) => !q || c.name.toLowerCase().includes(q) || (digits && c.phone.includes(digits)));
  }, [customers, query]);
  const dueDays = Math.round((Date.parse(dueDate) - Date.parse(today)) / 86_400_000);
  const errors = state.fieldErrors;

  const pick = (id: string) => {
    setSelectedId(id);
    // Next thing to type is the amount.
    requestAnimationFrame(() => amountRef.current?.focus());
  };

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="customerId" value={mode === "existing" ? (selectedId ?? "") : ""} />

      <section className="space-y-3">
        <p className="text-sm font-medium text-ink-subtle">{t("udhaar.customer")}</p>

        {mode === "existing" && selected && (
          <div className="flex items-center gap-3 rounded-md border border-primary bg-primary-faded px-3 py-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-sm font-semibold text-primary">
              {selected.name.charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{selected.name}</span>
              <span className="block text-xs text-ink-muted">
                {selected.duePaise > 0 ? t("customer.left", { amount: formatRupees(selected.duePaise) }) : t("customers.nothingDue")}
              </span>
            </span>
            <button type="button" onClick={() => setSelectedId(null)} className="text-sm font-semibold text-primary">
              {t("udhaar.change")}
            </button>
          </div>
        )}

        {mode === "existing" && !selected && (
          <div className="space-y-2">
            <div className="relative">
              <SearchIcon size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
              <TextInput
                aria-label={t("customers.search")}
                placeholder={t("customers.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                invalid={!!errors?.customer}
              />
            </div>
            <ul className="max-h-60 overflow-y-auto rounded-md border border-line bg-surface" role="listbox" aria-label={t("udhaar.customer")}>
              {matches.map((c) => (
                <li key={c.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => pick(c.id)}
                    className="flex w-full items-center justify-between gap-3 border-b border-line px-3 py-2.5 text-left last:border-b-0 hover:bg-gray-faded"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-ink">{c.name}</span>
                      <span className="block text-xs text-ink-muted">{formatPhone(c.phone)}</span>
                    </span>
                    {c.duePaise > 0 && <span className="shrink-0 text-sm text-ink-subtle">{formatRupees(c.duePaise)}</span>}
                  </button>
                </li>
              ))}
              {matches.length === 0 && <li className="px-3 py-3 text-sm text-ink-muted">{t("customers.noMatch")}</li>}
            </ul>
            {errors?.customer && (
              <p role="alert" className="text-xs font-medium text-negative">
                {t(errors.customer)}
              </p>
            )}
          </div>
        )}

        {mode === "new" && (
          <div className="space-y-4 rounded-md border border-line bg-surface p-3">
            <CustomerFields errors={errors} value={newCustomer} onChange={setNewCustomer} autoFocus={customers.length > 0} />
          </div>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === "new" ? "existing" : "new")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          {mode === "new" ? (
            t("customers.pickExisting")
          ) : (
            <>
              <PlusIcon size={16} />
              {t("customers.addNew")}
            </>
          )}
        </button>
      </section>

      <Field label={t("form.amount")} htmlFor="amount" error={errors?.amount && t(errors.amount)}>
        <AmountInput
          ref={amountRef}
          id="amount"
          name="amount"
          placeholder="0"
          value={amount}
          invalid={!!errors?.amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>

      <Field
        label={t("form.dueDate")}
        htmlFor="dueDate"
        error={errors?.dueDate && t(errors.dueDate)}
        hint={dueDays >= 0 ? t("udhaar.dueHint", { days: dueDays }) : undefined}
      >
        <TextInput
          id="dueDate"
          name="dueDate"
          type="date"
          min={today}
          value={dueDate}
          invalid={!!errors?.dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </Field>

      <Field label={t("form.note")} htmlFor="note" error={errors?.note && t(errors.note)}>
        <TextInput
          id="note"
          name="note"
          maxLength={200}
          placeholder={t("form.notePlaceholder")}
          value={note}
          invalid={!!errors?.note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      <FormError message={state.error && t(state.error)} />
      <PrimaryButton type="submit" disabled={pending}>
        {pending ? t("form.saving") : t("udhaar.save")}
      </PrimaryButton>
    </form>
  );
}
