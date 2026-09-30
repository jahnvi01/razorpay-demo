"use client";

import type { FormState } from "@/app/app/ledger-actions";
import { Field, Select, TextInput } from "./form";
import { useI18n } from "./i18n-provider";

/** Name, phone and message language. Shared by Add customer and New udhaar. */
export function CustomerFields({
  errors,
  value,
  onChange,
  autoFocus,
}: {
  errors?: FormState["fieldErrors"];
  value: { name: string; phone: string; language: "en" | "hi" };
  onChange: (next: { name: string; phone: string; language: "en" | "hi" }) => void;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  return (
    <>
      <Field label={t("form.name")} htmlFor="name" error={errors?.name && t(errors.name)}>
        <TextInput
          id="name"
          name="name"
          autoComplete="name"
          autoFocus={autoFocus}
          maxLength={80}
          value={value.name}
          invalid={!!errors?.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </Field>
      <Field label={t("form.phone")} htmlFor="phone" error={errors?.phone && t(errors.phone)}>
        <div className="flex gap-2">
          <span className="flex h-12 items-center rounded-sm border border-line-strong bg-page px-3 text-[15px] text-ink-subtle">
            +91
          </span>
          <TextInput
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={16}
            value={value.phone}
            invalid={!!errors?.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
          />
        </div>
      </Field>
      <Field label={t("form.language")} htmlFor="language">
        <Select
          id="language"
          name="language"
          value={value.language}
          onChange={(e) => onChange({ ...value, language: e.target.value === "hi" ? "hi" : "en" })}
        >
          <option value="en">{t("lang.en")}</option>
          <option value="hi">{t("lang.hi")}</option>
        </Select>
      </Field>
    </>
  );
}
