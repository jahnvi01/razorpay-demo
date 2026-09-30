# Udhaar Suite Kanban Board

Source: udhaar-suite-build-roadmap.md, with these changes applied.

- Offline entry and sync moved to V2 (Parking lot)
- No Meta or WhatsApp Business setup. The WhatsApp button opens the merchant's own WhatsApp with the message prefilled
- SMS goes out through Razorpay's existing payment link SMS
- Customers are added by manual entry in the MVP. Contact import moved to V2
- Day-before reminders run on a Vercel daily cron (decision below)
- No limit on reminders. The merchant decides how often to remind
- No sign-up or login. One hardcoded demo merchant, Ramesh Kirana, with a private sandbox per visitor session
- Stack: Next.js App Router, TypeScript, Tailwind, Serwist PWA, route handlers under app/api, Supabase Postgres (Mumbai) with server-only service role access, Supabase Realtime broadcast with polling fallback, official razorpay Node SDK, one Vercel project with Vercel Cron

**Reminder decision: Vercel daily cron.** Razorpay's built-in link reminders follow the link's own expiry settings, not our per-entry due dates. One link covers a customer's whole balance, so it can span entries with different due dates. A daily cron at 10:00 IST finds entries due tomorrow and triggers the Razorpay payment link SMS for each customer. Timing is "the day before the due date" rather than exactly 24 hours.

## Board overview

| ID | Title | Phase | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- |
| UD-01 | App shell and navigation | 0 | Must | M | Done |
| UD-02 | English and Hindi toggle | 0 | Must | M | Test |
| UD-03 | Data model and database | 0 | Must | M | Ready |
| UD-04 | Razorpay test mode and webhook endpoint | 0 | Must | M | Ready |
| UD-05 | Demo seed data | 0 | Must | S | Ready |
| UD-34 | Demo merchant and session sandbox | 0 | Must | M | Ready |
| UD-35 | Razorpay look and feel | 0 | Must | M | Test |
| UD-06 | Phase 0 gate | 0 | Must | S | Ready |
| UD-07 | Add customer manually | 1 | Must | S | Ready |
| UD-08 | Record udhaar | 1 | Must | M | Ready |
| UD-09 | Oldest-first clearing engine | 1 | Must | M | Ready |
| UD-10 | Cash received | 1 | Must | S | Ready |
| UD-11 | Home summary | 1 | Must | S | Ready |
| UD-12 | Phase 1 gate | 1 | Must | S | Ready |
| UD-13 | Customer pay link | 2 | Must | M | Backlog |
| UD-14 | WhatsApp share button | 2 | Must | S | Backlog |
| UD-15 | SMS through Razorpay payment link | 2 | Must | S | Backlog |
| UD-16 | Customer statement page | 2 | Must | M | Backlog |
| UD-17 | Phase 2 gate | 2 | Must | S | Backlog |
| UD-18 | Pay link auto-clear | 3 | Must | M | Backlog |
| UD-19 | Shared QR match | 3 | Should | L | Backlog |
| UD-20 | Day-before reminder cron | 3 | Must | M | Backlog |
| UD-21 | One-tap reminder | 3 | Must | S | Backlog |
| UD-22 | Phase 3 gate | 3 | Must | S | Backlog |
| UD-23 | Trust Meter | 4 | Must | M | Backlog |
| UD-24 | Overdue list | 4 | Must | M | Backlog |
| UD-25 | Phase 4 gate | 4 | Must | S | Backlog |
| UD-26 | End-to-end script and pilot | 5 | Must | M | Backlog |
| UD-27 | Nightly ledger consistency check | 5 | Should | S | Backlog |
| UD-28 | Landing page with App Demo button | 6 | Must | M | Backlog |
| UD-29 | Offline entry and sync | V2 | Could | L | Parking lot |
| UD-30 | Import customer from phone contacts | V2 | Could | S | Parking lot |
| UD-31 | Automatic WhatsApp messages via Business API | V2 | Could | L | Parking lot |
| UD-32 | Automatic reminders on and after due date | V2 | Could | S | Parking lot |
| UD-33 | Customer acknowledges an entry | V2 | Could | S | Parking lot |

## Parking lot

### UD-29 · Offline entry and sync
- Phase: V2
- Priority: Could
- Size: L
- Status: Parking lot
- Dependencies: UD-08, UD-09
- User story: As a merchant with patchy internet, I want to record udhaar offline so I never lose an entry.

**Acceptance criteria**
- Entries saved offline show a pending sync mark
- Entries sync once with no duplicates when back online

**Tech requirements**
- Local store plus a sync queue with idempotency keys per entry

### UD-30 · Import customer from phone contacts
- Phase: V2
- Priority: Could
- Size: S
- Status: Parking lot
- Dependencies: UD-07
- User story: As a merchant, I want to pick a customer from my contacts so I type less.

**Acceptance criteria**
- Name and phone fill in from the chosen contact
- Duplicate phone numbers are caught

**Tech requirements**
- Contact Picker API where supported, manual entry as fallback

### UD-31 · Automatic WhatsApp messages via Business API
- Phase: V2
- Priority: Could
- Size: L
- Status: Parking lot
- Dependencies: UD-14
- User story: As a merchant, I want WhatsApp updates sent without tapping anything.

**Acceptance criteria**
- Messages send automatically after entries and payments
- Approved templates in English and Hindi

**Tech requirements**
- Meta WhatsApp Business setup, template approval, delivery webhooks

### UD-32 · Automatic reminders on and after due date
- Phase: V2
- Priority: Could
- Size: S
- Status: Parking lot
- Dependencies: UD-20
- User story: As a merchant, I want late customers reminded on and after the due date without me asking.

**Acceptance criteria**
- Reminders on the due date and after it
- Add only if the pilot shows the day-before reminder is not enough

**Tech requirements**
- Extra rules in the UD-20 cron

### UD-33 · Customer acknowledges an entry
- Phase: V2
- Priority: Could
- Size: S
- Status: Parking lot
- Dependencies: UD-16
- User story: As a merchant, I want the customer to confirm an entry so there is no dispute later.

**Acceptance criteria**
- Statement page has a confirm button
- Merchant sees confirmed or not confirmed on the entry

**Tech requirements**
- Confirm action on the statement page writes to the entry

## Backlog

### UD-13 · Customer pay link
- Phase: 2
- Priority: Must
- Size: M
- Status: Backlog
- Dependencies: UD-04, UD-09
- User story: As a customer, I want one link to pay what I owe so paying back takes one tap.

**Acceptance criteria**
- One active link per customer for the current balance
- Partial payment is allowed
- When the balance changes, the old link is cancelled and a new one is created
- Link amount always equals the current balance

**Tech requirements**
- Razorpay Payment Links API: create with `accept_partial`, cancel on balance change
- Store link ID and short URL on the customer

### UD-14 · WhatsApp share button
- Phase: 2
- Priority: Must
- Size: S
- Status: Backlog
- Dependencies: UD-13, UD-16
- User story: As a merchant, I want to send the customer an update from my own WhatsApp with the message already written.

**Acceptance criteria**
- Shown after every new entry and every payment
- Opens the merchant's WhatsApp chat with the customer, message prefilled
- Message has amount, new balance, due date, pay link and statement link
- Message language matches the customer's language setting

**Tech requirements**
- Deep link `https://wa.me/<phone>?text=<encoded message>`
- Message templates stored in the English and Hindi string files

### UD-15 · SMS through Razorpay payment link
- Phase: 2
- Priority: Must
- Size: S
- Status: Backlog
- Dependencies: UD-13
- User story: As a merchant, I want the customer to get an SMS with the pay link even if I skip WhatsApp.

**Acceptance criteria**
- Customer gets an SMS with the pay link when a new link is created
- Entry shows that SMS was sent

**Tech requirements**
- Payment link created with SMS notify on
- Resend via `POST /v1/payment_links/{id}/notify_by/sms`

### UD-16 · Customer statement page
- Phase: 2
- Priority: Must
- Size: M
- Status: Backlog
- Dependencies: UD-03, UD-13
- User story: As a customer, I want to see what I owe and what I have paid without installing an app.

**Acceptance criteria**
- Opens on a phone with no login
- Shows open entries, payments, balance and the pay link
- Matches the merchant's ledger to the rupee
- Changed or guessed tokens return not found

**Tech requirements**
- Public route `/s/<token>` with a random token per customer
- Read-only, no listing of other customers

### UD-17 · Phase 2 gate
- Phase: 2
- Priority: Must
- Size: S
- Status: Backlog
- Dependencies: UD-13, UD-14, UD-15, UD-16

**Acceptance criteria**
- WhatsApp prefill is correct in English and Hindi
- SMS with the pay link arrives on a test number
- Pay link amount equals balance after a cash payment
- Statement page matches the ledger for all seed customers

### UD-18 · Pay link auto-clear
- Phase: 3
- Priority: Must
- Size: M
- Status: Backlog
- Dependencies: UD-04, UD-09, UD-13
- User story: As a merchant, I want udhaar to clear on its own when the customer pays online.

**Acceptance criteria**
- Full payment clears entries within 30 seconds and updates home totals
- Part payment clears oldest first and the rest stays due
- The same webhook sent twice records the payment once
- Failed or cancelled payments clear nothing

**Tech requirements**
- Handle `payment_link.paid` and `payment_link.partially_paid` webhooks
- Idempotency on Razorpay payment ID
- Supabase Realtime broadcast of the payment event to the sandbox, polling as fallback

### UD-19 · Shared QR match
- Phase: 3
- Priority: Should
- Size: L
- Status: Backlog
- Dependencies: UD-09, UD-18
- User story: As a merchant, I want payments on my shop QR matched to the right customer so I do not track them by hand.

**Acceptance criteria**
- Known payer shows "Clear ₹X for [name]?" and one tap clears it
- Unknown payer lets the merchant pick a customer or mark it as a sale
- A UPI ID linked to two customers is a weak match and the merchant chooses
- Nothing clears without the merchant's tap

**Tech requirements**
- Handle `qr_code.credited` webhook
- Match on payer VPA stored from past payments

### UD-20 · Day-before reminder cron
- Phase: 3
- Priority: Must
- Size: M
- Status: Backlog
- Dependencies: UD-13, UD-15
- User story: As a merchant, I want customers reminded the day before their due date without me asking.

**Acceptance criteria**
- Runs daily at 10:00 IST
- Sends one SMS per customer with entries due tomorrow
- Skips customers whose dues are already cleared
- Sends at most one day-before SMS per customer per day
- Every reminder is logged on the customer

**Tech requirements**
- Vercel cron at `30 4 * * *` UTC calling a protected API route
- Triggers Razorpay `notify_by/sms` on the customer's pay link

### UD-21 · One-tap reminder
- Phase: 3
- Priority: Must
- Size: S
- Status: Backlog
- Dependencies: UD-14, UD-15
- User story: As a merchant, I want to remind a customer with one tap without an awkward conversation.

**Acceptance criteria**
- Remind button on the entry and customer screens
- Opens WhatsApp with a prefilled reminder, or resends the Razorpay SMS
- No limit on how often the merchant can remind
- Hidden once dues reach zero

**Tech requirements**
- Reuses UD-14 deep link and UD-15 resend
- Every reminder logged in the Reminder table

### UD-22 · Phase 3 gate
- Phase: 3
- Priority: Must
- Size: S
- Status: Backlog
- Dependencies: UD-18, UD-19, UD-20, UD-21

**Acceptance criteria**
- Duplicate webhooks never double clear
- Cron run with a simulated date sends only the right reminders
- Cron and manual reminders are both logged on the customer
- Reminder text is correct in English and Hindi

### UD-23 · Trust Meter
- Phase: 4
- Priority: Must
- Size: M
- Status: Backlog
- Dependencies: UD-09, UD-08
- User story: As a merchant, I want to see how a customer usually pays before I give more credit.

**Acceptance criteria**
- Shows habit label, average days to pay, on-time rate, current due and oldest unpaid days
- Shows on the record udhaar screen before saving
- Shows "Not enough history" until 3 entries are cleared
- Labels: 80% or more on time is usually on time, 50 to 79% is sometimes late, under 50% is often late (confirmed)
- An entry cleared by several part payments uses its final clearing date

**Tech requirements**
- Computed from Allocation records
- Returned by a customer summary endpoint

### UD-24 · Overdue list
- Phase: 4
- Priority: Must
- Size: M
- Status: Backlog
- Dependencies: UD-11, UD-21
- User story: As a merchant, I want one list of everyone who is late so I can chase them quickly.

**Acceptance criteria**
- Lists customers with dues past the due date
- Sorts by amount or days late
- One-tap reminder from each row
- Opens from "remaining" on the home screen and totals agree

**Tech requirements**
- Overdue query endpoint with sort parameter

### UD-25 · Phase 4 gate
- Phase: 4
- Priority: Must
- Size: S
- Status: Backlog
- Dependencies: UD-23, UD-24

**Acceptance criteria**
- Seed customers at 90%, 60% and 30% on time show the three labels
- Meter figures match a spreadsheet for every seed customer
- Customers leave the overdue list the moment dues reach zero

### UD-26 · End-to-end script and pilot
- Phase: 5
- Priority: Must
- Size: M
- Status: Backlog
- Dependencies: UD-22, UD-25
- User story: As the team, we want proof the whole journey works before real merchants use it.

**Acceptance criteria**
- Script passes 3 times in a row in English and Hindi
- Script covers entry, WhatsApp share, SMS, reminder, part pay by link, QR match, cash and overpayment
- Works on a 2 GB RAM Android phone on slow 3G
- 5 merchants finish the script unaided and every issue is logged

**Tech requirements**
- Written test script in the repo
- Razorpay test mode for all payments

### UD-27 · Nightly ledger consistency check
- Phase: 5
- Priority: Should
- Size: S
- Status: Backlog
- Dependencies: UD-09, UD-18
- User story: As the team, we want to catch any ledger error before a merchant sees it.

**Acceptance criteria**
- Home totals equal the sum of the ledger for every merchant
- Payments missing from our ledger but present in Razorpay are flagged

**Tech requirements**
- Vercel cron calling a check route
- Compare against Razorpay payments list API

### UD-28 · Landing page with App Demo button
- Phase: 6
- Priority: Must
- Size: M
- Status: Backlog
- Dependencies: UD-26
- User story: As a visitor, I want to understand the problem in seconds and try the app in one tap.

**Acceptance criteria**
- One page that explains in simple words that udhaar is hard to track and awkward to collect
- Shows how the app fixes it in a few short steps
- App Demo button visible at the top without scrolling on phone and desktop
- Button opens the working app on the home summary with demo data and no login
- Same English and Hindi toggle in the header
- Loads in under 2 seconds on a mid-range phone over 4G

**Tech requirements**
- Static route `/`, app at `/app`
- App Demo opens a fresh Ramesh Kirana sandbox from UD-34

## Ready

### UD-03 · Data model and database
- Phase: 0
- Priority: Must
- Size: M
- Status: Ready
- Dependencies: none
- User story: As the team, we want one clean data model so every feature reads the same numbers.

**Acceptance criteria**
- Tables exist for Customer, CreditEntry, Payment, Allocation and Reminder
- CreditEntry has amount, due date, status and remaining
- Payment has source: link, QR or cash

**Tech requirements**
- Supabase Postgres in the Mumbai region
- All access from route handlers under app/api with the service role key
- Every row carries a sandbox ID
- Amounts stored in paise as integers

### UD-04 · Razorpay test mode and webhook endpoint
- Phase: 0
- Priority: Must
- Size: M
- Status: Ready
- Dependencies: UD-03
- User story: As the team, we want Razorpay connected in test mode so payment features can be built safely.

**Acceptance criteria**
- A test payment link can be created on the build deployment
- Test webhooks reach the endpoint and signatures are verified
- A tampered signature is rejected
- The Razorpay secret and Supabase service role key never reach the browser

**Tech requirements**
- Official razorpay Node SDK, server side only
- Test keys set as environment variables on the build deployment
- Webhook route handler under app/api with signature check

### UD-05 · Demo seed data
- Phase: 0
- Priority: Must
- Size: S
- Status: Ready
- Dependencies: UD-03
- User story: As the team, we want repeatable demo data so every test starts from the same state.

**Acceptance criteria**
- 5 demo customers with mixed paid and unpaid history
- Includes customers built to land at 90%, 60% and 30% on time
- Loads, resets and reloads cleanly

**Tech requirements**
- Seed script runnable from the command line
- Same seed data is cloned into each new sandbox by UD-34

### UD-34 · Demo merchant and session sandbox
- Phase: 0
- Priority: Must
- Size: M
- Status: Ready
- Dependencies: UD-03, UD-05
- User story: As a visitor, I want my own private copy of Ramesh Kirana's shop so I can try everything without seeing anyone else's data.

**Acceptance criteria**
- No sign-up or login screen anywhere
- Merchant name shows as Ramesh Kirana
- A new visitor session gets its own sandbox with fresh seed data
- Two browsers never see each other's changes
- Reset demo in the header menu wipes the sandbox and reloads fresh seed data in one tap
- Razorpay webhooks update only the sandbox that created the link or QR
- Sandbox lasts until the browser is closed. Reopening starts a fresh sandbox

**Tech requirements**
- Session ID in an HTTP-only session cookie (no expiry set) mapped to a sandbox ID
- Vercel Cron removes sandboxes with no activity for 24 hours (proposed)
- Sandbox ID stored in Razorpay link and QR notes to route webhooks

### UD-06 · Phase 0 gate
- Phase: 0
- Priority: Must
- Size: S
- Status: Ready
- Dependencies: UD-01, UD-02, UD-03, UD-04, UD-05, UD-34, UD-35

**Acceptance criteria**
- Language toggle checks pass on every screen
- Razorpay test link and webhook checks pass
- Seed data reset works
- Two browser sessions show separate sandboxes

### UD-07 · Add customer manually
- Phase: 1
- Priority: Must
- Size: S
- Status: Ready
- Dependencies: UD-03
- User story: As a merchant, I want to add a customer by typing a name and phone number.

**Acceptance criteria**
- Name and 10 digit Indian mobile number required
- Duplicate phone numbers are caught
- Customer language defaults to the app language and can be changed

**Tech requirements**
- Create customer endpoint with phone validation

### UD-08 · Record udhaar
- Phase: 1
- Priority: Must
- Size: M
- Status: Ready
- Dependencies: UD-07
- User story: As a merchant, I want to record credit in about 10 seconds while the customer is still at the counter.

**Acceptance criteria**
- Pick an existing customer or add a new one
- Amount rejects 0, negative and non-numeric input and accepts paise
- Due date defaults to today plus 7 days and can be edited
- Past due dates are blocked
- 5 first-time testers each record an entry in 10 seconds or less

**Tech requirements**
- Create entry endpoint
- Customer search by name or phone

### UD-09 · Oldest-first clearing engine
- Phase: 1
- Priority: Must
- Size: M
- Status: Ready
- Dependencies: UD-03
- User story: As a merchant, I want every payment applied to the oldest dues first without me doing anything.

**Acceptance criteria**
- Entries ₹500, ₹300, ₹200 and a ₹600 payment leave the first cleared, the second at ₹200 and the third untouched
- Paying the exact total clears everything
- Overpayment is held as advance and applied to the next new entry
- Two payments at the same moment never allocate the same rupee twice
- Deleting or correcting a payment re-runs allocation correctly

**Tech requirements**
- One allocation function used by cash, pay link and QR
- Runs inside a database transaction
- Unit tests for every case above

### UD-10 · Cash received
- Phase: 1
- Priority: Must
- Size: S
- Status: Ready
- Dependencies: UD-09
- User story: As a merchant, I want to clear udhaar with one tap when the customer pays cash.

**Acceptance criteria**
- One tap records a full or part cash payment
- Part payment leaves the entry open with the new balance
- Extra amount shows as advance credit

**Tech requirements**
- Record payment endpoint with source cash, calls UD-09

### UD-11 · Home summary
- Phase: 1
- Priority: Must
- Size: S
- Status: Ready
- Dependencies: UD-08, UD-09
- User story: As a merchant, I want to see at a glance how much I gave, collected and still need to collect.

**Acceptance criteria**
- Shows udhaar given this month and collected this month
- Shows total remaining and the number of customers who owe
- Customer count counts customers, not entries
- Tapping remaining opens the overdue list (placeholder until UD-24)
- Totals match a hand calculation on seed data, including across a month boundary

**Tech requirements**
- Summary endpoint with month boundaries in IST

### UD-12 · Phase 1 gate
- Phase: 1
- Priority: Must
- Size: S
- Status: Ready
- Dependencies: UD-07, UD-08, UD-09, UD-10, UD-11

**Acceptance criteria**
- All clearing unit tests pass
- All Phase 1 screens pass in English and Hindi
- Home totals match the ledger on seed data

## In progress

No tickets yet.

## Test

### UD-35 · Razorpay look and feel
- Phase: 0
- Priority: Must
- Size: M
- Status: Test
- Dependencies: UD-01
- User story: As a merchant, I want Udhaar Suite to look and feel like the Razorpay app I already use.

**Acceptance criteria**
- Colours, fonts, corner radius, spacing, shadows and motion follow Razorpay's Blade design system
- Header, bottom navigation, cards and buttons match Razorpay app patterns
- Hindi text renders cleanly next to Blade fonts
- Screens still pass the 360 px checks from UD-01

**Tech requirements**
- Blade tokens (MIT licensed) mapped into the Tailwind theme
- Blade fonts: TASA Orbiter for headings, Inter for text
- Razorpay logo mark and icons taken from Blade
- Layout follows the user's Razorpay dashboard screenshots in images/
- Notes: colours, fonts, radius, shadows, logo, header, cards and nav done. 25 of 25 checks pass in `npm run test:e2e`. Hindi rendering check passes (Noto Sans Devanagari). Waiting on user review

### UD-02 · English and Hindi toggle
- Phase: 0
- Priority: Must
- Size: M
- Status: Test
- Dependencies: UD-01
- User story: As a merchant, I want to switch between English and Hindi with one tap.

**Acceptance criteria**
- EN | हिं toggle always visible in the header
- Every visible string switches in one tap with no reload
- Choice persists after closing and reopening
- No missing keys or clipped Hindi text at 360 px

**Tech requirements**
- English and Hindi string files
- Language saved on the device
- Notes: first visit opens in English. Choice is saved in a cookie for 1 year. 17 of 17 checks pass in `npm run test:e2e`. Waiting on the user's review of the Hindi strings in lib/i18n/dictionaries.ts

## Done

### UD-01 · App shell and navigation
- Phase: 0
- Priority: Must
- Size: M
- Status: Done
- Dependencies: none
- User story: As a merchant, I want a simple app with clear sections so I can find things fast.

**Acceptance criteria**
- Top header and bottom navigation with Home, Customers and Overdue
- Header menu holds Reset demo (wired up in UD-34)
- Works at 360 px width with no horizontal scroll

**Tech requirements**
- Next.js App Router with TypeScript and Tailwind
- PWA with Serwist (manifest, icons, service worker). Install is optional
- One Vercel project
- Routes for home, customers, customer detail and overdue
- Notes: all acceptance checks pass in `npm run test:e2e` (headless Chrome at 360 px). Vercel deploy is checked with UD-04
