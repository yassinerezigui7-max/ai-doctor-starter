"use client";

import { Button } from "@/components/ui/Button";
import { t } from "@/config/copy.fr";
import { formatDA } from "@/lib/format";

interface SubmitButtonProps {
  total: number;
  submitting: boolean;
}

/** Full-width pill with the live total baked into the label. */
export function SubmitButton({ total, submitting }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      size="xl"
      loading={submitting}
      className="w-full"
    >
      {submitting
        ? t("order.submitting")
        : t("order.submitLabel", { total: formatDA(total) })}
    </Button>
  );
}
