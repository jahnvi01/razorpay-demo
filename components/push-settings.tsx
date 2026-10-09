"use client";

import { useEffect, useState } from "react";
import { useI18n } from "./i18n-provider";
import { BellIcon } from "./icons";

type State = "loading" | "unsupported" | "ios" | "blocked" | "off" | "on";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const b64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** The service worker, or null if it never becomes ready (dev builds have none). */
async function worker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return Promise.race([navigator.serviceWorker.ready, new Promise<null>((r) => setTimeout(() => r(null), 4000))]);
}

function initialState(): State {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (!("PushManager" in window) || !("Notification" in window)) return ios && !standalone ? "ios" : "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return "off";
}

/**
 * UD-61 Notifications in the RK menu: turn the 10 am digest and payment alerts on or off for this
 * device, and send either one to this device right away for the demo.
 */
export function PushSettings() {
  const { t, lang } = useI18n();
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const first = initialState();
      if (first !== "off") return live && setState(first);
      const reg = await worker();
      const sub = await reg?.pushManager.getSubscription();
      if (live) setState(reg ? (sub ? "on" : "off") : "unsupported");
    })();
    return () => {
      live = false;
    };
  }, []);

  const turnOn = async () => {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return setState(permission === "denied" ? "blocked" : "off");
    const reg = await worker();
    if (!reg) return setState("unsupported");
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID) }));
    const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...sub.toJSON(), lang }) });
    if (!res.ok) throw new Error("subscribe failed");
    setState("on");
  };

  const turnOff = async () => {
    const sub = await (await worker())?.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe();
    }
    setState("off");
  };

  const test = async (kind: "digest" | "payment") => {
    const sub = await (await worker())?.pushManager.getSubscription();
    if (!sub) return setState("off");
    const res = await fetch("/api/push/test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint, kind }) });
    const ok = res.ok && ((await res.json()) as { ok?: boolean }).ok;
    setNote(ok ? t("push.sent") : t("push.failed"));
  };

  const run = (fn: () => Promise<void>) => async () => {
    setBusy(true);
    setNote(null);
    try {
      await fn();
    } catch {
      setNote(t("push.failed"));
    } finally {
      setBusy(false);
    }
  };

  const hint =
    state === "on" ? t("push.menuOn") : state === "blocked" ? t("push.blocked") : state === "unsupported" ? t("push.unsupported") : state === "ios" ? t("push.iosInstall") : t("push.menuOff");
  const canToggle = state === "on" || state === "off";
  const small = "h-8 rounded-sm border border-line px-2.5 text-xs font-semibold text-primary transition-colors duration-200 ease-standard hover:bg-primary-faded disabled:cursor-wait disabled:text-ink-muted";

  return (
    <div className="border-t border-line px-4 py-2.5">
      <div className="flex items-start gap-3">
        <BellIcon size={18} className="mt-0.5 shrink-0 text-ink" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium text-ink">{t("push.menu")}</span>
          <span className="text-xs text-ink-muted">{hint}</span>
        </div>
        {canToggle && (
          <button
            type="button"
            role="switch"
            aria-checked={state === "on"}
            aria-label={t("push.menu")}
            disabled={busy}
            onClick={run(state === "on" ? turnOff : turnOn)}
            className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ease-standard disabled:opacity-60 ${state === "on" ? "bg-primary" : "bg-line-strong"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-standard ${state === "on" ? "translate-x-4" : ""}`} />
          </button>
        )}
      </div>
      {state === "on" && (
        <div className="mt-2 flex flex-wrap gap-2 pl-7.5">
          <button type="button" disabled={busy} onClick={run(() => test("digest"))} className={small}>
            {t("push.testDigest")}
          </button>
          <button type="button" disabled={busy} onClick={run(() => test("payment"))} className={small}>
            {t("push.testPayment")}
          </button>
        </div>
      )}
      {note && (
        <p role="status" className="mt-1.5 pl-7.5 text-xs text-ink-subtle">
          {note}
        </p>
      )}
    </div>
  );
}
