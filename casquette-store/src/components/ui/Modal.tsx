"use client";

import { cn } from "@/lib/cn";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name — id of the heading inside, or a label */
  labelledBy?: string;
  label?: string;
  children: ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Focus-trapped dialog: Esc closes, overlay click closes, focus restored
 * to the trigger on close, body scroll locked while open.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  label,
  children,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();
    return () => previousFocus.current?.focus();
  }, [open]);

  // Modals only open from client interaction, so document is always
  // available here; the guard covers a hypothetical open-on-SSR misuse.
  if (!open || typeof document === "undefined") return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0 bg-ink/40 motion-safe:animate-[modal-fade_var(--dur-modal)_var(--ease)]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-md rounded-lg bg-surface p-6 shadow-lift",
          "motion-safe:animate-[modal-pop_var(--dur-modal)_var(--ease)]",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
