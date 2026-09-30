import "server-only";
import { todayIST } from "@/lib/dates";
import { buildDemoSeed } from "@/lib/seed/demo-seed";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * One shared demo of Ramesh Kirana for every visitor (UD-34). The schema keeps its sandbox_id
 * column, so the ledger stays scoped and per-visitor sandboxes could return later if needed.
 */
export const DEMO_SANDBOX_ID = "00000000-0000-4000-8000-000000000001";

let ready: Promise<void> | null = null;

/**
 * Returns the shared demo's sandbox ID, creating and seeding it the first time this server
 * process needs it. Later calls cost nothing, so page views never write to the database.
 */
export async function requireSandbox(): Promise<string> {
  ready ??= (async () => {
    const { error } = await supabaseAdmin().rpc("ensure_sandbox", {
      p_sandbox_id: DEMO_SANDBOX_ID,
      p_seed: buildDemoSeed(todayIST()),
    });
    if (error) throw new Error(`Could not open the demo: ${error.message}`);
  })();
  try {
    await ready;
  } catch (err) {
    ready = null; // try again on the next request
    throw err;
  }
  return DEMO_SANDBOX_ID;
}

/** Reset demo: wipes the shared demo for everyone and loads fresh seed data. */
export async function resetDemo(): Promise<void> {
  const { error } = await supabaseAdmin().rpc("reset_sandbox", {
    p_sandbox_id: DEMO_SANDBOX_ID,
    p_seed: buildDemoSeed(todayIST()),
  });
  if (error) throw new Error(`Could not reset the demo: ${error.message}`);
}
