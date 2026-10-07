"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n-provider";
import { CheckCircleIcon, ClockIcon, RefreshIcon } from "./icons";
import { isOffline, onOutboxChange, pending, remove } from "@/lib/offline/outbox";

const RETRY_MS = [5_000, 15_000, 30_000, 60_000];
const WARM_ROUTES = ["/app", "/app/customers", "/app/dues", "/app/udhaar/new"];

/**
 * UD-58 Offline mode, for every app screen. Shows a thin strip when offline or when changes wait to
 * sync, sends queued changes to /api/sync as soon as the network is back (on reconnect, on return to the
 * app, and with backoff retries), and while online keeps the main screens in the offline cache.
 */
export function OfflineSync() {
  const { t } = useI18n();
  const router = useRouter();
  const [offline, setOffline] = useState(false);
  const [count, setCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [rejected, setRejected] = useState(0);
  const busy = useRef(false);
  const attempt = useRef(0);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const again = useRef<() => void>(() => {}); // lets syncNow schedule itself

  const refreshCount = useCallback(async () => setCount((await pending().catch(() => [])).length), []);

  // While online, fetch the main screens so the service worker has a fresh copy for offline use
  const warm = useCallback(async () => {
    if (isOffline()) return;
    try {
      const html = await (await fetch("/app/customers", { headers: { accept: "text/html" } })).text();
      const ids = [...new Set([...html.matchAll(/href="\/app\/customers\/([0-9a-f-]{36})"/g)].map((m) => m[1]))];
      const urls = [...WARM_ROUTES, ...ids.map((id) => `/app/customers/${id}`)];
      for (const url of urls) await fetch(url, { headers: { accept: "text/html" } }).catch(() => {});
    } catch {
      // Best effort only
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (busy.current || isOffline()) return;
    const ops = await pending().catch(() => []);
    if (!ops.length) return;
    busy.current = true;
    setSyncing(true);
    if (retry.current) clearTimeout(retry.current);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ops: ops.slice(0, 50) }),
      });
      const json = (await res.json().catch(() => ({}))) as { results?: { opId: string; status: string }[] };
      const results = json.results ?? [];
      await remove(results.map((r) => r.opId));
      const dropped = results.filter((r) => r.status === "rejected").length;
      if (dropped) setRejected((n) => n + dropped);
      if (!res.ok) throw new Error(`sync ${res.status}`);
      attempt.current = 0;
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
      router.refresh();
      busy.current = false;
      setSyncing(false);
      if (ops.length > 50) again.current();
      else void warm();
    } catch {
      // Network still weak: try again a little later
      busy.current = false;
      setSyncing(false);
      const wait = RETRY_MS[Math.min(attempt.current++, RETRY_MS.length - 1)];
      retry.current = setTimeout(() => again.current(), wait);
    }
  }, [router, warm]);

  useEffect(() => {
    again.current = () => void syncNow();
  }, [syncNow]);

  useEffect(() => {
    const update = () => setOffline(isOffline());
    update();
    void refreshCount(); // eslint-disable-line react-hooks/set-state-in-effect
    const goOnline = () => {
      update();
      attempt.current = 0;
      void syncNow();
    };
    const onVisible = () => document.visibilityState === "visible" && void syncNow();
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", update);
    document.addEventListener("visibilitychange", onVisible);
    const stop = onOutboxChange(() => {
      void refreshCount();
      void syncNow();
    });
    void syncNow();
    const warmTimer = setTimeout(() => void warm(), 4000); // after the screen has settled
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", update);
      document.removeEventListener("visibilitychange", onVisible);
      stop();
      clearTimeout(warmTimer);
      if (retry.current) clearTimeout(retry.current);
    };
  }, [refreshCount, syncNow, warm]);

  let tone = "";
  let text = "";
  if (rejected > 0) {
    tone = "bg-negative-subtle text-negative";
    text = t("offline.rejected", { count: rejected });
  } else if (offline) {
    tone = "bg-[#FFF4E5] text-notice";
    text = count ? t("offline.waitingOffline", { count }) : t("offline.offline");
  } else if (count > 0) {
    tone = "bg-primary-faded text-primary";
    text = syncing ? t("offline.syncing", { count }) : t("offline.waiting", { count });
  } else if (justSynced) {
    tone = "bg-positive-subtle text-positive";
    text = t("offline.synced");
  }
  if (!text) return null;

  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold ${tone}`}>
      {justSynced && !count ? <CheckCircleIcon size={14} /> : syncing ? <RefreshIcon size={14} className="animate-spin" /> : <ClockIcon size={14} />}
      <span className="min-w-0 flex-1">{text}</span>
      {rejected > 0 ? (
        <button type="button" onClick={() => setRejected(0)} className="shrink-0 underline">
          {t("offline.dismiss")}
        </button>
      ) : (
        !offline &&
        count > 0 &&
        !syncing && (
          <button type="button" onClick={() => void syncNow()} className="shrink-0 underline">
            {t("offline.syncNow")}
          </button>
        )
      )}
    </div>
  );
}
