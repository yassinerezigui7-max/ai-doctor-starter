"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { t } from "@/config/copy.fr";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import type { ProductImage } from "@/types";

interface ImageZoomProps {
  image: ProductImage;
  onClose: () => void;
}

const MAX_SCALE = 3;

/**
 * Full-screen zoom: click/tap toggles 1↔2×, drag pans when zoomed,
 * two-finger pinch zooms, swipe-down (unzoomed) or Esc closes.
 * Focus trapped on the close button; restored by the parent on unmount.
 */
export function ImageZoom({ image, onClose }: ImageZoomProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({
    startDist: 0,
    startScale: 1,
    startOffset: { x: 0, y: 0 },
    startPoint: { x: 0, y: 0 },
    moved: false,
  });

  useLockBodyScroll(true);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const clampOffset = (next: { x: number; y: number }, s: number) => {
    const limitX = (window.innerWidth * (s - 1)) / 2;
    const limitY = (window.innerHeight * (s - 1)) / 2;
    return {
      x: Math.max(-limitX, Math.min(limitX, next.x)),
      y: Math.max(-limitY, Math.min(limitY, next.y)),
    };
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
    const pts = [...pointers.current.values()];
    gesture.current.moved = false;
    gesture.current.startScale = scale;
    gesture.current.startOffset = offset;
    if (pts.length === 2) {
      gesture.current.startDist = Math.hypot(
        pts[0].x - pts[1].x,
        pts[0].y - pts[1].y,
      );
    } else {
      gesture.current.startPoint = { x: e.clientX, y: e.clientY };
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];

    if (pts.length === 2) {
      // pinch
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const next = Math.min(
        MAX_SCALE,
        Math.max(1, (gesture.current.startScale * dist) / gesture.current.startDist),
      );
      setScale(next);
      setOffset((o) => clampOffset(o, next));
      gesture.current.moved = true;
    } else if (pts.length === 1) {
      const dx = e.clientX - gesture.current.startPoint.x;
      const dy = e.clientY - gesture.current.startPoint.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) gesture.current.moved = true;
      if (scale > 1) {
        setOffset(
          clampOffset(
            {
              x: gesture.current.startOffset.x + dx,
              y: gesture.current.startOffset.y + dy,
            },
            scale,
          ),
        );
      }
    }
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    const start = gesture.current.startPoint;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;
    setDragging(false);

    const dy = e.clientY - start.y;
    const dx = e.clientX - start.x;
    if (scale === 1 && gesture.current.moved && dy > 80 && Math.abs(dx) < 120) {
      onClose(); // swipe down
      return;
    }
    if (!gesture.current.moved) {
      // tap/click: toggle zoom
      if (scale > 1) {
        setScale(1);
        setOffset({ x: 0, y: 0 });
      } else {
        setScale(2);
      }
    }
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Escape") onClose();
    // Single focusable element — trap Tab entirely.
    if (e.key === "Tab") e.preventDefault();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("gallery.zoomLabel", { alt: image.alt })}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 bg-ink/90 motion-safe:animate-[modal-fade_var(--dur-reveal)_var(--ease)]"
    >
      <div
        className="h-full w-full touch-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Image
          src={image.src.avif}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="100vw"
          className={cn(
            "h-full w-full object-contain select-none",
            scale === 1 && "cursor-zoom-in",
            scale > 1 && "cursor-grab active:cursor-grabbing",
          )}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 180ms var(--ease)",
          }}
          draggable={false}
        />
      </div>
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t("gallery.zoomClose")}
        className="absolute top-4 right-4 grid size-11 place-items-center rounded-pill bg-white/95 text-ink shadow-lift"
      >
        <svg
          className="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>,
    document.body,
  );
}

export default ImageZoom;
