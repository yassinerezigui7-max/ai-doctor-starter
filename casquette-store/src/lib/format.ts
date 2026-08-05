import { config } from "@/config/site.config";
import type { DeliveryTypeId, Totals, Wilaya } from "@/types";

/** 2500 → "2 500" (separator from config, no decimals). */
export function formatNumber(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, config.currency.separator);
  return sign + grouped;
}

/** 2500 → "2 500 DA" */
export function formatDA(n: number): string {
  return `${formatNumber(n)} ${config.currency.suffix}`;
}

/**
 * Unit price for a given quantity, applying config quantity discounts.
 * An empty `quantityDiscounts` array simply leaves the base price in place —
 * the loop never runs, so there is no undefined to fall through to.
 */
export function unitPrice(qty: number): number {
  let price: number = config.pricing.price;
  for (const tier of config.pricing.quantityDiscounts) {
    if (qty >= tier.minQty) price = tier.unitPrice;
  }
  return price;
}

/**
 * The single money function. Used by the summary UI, the submit button label,
 * the sticky bar AND the submitted payload — they must never diverge.
 *
 * With `pricing.freeShipping` on, shipping is 0 everywhere, immediately — no
 * wilaya needed, no delivery-type difference. Otherwise shipping stays null
 * until a wilaya is chosen, and a null desk price falls back to the home rate.
 */
export function computeTotals(
  qty: number,
  wilaya: Wilaya | null,
  deliveryType: DeliveryTypeId,
): Totals {
  const u = unitPrice(qty);
  const productTotal = u * qty;

  let shipping: number | null = null;
  if (config.pricing.freeShipping) {
    shipping = 0;
  } else if (wilaya) {
    shipping =
      deliveryType === "desk"
        ? (wilaya.shipping.desk ?? wilaya.shipping.home)
        : wilaya.shipping.home;
    const threshold = config.pricing.freeShippingThreshold;
    if (threshold !== null && productTotal >= threshold) shipping = 0;
  }

  return {
    unitPrice: u,
    productTotal,
    shipping,
    total: productTotal + (shipping ?? 0),
  };
}
