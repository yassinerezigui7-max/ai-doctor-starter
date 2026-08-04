"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";
import { config, type ColorId } from "@/config/site.config";
import { t } from "@/config/copy.fr";
import { communesOf } from "@/data/communes";
import { findWilaya } from "@/data/wilayas";
import { computeTotals } from "@/lib/format";
import {
  orderFormSchema,
  type OrderFormOutput,
  type OrderFormValues,
} from "@/lib/validation";
import { draftStorage, type DraftShape } from "@/lib/storage";
import { useOrderSubmit } from "@/hooks/useOrderSubmit";
import { useProduct } from "@/components/product/ProductProvider";
import { Input } from "@/components/ui/Input";
import { WilayaSelect } from "@/components/order/WilayaSelect";
import { CommuneSelect } from "@/components/order/CommuneSelect";
import { DeliveryTypeRadio } from "@/components/order/DeliveryTypeRadio";
import { QuantityStepper } from "@/components/order/QuantityStepper";
import { OrderSummary } from "@/components/order/OrderSummary";
import { SubmitButton } from "@/components/order/SubmitButton";
import { useEffect, useRef } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
} from "react-hook-form";

const SuccessModal = dynamic(() => import("@/components/order/SuccessModal"), {
  ssr: false,
});
const ErrorModal = dynamic(() => import("@/components/order/ErrorModal"), {
  ssr: false,
});

/** Compact segmented control, two-way synced with the hero color selector. */
function ColorSegments() {
  const { colorId, setColor } = useProduct();
  return (
    <div className="flex flex-col gap-1.5">
      <span id="order-color-label" className="text-small font-medium text-ink">
        {t("order.fields.color.label")}
      </span>
      <div
        role="radiogroup"
        aria-labelledby="order-color-label"
        className="grid grid-cols-3 gap-2"
      >
        {config.colors.map((color) => {
          const checked = colorId === color.id;
          return (
            <button
              key={color.id}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => setColor(color.id)}
              onKeyDown={(e) => {
                const ids = config.colors.map((c) => c.id);
                const i = ids.indexOf(colorId);
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  setColor(ids[(i + 1) % ids.length]);
                } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setColor(ids[(i - 1 + ids.length) % ids.length]);
                }
              }}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-md border border-line-strong bg-white text-small font-medium text-ink",
                "transition-[border-color,background-color] duration-[180ms] ease-soft active:scale-[.97]",
                checked && "border-primary bg-primary-tint",
              )}
            >
              <span
                aria-hidden="true"
                className="size-3.5 rounded-pill border border-line"
                style={{ backgroundColor: color.swatch }}
              />
              {color.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Persists the draft to localStorage, debounced 400ms.
 * Isolated in its own component so per-keystroke value changes don't
 * re-render the whole form (and so OrderForm stays compiler-friendly).
 */
function DraftPersistence({ control }: { control: Control<OrderFormValues> }) {
  const values = useWatch({ control });
  const serialized = JSON.stringify(values);
  useEffect(() => {
    const timer = setTimeout(
      () => draftStorage.save(JSON.parse(serialized) as DraftShape),
      400,
    );
    return () => clearTimeout(timer);
  }, [serialized]);
  return null;
}

const FIELD_ORDER: (keyof OrderFormValues)[] = [
  "name",
  "phone",
  "wilaya",
  "commune",
  "color",
  "quantity",
  "deliveryType",
];

export function OrderForm() {
  const { colorId, quantity, setColor, setQuantity } = useProduct();

  const form = useForm<OrderFormValues, unknown, OrderFormOutput>({
    resolver: zodResolver(orderFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      wilaya: "",
      commune: "",
      color: colorId,
      quantity,
      deliveryType: config.delivery.default,
    },
  });
  const { register, handleSubmit, control, setValue, reset, formState } = form;

  // useWatch (not watch()) — subscribes without breaking React Compiler.
  const wilayaCode = useWatch({ control, name: "wilaya" });
  const deliveryType = useWatch({ control, name: "deliveryType" });
  const wilaya = wilayaCode ? findWilaya(wilayaCode) : null;
  const totals = computeTotals(quantity, wilaya, deliveryType);

  const submitter = useOrderSubmit(() => {
    // Success: clear the draft; the form resets when the modal closes.
    draftStorage.clear();
  });

  // Mirror context-owned color/quantity into the form payload.
  useEffect(() => {
    setValue("color", colorId);
  }, [colorId, setValue]);
  useEffect(() => {
    setValue("quantity", quantity);
  }, [quantity, setValue]);

  // Desk unavailable in this wilaya → force home delivery.
  useEffect(() => {
    if (wilaya && wilaya.shipping.desk === null && deliveryType === "desk") {
      setValue("deliveryType", "home", { shouldValidate: true });
    }
  }, [wilaya, deliveryType, setValue]);

  // Rehydrate the saved draft once on mount.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const draft = draftStorage.load();
    if (!draft) return;
    reset({
      name: draft.name ?? "",
      phone: draft.phone ?? "",
      wilaya: draft.wilaya ?? "",
      commune:
        draft.wilaya &&
        draft.commune &&
        communesOf(draft.wilaya).some((c) => c.name === draft.commune)
          ? draft.commune
          : "",
      color: config.colors.some((c) => c.id === draft.color)
        ? (draft.color as ColorId)
        : colorId,
      quantity: draft.quantity ?? quantity,
      deliveryType:
        draft.deliveryType === "desk" || draft.deliveryType === "home"
          ? draft.deliveryType
          : config.delivery.default,
    });
    if (draft.color && config.colors.some((c) => c.id === draft.color)) {
      setColor(draft.color as ColorId);
    }
    if (draft.quantity) setQuantity(draft.quantity);
  }, [reset, colorId, quantity, setColor, setQuantity]);

  const onValid = async (data: OrderFormOutput) => {
    const w = findWilaya(data.wilaya);
    const finalTotals = computeTotals(data.quantity, w, data.deliveryType);
    await submitter.submit({
      name: data.name,
      phone: data.phone,
      wilaya: data.wilaya,
      commune: data.commune,
      color: data.color as ColorId,
      quantity: data.quantity,
      deliveryType: data.deliveryType,
      shippingPrice: finalTotals.shipping ?? 0,
      total: finalTotals.total,
    });
  };

  const onInvalid = (errors: FieldErrors<OrderFormValues>) => {
    const first = FIELD_ORDER.find((key) => errors[key]);
    if (!first) return;
    const wrapper = document.getElementById(`field-${first}`);
    wrapper?.scrollIntoView({ behavior: "smooth", block: "center" });
    wrapper
      ?.querySelector<HTMLElement>("input:not([type=radio]), select, button")
      ?.focus({ preventScroll: true });
  };

  const errorCount = FIELD_ORDER.filter((key) => formState.errors[key]).length;
  const submitting = submitter.phase === "submitting";

  const closeSuccess = () => {
    submitter.acknowledge(true);
    reset({
      name: "",
      phone: "",
      wilaya: "",
      commune: "",
      color: colorId,
      quantity: config.quantity.default,
      deliveryType: config.delivery.default,
    });
    setQuantity(config.quantity.default);
    draftStorage.clear();
    document
      .getElementById("commander")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onValid, onInvalid)}
      className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card"
    >
      {formState.submitCount > 0 && errorCount > 0 && (
        <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-small text-danger">
          {t("order.errors.formErrors", { count: errorCount })}
        </p>
      )}

      <div id="field-name">
        <Input
          label={t("order.fields.name.label")}
          placeholder={t("order.fields.name.placeholder")}
          autoComplete="name"
          required
          error={formState.errors.name?.message}
          {...register("name")}
        />
      </div>

      <div id="field-phone">
        <Input
          label={t("order.fields.phone.label")}
          placeholder={t("order.fields.phone.placeholder")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          error={formState.errors.phone?.message}
          {...register("phone")}
        />
      </div>

      <div id="field-wilaya">
        <Controller
          control={control}
          name="wilaya"
          render={({ field, fieldState }) => (
            <WilayaSelect
              value={field.value}
              onChange={(code) => {
                field.onChange(code);
                setValue("commune", "");
              }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div id="field-commune">
        <Controller
          control={control}
          name="commune"
          render={({ field, fieldState }) => (
            <CommuneSelect
              wilayaCode={wilayaCode}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div id="field-color">
        <ColorSegments />
      </div>

      <div id="field-quantity">
        <QuantityStepper />
      </div>

      <div id="field-deliveryType">
        <Controller
          control={control}
          name="deliveryType"
          render={({ field, fieldState }) => (
            <DeliveryTypeRadio
              value={field.value}
              onChange={field.onChange}
              wilaya={wilaya}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <DraftPersistence control={control} />

      <OrderSummary
        quantity={quantity}
        wilaya={wilaya}
        deliveryType={deliveryType}
      />

      <SubmitButton total={totals.total} submitting={submitting} />
      <p className="text-center text-small text-muted">
        {config.pricing.freeShipping
          ? t("order.reassuranceFreeShipping")
          : t("order.reassurance")}
      </p>

      <SuccessModal
        open={submitter.phase === "success"}
        orderId={submitter.orderId ?? ""}
        onClose={closeSuccess}
      />
      <ErrorModal
        open={submitter.phase === "error"}
        onRetry={() => void submitter.retry()}
        onClose={() => submitter.acknowledge(false)}
        payload={submitter.lastPayload}
      />
    </form>
  );
}
