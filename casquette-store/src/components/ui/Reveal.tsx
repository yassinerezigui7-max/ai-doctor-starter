"use client";

import { cn } from "@/lib/cn";
import { useReveal } from "@/hooks/useReveal";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger index — each step delays by 60ms */
  step?: number;
  className?: string;
}

/** Scroll reveal: 16px translate-Y + opacity, once, at 15% visibility. */
export function Reveal({ children, step = 0, className }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      style={step ? { ["--reveal-delay" as string]: `${step * 60}ms` } : undefined}
    >
      {children}
    </div>
  );
}
