"use client";

import { cn } from "@/lib/cn";
import { t } from "@/config/copy.fr";
import { computeTotals, formatDA } from "@/lib/format";
import type { DeliveryTypeId, Wilaya } from "@/types";

interface OrderSummaryProps {
  quantity: number;
  wilaya: Wilaya | null;
  deliveryType: DeliveryTypeId;
}

function Row({
  label,
  value,
  bold = false,
  highlight = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  /** Free delivery — reads as a benefit, not a zero */
  highlight?: boolean;
}) {
  return (
    <div
      className={
        bold
          ? "flex items-baseline justify-between text-[120%] font-semibold text-ink"
          : "flex items-baseline justify-between text-small text-muted"
      }
    >
      <span>{label}</span>
      {/* key on the value re-runs the 180ms cross-fade on every change */}
      <span
        key={value}
        className={cn(
          "num-swap inline-block tabular-nums",
          highlight && "font-medium text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Uses the same computeTotals() as the submitted payload — never diverges. */
export function OrderSummary({ quantity, wilaya, deliveryType }: OrderSummaryProps) {
  const totals = computeTotals(quantity, wilaya, deliveryType);

  return (
    <div className="flex flex-col gap-2 border-t border-dashed border-line pt-4">
      <p className="sr-only">{t("order.summary.title")}</p>
      <Row
        label={
          quantity > 1
            ? t("order.summary.productQty", { qty: quantity })
            : t("order.summary.product")
        }
        value={formatDA(totals.productTotal)}
      />
      {/* A zero shipping cost is never printed as "0 DA" — it reads as free. */}
      <Row
        label={t("order.summary.shipping")}
        value={
          totals.shipping === null
            ? t("order.summary.shippingPending")
            : totals.shipping === 0
              ? t("order.summary.free")
              : formatDA(totals.shipping)
        }
        highlight={totals.shipping === 0}
      />
      <Row label={t("order.summary.total")} value={formatDA(totals.total)} bold />
    </div>
  );
}
