// UD-02 English and Hindi toggle. Run against a production server: npm run build && PORT=3100 npm start
import puppeteer from "puppeteer-core";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

const ENGLISH_ONLY = ["Overview", "This month", "Udhaar given", "Collected", "Remaining", "Home", "Customers", "Overdue", "Live totals"];

const newPage = async () => {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => localStorage.setItem("ud-welcome-seen", "1")); // returning visitor (UD-42)
  await page.setViewport({ width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  return page;
};

const state = (page) =>
  page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const overflowing = [...document.querySelectorAll("body *")]
      .filter((el) => el.childElementCount === 0 && el.textContent.trim())
      .filter((el) => el.getBoundingClientRect().right > vw + 0.5 || el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent.trim());
    return {
      lang: document.documentElement.lang,
      nav: [...document.querySelectorAll("nav a")].map((a) => a.textContent.trim()).join(","),
      heading: document.querySelector("main h2")?.textContent.trim(),
      text: document.body.innerText,
      scroll: document.documentElement.scrollWidth <= vw,
      overflowing,
      toggle: !!document.querySelector('header [role="radiogroup"]'),
      checked: document.querySelector('header [role="radio"][aria-checked="true"]')?.getAttribute("lang"),
      marker: window.__noReload === true,
    };
  });

let page = await newPage();
// A real customer from this browser's own sandbox
await page.goto(base + "/app/customers", { waitUntil: "networkidle0" });
const customerPath = await page.$eval("main ul li a", (a) => a.getAttribute("href"));
const routes = ["/app", "/app/customers", customerPath, "/app/overdue"];
await page.goto(base + "/app", { waitUntil: "networkidle0" });
let s = await state(page);
check("first visit opens in English", s.lang === "en" && s.nav === "Home,Customers,Overdue" && s.checked === "en", s.nav);
check("toggle visible in header", s.toggle);

// Switch to Hindi in one tap, no reload
await page.evaluate(() => (window.__noReload = true));
await page.click('header [role="radio"][lang="hi"]');
await page.waitForFunction(() => document.querySelector("main h2")?.textContent.trim() === "सारांश");
s = await state(page);
check("one tap switches to Hindi", s.lang === "hi" && s.checked === "hi");
check("no page reload on switch", s.marker);
check("nav in Hindi", s.nav === "होम,ग्राहक,बकाया", s.nav);
const leftovers = ENGLISH_ONLY.filter((w) => s.text.includes(w));
check("no English strings left on Home", leftovers.length === 0, leftovers.join(", "));

// Every screen in Hindi at 360 px
for (const path of routes) {
  await page.goto(base + path, { waitUntil: "networkidle0" });
  s = await state(page);
  const left = ENGLISH_ONLY.filter((w) => s.text.includes(w));
  check(`${path} in Hindi`, s.lang === "hi" && left.length === 0, left.join(", "));
  check(`${path} no clipped or overflowing Hindi text at 360 px`, s.scroll && s.overflowing.length === 0, s.overflowing.join(" | "));
}

// Hindi menu
await page.goto(base + "/app", { waitUntil: "networkidle0" });
await page.click("header button[aria-haspopup]");
const menu = await page.$eval('[role="menu"]', (m) => m.innerText);
check("menu in Hindi", menu.includes("डेमो रीसेट करें") && menu.includes("डेमो व्यापारी"));

// Devanagari font actually loaded (UD-35)
const font = await page.evaluate(async () => {
  await document.fonts.ready;
  return document.fonts.check('600 20px "Noto Sans Devanagari"', "सारांश");
});
check("Hindi renders in Noto Sans Devanagari", font);

// Persists after closing and reopening
await page.close();
page = await newPage();
await page.goto(base + "/app", { waitUntil: "networkidle0" });
s = await state(page);
check("Hindi persists after close and reopen", s.lang === "hi" && s.heading === "सारांश");

// And back to English
await page.click('header [role="radio"][lang="en"]');
await page.waitForFunction(() => document.querySelector("main h2")?.textContent.trim() === "Overview");
s = await state(page);
check("switch back to English", s.lang === "en" && s.nav === "Home,Customers,Overdue");
await page.screenshot({ path: process.env.SHOT_DIR ? process.env.SHOT_DIR + "/ud02-en.png" : "/dev/null" }).catch(() => {});

await browser.close();
console.log(results.join("\n"));
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
