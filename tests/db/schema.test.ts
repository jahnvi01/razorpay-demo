// UD-03 schema, UD-05 seed and UD-34 sandbox, tested against a real Postgres.
import { randomUUID } from "node:crypto";
import type { Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildDemoSeed } from "@/lib/seed/demo-seed";
import { connectAs, hasDb } from "./helpers";

const seed = buildDemoSeed();
const seedEntries = seed.customers.reduce((n, c) => n + c.entries.length, 0);
const seedPayments = seed.customers.reduce((n, c) => n + c.payments.length, 0);

describe.skipIf(!hasDb)("database", () => {
  let db: Sql;

  beforeAll(() => {
    db = connectAs("service_role", 8);
  });
  afterAll(async () => {
    await db.end();
  });

  const ensure = async (id: string) =>
    (await db`select public.ensure_sandbox(${id}::uuid, ${db.json(seed)}) as created`)[0].created as boolean;
  const reset = (id: string) => db`select public.reset_sandbox(${id}::uuid, ${db.json(seed)})`;
  const counts = async (id: string) =>
    (
      await db`
        select
          (select count(*)::int from public.customers where sandbox_id = ${id}) as customers,
          (select count(*)::int from public.credit_entries where sandbox_id = ${id}) as entries,
          (select count(*)::int from public.payments where sandbox_id = ${id}) as payments,
          (select count(*)::int from public.credit_entries where sandbox_id = ${id} and status = 'open') as open,
          (select coalesce(sum(remaining_paise), 0)::bigint from public.credit_entries where sandbox_id = ${id}) as due`
    )[0];

  describe("sandbox seeding (UD-05, UD-34)", () => {
    it("creates and seeds a new sandbox in one call", async () => {
      const id = randomUUID();
      expect(await ensure(id)).toBe(true);
      const c = await counts(id);
      expect(c.customers).toBe(5);
      expect(c.entries).toBe(seedEntries);
      expect(c.payments).toBe(seedPayments);
    });

    it("derives balances from allocations exactly as the seed intends", async () => {
      const id = randomUUID();
      await ensure(id);
      const rows = await db`
        select c.name, e.amount_paise, e.remaining_paise, e.status, e.paid_at
          from public.credit_entries e join public.customers c on c.id = e.customer_id
         where e.sandbox_id = ${id} and e.status = 'open'
         order by c.name, e.created_at`;
      const open = rows.map((r) => [r.name, Number(r.remaining_paise)]);
      expect(open).toEqual([
        ["Arjun Mehta", 131000],
        ["Farhan Qureshi", 34000],
        ["Farhan Qureshi", 75000],
        ["Farhan Qureshi", 103500],
        ["Gurpreet Singh", 100000],
        ["Gurpreet Singh", 214000],
        ["Lakshmi Iyer", 57500],
        ["Sunita Sharma", 148500],
        ["Sunita Sharma", 120000],
      ]);
      const paid = await db`select count(*)::int as n from public.credit_entries where sandbox_id = ${id} and status = 'paid' and paid_at is not null and remaining_paise = 0`;
      expect(paid[0].n).toBe(seedEntries - 9);
    });

    it("is idempotent: a second call only touches last_seen_at", async () => {
      const id = randomUUID();
      await ensure(id);
      const before = (await db`select last_seen_at from public.sandboxes where id = ${id}`)[0].last_seen_at;
      await new Promise((r) => setTimeout(r, 20));
      expect(await ensure(id)).toBe(false);
      expect((await counts(id)).customers).toBe(5);
      const after = (await db`select last_seen_at from public.sandboxes where id = ${id}`)[0].last_seen_at;
      expect(after.getTime()).toBeGreaterThan(before.getTime());
    });

    it("seeds only once when many first requests arrive together", async () => {
      const id = randomUUID();
      const results = await Promise.all(Array.from({ length: 8 }, () => ensure(id)));
      expect(results.filter(Boolean)).toHaveLength(1);
      expect((await counts(id)).customers).toBe(5);
    });

    it("reset wipes changes and reloads the seed", async () => {
      const id = randomUUID();
      await ensure(id);
      const fresh = await counts(id);
      await db`insert into public.customers (sandbox_id, name, phone) values (${id}, 'Extra', '9111111111')`;
      await db`delete from public.customers where sandbox_id = ${id} and name = 'Sunita Sharma'`;
      expect((await counts(id)).customers).toBe(5);
      await reset(id);
      expect(await counts(id)).toEqual(fresh);
      const names = await db`select name from public.customers where sandbox_id = ${id} order by name`;
      expect(names.map((r) => r.name)).not.toContain("Extra");
      expect(names.map((r) => r.name)).toContain("Sunita Sharma");
    });

    it("keeps sandboxes isolated from each other", async () => {
      const a = randomUUID();
      const b = randomUUID();
      await ensure(a);
      await ensure(b);
      await db`insert into public.customers (sandbox_id, name, phone) values (${a}, 'Only in A', '9222222222')`;
      await reset(b);
      expect((await counts(a)).customers).toBe(6);
      expect((await counts(b)).customers).toBe(5);
    });

    it("rejects a malformed seed without leaving a half-made sandbox", async () => {
      const id = randomUUID();
      const bad = { customers: [{ name: "Bad", phone: "12345", entries: [] }] };
      await expect(db`select public.ensure_sandbox(${id}::uuid, ${db.json(bad)})`).rejects.toThrow();
      const rows = await db`select 1 from public.sandboxes where id = ${id}`;
      expect(rows).toHaveLength(0);
    });

    it("deleting a sandbox removes all of its data", async () => {
      const id = randomUUID();
      await ensure(id);
      await db`delete from public.sandboxes where id = ${id}`;
      expect(await counts(id)).toEqual({ customers: 0, entries: 0, payments: 0, open: 0, due: "0" });
      const orphans = await db`select count(*)::int as n from public.allocations where sandbox_id = ${id}`;
      expect(orphans[0].n).toBe(0);
    });
  });

  describe("schema rules (UD-03)", () => {
    let sandbox: string;
    let other: string;
    let customer: string;
    let otherCustomer: string;

    beforeAll(async () => {
      sandbox = randomUUID();
      other = randomUUID();
      await db`insert into public.sandboxes (id) values (${sandbox}), (${other})`;
      customer = (await db`insert into public.customers (sandbox_id, name, phone) values (${sandbox}, 'Test', '9333333333') returning id`)[0].id;
      otherCustomer = (await db`insert into public.customers (sandbox_id, name, phone) values (${other}, 'Other', '9333333333') returning id`)[0].id;
    });

    const entry = async (rupees: number) =>
      (await db`insert into public.credit_entries (sandbox_id, customer_id, amount_paise, remaining_paise, due_date)
                values (${sandbox}, ${customer}, ${rupees * 100}, 0, current_date + 7) returning id`)[0].id as string;
    const payment = async (rupees: number, source = "cash", rzp: string | null = null) =>
      (await db`insert into public.payments (sandbox_id, customer_id, amount_paise, source, razorpay_payment_id)
                values (${sandbox}, ${customer}, ${rupees * 100}, ${source}, ${rzp}) returning id`)[0].id as string;
    const allocate = (p: string, e: string, rupees: number) =>
      db`insert into public.allocations (sandbox_id, customer_id, payment_id, entry_id, amount_paise)
         values (${sandbox}, ${customer}, ${p}, ${e}, ${rupees * 100})`;
    const entryState = async (id: string) =>
      (await db`select remaining_paise::int as remaining, status, paid_at is not null as has_paid_at from public.credit_entries where id = ${id}`)[0];

    it("validates customer name, phone and language", async () => {
      const bad = [
        [" ", "9444444444", "en"],
        ["Name", "12345", "en"],
        ["Name", "5444444444", "en"],
        ["Name", "9444444444", "fr"],
      ];
      for (const [name, phone, language] of bad) {
        await expect(
          db`insert into public.customers (sandbox_id, name, phone, language) values (${sandbox}, ${name}, ${phone}, ${language})`,
        ).rejects.toThrow(/check/);
      }
    });

    it("blocks duplicate phones within a sandbox but allows them across sandboxes", async () => {
      await expect(
        db`insert into public.customers (sandbox_id, name, phone) values (${sandbox}, 'Dup', '9333333333')`,
      ).rejects.toThrow(/duplicate key/);
      expect(otherCustomer).toBeTruthy(); // same phone lives happily in the other sandbox
    });

    it("rejects zero or negative amounts", async () => {
      await expect(entry(0)).rejects.toThrow(/check/);
      await expect(entry(-5)).rejects.toThrow(/check/);
      await expect(payment(0)).rejects.toThrow(/check/);
    });

    it("cannot link an entry to a customer from another sandbox", async () => {
      await expect(
        db`insert into public.credit_entries (sandbox_id, customer_id, amount_paise, remaining_paise, due_date)
           values (${sandbox}, ${otherCustomer}, 1000, 1000, current_date)`,
      ).rejects.toThrow(/foreign key/);
    });

    it("starts every new entry fully unpaid, whatever the caller sends", async () => {
      const e = await entry(500);
      expect(await entryState(e)).toEqual({ remaining: 50000, status: "open", has_paid_at: false });
    });

    it("keeps remaining, status and paid_at in step with allocations", async () => {
      const e = await entry(500);
      const p1 = await payment(200);
      await allocate(p1, e, 200);
      expect(await entryState(e)).toEqual({ remaining: 30000, status: "open", has_paid_at: false });
      const p2 = await payment(300);
      await allocate(p2, e, 300);
      expect(await entryState(e)).toEqual({ remaining: 0, status: "paid", has_paid_at: true });
      await db`delete from public.payments where id = ${p2}`; // correcting a payment
      expect(await entryState(e)).toEqual({ remaining: 30000, status: "open", has_paid_at: false });
    });

    it("never lets allocations exceed the entry or the payment", async () => {
      const e = await entry(100);
      const big = await payment(500);
      await expect(allocate(big, e, 150)).rejects.toThrow(/exceed entry/);
      const e2 = await entry(1000);
      const small = await payment(100);
      await expect(allocate(small, e2, 150)).rejects.toThrow(/exceed payment/);
    });

    it("refuses a status that contradicts the balance", async () => {
      const e = await entry(100);
      await expect(db`update public.credit_entries set status = 'paid' where id = ${e}`).rejects.toThrow(/check/);
    });

    it("records a Razorpay payment only once, and cash never carries a Razorpay ID", async () => {
      await payment(100, "link", "pay_TEST123");
      await expect(payment(100, "link", "pay_TEST123")).rejects.toThrow(/duplicate key/);
      await expect(payment(100, "cash", "pay_TEST999")).rejects.toThrow(/check/);
    });
  });

  describe("oldest-first clearing (UD-09)", () => {
    let sandbox: string;
    beforeAll(async () => {
      sandbox = randomUUID();
      await db`insert into public.sandboxes (id) values (${sandbox})`;
    });

    let phone = 9500000000;
    const newCustomerWith = async (...rupees: number[]) => {
      const customer = (await db`select public.create_customer(${sandbox}, 'Clearing', ${String(phone++)}, 'en') as id`)[0].id as string;
      for (const r of rupees) {
        await db`select * from public.create_entry(${sandbox}, ${customer}, null, null, null, ${r * 100}, current_date + 7, null)`;
        await db`select pg_sleep(0.002)`; // distinct created_at, so "oldest" is well defined
      }
      return customer;
    };
    const pay = async (customer: string, rupees: number) =>
      (await db`select * from public.record_payment(${sandbox}, ${customer}, ${rupees * 100}, 'cash')`)[0];
    const remaining = async (customer: string) =>
      (await db`select remaining_paise::int / 100 as r from public.credit_entries where customer_id = ${customer} order by created_at`).map((x) => x.r);

    it("Rs 500, 300, 200 and a Rs 600 payment: first cleared, second at 200, third untouched", async () => {
      const c = await newCustomerWith(500, 300, 200);
      expect(Number((await pay(c, 600)).advance_paise)).toBe(0);
      expect(await remaining(c)).toEqual([0, 200, 200]);
    });

    it("paying the exact total clears everything", async () => {
      const c = await newCustomerWith(500, 300, 200);
      await pay(c, 1000);
      expect(await remaining(c)).toEqual([0, 0, 0]);
    });

    it("overpayment is held as advance and used by the next new entry", async () => {
      const c = await newCustomerWith(500, 300, 200);
      expect(Number((await pay(c, 1100)).advance_paise)).toBe(10000);
      await db`select * from public.create_entry(${sandbox}, ${c}, null, null, null, 30000, current_date + 7, null)`;
      expect(await remaining(c)).toEqual([0, 0, 0, 200]);
    });

    it("two payments at the same moment never allocate the same rupee twice", async () => {
      const c = await newCustomerWith(500, 300, 200);
      await Promise.all([pay(c, 400), pay(c, 400), pay(c, 400)]);
      expect(await remaining(c)).toEqual([0, 0, 0]);
      const [{ allocated }] = await db`select sum(amount_paise)::int / 100 as allocated from public.allocations where customer_id = ${c}`;
      expect(allocated).toBe(1000); // Rs 200 left over as advance, never double counted
    });

    it("deleting a payment re-runs clearing and restores the right balances", async () => {
      const c = await newCustomerWith(500, 300, 200);
      const first = await pay(c, 500);
      await pay(c, 300);
      expect(await remaining(c)).toEqual([0, 0, 200]);
      await db`select public.delete_payment(${sandbox}, ${first.payment_id})`;
      expect(await remaining(c)).toEqual([200, 300, 200]); // Rs 300 now clears the oldest entry first
    });

    it("only cash payments can be deleted, and only inside the caller's sandbox", async () => {
      const c = await newCustomerWith(100);
      const link = (await db`select * from public.record_payment(${sandbox}, ${c}, 5000, 'link', ${"pay_" + randomUUID()})`)[0];
      await expect(db`select public.delete_payment(${sandbox}, ${link.payment_id})`).rejects.toThrow(/not found/);
      const cash = await pay(c, 10);
      await expect(db`select public.delete_payment(${randomUUID()}, ${cash.payment_id})`).rejects.toThrow(/not found/);
    });

    it("a repeated Razorpay payment is recorded once", async () => {
      const c = await newCustomerWith(500);
      const id = "pay_" + randomUUID();
      await db`select * from public.record_payment(${sandbox}, ${c}, 20000, 'link', ${id})`;
      await db`select * from public.record_payment(${sandbox}, ${c}, 20000, 'link', ${id})`;
      expect(await remaining(c)).toEqual([300]);
    });

    it("the reallocated seed matches the designed seed", async () => {
      const id = randomUUID();
      await ensure(id);
      const before = await db`select id, remaining_paise from public.credit_entries where sandbox_id = ${id} order by id`;
      for (const { id: cid } of await db`select id from public.customers where sandbox_id = ${id}`) {
        await db`select public.reallocate_customer(${id}, ${cid})`;
      }
      const after = await db`select id, remaining_paise from public.credit_entries where sandbox_id = ${id} order by id`;
      expect(after).toEqual(before);
    });
  });

  describe("security", () => {
    let anon: Sql;
    beforeAll(() => {
      anon = connectAs("anon");
    });
    afterAll(async () => {
      await anon.end();
    });

    it("the public (anon) role cannot read or write any table", async () => {
      for (const table of ["sandboxes", "customers", "credit_entries", "payments", "allocations", "reminders"]) {
        await expect(anon.unsafe(`select * from public.${table} limit 1`)).rejects.toThrow(/permission denied/);
      }
    });

    it("the public (anon) role cannot call the sandbox functions", async () => {
      await expect(anon`select public.ensure_sandbox(${randomUUID()}::uuid, ${anon.json(seed)})`).rejects.toThrow(
        /permission denied/,
      );
      await expect(anon`select public.reset_sandbox(${randomUUID()}::uuid, ${anon.json(seed)})`).rejects.toThrow(
        /permission denied/,
      );
    });
  });
});
