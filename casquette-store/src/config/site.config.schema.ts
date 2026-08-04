import { z } from "zod";
import { config } from "./site.config";

/**
 * Config validation lives here, apart from the config itself, and is imported
 * ONLY from the server component in app/layout.tsx. That keeps the guarantee
 * the brief asks for — a typo fails `next build`, not the page — while keeping
 * zod (≈64 KB gzipped) out of every client bundle that reads the config.
 * See DECISIONS.md.
 */
const money = z.number().int().nonnegative();

const configSchema = z.object({
  store: z.object({
    name: z.string().min(1),
    productTitle: z.string().min(1),
    shortDescription: z.string().min(1),
    logo: z
      .object({
        src: z.string().min(1),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .nullable(),
    whatsapp: z.union([z.literal(""), z.string().regex(/^\d{10,15}$/)]),
    email: z.union([z.literal(""), z.string().email()]),
  }),
  currency: z.object({
    code: z.string().length(3),
    suffix: z.string(),
    separator: z.string(),
    decimals: z.number().int().min(0).max(2),
  }),
  pricing: z
    .object({
      price: money.positive(),
      compareAtPrice: money.positive().nullable(),
      freeShipping: z.boolean(),
      freeShippingThreshold: money.positive().nullable(),
      quantityDiscounts: z.array(
        z.object({ minQty: z.number().int().min(2), unitPrice: money.positive() }),
      ),
    })
    .refine(
      (p) => p.compareAtPrice === null || p.compareAtPrice > p.price,
      "compareAtPrice must be greater than price",
    )
    .refine(
      (p) =>
        p.quantityDiscounts.every(
          (d, i, arr) => i === 0 || d.minQty > arr[i - 1].minQty,
        ),
      "quantityDiscounts must be sorted by minQty ascending",
    ),
  colors: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        swatch: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      }),
    )
    .min(1),
  quantity: z
    .object({
      min: z.number().int().min(1),
      max: z.number().int().min(1),
      default: z.number().int().min(1),
    })
    .refine(
      (q) => q.min <= q.default && q.default <= q.max,
      "quantity.default must be within [min, max]",
    ),
  delivery: z.object({
    types: z
      .array(
        z.object({
          id: z.enum(["home", "desk"]),
          label: z.string().min(1),
          hint: z.string(),
        }),
      )
      .length(2),
    default: z.enum(["home", "desk"]),
  }),
  shipping: z.object({ fallbackHome: money, fallbackDesk: money }),
  validation: z.object({
    phone: z.object({
      pattern: z.string().min(1),
      normalize: z.boolean(),
      minLength: z.number().int(),
    }),
    name: z.object({ min: z.number().int().min(1), max: z.number().int() }),
  }),
  order: z.object({
    endpoint: z.string(),
    idPrefix: z.string().min(1).max(8),
    timeoutMs: z.number().int().positive(),
    retries: z.number().int().min(0).max(5),
    defaultStatus: z.string().min(1),
  }),
  seo: z.object({ siteUrl: z.string().url(), locale: z.string() }),
});

/** Throws (failing the build) if site.config.ts has an invalid value. */
export function validateConfig(): void {
  configSchema.parse(config);
}
