/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const APP_PAGE = (pathname: string) => pathname === "/app" || pathname.startsWith("/app/");

// UD-58 Offline mode. App screens (HTML and the router's RSC payloads) come from the network when it
// answers within 4 seconds, else from the last copy, so a weak signal never leaves a spinner. API calls
// (sync, webhooks) always need the network: queued changes are handled by the page, not the worker.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ sameOrigin, url: { pathname } }) => sameOrigin && pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, sameOrigin, url: { pathname } }) => sameOrigin && APP_PAGE(pathname) && request.headers.get("RSC") === "1",
      handler: new NetworkFirst({
        cacheName: "app-rsc",
        networkTimeoutSeconds: 4,
        plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 7 * 86400 })],
      }),
    },
    {
      matcher: ({ request, sameOrigin, url: { pathname } }) => sameOrigin && APP_PAGE(pathname) && request.method === "GET",
      handler: new NetworkFirst({
        cacheName: "app-pages",
        networkTimeoutSeconds: 4,
        // Offline, /app/udhaar/new?customer=… or /app/dues?filter=… open the cached screen; the page
        // reads its own query in the browser where it needs to (the udhaar form's customer)
        matchOptions: { ignoreVary: true, ignoreSearch: true },
        plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 7 * 86400 })],
      }),
    },
    ...defaultCache.filter((entry) => !String(entry.matcher).includes("api")),
  ],
});

serwist.addEventListeners();
