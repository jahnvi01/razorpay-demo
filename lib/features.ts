/**
 * Product switches. Shop QR (UD-18 to UD-22) is hidden for now: matching a QR payment to a customer
 * needs a manual step, so for simplicity the merchant records counter payments as cash instead.
 * The QR code, webhook handling and nightly check stay in place, so this one flag brings it back.
 */
export const SHOP_QR_ENABLED = false;

/**
 * Trust Meter style. true shows the score ring (trial, 9 Oct 2026); false brings back the original
 * progress bar card (TrustMeterBar), which is kept unchanged.
 */
export const TRUST_RING_ENABLED = true;
