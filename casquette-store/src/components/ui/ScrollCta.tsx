"use client";

import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import type { ReactNode } from "react";

/**
 * Smooth-scrolls to the order section, then focuses its first empty field
 * (used by the hero CTA and the sticky bar).
 */
export function scrollToOrder(): void {
  const target = document.getElementById("commander");
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  // Focus the first empty field once the scroll settles.
  window.setTimeout(() => {
    const field = target.querySelector<HTMLElement>(
      "input:not([type=radio]):not([type=hidden]), select",
    );
    const firstEmpty = Array.from(
      target.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        "input:not([type=radio]):not([type=hidden]), select",
      ),
    ).find((el) => !el.value && !el.disabled);
    (firstEmpty ?? field)?.focus({ preventScroll: true });
  }, 450);
}

export function ScrollCta({
  children,
  size = "lg",
  className,
  id,
}: {
  children: ReactNode;
  size?: "md" | "lg" | "xl";
  className?: string;
  id?: string;
}) {
  return (
    <Button
      id={id}
      size={size}
      className={className}
      onClick={() => {
        track("cta_click");
        scrollToOrder();
      }}
    >
      {children}
    </Button>
  );
}
