import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { serverEnv } from "@/lib/env";

let client: Razorpay | undefined;

/** Razorpay API client. Server only: it holds the key secret. */
export function razorpay(): Razorpay {
  client ??= new Razorpay({ key_id: serverEnv.razorpayKeyId, key_secret: serverEnv.razorpayKeySecret });
  return client;
}

/**
 * Checks the X-Razorpay-Signature header: HMAC-SHA256 of the raw request body with the webhook secret.
 * Constant-time comparison, so the check leaks nothing about the expected value.
 */
export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", serverEnv.razorpayWebhookSecret).update(rawBody).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
