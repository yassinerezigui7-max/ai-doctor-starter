"use client";

import { cn } from "@/lib/cn";
import { t } from "@/config/copy.fr";
import { computeTotals, formatDA } from "@/lib/format";
import { useProduct } from "@/components/product/ProductProvider";
import { useStickyCta } from "@/hooks/useStickyCta";
import { scrollToOrder } from "@/components/ui/ScrollCta";
import { track } from "@/lib/analytics";

/**
 * Fixed bottom bar: live product price on the left, CTA on the right.
 * Shipping is unknown here (no wilaya yet), so it shows the product total.
 */
export function StickyCta() {
  const { quantity } = useProduct();
  const visible = useStickyCta();
  const { productTotal } = computeTotals(quantity, null, "home");

  return (
    <div
      id="sticky-cta"
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line",
        "bg-bg/85 backdrop-blur-[12px]",
        "pb-[env(safe-area-inset-bottom)]",
        "transition-[translate,opacity] duration-[320ms] ease-soft",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      {/* --primary-tint → transparent scrim keeps text legible over imagery */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-primary-tint to-transparent"
      />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <p className="min-w-0">
          <span className="sr-only">{t("sticky.priceLabel")} : </span>
          <span
            key={productTotal}
            className="num-swap inline-block text-[1.25rem] leading-tight font-semibold text-ink tabular-nums"
          >
            {formatDA(productTotal)}
          </span>
        </p>
        <button
          type="button"
          tabIndex={visible ? 0 : -1}
          onClick={() => {
            track("cta_click", { from: "sticky" });
            scrollToOrder();
          }}
          className={cn(
            "inline-flex h-14 shrink-0 items-center justify-center rounded-pill bg-primary px-7 font-medium text-white",
            "transition-[background-color,scale] duration-[180ms] ease-soft",
            "hover:bg-primary-press active:scale-[.97]",
          )}
        >
          {t("common.orderCta")}
        </button>
      </div>
    </div>
  );
}
