"use client";

import { RadioCard } from "@/components/ui/RadioCard";
import { config, type DeliveryTypeId } from "@/config/site.config";
import { t } from "@/config/copy.fr";
import { formatDA } from "@/lib/format";
import type { Wilaya } from "@/types";

interface DeliveryTypeRadioProps {
  value: DeliveryTypeId;
  onChange: (value: DeliveryTypeId) => void;
  wilaya: Wilaya | null;
  error?: string;
}

/** Stacked radio cards with the live price on the right. */
export function DeliveryTypeRadio({
  value,
  onChange,
  wilaya,
  error,
}: DeliveryTypeRadioProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-small font-medium text-ink">
        {t("order.fields.delivery.label")}
      </legend>
      <div className="flex flex-col gap-3">
        {config.delivery.types.map((type) => {
          const unavailable =
            type.id === "desk" && wilaya !== null && wilaya.shipping.desk === null;
          // With free shipping on, neither card shows a price — there is nothing
          // to compare. The stopdesk availability rule still applies.
          const price = config.pricing.freeShipping
            ? null
            : wilaya === null
              ? null
              : type.id === "desk"
                ? wilaya.shipping.desk
                : wilaya.shipping.home;
          return (
            <RadioCard
              key={type.id}
              name="deliveryType"
              value={type.id}
              checked={value === type.id}
              disabled={unavailable}
              onChange={() => onChange(type.id)}
              title={type.label}
              hint={unavailable ? t("order.fields.delivery.unavailable") : type.hint}
              right={
                price === null ? undefined : (
                  <span key={price} className="num-swap inline-block text-ink">
                    {formatDA(price)}
                  </span>
                )
              }
            />
          );
        })}
      </div>
      {error && <p className="text-small text-danger">{error}</p>}
    </fieldset>
  );
}
