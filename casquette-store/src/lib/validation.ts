import { z } from "zod";
import { config } from "@/config/site.config";
import { findWilaya } from "@/data/wilayas";
import { communesOf } from "@/data/communes";
import { t } from "@/config/copy.fr";

/** Strip spaces, dots, dashes and parentheses. */
function cleanPhone(input: string): string {
  return input.replace(/[\s().\-]/g, "");
}

/** Accepts +213 / 00213 / 0 prefixes → canonical 0XXXXXXXXX. */
export function normalizePhone(input: string): string {
  const cleaned = cleanPhone(input);
  if (cleaned.startsWith("+213")) return "0" + cleaned.slice(4);
  if (cleaned.startsWith("00213")) return "0" + cleaned.slice(5);
  return cleaned;
}

/** Mobile only (05/06/07 after normalization) — pattern comes from config. */
export function isValidMobile(input: string): boolean {
  return new RegExp(config.validation.phone.pattern).test(cleanPhone(input));
}

const COLOR_IDS = config.colors.map((c) => c.id) as [string, ...string[]];

const nameSchema = z
  .string()
  .trim()
  .min(1, t("order.errors.nameRequired"))
  .min(config.validation.name.min, t("order.errors.nameLength", config.validation.name))
  .max(config.validation.name.max, t("order.errors.nameLength", config.validation.name))
  .regex(/^[\p{L}][\p{L}' \-]*$/u, t("order.errors.nameFormat"));

const phoneSchema = z
  .string()
  .trim()
  .min(1, t("order.errors.phoneRequired"))
  .refine(isValidMobile, t("order.errors.phoneInvalid"))
  .transform(normalizePhone);

/** Client-side form schema (react-hook-form resolver). */
export const orderFormSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    wilaya: z
      .string()
      .min(1, t("order.errors.wilayaRequired"))
      .refine((code) => findWilaya(code) !== null, t("order.errors.wilayaRequired")),
    commune: z.string().min(1, t("order.errors.communeRequired")),
    color: z.enum(COLOR_IDS),
    quantity: z
      .number()
      .int()
      .min(config.quantity.min)
      .max(config.quantity.max),
    deliveryType: z.enum(["home", "desk"]),
  })
  .superRefine((data, ctx) => {
    const wilaya = findWilaya(data.wilaya);
    if (!wilaya) return;
    if (
      data.commune &&
      !communesOf(wilaya.code).some((c) => c.name === data.commune)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["commune"],
        message: t("order.errors.communeRequired"),
      });
    }
    if (data.deliveryType === "desk" && wilaya.shipping.desk === null) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryType"],
        message: t("order.fields.delivery.unavailable"),
      });
    }
  });

export type OrderFormValues = z.input<typeof orderFormSchema>;
export type OrderFormOutput = z.output<typeof orderFormSchema>;

/** Full payload schema — shared by the client submitter and the API route. */
export const orderPayloadSchema = z.object({
  orderId: z
    .string()
    .regex(new RegExp(`^${config.order.idPrefix}-\\d{6}-[A-Z2-7]{6}$`)),
  name: nameSchema,
  phone: z.string().regex(/^0[5-7]\d{8}$/),
  wilaya: z.string().refine((code) => findWilaya(code) !== null),
  commune: z.string().min(1),
  color: z.enum(COLOR_IDS),
  quantity: z.number().int().min(config.quantity.min).max(config.quantity.max),
  deliveryType: z.enum(["home", "desk"]),
  // Money fields are validated for shape here but ALWAYS recomputed
  // server-side from the wilaya data before forwarding.
  shippingPrice: z.number().int().nonnegative(),
  total: z.number().int().positive(),
});

export type ValidatedOrderPayload = z.output<typeof orderPayloadSchema>;
