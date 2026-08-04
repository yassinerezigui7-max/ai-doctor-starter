"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { t } from "@/config/copy.fr";
import { useToast } from "@/hooks/useToast";

interface SuccessModalProps {
  open: boolean;
  orderId: string;
  onClose: () => void;
}

export function SuccessModal({ open, orderId, onClose }: SuccessModalProps) {
  const { toast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast(t("common.copied"), "success");
    } catch {
      /* clipboard unavailable — the id stays visible */
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="order-success-title">
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="grid size-16 place-items-center rounded-pill bg-success/10 text-success"
        >
          <svg
            className="size-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m4.5 12.5 5 5 10-11" />
          </svg>
        </span>
        <h3 id="order-success-title" className="font-display text-h2 text-ink">
          {t("order.success.title")}
        </h3>
        <div className="flex w-full items-center justify-between gap-3 rounded-md border border-line bg-white px-4 py-3">
          <span className="min-w-0 text-left">
            <span className="block text-micro tracking-[0.08em] text-muted uppercase">
              {t("order.success.orderIdLabel")}
            </span>
            <span className="font-medium break-all text-ink">{orderId}</span>
          </span>
          <Button variant="secondary" size="md" onClick={copy}>
            {t("common.copy")}
          </Button>
        </div>
        <p className="text-small text-muted">{t("order.success.body")}</p>
        <Button size="lg" className="w-full" onClick={onClose}>
          {t("common.close")}
        </Button>
      </div>
    </Modal>
  );
}

export default SuccessModal;
