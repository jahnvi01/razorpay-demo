import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCustomerLedger, type CustomerLedger } from "./ledger";

const TOKEN = /^[0-9a-f]{64}$/;

/** UD-16 The customer behind a statement token, or null. Tokens are the only key: never list customers. */
export async function getStatement(token: string): Promise<{ sandboxId: string; ledger: CustomerLedger } | null> {
  if (!TOKEN.test(token)) return null;
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select("id, sandbox_id")
    .eq("statement_token", token)
    .maybeSingle();
  if (error) throw new Error(`statement: ${error.message}`);
  if (!data) return null;
  const ledger = await getCustomerLedger(data.sandbox_id, data.id);
  return ledger ? { sandboxId: data.sandbox_id, ledger } : null;
}
