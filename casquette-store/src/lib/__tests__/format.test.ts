import { describe, expect, it } from "vitest";
import { computeTotals, formatDA, formatNumber, unitPrice } from "@/lib/format";
import { config } from "@/config/site.config";
import { findWilaya } from "@/data/wilayas";
import type { Wilaya } from "@/types";

describe("formatNumber / formatDA", () => {
  it("groups thousands with a space and no decimals", () => {
    expect(formatNumber(2500)).toBe("2 500");
    expect(formatNumber(100)).toBe("100");
    expect(formatNumber(1234567)).toBe("1 234 567");
    expect(formatNumber(0)).toBe("0");
  });

  it("appends the DA suffix", () => {
    expect(formatDA(12000)).toBe("12 000 DA");
  });
});

describe("unitPrice", () => {
  it("uses the base price for qty 1", () => {
    expect(unitPrice(1)).toBe(12000);
  });

  // quantityDiscounts is currently [] — the loop must simply not run rather
  // than falling through to undefined.
  it("returns the flat base price at every quantity when there are no tiers", () => {
    expect(config.pricing.quantityDiscounts).toHaveLength(0);
    for (const qty of [1, 2, 3, 5, 10]) {
      expect(unitPrice(qty)).toBe(12000);
      expect(Number.isFinite(unitPrice(qty))).toBe(true);
    }
  });
});

describe("computeTotals — free shipping (pricing.freeShipping = true)", () => {
  const alger = findWilaya("16")!;
  const oran = findWilaya("31")!;

  it("is enabled in config", () => {
    expect(config.pricing.freeShipping).toBe(true);
  });

  it("returns 0 shipping before any wilaya is chosen", () => {
    const t = computeTotals(1, null, "home");
    expect(t.shipping).toBe(0);
    expect(t.total).toBe(12000);
  });

  it("returns 0 shipping for every wilaya and both delivery types", () => {
    for (const w of [alger, oran]) {
      for (const type of ["home", "desk"] as const) {
        expect(computeTotals(1, w, type).shipping).toBe(0);
      }
    }
  });

  it("totals price × quantity", () => {
    expect(computeTotals(1, alger, "home").total).toBe(12000);
    expect(computeTotals(2, alger, "desk").total).toBe(24000);
    expect(computeTotals(3, oran, "home").total).toBe(36000);
  });

  it("leaves the per-wilaya rates in the dataset untouched", () => {
    // Flipping the flag back must restore the original prices.
    expect(alger.shipping).toEqual({ home: 400, desk: 250 });
    expect(oran.shipping).toEqual({ home: 500, desk: 300 });
    expect(findWilaya("54")!.shipping).toEqual({ home: 1400, desk: null });
  });

  it("keeps summary and payload amounts identical by construction", () => {
    const t = computeTotals(3, alger, "desk");
    expect(t.total).toBe(t.productTotal + (t.shipping ?? 0));
  });
});

describe("computeTotals — paid shipping (flag off)", () => {
  const alger: Wilaya = {
    code: "16",
    name: "Alger",
    nameAr: "",
    shipping: { home: 400, desk: 250 },
  };
  const noDesk: Wilaya = {
    code: "54",
    name: "In Guezzam",
    nameAr: "",
    shipping: { home: 1400, desk: null },
  };

  // Exercised against a stubbed flag so the paid path stays covered while
  // free shipping is live.
  function paidTotals(qty: number, w: Wilaya | null, type: "home" | "desk") {
    const original = config.pricing.freeShipping;
    (config.pricing as { freeShipping: boolean }).freeShipping = false;
    try {
      return computeTotals(qty, w, type);
    } finally {
      (config.pricing as { freeShipping: boolean }).freeShipping = original;
    }
  }

  it("returns null shipping until a wilaya is chosen", () => {
    const t = paidTotals(1, null, "home");
    expect(t.shipping).toBeNull();
    expect(t.total).toBe(12000);
  });

  it("adds home shipping for the selected wilaya", () => {
    expect(paidTotals(1, alger, "home").shipping).toBe(400);
    expect(paidTotals(1, alger, "home").total).toBe(12400);
  });

  it("uses the desk price for stopdesk delivery", () => {
    expect(paidTotals(1, alger, "desk").shipping).toBe(250);
    expect(paidTotals(1, alger, "desk").total).toBe(12250);
  });

  it("falls back to home price when a wilaya has no stopdesk", () => {
    expect(paidTotals(1, noDesk, "desk").shipping).toBe(1400);
  });
});
