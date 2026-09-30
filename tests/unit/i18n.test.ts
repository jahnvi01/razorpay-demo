import { describe, expect, it } from "vitest";
import { dictionaries, isLang, translator } from "@/lib/i18n/dictionaries";

describe("i18n", () => {
  it("Hindi defines every English key with a non-empty string", () => {
    expect(Object.keys(dictionaries.hi).sort()).toEqual(Object.keys(dictionaries.en).sort());
    for (const value of Object.values(dictionaries.hi)) expect(value.trim()).not.toBe("");
  });

  it("keeps the same placeholders in both languages", () => {
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(dictionaries.en) as (keyof typeof dictionaries.en)[]) {
      expect(vars(dictionaries.hi[key]), key).toEqual(vars(dictionaries.en[key]));
    }
  });

  it("fills placeholders", () => {
    expect(translator("en")("home.fromEntries", { count: 3 })).toBe("from 3 entries");
    expect(translator("hi")("home.fromEntries", { count: 3 })).toBe("3 एंट्री से");
  });

  it("only accepts known languages", () => {
    expect(isLang("hi")).toBe(true);
    expect(isLang("fr")).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
});
