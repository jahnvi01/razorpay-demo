// UD-05 demo seed from the command line. Uses SUPABASE_URL and SUPABASE_SECRET_KEY (.env.local).
//
//   npm run db:seed                  create a new seeded sandbox and print its ID
//   npm run db:seed -- --reset <id>  wipe that sandbox and load the seed again
//   npm run db:seed -- --count <id>  show what is in that sandbox
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { todayIST } from "../lib/dates.ts";
import { buildDemoSeed } from "../lib/seed/demo-seed.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const url = process.env.SUPABASE_URL ?? fail("SUPABASE_URL is not set");
const key = process.env.SUPABASE_SECRET_KEY ?? fail("SUPABASE_SECRET_KEY is not set");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function count(id: string) {
  const tables = ["customers", "credit_entries", "payments", "allocations", "reminders"] as const;
  const out: Record<string, number> = {};
  for (const table of tables) {
    const { count: n, error } = await db.from(table).select("*", { count: "exact", head: true }).eq("sandbox_id", id);
    if (error) fail(`${table}: ${error.message}`);
    out[table] = n ?? 0;
  }
  return out;
}

const [flag, arg] = process.argv.slice(2);
const seed = buildDemoSeed(todayIST());

if (!flag) {
  const id = randomUUID();
  const { error } = await db.rpc("ensure_sandbox", { p_sandbox_id: id, p_seed: seed });
  if (error) fail(error.message);
  console.log(`created sandbox ${id}`, await count(id));
} else if (flag === "--reset" || flag === "--count") {
  if (!arg || !UUID.test(arg)) fail(`Usage: npm run db:seed -- ${flag} <sandbox-id>`);
  if (flag === "--reset") {
    const { error } = await db.rpc("reset_sandbox", { p_sandbox_id: arg, p_seed: seed });
    if (error) fail(error.message);
    console.log(`reset sandbox ${arg}`, await count(arg));
  } else {
    console.log(`sandbox ${arg}`, await count(arg));
  }
} else {
  fail(`Unknown option ${flag}. Use --reset <id> or --count <id>.`);
}
