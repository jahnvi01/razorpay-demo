import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

let client: SupabaseClient | undefined;

/**
 * Supabase client with the secret key. Server only: it bypasses row level security,
 * so every query must be scoped to the caller's sandbox (see lib/sandbox/server.ts).
 */
export function supabaseAdmin(): SupabaseClient {
  client ??= createClient(serverEnv.supabaseUrl, serverEnv.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
