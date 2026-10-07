# Udhaar Suite Kanban Board

Source: udhaar-suite-build-roadmap.md, with these changes applied.

- Offline entry and sync moved to V2 (Parking lot)
- No Meta or WhatsApp Business setup. The WhatsApp button opens the merchant's own WhatsApp with the message prefilled
- SMS goes out through Razorpay's existing payment link SMS
- Customers are added by manual entry in the MVP. Contact import moved to V2
- Day-before reminders run on a Vercel daily cron (decision below)
- No limit on reminders. The merchant decides how often to remind
- No sign-up or login. One hardcoded demo merchant, Ramesh Kirana, with one shared demo for all visitors (Reset demo resets it for everyone)
- Stack: Next.js App Router, TypeScript, Tailwind, Serwist PWA, route handlers under app/api, Supabase Postgres (Mumbai) with server-only service role access, Supabase Realtime broadcast with polling fallback, official razorpay Node SDK, one Vercel project with Vercel Cron

**Reminder decision: Vercel daily cron.** Razorpay's built-in link reminders follow the link's own expiry settings, not our per-entry due dates. One link covers a customer's whole balance, so it can span entries with different due dates. A daily cron at 10:00 IST finds entries due tomorrow and triggers the Razorpay payment link SMS for each customer. Timing is "the day before the due date" rather than exactly 24 hours.

## Board overview

| ID | Title | Phase | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- |
| UD-01 | App shell and navigation | 0 | Must | M | Done |
| UD-02 | English and Hindi toggle | 0 | Must | M | Done |
| UD-03 | Data model and database | 0 | Must | M | Done |
| UD-04 | Razorpay test mode and webhook endpoint | 0 | Must | M | Done |
| UD-05 | Demo seed data | 0 | Must | S | Done |
| UD-34 | Demo merchant and shared demo data | 0 | Must | M | Done |
| UD-35 | Razorpay look and feel | 0 | Must | M | Done |
| UD-06 | Phase 0 gate | 0 | Must | S | Done |
| UD-07 | Add customer manually | 1 | Must | S | Done |
| UD-08 | Record udhaar | 1 | Must | M | Test |
| UD-09 | Oldest-first clearing engine | 1 | Must | M | Done |
| UD-10 | Cash received | 1 | Must | S | Done |
| UD-11 | Home summary | 1 | Must | S | Done |
| UD-12 | Phase 1 gate | 1 | Must | S | Test |
| UD-13 | Customer pay link | 2 | Must | M | Done |
| UD-14 | WhatsApp share button | 2 | Must | S | Done |
| UD-15 | SMS through Razorpay payment link | 2 | Must | S | Done |
| UD-16 | Customer statement page | 2 | Must | M | Done |
| UD-17 | Phase 2 gate | 2 | Must | S | Done |
| UD-18 | Pay link auto-clear | 3 | Must | M | Done |
| UD-19 | Shared QR match | 3 | Should | L | Done |
| UD-20 | Day-before reminder cron | 3 | Must | M | Done |
| UD-21 | One-tap reminder | 3 | Must | S | Done |
| UD-22 | Phase 3 gate | 3 | Must | S | Done |
| UD-23 | Trust Meter | 4 | Must | M | Done |
| UD-24 | Overdue list | 4 | Must | M | Done |
| UD-25 | Phase 4 gate | 4 | Must | S | Done |
| UD-26 | End-to-end script and pilot | 5 | Must | M | Test |
| UD-27 | Nightly ledger consistency check | 5 | Should | S | Done |
| UD-28 | Landing page with App Demo button | 6 | Must | M | Done |
| UD-36 | Interactive landing page in the razorpay.com style | 6 | Should | M | Done |
| UD-37 | Landing page trim and side by side khata comparison | 6 | Should | S | Done |
| UD-38 | Landing page rebuilt in the RazorpayX style with animated demos | 6 | Should | M | Done |
| UD-39 | Landing story: problem, market numbers, merchant stories, scroll transitions | 6 | Should | M | Done |
| UD-40 | Bug: Send SMS tap does not reach the customer | 2 | Must | S | Test |
| UD-41 | Demo seed shows activity in the current month | 1 | Should | S | Done |
| UD-42 | Welcome sheet on first demo visit | 6 | Should | S | Done |
| UD-43 | Hide Shop QR for now | 3 | Should | S | Done |
| UD-44 | Header menu opens from the RK avatar | 0 | Could | S | Done |
| UD-45 | Landing trims and phone hero fix | 6 | Should | S | Done |
| UD-46 | Home period picker and fuller this month demo data | 1 | Should | M | Done |
| UD-47 | Dues page replaces Overdue | 4 | Should | M | Done |
| UD-48 | Automatic SMS to demo customers for new udhaar | 2 | Should | S | Test |
| UD-49 | One tap reminders: bulk SMS to overdue customers | 4 | Should | M | Test |
| UD-50 | Last reminder on Dues rows | 4 | Could | S | Done |
| UD-51 | Dues rows: no phone, WhatsApp and SMS icon buttons | 4 | Should | S | Done |
| UD-52 | Fewer numbers on home | 1 | Could | S | Done |
| UD-53 | Calmer Dues list and floating button spacing | 4 | Should | S | Done |
| UD-54 | Compact Dues header with the total in the title | 4 | Could | S | Done |
| UD-55 | Two line Dues rows of equal height | 4 | Could | S | Done |
| UD-56 | Landing hero acts out the journey on a phone, OkCredit style | 6 | Should | M | Done |
| UD-57 | Shop segments with real photos on the landing page | 6 | Should | S | Done |
| UD-58 | Offline mode and auto sync for low network areas | V2 | Should | L | Test |
| UD-59 | Landing polish: centred hero on phones, simpler tool cards, centred dots, no all caps labels | 6 | Could | S | Test |
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

No tickets yet.

## Ready

No tickets yet.

## In progress

No tickets yet.

## Test

### UD-59 · Landing polish: centred hero on phones, simpler tool cards, centred dots, no all caps labels
- Phase: 6
- Priority: Could
- Size: S
- Status: Test
- Dependencies: UD-56, UD-58
- User story: As a visitor, I want a calmer landing page with less repetition.

**Acceptance criteria**
- Hero text and App Demo are centred on phones, left aligned on desktop
- Tool cards show only a title, one line and the demo, no Try it button and no ticks. The offline card is called Low network support
- Merchant story dots are centred between the arrows
- No all caps labels: section eyebrows removed, hero line and payment strip label in normal case

- Notes: built locally with UD-58, not deployed. Removed 24 unused strings. 26 landing checks pass locally. Waiting for the user's go ahead to deploy together with UD-58

### UD-58 · Offline mode and auto sync for low network areas
- Phase: V2 (first slice of UD-29)
- Priority: Should
- Size: L
- Status: Test
- Dependencies: UD-08, UD-10, UD-04
- User story: As a merchant in a low network area, I want to keep recording udhaar and cash, and have it sync by itself when the network comes back.

**Acceptance criteria**
- Home, Customers, Dues and customer screens open offline from the last copy on the phone
- Give udhaar and Cash received for existing customers save on the phone at once when offline or when the network fails, and show as waiting to sync
- A strip shows Offline and how many changes are waiting, with Sync now
- Changes sync automatically when the network is back, in order, never twice, and the pay link and SMS go out once per customer after sync
- Adding a new customer offline says it needs network
- Landing tools section describes working on low network
- English and Hindi. Local only, not deployed until the user says so
- Notes: built and tested locally, not deployed. Migration 1000 (sync_ops log and apply_sync_op, applied to Supabase because local and production share it, additive and unused by production) keeps each change at most once with the phone's own time. /api/sync takes up to 50 queued changes, rejects bad ones and changes for customers gone after a reset, then refreshes the pay link and SMS once per customer. lib/offline/outbox.ts is the IndexedDB queue. OfflineSync in the header shows the strip, syncs on reconnect, on return to the app and with backoff, and keeps the main screens cached. The service worker serves app screens from cache when the network does not answer in 4 seconds. Give udhaar and Cash received queue when offline or when the request fails. An offline udhaar shows its confirmation on the form with Open customer. 18 offline checks, 43 app checks, 42 unit and database tests and 26 landing checks pass locally. Landing tools section has a fifth card, Works on low network. Waiting for the user's go ahead to deploy

### UD-49 · One tap reminders: bulk SMS to overdue customers
- Phase: 4
- Priority: Should
- Size: M
- Status: Test
- Dependencies: UD-47, UD-40
- User story: As a merchant, I want to remind all my overdue customers by SMS in one go, instead of one by one.

**Acceptance criteria**
- Floating One tap reminders button on Dues, shown only when someone is overdue
- Tapping opens a sheet listing overdue customers with checkboxes, all ticked, with amount and days late
- Send SMS to N sends the Razorpay pay link SMS to each ticked customer, then shows who was sent and who failed
- Customers already sent an SMS today are treated like everyone else
- English and Hindi, works at 360 px, test runs send no SMS
- Notes: bulkSmsAction in share-actions.ts sends the manual pay link SMS to up to 50 customers, 3 at a time, and returns a result per customer. components/one-tap-reminders.tsx is the floating pill and the review sheet with Select all, Send SMS to N, and a Sent to N or Couldn't send to summary. Dues gets extra bottom space so the pill never covers the last Remind. Test runs with ud-sms-off report sent without texting. 11 bulk checks pass on production with 0 SMS sent, 43 app checks pass. Waiting for the user to send one real batch and confirm the SMS arrive

### UD-48 · Automatic SMS to demo customers for new udhaar
- Phase: 2
- Priority: Should
- Size: S
- Status: Test
- Dependencies: UD-15, UD-40
- User story: As a merchant trying the demo, when I record new udhaar for a demo customer, I want them to get the SMS just like a real customer.

**Acceptance criteria**
- New udhaar for a demo customer sends the Razorpay pay link SMS automatically
- Seeded credit records never send an SMS, on reset or when screens open
- Cash received, deleted payments and online payments still send no automatic SMS to demo customers
- Automated test runs send no SMS

- Notes: new SmsMode udhaar used only by Give udhaar. Test runs set the ud-sms-off cookie (the journey does this unless --with-sms). Verified: journey recorded udhaar for a demo customer with no SMS, and after Reset demo on production plus opening every customer there were 0 SMS rows. Customer screen note now says SMS goes out automatically for new udhaar. Waiting for the user to record one udhaar on a demo customer and confirm the SMS arrives

### UD-40 · Bug: Send SMS tap does not reach the customer
- Phase: 2
- Priority: Must
- Size: S
- Status: Test
- Dependencies: UD-15
- User story: As a merchant, when I tap Send SMS, I want my customer to get the SMS.

**Acceptance criteria**
- Tapping Send SMS delivers a Razorpay SMS with the pay link to the customer's phone
- The day-before reminder uses the same delivery path
- Works for demo customers on a manual tap, still no automatic SMS for them

- Notes: taps were logged and Razorpay's resend endpoint (notify_by) answered success, but no SMS arrived. The SMS confirmed in Phase 2 came from link creation with SMS on. Manual and day-before sends now cancel the old link and create a fresh one with SMS on. Waiting for the user to confirm an SMS arrives after one tap

### UD-08 · Record udhaar
- Phase: 1
- Priority: Must
- Size: M
- Status: Test
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
- Notes: /app/udhaar/new, also opened from a customer with the customer preselected. New customer can be added inline in the same save. Amount keypad gets focus after picking a customer. All checks pass on hosted Supabase. Waiting on the 5 person 10 second timing test (needs real people)

### UD-12 · Phase 1 gate
- Phase: 1
- Priority: Must
- Size: S
- Status: Test
- Dependencies: UD-07, UD-08, UD-09, UD-10, UD-11

**Acceptance criteria**
- All clearing unit tests pass
- All Phase 1 screens pass in English and Hindi
- Home totals match the ledger on seed data

### UD-26 · End-to-end script and pilot
- Phase: 5
- Priority: Must
- Size: M
- Status: Test
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
- Notes: tests/e2e/journey.mjs (`npm run test:journey`). On production (2026-10-01) 3 English and 3 Hindi journeys passed in a row (14 of 14 steps each) plus a Slow 3G and 4x CPU run. Cold Slow 3G: first paint 4.7 s, usable in about 13 s, later screens about 3 s. Fast 4G: 0.9 s. Demo customers by default, so no SMS. --with-sms --sms-to sends real SMS. Link payments use signed webhooks because Razorpay checkout cannot be automated reliably. Waiting on the human pilot in PILOT.md (5 merchants, which also covers the UD-08 10 second check)

## Done

### UD-57 · Shop segments with real photos on the landing page
- Phase: 6
- Priority: Should
- Size: S
- Status: Done
- Dependencies: UD-39
- User story: As a visitor, I want to see the kind of shop I run, so I know Udhaar Suite is for me.

**Acceptance criteria**
- A section before How shops like yours use it, with three photo cards: Kirana stores, Milk and dairy, Wholesale and distribution
- Real photos of Indian shops under a free licence, saved in the app and small
- Each card has the segment name and one line on how udhaar works there, over a dark fade
- Three in a row on desktop, a swipe row on phones. English and Hindi. Page still loads in under 2 seconds on 4G
- Notes: three free Unsplash License photos (kirana storefront by Zoshua Colah, dairy farmer by Satyabratasm, trader among grain sacks by kabir cheema), cropped 4:5 and saved as 62 to 75 KB WebP in public/landing/shops with CREDITS.txt. components/landing/segments.tsx, lazy loaded through next/image, placed before the merchant stories. 26 landing checks pass on production, load 0.92 s on Fast 4G with a 4x CPU slowdown

### UD-56 · Landing hero acts out the journey on a phone, OkCredit style
- Phase: 6
- Priority: Should
- Size: M
- Status: Done
- Dependencies: UD-38, UD-45
- User story: As a visitor, I want the hero to show the whole udhaar journey on a phone in a few seconds, so I get it without scrolling.

**Acceptance criteria**
- Desktop: text on the left, phone on the right. Phone: headline, then phone, then paragraph and App Demo
- The headline is three steps, Record udhaar, Remind in one tap, Get paid on time, and the current step lights up with the phone
- The phone plays one continuous story every few seconds: udhaar recorded on Sunita's screen, WhatsApp reminder, UPI payment, balance cleared
- Step pills under the phone follow along and can be tapped
- The How it works section and the static collage are removed
- English and Hindi, reduced motion stops autoplay, no sideways scroll at 360 px, App Demo visible without scrolling, loads in under 2 seconds on 4G
- Notes: components/landing/hero-story.tsx drives the headline, phone and pills from one timeline of four scenes (about 11 s a loop): udhaar on Sunita's ledger screen, WhatsApp message, UPI pay screen, payment entry with balance ₹0 and Udhaar cleared. Pauses when off screen, never autoplays for reduced motion. Removed the How it works scroll story, the hero collage, unused phone screens and 19 unused strings. Fixed the notch overlapping the ledger header. 26 landing checks on production, 43 app checks and 15 unit tests pass. Production load 0.92 s on Fast 4G with a 4x CPU slowdown

### UD-55 · Two line Dues rows of equal height
- Phase: 4
- Priority: Could
- Size: S
- Status: Done
- Dependencies: UD-54
- User story: As a merchant, I want every Dues row the same height so the list is calm to scan.

**Acceptance criteria**
- Every row is two lines: name with the last reminder hint, then amount with a late badge or a green due date
- The overdue part folds into the badge, for example ₹1,000 · 15 days late
- Full names fit at 360 px. English and Hindi. Local only until the user approves

- Notes: deployed to production on 7 October after the user's review. All rows measure 71 px. English hint is the channel icon plus yesterday, Hindi keeps कल याद दिलाया, and screen readers hear Reminded yesterday (WhatsApp). No text is cut off at 360 or 390 px. 43 app checks and 15 Dues checks pass locally

### UD-54 · Compact Dues header with the total in the title
- Phase: 4
- Priority: Could
- Size: S
- Status: Done
- Dependencies: UD-47, UD-53
- User story: As a merchant, I want the Dues summary to take little space so I see more customers.

**Acceptance criteria**
- The summary card is gone. The title reads Dues with the total next to it, and the customer count on the right
- One row of chips: All with count, and Overdue with count and amount, which toggles the filter
- Sort is a small Amount or Recent menu in the same row
- English and Hindi, works at 360 px. Local only until the user approves
- Notes: deployed to production on 7 October after the user's review. Title reads Dues ₹9,835 · 5 customers on one line. Chips All 5 and Overdue 2 · ₹2,090, sort is a small Amount menu with Amount and Recent. The list now starts 93 px below the title, down from about 230 px, and all 5 customers fit on one iPhone screen. Reminder line is the channel icon (WhatsApp or SMS) with Reminded yesterday, or a bell with Not reminded, so nothing is cut off. 43 app checks, 15 Dues checks and 11 One tap reminder checks pass locally. Waiting for the user's review before deploying

### UD-53 · Calmer Dues list and floating button spacing
- Phase: 4
- Priority: Should
- Size: S
- Status: Done
- Dependencies: UD-49, UD-51
- User story: As a merchant on an iPhone, I want the Dues list to be easy to scan and the reminder button not to sit on the tab bar.

**Acceptance criteria**
- One tap reminders sits clear above the tab bar, including the iPhone home indicator area
- Badges only for overdue. Not yet due shows plain green text Due on 11 Oct
- Rows are compact: whole rupee amounts without .00, overdue part and last reminder on one line, smaller icon buttons

- Notes: floating button bottom is the tab bar height plus the safe area plus 16 px. Amount has a compact option for lists. 5 customers now fit on one iPhone screen. Hindi reads 11 अक्टू॰ को देय. 43 app checks and 15 Dues checks pass on production

### UD-52 · Fewer numbers on home
- Phase: 1
- Priority: Could
- Size: S
- Status: Done
- Dependencies: UD-11
- User story: As a merchant, I want the home screen to show only the key numbers.

**Acceptance criteria**
- Udhaar given no longer says from N entries
- Remaining no longer says from N customers, only N overdue in red

- Notes: removed both lines and their strings. The i18n unit test now checks placeholders on customer.openEntries. 15 unit tests and 43 app checks pass, production verified in English and Hindi

### UD-51 · Dues rows: no phone, WhatsApp and SMS icon buttons
- Phase: 4
- Priority: Should
- Size: S
- Status: Done
- Dependencies: UD-47
- User story: As a merchant, I want a cleaner Dues list and the choice to remind by WhatsApp or SMS from each row.

**Acceptance criteria**
- Dues rows do not show phone numbers. The customer screen still does
- Each row has a WhatsApp icon button and an SMS icon button, no Remind text
- WhatsApp opens my WhatsApp with the reminder written. SMS sends the Razorpay pay link SMS and shows a tick, or a red outline if it failed

- Notes: RemindButton is now two round icon buttons with screen reader labels Remind on WhatsApp and Remind by SMS (Hindi too). SMS uses resendSmsAction, which now skips sending for test runs with ud-sms-off. Fixed the SMS button staying on a spinner by refreshing outside the transition. Test WhatsApp log row removed after checking. 43 app checks pass, production verified

### UD-50 · Last reminder on Dues rows
- Phase: 4
- Priority: Could
- Size: S
- Status: Done
- Dependencies: UD-47, UD-49
- User story: As a merchant, I want to see when I last reminded each customer, so I know whom to chase.

**Acceptance criteria**
- Each Dues row shows Reminded today, yesterday or N days ago, with SMS or WhatsApp
- Overdue customers never reminded show Not reminded yet. Others show nothing extra
- Counts Send SMS, One tap reminders, day-before SMS and WhatsApp Remind. The automatic SMS with a new udhaar does not count
- Only on Dues rows

- Notes: listDues reads reminders with kind manual or day_before. WhatsApp Remind refreshes the page data before opening WhatsApp. Verified with temporary log rows (removed after) and a WhatsApp tap: an older day-before SMS showed and a newer automatic update was ignored. Hindi reads 3 दिन पहले याद दिलाया (SMS). 43 app checks pass

### UD-47 · Dues page replaces Overdue
- Phase: 4
- Priority: Should
- Size: M
- Status: Done
- Dependencies: UD-24, UD-11
- User story: As a merchant, when I tap Remaining, I want to see everyone who still owes me, sort them, and narrow to the overdue ones in one tap.

**Acceptance criteria**
- Bottom tab and page are called Dues (Hindi बकाया) and list every customer with udhaar still to pay
- Top strip shows the total to collect and a tappable overdue chip that turns the Overdue filter on and off
- Filter All or Overdue. Sort by Amount (default) or Recent (newest udhaar first)
- Each row shows amount due, a late or due date badge, and the Remind button
- Home Remaining card opens Dues. Old /app/overdue links open Dues with the Overdue filter on
- Filter and sort live in the URL. English and Hindi, works at 360 px
- Notes: new /app/dues page and lib/data/dues.ts. Strip reads ₹9,835 to collect from 5 customers with a 2 overdue · ₹2,090 chip that toggles ?filter=overdue. Sort Amount or Recent (newest open udhaar first, ties by amount). Rows show total due, a days late or Due date badge, the overdue part when partial, and Remind. /app/overdue redirects to Dues with the filter on. Bottom tab, home Remaining card and landing Dues list tool point here. Hindi uses देर से for overdue so it does not clash with बकाया. 43 app checks and 15 Dues checks pass on production

### UD-46 · Home period picker and fuller this month demo data
- Phase: 1
- Priority: Should
- Size: M
- Status: Done
- Dependencies: UD-11, UD-41
- User story: As a merchant, I want to see udhaar given and collected for this month, last month or any dates I pick.

**Acceptance criteria**
- This month on home is a button that opens This month, Last month and Custom range. This month is the default
- Custom range takes from and to dates, blocks a backwards range and caps the end at today
- The choice stays in the URL, survives a refresh, and This month goes back to the plain home URL
- Demo shows realistic, uneven amounts, about ₹8,000 given and ₹2,000 collected this month, with higher remaining and overdue customers
- Remaining stays all time. English and Hindi, works at 360 px

- Notes: lib/period.ts parses ?period=last and ?from=&to= and falls back to this month. getHomeSummary takes the period. Seed entries marked recent always land in the current month, even on the 1st. On production after Reset demo: this month ₹8,265 given, ₹2,030 collected, ₹9,835 remaining from 5 customers with 2 overdue. Last month ₹10,880 and ₹8,940. 42 unit and database tests, 43 app checks and 9 period checks pass

### UD-45 · Landing trims and phone hero fix
- Phase: 6
- Priority: Should
- Size: S
- Status: Done
- Dependencies: UD-39
- User story: As a visitor on a phone, I want a clean hero and a short market section, so the page reads quickly.

**Acceptance criteria**
- Market shows only 1.3 crore kiranas, 80%+ cash-heavy and ₹30 lakh crore credit gap
- Flow step 3 reads Customers pay from the link
- No disclaimer line under merchant stories
- On phones the hero cards never cover the phone screen

- Notes: removed the 95%, 88% and UPI cards and the three Target cards, with their strings. Market subtitle now says most of it is still tracked on paper. On phones the WhatsApp and payment cards sit in a row under the phone, over its empty bottom edge. Desktop collage unchanged. 27 landing checks pass on production

### UD-44 · Header menu opens from the RK avatar
- Phase: 0
- Priority: Could
- Size: S
- Status: Done
- Dependencies: UD-01
- User story: As a merchant, I want a cleaner header, with my avatar opening the menu.

**Acceptance criteria**
- No three dot button in the header
- Tapping RK opens the menu with Demo guide and Reset demo, and an outside tap closes it

- Notes: RK is now the menu button, labelled Ramesh Kirana: Menu for screen readers, with a ring while open. Shell test checks there is exactly one menu button and it is RK. 43 app checks pass

### UD-43 · Hide Shop QR for now
- Phase: 3
- Priority: Should
- Size: S
- Status: Done
- Dependencies: UD-18, UD-19
- User story: As a merchant, I want a simpler app. If someone pays on my counter QR, I record it myself as cash.

**Acceptance criteria**
- No Shop QR button or QR review banner on home, and /app/qr shows not found
- Landing page has no Shop QR tool tab, flow step 3 says they pay from the link, and no merchant story is about the QR
- Demo payment history shows only cash and pay link payments
- One flag brings it all back

- Notes: SHOP_QR_ENABLED in lib/features.ts is false. QR code, webhook handling, ledger check and QR code paths stay in the code. Seed payment sources are cash and link while the flag is off. Journey step 6 (QR payment) runs only with SHOP_QR=1. Shared demo reset on production, payments now 18 cash and 17 link. 41 unit and database tests, 42 app checks, 25 landing checks and the EN journey pass

### UD-42 · Welcome sheet on first demo visit
- Phase: 6
- Priority: Should
- Size: S
- Status: Done
- Dependencies: UD-28, UD-34
- User story: As a first time visitor, I want to know who I am playing and what is already set up, so I know what to expect inside the demo.

**Acceptance criteria**
- First visit to the app opens a bottom sheet: you are Ramesh, owner of Ramesh Kirana
- It says how many regular customers buy on udhaar, what they owe and how many are late, from live data
- Mini cards for the customers, with one line about each demo customer
- Shows once per browser. Demo guide in the header menu opens it again
- Closes with the button, Escape or a tap outside. English and Hindi, works at 360 px
- Notes: bottom sheet on the home screen for a first visit. Numbers are live from the home summary, so on 1 October it read 5 customers, ₹5,790 owed, 2 late. Customer rows show amount due, an Overdue badge and one line for each seeded customer. Start exploring stays pinned while the list scrolls (See my customers removed at the user's request). Test mode note removed at the user's request. Seen is kept in localStorage. Demo guide in the header menu opens /app?welcome=1. Old e2e tests now act as returning visitors and pick Reset demo by role. 15 sheet checks pass on production, 42 app checks pass

### UD-41 · Demo seed shows activity in the current month
- Phase: 1
- Priority: Should
- Size: S
- Status: Done
- Dependencies: UD-05, UD-11
- User story: As a demo visitor, I want the home screen's This month cards to show real numbers, so the overview makes sense next to what is still due.

**Acceptance criteria**
- Udhaar given and Collected are above zero on the day the demo is reset, including the 1st of a month
- Trust Meter results and overdue customers stay as designed

- Notes: the seed now puts some activity on the seed day. Sunita ₹1,100 and Lakshmi ₹540 udhaar, Arjun pays ₹500 and Gurpreet pays ₹750 part of his overdue entry. Production after Reset demo on 1 October shows ₹1,640 given from 2 entries, ₹1,250 collected, ₹5,790 remaining from 5 customers with 2 overdue. All 41 unit and database tests pass

### UD-39 · Landing story: problem, market numbers, merchant stories, scroll transitions
- Phase: 6
- Priority: Should
- Size: M
- Status: Done
- Dependencies: UD-38
- User story: As a visitor, I want the landing page to show how big the udhaar problem is and how Udhaar Suite digitises it, so I understand the value in one scroll.

**Acceptance criteria**
- Order: hero, problem, market, four step fix, tools, merchant stories, call to action
- Problem section with three visual cards that slide in one by one
- Market section with small graphical number cards that count up. Every market figure has a source line. Our goals are tagged Target. No invented traction
- Merchant stories section, dark, card carousel, clearly labelled as illustrative stories
- Every section enters with a scroll transition: headings fade up, cards stagger, numbers count up. Reduced motion shows everything without motion
- English and Hindi, no sideways scroll at 360 px, App Demo visible without scrolling, loads in under 2 seconds on a mid-range phone over 4G
- Notes: page now reads problem, market, fix, tools, stories, call to action. Hero headline is India runs on udhaar, now it runs on Razorpay. Market cards use Invest India (1.3 crore kiranas, 95% of bills under ₹200, 80%+ cash-heavy, 88% unorganised), NPCI (24.51 bn UPI payments in August 2026) and SIDBI (₹30 lakh crore MSME credit gap), each with a source link. Targets are 1.3 lakh shops at 1% of kiranas, ₹260 crore a month at ₹20,000 a shop, and 10 seconds to record, all tagged Target. Six merchant stories in a dark carousel, labelled illustrative. Headings fade up with a blur, cards stagger, numbers count up, the CTA zooms in. Shops carousel removed, the stories cover shop types. 25 landing checks and 42 app checks pass. Production load 0.93 s on Fast 4G with a 4x CPU slowdown

### UD-38 · Landing page rebuilt in the RazorpayX style with animated demos
- Phase: 6
- Priority: Should
- Size: M
- Status: Done
- Dependencies: UD-37
- User story: As a visitor, I want the landing page to show the flow with motion, the way razorpay.com/x does, so I understand Udhaar Suite in one scroll.

**Acceptance criteria**
- Five sections, each with one job, nothing repeated: hero collage, flow scroll story, tools tabs with stacked cards, shop carousel, closing call to action
- Hero: light background, centred headline, phone with floating cards, pay methods strip
- Flow: phone pinned while the four steps light up on scroll on desktop, swipe carousel with dots on phones
- Tools: sticky tabs for Trust Meter, Overdue, Shop QR, Hindi and English. Each card has a looping animated demo built in code
- Shops: auto carousel with dots and arrows for kirana, medical, tailor and wholesale
- Notebook comparison, How it works stepper, six feature cards and FAQ removed
- English and Hindi, no sideways scroll at 360 px, App Demo visible without scrolling, reduced motion stops all loops
- Loads in under 2 seconds on a mid-range phone over 4G
- Notes: rebuilt after the user pointed at razorpay.com/x. Hero is a light centred headline over the app home screen with floating WhatsApp, payment received, Trust Meter and shop QR cards. Flow pins the phone while four steps light up on scroll, and is a swipe carousel on phones. Tools has sticky tabs and cards that stack on desktop, each with a 6 second looping demo built in CSS, with a cursor tapping Remind, Clear for Sunita and the language toggle. Shops is an auto carousel with arrows and dots. Notebook comparison, stepper, feature cards and the old use case grid are gone. Fixed body overflow from hidden to clip so sticky works across the app. Scissors icon redrawn as filled shapes. 20 landing checks and 42 app checks pass. Production load 0.94 s on Fast 4G with a 4x CPU slowdown

### UD-37 · Landing page trim and side by side khata comparison
- Phase: 6
- Priority: Should
- Size: S
- Status: Done
- Dependencies: UD-36
- User story: As a visitor, I want to see the notebook khata and Udhaar Suite next to each other so the difference is clear at a glance.

**Acceptance criteria**
- Try it section and FAQ section removed, with their header links
- Notebook and Udhaar Suite shown together, side by side, row by row, with no switching
- Two clean pictures, a notebook page and an app screen, with matching numbered markers and a short legend
- Works in English and Hindi at 360 px with no sideways scroll
- Landing still loads in under 2 seconds on a mid-range phone over 4G
- Notes: Try it and FAQ removed, with their header links. Why switch section redesigned after review. A notebook page and an app screen sit side by side with numbered markers 1 to 4 on the same jobs, recording, reminding, collecting and tracking. A legend below gives one cross and one tick line per job. No paper texture or mini widgets. 17 landing checks pass on production. Load 0.9 s on Fast 4G with a 4x CPU slowdown

### UD-36 · Interactive landing page in the razorpay.com style
- Phase: 6
- Priority: Should
- Size: M
- Status: Done
- Dependencies: UD-28
- User story: As a visitor, I want the landing page to show what Udhaar Suite does, the way Razorpay product pages do, so I understand it before opening the demo.

**Acceptance criteria**
- Follows razorpay.com product page patterns: highlighted headline, product visual, scrolling strip, try it widget, stepper, use case cards, illustrated feature cards, FAQ, closing call to action
- An animated phone acts out the journey: record, WhatsApp, pay, udhaar cleared
- A try it widget builds the customer message and statement live from what the visitor types
- English and Hindi, no sideways scroll at 360 px, App Demo visible without scrolling
- Still loads in under 2 seconds on a mid-range phone over 4G, and respects reduced motion
- No invented customer logos, quotes or statistics

**Tech requirements**
- Client components only where interaction is needed. CSS animations, no animation library
- Notes: rebuilt / in the razorpay.com product page style. Dark hero with an animated phone that plays record, WhatsApp, UPI pay and cleared, with tappable captions and pause. Payment method strip, stepper, try it widget that builds the real WhatsApp text and statement in English or Hindi, notebook versus Udhaar Suite toggle, six illustrated feature cards, four use case cards, FAQ and closing call to action. 20 landing checks pass on production. First paint 0.65 s, load 0.9 s on Fast 4G with a 4x CPU slowdown. Reduced motion stops the auto play

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
- Notes: all acceptance checks pass in `npm run test:e2e` (headless Chrome at 360 px), locally and on the Vercel deployment

### UD-03 · Data model and database
- Phase: 0
- Priority: Must
- Size: M
- Status: Done
- Dependencies: none
- User story: As the team, we want one clean data model so every feature reads the same numbers.

**Acceptance criteria**
- Tables exist for Customer, CreditEntry, Payment, Allocation and Reminder
- CreditEntry has amount, due date, status and remaining
- Payment has source: link, QR or cash

**Tech requirements**
- Supabase Postgres in the Mumbai region
- All access from server code only (server components, server actions, route handlers) with the service role key
- Every row carries a sandbox ID
- Amounts stored in paise as integers
- Notes: migrations in supabase/migrations, applied by `npm run db:migrate`. Composite foreign keys block cross sandbox links. RLS on with no policies. A trigger keeps remaining, status and paid_at in step with allocations. 19 DB tests pass on local Postgres 15. Migrated and verified on hosted Supabase (Postgres 17.6) on 2026-09-30

### UD-05 · Demo seed data
- Phase: 0
- Priority: Must
- Size: S
- Status: Done
- Dependencies: UD-03
- User story: As the team, we want repeatable demo data so every test starts from the same state.

**Acceptance criteria**
- 5 demo customers with mixed paid and unpaid history
- Includes customers built to land at 90%, 60% and 30% on time
- Loads, resets and reloads cleanly

**Tech requirements**
- Seed script runnable from the command line
- The same seed data loads the shared demo and every Reset demo (UD-34)
- Notes: seed in lib/seed/demo-seed.ts, dates relative to today in IST. `npm run db:seed` creates, `--reset <id>` reloads, `--count <id>` checks. 7 unit tests prove the oldest first rule and the 90, 60 and 30 percent rates. Verified on hosted Supabase on 2026-09-30

### UD-07 · Add customer manually
- Phase: 1
- Priority: Must
- Size: S
- Status: Done
- Dependencies: UD-03
- User story: As a merchant, I want to add a customer by typing a name and phone number.

**Acceptance criteria**
- Name and 10 digit Indian mobile number required
- Duplicate phone numbers are caught
- Customer language defaults to the app language and can be changed

**Tech requirements**
- Create customer endpoint with phone validation
- Notes: /app/customers/new. Accepts +91, spaces and a leading 0. Duplicate phone shows a friendly error. Verified on hosted Supabase in English and Hindi

### UD-09 · Oldest-first clearing engine
- Phase: 1
- Priority: Must
- Size: M
- Status: Done
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
- Notes: reallocate_customer in migration 300 re-runs clearing for a customer under a row lock. A deadlock between parallel payments was found and fixed by locking before writing. 8 clearing tests pass, 41 of 41 DB and unit tests overall

### UD-10 · Cash received
- Phase: 1
- Priority: Must
- Size: S
- Status: Done
- Dependencies: UD-09
- User story: As a merchant, I want to clear udhaar with one tap when the customer pays cash.

**Acceptance criteria**
- One tap records a full or part cash payment
- Part payment leaves the entry open with the new balance
- Extra amount shows as advance credit

**Tech requirements**
- Record payment endpoint with source cash, calls UD-09
- Notes: Cash received on the customer screen is pre-filled with the full due. Extra shows as an Advance badge and is used by the next entry. Mistaken cash payments can be deleted, and clearing re-runs

### UD-11 · Home summary
- Phase: 1
- Priority: Must
- Size: S
- Status: Done
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
- Notes: home_summary function. Totals matched a hand calculation on hosted Supabase, including a simulated 1 October month boundary. Remaining links to the overdue placeholder

### UD-34 · Demo merchant and shared demo data
- Phase: 0
- Priority: Must
- Size: M
- Status: Done
- Dependencies: UD-03, UD-05
- User story: As a visitor, I want to open Ramesh Kirana's shop straight away and try everything without signing up.

**Acceptance criteria**
- No sign-up or login screen anywhere
- Merchant name shows as Ramesh Kirana
- Everyone shares one demo seeded with the UD-05 data, so no rows are created per visit
- Reset demo in the header menu reloads the seed data for everyone in one tap, and says so

**Tech requirements**
- One fixed sandbox ID for the shared demo. The sandbox_id column stays, so per visitor sandboxes can return later
- The shared demo is created and seeded on first use, checked once per server process
- Notes: changed from a sandbox per browser session on 2026-09-30 (user decision). Cookie, proxy.ts and the cleanup job removed. Migration 400 removed the old per visitor sandboxes on hosted Supabase. Verified two clients see the same data, a change shows for both, and reset restores the seed

### UD-04 · Razorpay test mode and webhook endpoint
- Phase: 0
- Priority: Must
- Size: M
- Status: Done
- Dependencies: UD-03
- User story: As the team, we want Razorpay connected in test mode so payment features can be built safely.

**Acceptance criteria**
- A test payment link can be created on the build deployment
- Test webhooks reach the endpoint and signatures are verified (locally via `npm run webhook:send`, live via Razorpay on Vercel)
- A tampered signature is rejected
- The Razorpay secret and Supabase service role key never reach the browser

**Tech requirements**
- Official razorpay Node SDK, server side only
- Test keys set as environment variables on the build deployment
- Webhook route handler under app/api with signature check
- Notes: `npm run razorpay:check` creates and cancels a Rs 1 test link (passes). POST /api/razorpay/webhook verifies X-Razorpay-Signature with a constant time HMAC check. `npm run webhook:send` sends signed sample events locally (paid, partially paid, QR credited and a bad signature all behave correctly). No ngrok (user decision): real Razorpay webhooks are registered only for the Vercel deployment. Deployed to https://udhaar-suite.vercel.app (Vercel project udhaar-suite, region bom1). Signed webhook to production returns 200 and shows in Vercel logs, a bad signature returns 400. Webhook registered in the Razorpay Dashboard by the user. A Rs 1 test link paid through Razorpay test netbanking delivered real payment.authorized, payment.captured and payment_link.paid webhooks to production, all verified (2026-09-30)

### UD-13 · Customer pay link
- Phase: 2
- Priority: Must
- Size: M
- Status: Done
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
- Notes: lib/razorpay/pay-links.ts syncPayLink runs after every udhaar, cash payment and deleted payment. Old link cancelled, new link for the full balance with partial payment on. Race safe (a losing link is cancelled). Reset demo cancels open links and sends no SMS. Callback goes to the customer's statement on APP_URL (production). Verified with real Razorpay test calls

### UD-14 · WhatsApp share button
- Phase: 2
- Priority: Must
- Size: S
- Status: Done
- Dependencies: UD-13, UD-16
- User story: As a merchant, I want to send the customer an update from my own WhatsApp with the message already written.

**Acceptance criteria**
- Shown after every new entry and every payment
- Opens the merchant's WhatsApp chat with the customer, message prefilled
- Message has amount, new balance, due date and the statement link, which never expires and carries the Pay button (user decision 2026-10-01)
- Message language matches the customer's language setting

**Tech requirements**
- Deep link `https://wa.me/<phone>?text=<encoded message>`
- Message templates stored in the English and Hindi string files
- Notes: messages link only to the statement page, so an older message never shows an expired pay link. Send update card on the customer screen, highlighted after a save. wa.me opens the merchant's WhatsApp with the text in the customer's language (lib/messages.ts). Verified the Hindi text has the change, balance, due date, pay link and statement link, and that WhatsApp sends no SMS

### UD-15 · SMS through Razorpay payment link
- Phase: 2
- Priority: Must
- Size: S
- Status: Done
- Dependencies: UD-13
- User story: As a merchant, I want the customer to get an SMS with the pay link even if I skip WhatsApp.

**Acceptance criteria**
- Customer gets an SMS with the pay link when a new link is created
- Entry shows that SMS was sent

**Tech requirements**
- Payment link created with SMS notify on
- Resend via `POST /v1/payment_links/{id}/notify_by/sms`
- Notes: SMS sent automatically on every balance change (link created with SMS on) plus a Resend SMS button (notify_by). Each SMS logged in reminders. User confirmed the test SMS arrived on 7228070222 (2026-10-01). Seed (demo) customers never get automatic SMS (user decision, migration 600, customers.is_demo). Customers added in the app keep automatic SMS. Manual Send SMS works for everyone

### UD-16 · Customer statement page
- Phase: 2
- Priority: Must
- Size: M
- Status: Done
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
- Notes: /s/<64 hex token>, noindex, customer's language, Pay button for the full balance. Changed or junk tokens return 404. Opening it creates a missing link without SMS. User confirmed paying from the statement returns the customer to it (2026-10-01). The balance itself updates after payment from UD-18

### UD-17 · Phase 2 gate
- Phase: 2
- Priority: Must
- Size: S
- Status: Done
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
- Status: Done
- Dependencies: UD-04, UD-09, UD-13
- User story: As a merchant, I want udhaar to clear on its own when the customer pays online.

**Acceptance criteria**
- Full payment clears entries within 30 seconds and updates home totals
- Part payment clears oldest first and the rest stays due
- The same webhook sent twice records the payment once
- Failed or cancelled payments clear nothing
- Payment status is also synced when a customer screen opens, so a missed webhook is caught and local testing needs no tunnel

**Tech requirements**
- Handle `payment_link.paid` and `payment_link.partially_paid` webhooks
- Idempotency on Razorpay payment ID
- Supabase Realtime broadcast of the payment event to open screens, polling as fallback
- Notes: webhook records payment_link.paid and partially_paid once (idempotent on the Razorpay payment ID), clears oldest first, refreshes the pay link and broadcasts to open screens. Sync on open (customer screen and statement) records captured link payments the webhook missed, which replaced the daily check (user decision). Verified on production 2026-10-01, including duplicate and forged webhooks and a real captured Razorpay payment

### UD-19 · Shared QR match
- Phase: 3
- Priority: Should
- Size: L
- Status: Done
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
- Notes: Shop QR screen at /app/qr with the real Razorpay test QR (multiple use, any amount) and a demo simulate panel that sends the signed qr_code.credited webhook. Strong match (one customer), weak match (shared family UPI, merchant picks) and unknown UPI (pick or mark as sale) all verified on production. Home shows QR payments to review. Reset demo clears QR payments (migration 800)

### UD-20 · Day-before reminder cron
- Phase: 3
- Priority: Must
- Size: M
- Status: Done
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
- Notes: /api/cron/day-before, registered on Vercel at 30 4 * * * UTC (10:00 IST), protected by CRON_SECRET. Demo customers are skipped (no automatic SMS rule), and so is anyone already reminded that day. `?date=` simulates a day. Verified auth, demo skip and dedupe on production without sending SMS

### UD-21 · One-tap reminder
- Phase: 3
- Priority: Must
- Size: S
- Status: Done
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
- Notes: the WhatsApp button reads Remind on WhatsApp when something is due (Send on WhatsApp right after a save). Gentle reminder text in the customer's language, saying so when already overdue, linking to the statement. Verified English and Hindi, logged as manual

### UD-22 · Phase 3 gate
- Phase: 3
- Priority: Must
- Size: S
- Status: Done
- Dependencies: UD-18, UD-19, UD-20, UD-21

**Acceptance criteria**
- Duplicate webhooks never double clear
- Cron run with a simulated date sends only the right reminders
- Cron and manual reminders are both logged on the customer
- Reminder text is correct in English and Hindi

### UD-02 · English and Hindi toggle
- Phase: 0
- Priority: Must
- Size: M
- Status: Done
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
- Notes: first visit opens in English. Choice is saved in a cookie for 1 year. 17 of 17 checks pass in `npm run test:e2e`. User approved after testing through Phase 3 (2026-10-01)

### UD-35 · Razorpay look and feel
- Phase: 0
- Priority: Must
- Size: M
- Status: Done
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
- Notes: colours, fonts, radius, shadows, logo, header, cards and nav done. 25 of 25 checks pass in `npm run test:e2e`. Hindi rendering check passes (Noto Sans Devanagari). User approved after testing through Phase 3 (2026-10-01)

### UD-06 · Phase 0 gate
- Phase: 0
- Priority: Must
- Size: S
- Status: Done
- Dependencies: UD-01, UD-02, UD-03, UD-04, UD-05, UD-34, UD-35

**Acceptance criteria**
- Language toggle checks pass on every screen
- Razorpay test link and webhook checks pass
- Seed data reset works
- The shared demo loads and Reset demo restores it
- Notes: toggle, layout and service worker checks pass on production. Razorpay test link and live webhook pass. Reset demo restores the shared demo. UD-02 and UD-35 approved by the user (2026-10-01)

### UD-23 · Trust Meter
- Phase: 4
- Priority: Must
- Size: M
- Status: Done
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
- Notes: lib/trust.ts (pure). On time = fully paid on or before the due date (IST), using the final payment. Avg days to pay = udhaar given to fully paid. Oldest unpaid = days since the oldest open udhaar was given. Shown on the customer screen and on New udhaar as soon as a customer is picked. All 5 seed customers matched a hand calculation on production (2026-10-01)

### UD-24 · Overdue list
- Phase: 4
- Priority: Must
- Size: M
- Status: Done
- Dependencies: UD-11, UD-21
- User story: As a merchant, I want one list of everyone who is late so I can chase them quickly.

**Acceptance criteria**
- Lists customers with dues past the due date
- Sorts by amount or days late
- One-tap reminder from each row
- Opens from "remaining" on the home screen and totals agree

**Tech requirements**
- Overdue query endpoint with sort parameter
- Notes: /app/overdue?sort=amount or days. Shows overdue amount, days late from the oldest missed due date, total due when larger, and a one-tap WhatsApp reminder per row. Total matches the Home overdue count. Verified sorting, drop off at zero and Hindi at 360 px on production

### UD-25 · Phase 4 gate
- Phase: 4
- Priority: Must
- Size: S
- Status: Done
- Dependencies: UD-23, UD-24

**Acceptance criteria**
- Seed customers at 90%, 60% and 30% on time show the three labels
- Meter figures match a spreadsheet for every seed customer
- Customers leave the overdue list the moment dues reach zero

### UD-27 · Nightly ledger consistency check
- Phase: 5
- Priority: Should
- Size: S
- Status: Done
- Dependencies: UD-09, UD-18
- User story: As the team, we want to catch any ledger error before a merchant sees it.

**Acceptance criteria**
- Home totals equal the sum of the ledger for every merchant
- Payments missing from our ledger but present in Razorpay are flagged

**Tech requirements**
- Vercel cron calling a check route
- Compare against Razorpay payments list API
- Notes: /api/cron/ledger-check at 30 20 * * * UTC (02:00 IST), CRON_SECRET protected. Database rules via ledger_consistency_report (migration 900): entry balances, statuses, over-allocation, oldest first (no advance while entries are open) and home totals. Also flags captured Razorpay payments on our pay links or the shop QR missing from the ledger. Verified it catches a deliberately corrupted allocation, and a real paid Razorpay link missing from the ledger. Clean on production

### UD-28 · Landing page with App Demo button
- Phase: 6
- Priority: Must
- Size: M
- Status: Done
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
- App Demo opens the shared Ramesh Kirana demo from UD-34
- Notes: bilingual landing page at /. App Demo is in the sticky header and the hero, visible without scrolling on phone and desktop. Opens /app with demo data, no login. Production: first paint 0.6 s, load 0.9 s on Fast 4G with a 2x and 4x CPU slowdown
