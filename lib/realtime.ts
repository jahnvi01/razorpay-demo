import "server-only";
import { serverEnv } from "@/lib/env";

import { LEDGER_EVENT, LEDGER_TOPIC } from "@/lib/realtime-topic";

/** UD-18 Tells open screens that a sandbox's ledger changed, so they refresh. Never throws. */
export async function broadcastLedgerChange(sandboxId: string, customerId?: string): Promise<void> {
  try {
    await fetch(`${serverEnv.supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: serverEnv.supabaseSecretKey,
        Authorization: `Bearer ${serverEnv.supabaseSecretKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        // The payload carries IDs only, never names, amounts or phone numbers.
        messages: [{ topic: LEDGER_TOPIC, event: LEDGER_EVENT, payload: { sandboxId, customerId: customerId ?? null } }],
      }),
    });
  } catch (err) {
    console.error("realtime broadcast failed", err);
  }
}
