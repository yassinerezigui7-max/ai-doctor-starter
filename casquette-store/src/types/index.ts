import type { ColorId, DeliveryTypeId } from "@/config/site.config";

export type { ColorId, DeliveryTypeId };

export interface Wilaya {
  /** Two-digit code, '01'–'58' */
  code: string;
  name: string;
  nameAr: string;
  shipping: {
    home: number;
    /** null = no stopdesk agency in this wilaya */
    desk: number | null;
  };
}

export interface Commune {
  wilayaCode: string;
  name: string;
}

export interface ProductImage {
  /** Stable slug derived from content hash, not filename */
  id: string;
  alt: string;
  width: number;
  height: number;
  variant: ColorId | "unassigned";
  role: "hero" | "gallery" | "detail";
  /** base64 blur placeholder (20px wide) */
  lqip: string;
  src: { avif: string; webp: string; fallback: string };
  order: number;
}

export interface Review {
  id: string;
  name: string;
  wilaya: string;
  rating: number;
  body: string;
  verified: boolean;
}

/** What the client sends; money fields are recomputed server-side. */
export interface OrderPayload {
  orderId: string;
  name: string;
  /** normalized to 0XXXXXXXXX */
  phone: string;
  wilaya: string;
  commune: string;
  color: ColorId;
  quantity: number;
  deliveryType: DeliveryTypeId;
  shippingPrice: number;
  total: number;
}

export interface OrderResponse {
  ok: boolean;
  orderId?: string;
  code?: string;
  duplicate?: boolean;
}

export interface Totals {
  unitPrice: number;
  productTotal: number;
  /** null until a wilaya is chosen */
  shipping: number | null;
  /** productTotal + (shipping ?? 0) */
  total: number;
}

export type SubmitPhase = "idle" | "submitting" | "success" | "error";
