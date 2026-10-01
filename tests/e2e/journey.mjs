// UD-26 End-to-end merchant journey against a running app (local or production).
//
//   npm run test:journey                                  3 runs in English + 3 in Hindi on localhost:3000
//   npm run test:journey -- --base https://udhaar-suite.vercel.app
//   npm run test:journey -- --lang en --runs 1
//   npm run test:journey -- --slow                        one extra run on emulated Slow 3G with a 4x slower CPU
//   npm run test:journey -- --with-sms --sms-to 98XXXXXXXX  step 1 uses a NEW customer on that number (sends real SMS)
//
// Without --with-sms the journey uses a demo customer (no automatic SMS), so nobody gets a message.
// Each run starts with Reset demo. Online payments arrive as correctly signed Razorpay webhooks.
// Needs SUPABASE_URL, SUPABASE_SECRET_KEY, RAZORPAY_WEBHOOK_SECRET and CRON_SECRET (from .env.local).
import { createHmac, randomBytes } from "node:crypto";
import puppeteer, { PredefinedNetworkConditions } from "puppeteer-core";

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback);
const base = (arg("base", process.env.BASE_URL ?? "http://localhost:3000")).replace(/\/$/, "");
const langs = arg("lang", "both") === "both" ? ["en", "hi"] : [arg("lang")];
const runs = Number(arg("runs", "3"));
const slow = args.includes("--slow");
const withSms = args.includes("--with-sms");
const smsTo = arg("sms-to", null);
if (withSms && !/^[6-9]\d{9}$/.test(smsTo ?? "")) throw new Error("--with-sms needs --sms-to <10 digit mobile number>");

const env = process.env;
for (const k of ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "RAZORPAY_WEBHOOK_SECRET", "CRON_SECRET"]) if (!env[k]) throw new Error(`Missing ${k}`);
const SANDBOX = "00000000-0000-4000-8000-000000000001";
const sb = (q, init = {}) =>
  fetch(`${env.SUPABASE_URL}/rest/v1/${q}`, {
    ...init,
    headers: { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`, "content-type": "application/json" },
  }).then((r) => r.text()).then((t) => (t ? JSON.parse(t) : null));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rupees = (paise) => `₹${(paise / 100).toLocaleString("en-IN")}`;
// The Amount component renders "₹", rupees and ".paise" as separate pieces, so match on the rupees digits.
const digits = (paise) => (Math.trunc(paise / 100)).toLocaleString("en-IN");

// Demo customer per language: English Arjun, Hindi Sunita (their message language matches).
const DEMO = { en: { name: "Arjun Mehta", vpa: "arjun.mehta@okhdfcbank" }, hi: { name: "Sunita Sharma", vpa: "sunita.sharma@okicici" } };
const LABEL = {
  en: { save: "Save udhaar", cash: "Cash received", record: "Record cash", wa: "Send on WhatsApp", simulate: "Simulate payment", advance: "Advance" },
  hi: { save: "उधार सेव करें", cash: "नकद मिला", record: "नकद दर्ज करें", wa: "WhatsApp पर भेजें", simulate: "भुगतान दिखाएं", advance: "एडवांस" },
};

const browser = await puppeteer.launch({
  executablePath: env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const results = [];

async function journey(lang, { throttled = false } = {}) {
  const tag = `${lang.toUpperCase()}${throttled ? " slow-3G" : ""}`;
  const steps = [];
  const timings = [];
  const step = (name, ok, extra = "") => steps.push({ name, ok, extra });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  if (throttled) {
    await page.emulateNetworkConditions(PredefinedNetworkConditions["Slow 3G"]);
    await page.emulateCPUThrottling(4);
  }
  await page.setCookie({ name: "lang", value: lang, url: base });
  page.setDefaultTimeout(throttled ? 120_000 : 30_000);
  const L = LABEL[lang];
  const go = async (path) => {
    const t0 = Date.now();
    await page.goto(base + path, { waitUntil: "networkidle0", timeout: throttled ? 180_000 : 60_000 });
    timings.push({ path: path.replace(/[0-9a-f-]{36}|[0-9a-f]{64}/g, ":id").split("?")[0], ms: Date.now() - t0 });
  };
  const main = () => page.$eval("main", (m) => m.innerText.replace(/\s+/g, " "));
  const tap = async (el) => {
    await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await wait(150);
    await el.click();
  };
  const button = async (text) => (await page.$$(`xpath/.//button[contains(normalize-space(), "${text}")]`))[0];
  const submit = async (text) => {
    const posted = page.waitForResponse((r) => r.request().method() === "POST", { timeout: throttled ? 180_000 : 60_000 });
    await tap(await button(text));
    await posted;
    await page.waitForNetworkIdle({ idleTime: 800, timeout: throttled ? 180_000 : 60_000 }).catch(() => {});
  };
  const typeInto = async (sel, text) => {
    await page.$eval(sel, (e) => { e.scrollIntoView({ block: "center" }); e.focus(); e.select?.(); });
    await page.keyboard.press("Backspace");
    await page.keyboard.type(text);
  };
  const customerRow = async (name) =>
    (await sb(`customers?select=id,statement_token,pay_link_id,pay_link_amount_paise,is_demo&sandbox_id=eq.${SANDBOX}&name=eq.${encodeURIComponent(name)}`))[0];
  const dueOf = async (id) =>
    (await sb(`credit_entries?select=remaining_paise&customer_id=eq.${id}`)).reduce((s, e) => s + Number(e.remaining_paise), 0);
  const signedWebhook = async (event, payload) => {
    const body = JSON.stringify({ entity: "event", account_id: "acc_journey", event, contains: Object.keys(payload), payload, created_at: Math.floor(Date.now() / 1000) });
    const sig = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
    return (await fetch(`${base}/api/razorpay/webhook`, { method: "POST", headers: { "content-type": "application/json", "x-razorpay-signature": sig }, body })).status;
  };

  try {
    // 0. Fresh demo
    await go("/app/customers");
    await tap(await page.$("header button[aria-haspopup]"));
    await tap(await page.$('[role="menuitem"]'));
    await page.waitForNetworkIdle({ idleTime: 1000, timeout: throttled ? 180_000 : 60_000 }).catch(() => {});
    step("reset demo", (await sb(`customers?select=id&sandbox_id=eq.${SANDBOX}`)).length === 5);

    // 1. Record ₹500 udhaar with the default 7-day due date
    let name = DEMO[lang].name;
    if (withSms) {
      name = `Journey ${lang.toUpperCase()} ${randomBytes(2).toString("hex")}`;
      await go("/app/udhaar/new");
      await tap(await button(lang === "hi" ? "नया ग्राहक जोड़ें" : "Add new customer"));
      await typeInto("#name", name);
      await typeInto("#phone", smsTo);
      await page.select("#language", lang);
    } else {
      const c = await customerRow(name);
      await go(`/app/udhaar/new?customer=${c.id}`);
    }
    const dueDate = await page.$eval("#dueDate", (e) => e.value);
    const expectDue = new Date(Date.now() + 5.5 * 3600e3 + 7 * 864e5).toISOString().slice(0, 10);
    step("due date defaults to today + 7", dueDate === expectDue, dueDate);
    await typeInto("#amount", "500");
    await submit(L.save);
    const cust = await customerRow(name);
    const due0 = await dueOf(cust.id);
    step("udhaar saved and visible", page.url().includes(`/app/customers/${cust.id}`) && (await main()).includes("₹500"));

    // 2. WhatsApp share: prefilled message with the change, balance and statement link
    let waUrl = null;
    page.on("request", (q) => {
      if (!waUrl && /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(q.url())) waUrl = q.url();
    });
    await tap(await button(L.wa));
    for (let i = 0; i < 120 && !waUrl; i++) await wait(250);
    const text = waUrl ? new URL(waUrl).searchParams.get("text") ?? "" : "";
    step("WhatsApp opens with the update", text.includes("₹500") && text.includes(rupees(due0)) && text.includes(`/s/${cust.statement_token}`), text.split("\n")[1]);
    await go(`/app/customers/${cust.id}`);

    // 3. SMS
    const link = await customerRow(name);
    if (withSms) {
      const sms = await sb(`reminders?select=id&customer_id=eq.${cust.id}&channel=eq.sms`);
      step("SMS sent through Razorpay for a new customer", sms.length >= 1 && !!link.pay_link_id);
    } else {
      step("demo customer: pay link ready, no automatic SMS", !!link.pay_link_id && (await sb(`reminders?select=id&customer_id=eq.${cust.id}&channel=eq.sms`)).length === 0);
    }

    // 4. Day-before reminder job for this customer's due date
    const entries = await sb(`credit_entries?select=due_date&customer_id=eq.${cust.id}&status=eq.open&order=due_date`);
    const latestDue = entries.at(-1).due_date;
    const dayBefore = new Date(Date.parse(latestDue) - 864e5).toISOString().slice(0, 10);
    const cron = await fetch(`${base}/api/cron/day-before?date=${dayBefore}`, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } }).then((r) => r.json());
    step(
      "day-before reminder job handles the customer",
      withSms ? cron.sent.includes(name) : cron.skippedDemo.includes(name) && !cron.sent.includes(name),
      JSON.stringify({ sent: cron.sent, skippedDemo: cron.skippedDemo }),
    );

    // 5. Customer pays ₹300 by the pay link (signed webhook), screen updates live
    const before = await main();
    const payId = `pay_j${randomBytes(6).toString("hex")}`;
    const status = await signedWebhook("payment_link.partially_paid", {
      payment_link: { entity: { id: link.pay_link_id, notes: { sandbox_id: SANDBOX, customer_id: cust.id } } },
      payment: { entity: { id: payId, amount: 30000, vpa: DEMO[lang].vpa, created_at: Math.floor(Date.now() / 1000), status: "captured" } },
    });
    const due1 = await dueOf(cust.id);
    step("pay link payment of ₹300 clears oldest first", status === 200 && due1 === due0 - 30000);
    await page.waitForFunction((old) => document.querySelector("main")?.innerText.replace(/\s+/g, " ") !== old, { timeout: throttled ? 90_000 : 30_000 }, before).catch(() => {});
    step("open screen updated live", (await main()) !== before);

    // 6. Customer pays ₹200 on the shop QR, merchant confirms the match
    await go("/app/qr");
    await page.select("#sim-vpa", DEMO[lang].vpa);
    await typeInto("#sim-amount", "200");
    await tap(await button(L.simulate));
    // Strong match: "Clear for <name>" (English) or "<name> का उधार चुकाएं" (Hindi)
    const clearLabel = lang === "hi" ? `${name} का उधार चुकाएं` : `Clear for ${name}`;
    const clearBtn = await page.waitForSelector(`xpath/.//button[normalize-space()="${clearLabel}"]`, { timeout: throttled ? 120_000 : 30_000 });
    await tap(clearBtn);
    // Wait for the ledger itself, not for text (the Hindi button label contains the confirmation text).
    let due2 = await dueOf(cust.id);
    for (let i = 0; i < (throttled ? 240 : 60) && due2 !== due1 - 20000; i++) {
      await wait(500);
      due2 = await dueOf(cust.id);
    }
    step("QR payment matched and cleared ₹200", due2 === due1 - 20000);

    // 7. Home, Trust Meter and overdue list agree with the ledger
    await go("/app");
    const total = (await sb(`credit_entries?select=remaining_paise&sandbox_id=eq.${SANDBOX}`)).reduce((s, e) => s + Number(e.remaining_paise), 0);
    step("home remaining matches the ledger", (await main()).includes(digits(total)), rupees(total));
    await go(`/app/customers/${cust.id}`);
    const meter = await page.$eval('[role="region"]', (e) => e.innerText.replace(/\s+/g, " ")).catch(() => "");
    step("Trust Meter shows the current due", meter.includes(rupees(due2)), meter.slice(0, 80));

    // 8. Cash for the rest plus ₹100 extra: fully paid, ₹100 advance
    await tap(await button(L.cash));
    await page.waitForSelector("#cash-amount");
    await typeInto("#cash-amount", String(due2 / 100 + 100));
    await submit(L.record);
    const after = await main();
    step("cash clears everything and holds ₹100 advance", (await dueOf(cust.id)) === 0 && after.includes(`${L.advance} ₹100`));
    await go("/app/overdue");
    step("customer not on the overdue list", !(await main()).includes(name));

    // 9. Nightly consistency check is clean after the whole journey
    const check = await fetch(`${base}/api/cron/ledger-check`, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } }).then((r) => r.json());
    step("ledger consistency check passes", check.ok === true, check.ok ? "" : JSON.stringify(check.ledgerIssues).slice(0, 200));
  } catch (err) {
    step("journey completed", false, `${err.message} at ${page.url()}`);
  } finally {
    await context.close().catch(() => {}); // the browser may already be gone
  }
  return { tag, steps, timings };
}

const plan = [];
for (const lang of langs) for (let i = 0; i < runs; i++) plan.push({ lang });
if (slow) plan.push({ lang: langs[0], throttled: true });

for (const { lang, throttled } of plan) {
  const r = await journey(lang, { throttled });
  results.push(r);
  const failed = r.steps.filter((s) => !s.ok);
  console.log(`${failed.length ? "FAIL" : "PASS"}  ${r.tag} journey (${r.steps.length - failed.length}/${r.steps.length} steps)`);
  for (const s of failed) console.log(`        ✗ ${s.name}${s.extra ? "  (" + s.extra + ")" : ""}`);
  if (throttled) {
    const slowest = [...r.timings].sort((a, b) => b.ms - a.ms).slice(0, 4);
    console.log(`        slowest pages on Slow 3G + 4x CPU: ${slowest.map((t) => `${t.path} ${(t.ms / 1000).toFixed(1)}s`).join(", ")}`);
  }
}

await browser.close();
const allOk = results.every((r) => r.steps.every((s) => s.ok));
console.log(allOk ? `\nAll ${results.length} journeys passed against ${base}` : `\nSome journeys failed against ${base}`);
process.exit(allOk ? 0 : 1);
