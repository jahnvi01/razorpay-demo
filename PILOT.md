# Udhaar Suite pilot guide (UD-26)

Goal: 5 merchants complete the core journey on their own phone, unaided. Note every place they hesitate or ask for help.
This guide also covers the UD-08 check: **record an udhaar entry in 10 seconds or less**.

App: https://udhaar-suite.vercel.app (no login). Everyone shares one demo shop, Ramesh Kirana.
Before each session, tap the menu (⋮) and **Reset demo**.

## Before the session

- Use the merchant's own phone (Android preferred). Open the link in Chrome.
- Ask them to pick their language with the **EN | हिं** switch at the top.
- Do not demo anything first. Read each task aloud, then stay quiet.

## Tasks (read aloud one at a time)

| # | Task | Done when | Time it? |
| --- | --- | --- | --- |
| 1 | "Sunita owes you Rs 250 for groceries. Record it." | Udhaar of Rs 250 saved shows | Yes: from tapping **Give udhaar** to the saved screen. Target 10 seconds or less |
| 2 | "Let Sunita know on WhatsApp." | WhatsApp opens with the message ready | |
| 3 | "Farhan paid you Rs 500 in cash. Record it." | Cash of Rs 500 recorded shows | |
| 4 | "Who is late paying you? Remind the person who owes the most." | WhatsApp opens with a reminder | |
| 5 | "Before giving Farhan more udhaar, how does he usually pay?" | They read the Trust Meter (Often late) | |
| 6 | "A customer just paid on your shop QR. Find it and clear it." | Facilitator first taps **Shop QR**, then **Simulate payment** with Sunita's UPI ID. Merchant finds it and taps **Clear for Sunita Sharma** | |
| 7 | "How much udhaar is still to be collected?" | They read Remaining on Home | |

## Record for each merchant

| Merchant | Phone and Android version | Language | Task 1 seconds | Tasks done unaided (of 7) | Where they got stuck | Quote |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

## Pass criteria

- All 5 merchants finish tasks 1 to 7 without help (UD-26).
- All 5 record task 1 in 10 seconds or less (UD-08).
- Every issue found is logged on BOARD.md (Parking lot or Backlog) and fixed or consciously deferred.

## Automated companion

The same journey runs automatically, including a run on an emulated Slow 3G phone:

```bash
npm run test:journey -- --base https://udhaar-suite.vercel.app --slow
```
