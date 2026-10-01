import "server-only";
import { headers } from "next/headers";

/**
 * Public base URL for links we send to customers (statement page, pay link callback, WhatsApp text).
 * APP_URL wins, so links created from a local dev server still point at the live app a customer's
 * phone can open (local and production share one database). Falls back to the request's host.
 */
export async function appUrl(): Promise<string> {
  const configured = process.env.APP_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
