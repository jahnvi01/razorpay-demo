"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { simulateQrPaymentAction } from "@/app/app/qr-actions";
import { AmountInput, Field, FormError, PrimaryButton, Select, SuccessBanner, TextInput } from "./form";
import { useI18n } from "./i18n-provider";
import { Card } from "./ui";

/** Demo only: send the signed webhook Razorpay would send for a payment on the shop QR. */
export function QrSimulate({ knownVpas, familyVpa }: { knownVpas: { vpa: string; name: string }[]; familyVpa: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState("200");
  const [choice, setChoice] = useState(knownVpas[0]?.vpa ?? "new");
  const [newVpa, setNewVpa] = useState("new.customer@okhdfcbank");
  const [result, setResult] = useState<boolean | null>(null);

  const submit = () =>
    start(async () => {
      const form = new FormData();
      form.set("amount", amount);
      form.set("vpa", choice === "new" ? newVpa : choice);
      const res = await simulateQrPaymentAction(form);
      setResult(res.ok);
      if (res.ok) router.refresh();
    });

  return (
    <Card className="space-y-3 border-dashed p-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">{t("qr.demoTitle")}</h3>
        <p className="mt-1 text-xs text-ink-muted">{t("qr.demoHint")}</p>
      </div>
      <Field label={t("form.amount")} htmlFor="sim-amount">
        <AmountInput id="sim-amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label={t("qr.payerVpa")} htmlFor="sim-vpa">
        <Select id="sim-vpa" value={choice} onChange={(e) => setChoice(e.target.value)}>
          {knownVpas.map((k) => (
            <option key={k.vpa} value={k.vpa}>
              {k.vpa} ({k.name})
            </option>
          ))}
          <option value={familyVpa}>
            {familyVpa} ({t("qr.familyVpa")})
          </option>
          <option value="new">{t("qr.newVpa")}</option>
        </Select>
      </Field>
      {choice === "new" && (
        <TextInput aria-label={t("qr.newVpa")} value={newVpa} onChange={(e) => setNewVpa(e.target.value)} />
      )}
      {result === true && <SuccessBanner message={t("qr.simulated")} />}
      <FormError message={result === false ? t("qr.failed") : undefined} />
      <PrimaryButton type="button" disabled={pending} onClick={submit}>
        {pending ? t("form.saving") : t("qr.simulate")}
      </PrimaryButton>
    </Card>
  );
}
