import puppeteer from "puppeteer-core";
// Run against a production server: npm run build && PORT=3100 npm start
const base = process.env.BASE_URL ?? "http://localhost:3100";
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

// A real customer from this browser's own sandbox
await page.goto(base + "/app/customers", { waitUntil: "networkidle0" });
const customerPath = await page.$eval("main ul li a", (a) => a.getAttribute("href"));

for (const [path, label] of [["/app", "Home"], ["/app/customers", "Customers"], [customerPath, "Customers"], ["/app/overdue", "Overdue"]]) {
  await page.goto(base + path, { waitUntil: "networkidle0" });
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
    header: !!document.querySelector('header [aria-label="Ramesh Kirana"]') && !!document.querySelector('header [aria-label="Razorpay"]'),
    headingFont: getComputedStyle(document.querySelector("main h2")).fontFamily,
    tabs: [...document.querySelectorAll("nav a")].map((a) => a.textContent.trim()),
    active: document.querySelector('nav a[aria-current="page"]')?.textContent.trim(),
  }));
  check(`${path} no horizontal scroll`, m.sw <= m.cw, `${m.sw}/${m.cw}`);
  check(`${path} header shows Razorpay logo and Ramesh Kirana`, m.header);
  check(`${path} heading uses TASA Orbiter`, /TASA/i.test(m.headingFont), m.headingFont);
  check(`${path} nav has Home, Customers, Overdue`, m.tabs.join() === "Home,Customers,Overdue");
  check(`${path} active tab is ${label}`, m.active === label, m.active);
}

// nav click works client-side
await page.goto(base + "/app", { waitUntil: "networkidle0" });
await page.click('nav a[href="/app/overdue"]');
await page.waitForFunction(() => location.pathname === "/app/overdue");
check("tap Overdue tab navigates", true);

// menu with Reset demo
await page.click('button[aria-label="Menu"]');
const item = await page.$eval('[role="menuitem"]', (b) => ({ text: b.textContent, disabled: b.disabled }));
check("menu shows Reset demo, ready to use", item.text.includes("Reset demo") && !item.disabled);

await page.mouse.click(40, 400);
const closed = await page.$('[role="menu"]');
check("menu closes on outside tap", closed === null);

// service worker registers in production
await page.goto(base + "/app", { waitUntil: "networkidle0" });
const swReady = await page.evaluate(async () => {
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 8000))]);
  return !!reg?.active;
});
check("service worker active", swReady);


await browser.close();
console.log(results.join("\n"));
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
