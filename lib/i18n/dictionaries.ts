// All user-facing strings. Hindi must define every key that English does (enforced by the type).

export const LANGS = ["en", "hi"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "lang";

const en = {
  "app.name": "Udhaar Suite",
  "lang.switch": "Change language",
  "header.menu": "Menu",
  "header.merchantRole": "Demo merchant · Test mode",
  "header.resetDemo": "Reset demo",
  "header.comingSoon": "Available soon",
  "nav.home": "Home",
  "nav.customers": "Customers",
  "nav.overdue": "Overdue",
  "home.title": "Overview",
  "home.period": "This month",
  "home.given": "Udhaar given",
  "home.fromEntries": "from {count} entries",
  "home.collected": "Collected",
  "home.remaining": "Remaining",
  "home.placeholder": "Live totals arrive with the home summary.",
  "customers.title": "Customers",
  "customers.placeholder": "Your customers and what each one owes will show here.",
  "customer.back": "Customers",
  "customer.title": "Customer {id}",
  "customer.placeholder": "Entries, payments and reminders for this customer will show here.",
  "overdue.title": "Overdue",
  "overdue.placeholder": "Customers who are past their due date will show here.",
};

export type MessageKey = keyof typeof en;
export type Dictionary = Record<MessageKey, string>;

const hi: Dictionary = {
  "app.name": "Udhaar Suite",
  "lang.switch": "भाषा बदलें",
  "header.menu": "मेन्यू",
  "header.merchantRole": "डेमो व्यापारी · टेस्ट मोड",
  "header.resetDemo": "डेमो रीसेट करें",
  "header.comingSoon": "जल्द उपलब्ध",
  "nav.home": "होम",
  "nav.customers": "ग्राहक",
  "nav.overdue": "बकाया",
  "home.title": "सारांश",
  "home.period": "इस महीने",
  "home.given": "दिया गया उधार",
  "home.fromEntries": "{count} एंट्री से",
  "home.collected": "वसूला गया",
  "home.remaining": "बाकी",
  "home.placeholder": "होम सारांश आने पर यहां असली आंकड़े दिखेंगे।",
  "customers.title": "ग्राहक",
  "customers.placeholder": "आपके ग्राहक और हर ग्राहक का बकाया यहां दिखेगा।",
  "customer.back": "ग्राहक",
  "customer.title": "ग्राहक {id}",
  "customer.placeholder": "इस ग्राहक की एंट्री, भुगतान और रिमाइंडर यहां दिखेंगे।",
  "overdue.title": "बकाया",
  "overdue.placeholder": "जिन ग्राहकों की देय तारीख निकल चुकी है, वे यहां दिखेंगे।",
};

export const dictionaries: Record<Lang, Dictionary> = { en, hi };

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function translator(lang: Lang): Translate {
  const dict = dictionaries[lang];
  return (key, vars) =>
    vars ? dict[key].replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`)) : dict[key];
}
