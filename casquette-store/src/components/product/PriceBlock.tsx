"use client";

import { config } from "@/config/site.config";
import { t } from "@/config/copy.fr";
import { formatDA, unitPrice } from "@/lib/format";
import { useProduct } from "@/components/product/ProductProvider";

/** Current price large, compare-at struck through, discount pill. */
export function PriceBlock({ className }: { className?: string }) {
  const { quantity } = useProduct();
  const price = unitPrice(quantity);
  const compareAt = config.pricing.compareAtPrice;
  const percent =
    compareAt !== null ? Math.round((1 - price / compareAt) * 100) : 0;

  return (
    <p className={className}>
      <span className="sr-only">Prix : </span>
      <span
        key={price}
        className="num-swap inline-block text-[1.75rem] leading-none font-semibold text-ink"
      >
        {formatDA(price)}
      </span>
      {compareAt !== null && (
        <>
          {" "}
          <span className="ml-2 align-middle text-muted line-through">
            {formatDA(compareAt)}
          </span>
          <span className="ml-2 inline-block rounded-pill bg-primary-tint px-2.5 py-1 align-middle text-small font-medium text-primary">
            {t("hero.discountPill", { percent })}
          </span>
        </>
      )}
    </p>
  );
}
