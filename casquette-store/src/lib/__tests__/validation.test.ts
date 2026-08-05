import { describe, expect, it } from "vitest";
import {
  isValidMobile,
  normalizePhone,
  orderFormSchema,
} from "@/lib/validation";
import { generateOrderId } from "@/lib/orderId";

describe("normalizePhone", () => {
  it("keeps the canonical 0XXXXXXXXX form", () => {
    expect(normalizePhone("0550123456")).toBe("0550123456");
  });
  it("converts +213 prefix", () => {
    expect(normalizePhone("+213550123456")).toBe("0550123456");
  });
  it("converts 00213 prefix", () => {
    expect(normalizePhone("00213550123456")).toBe("0550123456");
  });
  it("strips spaces, dots, dashes and parentheses", () => {
    expect(normalizePhone("05 50.12-34(56)")).toBe("0550123456");
    expect(normalizePhone("+213 5 50 12 34 56")).toBe("0550123456");
  });
});

describe("isValidMobile", () => {
  it("accepts 05/06/07 mobiles in all prefix forms", () => {
    expect(isValidMobile("0550123456")).toBe(true);
    expect(isValidMobile("0661234567")).toBe(true);
    expect(isValidMobile("0771234567")).toBe(true);
    expect(isValidMobile("+213550123456")).toBe(true);
    expect(isValidMobile("00213550123456")).toBe(true);
    expect(isValidMobile("05 50 12 34 56")).toBe(true);
  });
  it("rejects landlines (02/03/04) and malformed numbers", () => {
    expect(isValidMobile("021123456")).toBe(false);
    expect(isValidMobile("0450123456")).toBe(false);
    expect(isValidMobile("055012345")).toBe(false); // too short
    expect(isValidMobile("05501234567")).toBe(false); // too long
    expect(isValidMobile("abc")).toBe(false);
    expect(isValidMobile("")).toBe(false);
  });
});

describe("orderFormSchema", () => {
  const valid = {
    name: "Yacine Benali",
    phone: "+213 550 12 34 56",
    wilaya: "16",
    commune: "Hydra",
    color: "blue",
    quantity: 1,
    deliveryType: "home" as const,
  };

  it("accepts a valid order and normalizes the phone", () => {
    const parsed = orderFormSchema.parse(valid);
    expect(parsed.phone).toBe("0550123456");
  });

  it("accepts accented and hyphenated names", () => {
    expect(() =>
      orderFormSchema.parse({ ...valid, name: "Aït-Ahmed N'Aïma" }),
    ).not.toThrow();
  });

  it("rejects a commune that does not belong to the wilaya", () => {
    expect(orderFormSchema.safeParse({ ...valid, commune: "Oran" }).success).toBe(
      false,
    );
  });

  it("rejects desk delivery in a wilaya without stopdesk", () => {
    const r = orderFormSchema.safeParse({
      ...valid,
      wilaya: "54", // In Guezzam — desk: null
      commune: "In Guezzam",
      deliveryType: "desk",
    });
    expect(r.success).toBe(false);
  });

  it("rejects out-of-range quantities", () => {
    expect(orderFormSchema.safeParse({ ...valid, quantity: 0 }).success).toBe(false);
    expect(orderFormSchema.safeParse({ ...valid, quantity: 99 }).success).toBe(false);
  });
});

describe("generateOrderId", () => {
  it("matches CAP-YYMMDD-XXXXXX", () => {
    const id = generateOrderId(new Date(2026, 7, 4));
    expect(id).toMatch(/^CAP-260804-[A-Z2-7]{6}$/);
  });
  it("is unique across calls", () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateOrderId()));
    expect(ids.size).toBe(200);
  });
});
