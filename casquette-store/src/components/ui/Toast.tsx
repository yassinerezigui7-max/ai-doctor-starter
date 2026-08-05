"use client";

import { cn } from "@/lib/cn";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

export type ToastVariant = "default" | "success" | "danger";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS = 4000;
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((it) => it.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = "default") => {
    setItems((list) => [...list, { id: nextId++, message, variant }]);
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* bottom-center on mobile, top-right on desktop */}
      <div
        aria-label="Notifications"
        className={cn(
          "pointer-events-none fixed z-[60] flex flex-col items-center gap-2",
          "inset-x-4 bottom-[calc(var(--sticky-cta-space,0px)+1rem)]",
          "sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-auto sm:items-end",
        )}
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; dx: number } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { startX: e.clientX, dx: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !ref.current) return;
    drag.current.dx = e.clientX - drag.current.startX;
    ref.current.style.translate = `${drag.current.dx}px 0`;
    ref.current.style.opacity = String(
      Math.max(0.2, 1 - Math.abs(drag.current.dx) / 160),
    );
  };
  const onPointerUp = () => {
    if (!drag.current || !ref.current) return;
    if (Math.abs(drag.current.dx) > 60) {
      onDismiss(item.id);
    } else {
      ref.current.style.translate = "0 0";
      ref.current.style.opacity = "1";
    }
    drag.current = null;
  };

  return (
    <div
      ref={ref}
      role="status"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "pointer-events-auto flex touch-pan-y items-center gap-2 rounded-md px-4 py-3 shadow-lift select-none",
        "motion-safe:animate-[toast-in_var(--dur-reveal)_var(--ease)]",
        item.variant === "success" && "bg-success text-white",
        item.variant === "danger" && "bg-danger text-white",
        item.variant === "default" && "border border-line-strong bg-white text-ink",
      )}
    >
      <span className="text-small font-medium">{item.message}</span>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
