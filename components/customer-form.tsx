"use client";

import { useActionState, useState } from "react";
import { createCustomerAction, type FormState } from "@/app/app/ledger-actions";
import { CustomerFields } from "./customer-fields";
import { FormError, PrimaryButton } from "./form";
import { useI18n } from "./i18n-provider";

/** UD-07 Add customer manually. */
export function CustomerForm() {
  const { t, lang } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(createCustomerAction, {});
  const [customer, setCustomer] = useState({ name: "", phone: "", language: lang });

  return (
    <form action={action} className="space-y-4" noValidate>
      <CustomerFields errors={state.fieldErrors} value={customer} onChange={setCustomer} autoFocus />
      <FormError message={state.error && t(state.error)} />
      <PrimaryButton type="submit" disabled={pending}>
        {pending ? t("form.saving") : t("customers.save")}
      </PrimaryButton>
    </form>
  );
}
