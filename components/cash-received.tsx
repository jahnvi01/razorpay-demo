"use client";

import { useActionState, useState } from "react";
import { recordCashAction, type FormState } from "@/app/app/ledger-actions";
import { formatRupees, paiseToInput } from "@/lib/format";
import { parseAmount } from "@/lib/validation";
import { AmountInput, Field, FormError, PrimaryButton, SecondaryButton } from "./form";
import { useI18n } from "./i18n-provider";

/** UD-10 Cash received. Pre-filled with the full due, so a full payment is one more tap. */
export function CashReceived({ customerId, duePaise }: { customerId: string; duePaise: number }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(duePaise > 0 ? paiseToInput(duePaise) : "");
  const [state, action, pending] = useActionState<FormState, FormData>(recordCashAction, {});

  if (!open) {
    return (
      <SecondaryButton type="button" onClick={() => setOpen(true)}>
        {t("cash.received")}
      </SecondaryButton>
    );
  }

  const parsed = parseAmount(amount);
  const extra = parsed.ok ? parsed.value - duePaise : 0;

  return (
    <form action={action} className="space-y-3 rounded-md border border-line bg-surface p-4" noValidate>
      <input type="hidden" name="customerId" value={customerId} />
      <Field
        label={t("cash.amount")}
        htmlFor="cash-amount"
        error={state.fieldErrors?.amount && t(state.fieldErrors.amount)}
        hint={extra > 0 ? t("cash.advanceNote", { amount: formatRupees(extra) }) : undefined}
      >
        <AmountInput
          id="cash-amount"
          name="amount"
          autoFocus
          value={amount}
          invalid={!!state.fieldErrors?.amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <FormError message={state.error && t(state.error)} />
      <div className="grid grid-cols-2 gap-2">
        <SecondaryButton type="button" onClick={() => setOpen(false)} disabled={pending}>
          {t("form.cancel")}
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? t("form.saving") : t("cash.record")}
        </PrimaryButton>
      </div>
    </form>
  );
}
