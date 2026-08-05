import { config } from "@/config/site.config";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * CAP-{YYMMDD}-{6 uppercase base32 chars}.
 * Generated ONCE per form session (see useOrderSubmit) and reused across
 * retries, so a retried request can never create a duplicate sheet row.
 */
export function generateOrderId(date: Date = new Date()): string {
  const yy = String(date.getFullYear() % 100).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const bytes = new Uint8Array(6);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let suffix = "";
  for (const b of bytes) suffix += BASE32[b % 32];

  return `${config.order.idPrefix}-${yy}${mm}${dd}-${suffix}`;
}
