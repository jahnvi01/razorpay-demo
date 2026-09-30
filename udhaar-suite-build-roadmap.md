# Udhaar Suite — Build Roadmap

Udhaar Suite ships in seven phases that follow the user flow: foundations, recording credit, telling the customer, collecting and reminding, trust insights, pilot hardening, then a landing page. Each phase ends with a test gate. The next phase starts only when every test in the gate passes.

## Decisions locked for the MVP

| Question | Decision |
| --- | --- |
| Login | No sign-up or login. One hardcoded demo merchant, Ramesh Kirana, with a private sandbox per visitor session |
| Customer acknowledgement of an entry | Not in the MVP. The message is one-way |
| Partial payments and multiple entries | Every payment clears the oldest open entry first, then the next |
| Pricing for merchants | Free |
| Adding customers | Manual entry of name and phone number. Contact import is V2 |
| WhatsApp | No Meta setup. The WhatsApp button opens the merchant's own WhatsApp with the message prefilled |
| SMS | Sent by Razorpay through its payment link SMS |
| Reminder schedule | Automatic SMS the day before the due date at 10:00 IST via Vercel Cron, plus manual one-tap reminders. No limit on reminders |
| Offline use | Moved to V2 |
| Languages | English and Hindi, switched with one tap from a clearly visible toggle in the top header |

Vercel Cron was chosen over Razorpay's built-in link reminders because those follow the link's expiry, not our due dates. One link also covers a customer's whole balance, which can span entries with different due dates. Ticket IDs (UD-xx) match BOARD.md.

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Next.js (App Router), TypeScript, Tailwind |
| PWA | Serwist for manifest, icons and service worker. Install is optional |
| API | Next.js route handlers under `app/api` |
| Database | Supabase Postgres, Mumbai region. All access on the server with the service role key |
| Live updates | Supabase Realtime broadcast for payment events, polling as fallback |
| Payments | Official `razorpay` Node SDK, test keys on the build deployment |
| Hosting | One Vercel project, Vercel Cron for daily jobs |

## Roadmap at a glance

Each phase ships only after its test gate passes.

| Phase | Ships | Test gate to move on |
| --- | --- | --- |
| 0 · Foundations | App shell, EN \| हिं toggle, Supabase schema, demo sandbox, Razorpay | Webhooks verified, i18n works |
| 1 · Record udhaar and keep the ledger right | Record udhaar, cash received, oldest-first clearing, home summary | Clearing unit tests all pass |
| 2 · Tell the customer automatically | WhatsApp share button, Razorpay SMS, statement page, pay link | Prefill and SMS correct |
| 3 · Collect and remind | Pay link auto-clear, shared QR match, day-before and one-tap reminders | No double clear, reminders correct |
| 4 · Trust Meter and overdue list | Habit label before saving, overdue list with one-tap remind | Meter matches a spreadsheet |
| 5 · End-to-end hardening and pilot | Full journey script, low-end phones, 5 pilot merchants | Script passes 3 times in a row |
| 6 · Landing page | One-page problem story with an App Demo button into the live app | Demo opens in one tap |

Phases 1–4 follow the merchant's journey: record, tell, collect, then judge who to trust. Phase 5 tests that whole journey together.

## Phase 0 — Foundations

This phase ships no merchant-facing feature. It sets up the app shell, data model and language toggle that every later phase depends on.

**What gets built**

1. **UD-01** Next.js app shell with a top header, bottom navigation (Home, Customers, Overdue) and an **EN | हिं** toggle always visible in the header. PWA via Serwist.
2. **UD-02** All strings in English and Hindi files. The language choice is saved on the device.
3. **UD-03** Supabase Postgres schema: `Customer`, `CreditEntry`, `Payment`, `Allocation`, `Reminder`. Amounts in paise. Server-only access with the service role key.
4. **UD-34** Demo merchant Ramesh Kirana with a private sandbox per visitor session. Each new session gets its own copy of the seed data. The sandbox lasts until the browser is closed. A Reset demo option in the header menu starts over in one tap.
5. **UD-04** Razorpay Node SDK with test keys on the build deployment, and a webhook route under `app/api` with a signature check.
6. **UD-05** Seed script with 5 demo customers and mixed paid and unpaid history, used by every later test.

**How to test (gate)**

- [ ] The header toggle switches every visible string between English and Hindi in one tap, with no reload
- [ ] The chosen language persists after the app is closed and reopened
- [ ] No screen shows a missing-translation key or clipped Hindi text at 360 px width
- [ ] Two browsers get separate sandboxes. A change in one never shows in the other
- [ ] A Razorpay test API call (create a test payment link) succeeds on the build deployment
- [ ] A test webhook reaches the endpoint and its signature is verified. A tampered signature is rejected
- [ ] Seed script loads, resets and reloads the demo data cleanly
- [ ] The Supabase service role key and Razorpay secret never reach the browser bundle

## Phase 1 — Record udhaar and keep the ledger right

After this phase a merchant can add customers, record credit, take cash against it and see accurate totals. No messages or online payments yet.

| Feature | Ships in this phase |
| --- | --- |
| UD-07 Add customer manually | Name and 10-digit mobile number. Duplicate phone numbers are caught |
| UD-08 Record udhaar | Pick or add a customer, enter amount, due date defaults to today + 7 days and can be edited, save in about 10 seconds |
| UD-10 Cash received | One tap to record cash. Full or part payment. Any amount above total dues is held as advance credit |
| UD-09 Oldest-first clearing | One allocator applies every payment to the oldest open entry first, then the next. Advance credit is applied to the next new entry |
| UD-11 Home summary | Udhaar given this month, collected this month, total remaining with number of customers. Tapping remaining opens a placeholder overdue list (full list in Phase 4) |

**How to test (gate)**

*Record udhaar*

- [ ] New customer by manual entry: name and 10-digit mobile required. A duplicate phone number is caught
- [ ] Due date shows today + 7 days by default and can be changed. Past dates are blocked
- [ ] Amount rejects 0, negative and non-numeric input. Accepts paise (e.g. ₹149.50)
- [ ] A first-time tester can record an entry in 10 seconds or less (time 5 people)

*Oldest-first clearing (unit tests)*

- [ ] Entries ₹500 (oldest), ₹300, ₹200; pay ₹600 → first cleared, second has ₹200 remaining, third untouched
- [ ] Pay exactly the total → all entries cleared, balance ₹0
- [ ] Pay ₹100 over the total → all cleared, ₹100 shown as advance; next ₹300 entry starts at ₹200 remaining
- [ ] Two payments recorded at the same moment never allocate the same rupee twice
- [ ] Deleting or correcting a payment re-runs the allocation and restores the right balances

*Cash received and home summary*

- [ ] Part cash payment reduces the balance and the entry stays open; full payment marks it paid
- [ ] Home totals match a hand calculation on the seed data, including across a month boundary
- [ ] Customer count in "remaining" counts customers, not entries
- [ ] All Phase 1 screens pass in both English and Hindi

## Phase 2 — Tell the customer automatically

After this phase the merchant can send the customer an update from their own WhatsApp in one tap. Razorpay sends an SMS with the pay link.

| Feature | Ships in this phase |
| --- | --- |
| UD-13 Customer pay link | One Razorpay Payment Link per customer for the current balance. Partial payment allowed. Cancelled and recreated when the balance changes |
| UD-14 WhatsApp share button | Opens the merchant's own WhatsApp with a prefilled message: amount, new balance, due date, pay link and statement link, in the customer's language. No Meta setup |
| UD-15 SMS through Razorpay | Razorpay sends the pay link by SMS when a link is created. Can be resent on demand |
| UD-16 Customer statement page | Mobile web page (no login, no app download) showing open entries, payments and balance, in the customer's language |

**How to test (gate)**

- [ ] After an entry, the WhatsApp button opens a chat with the customer's number and the correct prefilled text
- [ ] Prefilled text matches the customer's language (English and Hindi both checked)
- [ ] A test number receives the Razorpay SMS with the pay link
- [ ] Statement link opens on a phone without login and matches the ledger to the rupee
- [ ] Statement link cannot be guessed: a changed token returns "not found"
- [ ] Pay link amount equals the current balance. After a cash payment the old link is cancelled and a new one is sent
- [ ] Pay links and statements only ever show data from the visitor's own sandbox

## Phase 3 — Collect and remind

After this phase online payments clear udhaar on their own, and customers are reminded without the merchant asking.

| Feature | Ships in this phase |
| --- | --- |
| UD-18 Pay link auto-clear | `payment_link.paid` and `payment_link.partially_paid` webhooks record the payment and run oldest-first clearing. Open screens update live through Supabase Realtime, with polling as fallback |
| UD-19 Shared QR match | Detect payments on the shop's Razorpay QR. Match the payer to a customer from past payments (same UPI ID). One-tap merchant confirm before clearing. A weak match is never cleared without the merchant |
| UD-20 Day-before reminder | Vercel Cron runs daily at 10:00 IST and has Razorpay resend the pay link SMS to customers with entries due tomorrow. Stops once dues are cleared |
| UD-21 One-tap reminder | From the entry and customer screens: open WhatsApp with a prefilled reminder, or resend the Razorpay SMS. No limit on reminders |

**How to test (gate)**

*Pay-link auto-clear*

- [ ] Pay a test link in full → entries clear within 30 seconds and home totals update
- [ ] Pay part of the link → oldest-first clearing applies; the rest stays due
- [ ] Send the same webhook twice → the payment is recorded once
- [ ] Failed or cancelled payment → nothing clears
- [ ] Server down during payment → Razorpay retry is processed on recovery; a daily check against Razorpay's payment list catches any missed event

*Shared QR match*

- [ ] Known payer (UPI ID seen before for one customer) → merchant sees "Clear ₹X for [name]?" and one tap clears it
- [ ] Unknown payer → merchant can pick a customer or mark it as a normal sale; nothing clears by itself
- [ ] One UPI ID linked to two customers → treated as a weak match and the merchant chooses
- [ ] Merchant declines the match → the payment is kept as a sale and no balance changes

*Reminders*

- [ ] Cron run with a simulated date sends SMS only to customers with entries due tomorrow
- [ ] Entry cleared before the cron runs → no reminder goes out
- [ ] Every cron and manual reminder is logged on the customer
- [ ] Every reminder's pay link opens with the current balance
- [ ] Reminder text is correct in both English and Hindi
- [ ] A paid entry updates on an open screen without refresh, and still updates by polling when Realtime is off

## Phase 4 — Trust Meter and overdue list

After this phase the merchant sees who pays on time before giving more credit, and can chase every late customer from one list.

| Feature | Ships in this phase |
| --- | --- |
| 3. Trust Meter | Habit label (usually on time, sometimes late, often late), average days to pay, on-time rate, current due and oldest unpaid days; shown on the record-udhaar screen before saving; "Not enough history" until the customer has 3 cleared entries; computed from oldest-first allocations |
| 9. Overdue list | Customers with unpaid dues past the due date; sort by amount or days late; one-tap reminder from each row; opened from "remaining" on the home screen |

Label thresholds (confirmed): on-time rate of 80% or more = usually on time, 50–79% = sometimes late, below 50% = often late.

**How to test (gate)**

*Trust Meter*

- [ ] Customer with 0, 1 or 2 cleared entries → "Not enough history"; the 3rd cleared entry shows the meter
- [ ] Seed customers built to land at 90%, 60% and 30% on-time show the three matching labels
- [ ] Average days to pay and on-time rate match a spreadsheet calculation for each seed customer
- [ ] An entry cleared by several part payments counts its final clearing date, not the first payment
- [ ] Meter appears on the entry screen before save and does not slow the 10-second entry
- [ ] Meter updates right after a payment clears an entry

*Overdue list*

- [ ] Only customers past their due date appear; a customer drops off the moment dues reach zero
- [ ] Sorting by amount and by days late both give the right order on the seed data
- [ ] One-tap reminder from a row sends
- [ ] "Remaining" on home opens this list and the totals agree

## Phase 5 — End-to-end hardening and pilot

This phase adds no new core features. It proves the whole journey works end to end and gets the app ready for a small pilot with real merchants.

**End-to-end script (run in English, then in Hindi)**

1. Open a fresh Ramesh Kirana sandbox and record ₹500 udhaar for a new customer, with the default 7-day due date.
2. Tap the WhatsApp button. The prefilled message is correct, and Razorpay sends the pay link SMS.
3. Run the reminder cron with a simulated date the day before the due date. The reminder SMS arrives.
4. Customer pays ₹300 by the pay link. The entry stays open with ₹200 due and the screen updates live.
5. Customer pays ₹200 on the shop QR. The merchant confirms the match and the entry clears.
6. Home summary, Trust Meter and overdue list all reflect the final state.
7. Repeat with cash for the second payment, and with an overpayment that becomes advance credit.

**How to test (gate)**

- [ ] The end-to-end script passes 3 times in a row with no manual fixes
- [ ] Home totals always equal the sum of the ledger (automated consistency check runs nightly)
- [ ] App works on a low-end Android phone (2 GB RAM) and a slow 3G connection
- [ ] 5 merchants complete the script unaided; each issue they hit is logged and fixed
- [ ] Security check: webhook signatures verified, statement links unguessable, no keys in the app

Automatic reminders on and after the due date are parked for V2 (UD-32). Add them only if the pilot shows the day-before reminder is not enough.

## Phase 6 — Landing page

- [ ] **Build a one-page landing page for Udhaar Suite.** It explains in simple words the problem we solve: udhaar is hard to track and awkward to collect. It shows how the app fixes that in a few short steps, and puts an **App Demo** button at the top that opens the real journey in the app, in a fresh Ramesh Kirana sandbox.

**How to test (gate)**

- [ ] App Demo button is visible at the top without scrolling, on phone and desktop
- [ ] The button opens the working app on the home summary, with demo data, and no login
- [ ] A first-time visitor can explain the problem after 30 seconds on the page (test with 5 people)
- [ ] The page has the same English and Hindi toggle in the header
- [ ] The page loads in under 2 seconds on a mid-range phone over 4G

## Parking lot (V2)

| Ticket | Item |
| --- | --- |
| UD-29 | Offline entry and sync |
| UD-30 | Import customer from phone contacts |
| UD-31 | Automatic WhatsApp messages via Meta Business API |
| UD-32 | Automatic reminders on and after the due date |
| UD-33 | Customer acknowledges an entry |
