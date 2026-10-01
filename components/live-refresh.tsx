"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LEDGER_EVENT, LEDGER_TOPIC } from "@/lib/realtime-topic";

const POLL_MS = 30_000;

/**
 * UD-18 Refreshes the current screen when a payment lands (Supabase Realtime broadcast).
 * Falls back to refreshing every 30 seconds while the realtime channel is not connected.
 * The Supabase client is loaded only after the page is up, so it never slows the first paint.
 */
export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    let connected = false;
    let cancelled = false;
    let supabase: SupabaseClient | null = null;
    let channel: RealtimeChannel | null = null;

    if (url && key) {
      void import("@supabase/supabase-js").then(({ createClient }) => {
        if (cancelled) return;
        supabase = createClient(url, key, { auth: { persistSession: false } });
        channel = supabase
          .channel(LEDGER_TOPIC)
          .on("broadcast", { event: LEDGER_EVENT }, () => router.refresh())
          .subscribe((status) => {
            const wasConnected = connected;
            connected = status === "SUBSCRIBED";
            // Catch anything that changed while we were connecting or reconnecting.
            if (connected && !wasConnected) router.refresh();
          });
      });
    }

    const poll = setInterval(() => {
      if (!connected && document.visibilityState === "visible") router.refresh();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(poll);
      if (supabase && channel) void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
