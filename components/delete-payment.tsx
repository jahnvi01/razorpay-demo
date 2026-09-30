"use client";

import { useTransition } from "react";
import { deletePaymentAction } from "@/app/app/ledger-actions";
import { useI18n } from "./i18n-provider";

/** UD-09 Delete a mistaken cash payment after confirming. */
export function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(t("payment.deleteConfirm"))) return;
        const form = new FormData();
        form.set("paymentId", paymentId);
        start(() => deletePaymentAction(form));
      }}
      className="text-xs font-semibold text-negative disabled:opacity-50"
    >
      {t("payment.delete")}
    </button>
  );
}
