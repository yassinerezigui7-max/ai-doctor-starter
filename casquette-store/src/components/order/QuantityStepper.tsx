"use client";

import { cn } from "@/lib/cn";
import { config } from "@/config/site.config";
import { t } from "@/config/copy.fr";
import { useProduct } from "@/components/product/ProductProvider";

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-md border border-line-strong bg-white text-ink",
        "transition-[border-color,background-color,scale] duration-[180ms] ease-soft",
        "active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-40",
        "hover:border-primary",
      )}
    >
      {children}
    </button>
  );
}

/** − 1 + stepper, 44px targets, clamped to config, synced with ProductProvider. */
export function QuantityStepper() {
  const { quantity, setQuantity } = useProduct();

  return (
    <div className="flex flex-col gap-1.5">
      <span id="qty-label" className="text-small font-medium text-ink">
        {t("order.fields.quantity.label")}
      </span>
      <div
        className="flex items-center gap-3"
        role="group"
        aria-labelledby="qty-label"
      >
        <StepButton
          label={t("order.fields.quantity.decrease")}
          onClick={() => setQuantity(quantity - 1)}
          disabled={quantity <= config.quantity.min}
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </StepButton>
        <output
          aria-live="polite"
          className="min-w-10 text-center text-[18px] font-semibold text-ink tabular-nums"
        >
          <span key={quantity} className="num-swap inline-block">
            {quantity}
          </span>
        </output>
        <StepButton
          label={t("order.fields.quantity.increase")}
          onClick={() => setQuantity(quantity + 1)}
          disabled={quantity >= config.quantity.max}
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </StepButton>
      </div>
    </div>
  );
}
