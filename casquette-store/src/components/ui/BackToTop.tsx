"use client";

import { cn } from "@/lib/cn";
import { t } from "@/config/copy.fr";
import { useStickyCta } from "@/hooks/useStickyCta";
import { useEffect, useState } from "react";

/** Appears after 2 viewport heights; hidden while the sticky bar is up. */
export function BackToTop() {
  const [scrolled, setScrolled] = useState(false);
  const stickyVisible = useStickyCta();

  useEffect(() => {
    const sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:200vh;height:1px;width:1px;";
    sentinel.setAttribute("aria-hidden", "true");
    document.body.appendChild(sentinel);
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(sentinel);
    return () => {
      io.disconnect();
      sentinel.remove();
    };
  }, []);

  const visible = scrolled && !stickyVisible;

  return (
    <button
      type="button"
      aria-label={t("common.backToTop")}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30",
        "grid size-12 place-items-center rounded-pill border border-line-strong bg-white text-primary shadow-card",
        "transition-[translate,opacity,scale] duration-[320ms] ease-soft active:scale-[.97]",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <svg
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
