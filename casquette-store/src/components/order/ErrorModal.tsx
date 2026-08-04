"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { config } from "@/config/site.config";
import { t } from "@/config/copy.fr";
import { track } from "@/lib/analytics";
import type { OrderPayload } from "@/types";

interface ErrorModalProps {
  open: boolean;
  onRetry: () => void;
  onClose: () => void;
  payload: OrderPayload | null;
}

export function ErrorModal({ open, onRetry, onClose, payload }: ErrorModalProps) {
  const colorLabel =
    config.colors.find((c) => c.id === payload?.color)?.label ?? "";
  const whatsappHref =
    config.store.whatsapp !== "" && payload
      ? `https://wa.me/${config.store.whatsapp}?text=${encodeURIComponent(
          t("whatsapp.prefillOrder", {
            product: config.store.productTitle,
            color: colorLabel,
            qty: payload.quantity,
            wilaya: payload.wilaya,
            orderId: payload.orderId,
          }),
        )}`
      : null;

  return (
    <Modal open={open} onClose={onClose} labelledBy="order-error-title">
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="grid size-16 place-items-center rounded-pill bg-danger/10 text-danger"
        >
          <svg
            className="size-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 7v6M12 16.5v.5" />
            <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
          </svg>
        </span>
        <h3 id="order-error-title" className="font-display text-h2 text-ink">
          {t("order.error.title")}
        </h3>
        <p className="text-small text-muted">{t("order.error.body")}</p>
        <Button size="lg" className="w-full" onClick={onRetry}>
          {t("common.retry")}
        </Button>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_click", { from: "error_modal" })}
            className="inline-flex h-14 w-full items-center justify-center rounded-pill border border-line bg-white font-medium text-primary transition-[border-color] duration-[180ms] ease-soft hover:border-primary"
          >
            {t("order.error.whatsappCta")}
          </a>
        )}
        <Button variant="ghost" size="md" onClick={onClose}>
          {t("common.close")}
        </Button>
      </div>
    </Modal>
  );
}

export default ErrorModal;
