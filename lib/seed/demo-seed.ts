// UD-05 Demo seed for Ramesh Kirana. Every new sandbox starts from this (UD-34).
//
// Histories are defined relative to "today" in IST so the demo always looks current.
// Payments follow the oldest-first rule (UD-08 / UD-09): a customer's payments are applied
// to their oldest open entry first, so only the newest entries are ever still open.
//
// Designed on-time rates (entries cleared on or before their due date / cleared entries):
//   Sunita Sharma   9 of 10  = 90%  usually on time
//   Arjun Mehta     3 of 5   = 60%  sometimes late
//   Farhan Qureshi  3 of 10  = 30%  often late, two open entries past due
//   Lakshmi Iyer    2 of 2          not enough history (fewer than 3 cleared)
//   Gurpreet Singh  4 of 4  = 100%  one entry cleared in two part payments, one open entry past due
//
// This month (UD-46): entries marked `recent` always land in the current month, even on the 1st,
// so the home screen shows ₹8,265 given and ₹2,030 collected this month, while older
// overdue udhaar from last month keeps Remaining higher.

import { addDays, atIST, todayIST, type IsoDate } from "../dates.ts";
import { SHOP_QR_ENABLED } from "../features.ts";

export type PaymentSource = "cash" | "link" | "qr";

export type SeedPayment = {
  amount_paise: number;
  source: PaymentSource;
  received_at: string;
  /** UPI ID for link and QR payments, so shop QR payments can be recognised (UD-19). */
  payer_vpa?: string;
  allocations: { entry: number; amount_paise: number }[];
};

export type SeedEntry = { amount_paise: number; due_date: IsoDate; created_at: string; note?: string };

export type SeedCustomer = {
  name: string;
  phone: string;
  language: "en" | "hi";
  created_at: string;
  entries: SeedEntry[];
  payments: SeedPayment[];
};

export type Seed = { customers: SeedCustomer[] };

type EntrySpec = {
  rupees: number;
  createdAgo: number; // days before today
  term: number; // days until due
  note?: string;
  /** Paid in full this many days after the due date (negative = early). Omit for open entries. */
  paidAfterDue?: number;
  /** Paid in parts: each part in rupees and days before today. */
  parts?: { rupees: number; ago: number }[];
  /** Keep this entry (and its parts) inside the current month: days ago are capped at the 1st. */
  recent?: boolean;
};

type CustomerSpec = { name: string; phone: string; language: "en" | "hi"; vpa: string; entries: EntrySpec[] };

/** Arjun and Lakshmi each paid once from this shared family UPI, to show an ambiguous QR match. */
export const SHARED_FAMILY_VPA = "iyer.mehta.family@okaxis";

// With Shop QR hidden, past payments in the demo are cash or pay link only.
const SOURCES: PaymentSource[] = SHOP_QR_ENABLED ? ["cash", "link", "qr"] : ["cash", "link"];

const DEMO_CUSTOMERS: CustomerSpec[] = [
  {
    name: "Sunita Sharma",
    vpa: "sunita.sharma@okicici",
    phone: "7228070222",
    language: "hi",
    entries: [
      { rupees: 450, createdAgo: 100, term: 7, paidAfterDue: -2, note: "Monthly ration" },
      { rupees: 1200, createdAgo: 91, term: 7, paidAfterDue: -1 },
      { rupees: 800, createdAgo: 82, term: 7, paidAfterDue: 0 },
      { rupees: 650, createdAgo: 73, term: 7, paidAfterDue: -3 },
      { rupees: 2300, createdAgo: 64, term: 7, paidAfterDue: 4, note: "Festival order" },
      { rupees: 540, createdAgo: 55, term: 7, paidAfterDue: -2 },
      { rupees: 980, createdAgo: 46, term: 7, paidAfterDue: -1 },
      { rupees: 760, createdAgo: 37, term: 7, paidAfterDue: 0 },
      { rupees: 1500, createdAgo: 28, term: 7, paidAfterDue: -1 },
      { rupees: 820, createdAgo: 19, term: 7, paidAfterDue: -2 },
      { rupees: 1485, createdAgo: 2, term: 10, recent: true, note: "Festival shopping" },
      { rupees: 1200, createdAgo: 0, term: 7, recent: true, note: "Monthly ration" },
    ],
  },
  {
    name: "Arjun Mehta",
    vpa: "arjun.mehta@okhdfcbank",
    phone: "8780670895",
    language: "en",
    entries: [
      { rupees: 1250, createdAgo: 80, term: 10, paidAfterDue: 0 },
      { rupees: 600, createdAgo: 65, term: 10, paidAfterDue: 5 },
      { rupees: 2100, createdAgo: 50, term: 10, paidAfterDue: -2 },
      { rupees: 900, createdAgo: 35, term: 10, paidAfterDue: 3 },
      { rupees: 450, createdAgo: 20, term: 10, paidAfterDue: -1 },
      { rupees: 1830, createdAgo: 6, term: 10, recent: true, parts: [{ rupees: 520, ago: 0 }], note: "Rice and oil" },
    ],
  },
  {
    name: "Farhan Qureshi",
    vpa: "farhan.q@ybl",
    phone: "7600821798",
    language: "en",
    entries: [
      { rupees: 700, createdAgo: 120, term: 7, paidAfterDue: 6 },
      { rupees: 350, createdAgo: 110, term: 7, paidAfterDue: 0 },
      { rupees: 1600, createdAgo: 100, term: 7, paidAfterDue: 8 },
      { rupees: 520, createdAgo: 90, term: 7, paidAfterDue: 4 },
      { rupees: 880, createdAgo: 80, term: 7, paidAfterDue: -1 },
      { rupees: 1150, createdAgo: 70, term: 7, paidAfterDue: 5 },
      { rupees: 640, createdAgo: 60, term: 7, paidAfterDue: 9 },
      { rupees: 990, createdAgo: 50, term: 7, paidAfterDue: 3 },
      { rupees: 430, createdAgo: 40, term: 7, paidAfterDue: 0 },
      { rupees: 1250, createdAgo: 30, term: 7, paidAfterDue: 6 },
      { rupees: 1400, createdAgo: 22, term: 7, parts: [{ rupees: 300, ago: 10 }, { rupees: 760, ago: 0 }] },
      { rupees: 750, createdAgo: 12, term: 7 },
      { rupees: 1035, createdAgo: 3, term: 7, recent: true },
    ],
  },
  {
    name: "Lakshmi Iyer",
    vpa: "lakshmi.iyer@oksbi",
    phone: "9737659505",
    language: "en",
    entries: [
      { rupees: 380, createdAgo: 20, term: 5, paidAfterDue: -1 },
      { rupees: 620, createdAgo: 12, term: 5, paidAfterDue: 0 },
      { rupees: 575, createdAgo: 0, term: 5, recent: true },
    ],
  },
  {
    name: "Gurpreet Singh",
    vpa: "gurpreet.singh@paytm",
    phone: "7600046578",
    language: "hi",
    entries: [
      { rupees: 900, createdAgo: 60, term: 7, paidAfterDue: -1 },
      { rupees: 1300, createdAgo: 45, term: 7, paidAfterDue: 0 },
      { rupees: 1400, createdAgo: 32, term: 7, parts: [{ rupees: 600, ago: 28 }, { rupees: 800, ago: 25 }] },
      { rupees: 560, createdAgo: 24, term: 7, paidAfterDue: -2 },
      { rupees: 1750, createdAgo: 19, term: 7, parts: [{ rupees: 750, ago: 0 }], note: "Wedding supplies" },
      { rupees: 2140, createdAgo: 4, term: 10, recent: true, note: "Shop supplies" },
    ],
  },
];

/** Builds the seed for a given IST date. Deterministic: same date, same seed. */
export function buildDemoSeed(today: IsoDate = todayIST()): Seed {
  const daysIntoMonth = Number(today.slice(8, 10)) - 1; // 0 on the 1st
  const cap = (ago: number, recent?: boolean) => (recent ? Math.min(ago, daysIntoMonth) : ago);
  let sourceIndex = 0;
  const nextSource = () => SOURCES[sourceIndex++ % SOURCES.length];

  return {
    customers: DEMO_CUSTOMERS.map((spec) => {
      const firstEntryAgo = Math.max(...spec.entries.map((e) => e.createdAgo));
      const entries: SeedEntry[] = [];
      const payments: SeedPayment[] = [];
      const usesFamilyVpa = spec.name === "Arjun Mehta" || spec.name === "Lakshmi Iyer";
      let onlinePayments = 0;

      spec.entries.forEach((entry, index) => {
        const e = {
          ...entry,
          createdAgo: cap(entry.createdAgo, entry.recent),
          parts: entry.parts?.map((p) => ({ ...p, ago: cap(p.ago, entry.recent) })),
        };
        const created = addDays(today, -e.createdAgo);
        const due = addDays(created, e.term);
        entries.push({
          amount_paise: e.rupees * 100,
          due_date: due,
          created_at: atIST(created, e.createdAgo === 0 ? "09:00" : "10:30"),
          ...(e.note ? { note: e.note } : {}),
        });

        const parts =
          e.parts ??
          (e.paidAfterDue === undefined ? [] : [{ rupees: e.rupees, ago: e.createdAgo - e.term - e.paidAfterDue }]);
        for (const part of parts) {
          const source = nextSource();
          const vpa = source === "cash" ? undefined : usesFamilyVpa && onlinePayments++ === 0 ? SHARED_FAMILY_VPA : spec.vpa;
          payments.push({
            amount_paise: part.rupees * 100,
            source,
            received_at: atIST(addDays(today, -part.ago), part.ago === 0 ? "09:30" : "18:15"),
            ...(vpa ? { payer_vpa: vpa } : {}),
            allocations: [{ entry: index, amount_paise: part.rupees * 100 }],
          });
        }
      });

      return {
        name: spec.name,
        phone: spec.phone,
        language: spec.language,
        created_at: atIST(addDays(today, -firstEntryAgo - 1), "09:00"),
        entries,
        payments,
      };
    }),
  };
}
