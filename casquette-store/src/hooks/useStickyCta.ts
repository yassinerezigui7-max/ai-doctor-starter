"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared store: the bar is visible once the hero CTA has scrolled out of view,
 * and hidden again when the order section is ≥30% visible. Pure
 * IntersectionObserver — no scroll math. Both StickyCta and BackToTop read
 * this, so the observers are created once and only one writer owns
 * --sticky-cta-space (the body padding that keeps the bar off the footer).
 */
const HIDE_AT = 0.3;
const STEPS = Array.from({ length: 21 }, (_, i) => i / 20);

let visible = false;
let heroPassed = false;
let orderVisible = false;
const listeners = new Set<() => void>();
let observers: IntersectionObserver[] = [];

function setSpace(px: number) {
  document.documentElement.style.setProperty("--sticky-cta-space", `${px}px`);
}

function recompute() {
  const next = heroPassed && !orderVisible;
  if (next === visible) return;
  visible = next;
  // Measure the real bar so the reserved space always matches it exactly
  // (padding, borders and the iOS safe-area inset included).
  const bar = document.getElementById("sticky-cta");
  setSpace(visible ? (bar?.offsetHeight ?? 76) : 0);
  listeners.forEach((fn) => fn());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);

  if (observers.length === 0) {
    const heroCta = document.getElementById("hero-cta");
    const orderSection = document.getElementById("commander");

    if (heroCta) {
      const io = new IntersectionObserver(
        ([entry]) => {
          heroPassed = !entry.isIntersecting;
          recompute();
        },
        { threshold: 0 },
      );
      io.observe(heroCta);
      observers.push(io);
    }
    if (orderSection) {
      const io = new IntersectionObserver(
        ([entry]) => {
          // The order section is taller than the viewport, so the raw
          // intersectionRatio (visible ÷ element height) never reaches 30%.
          // Measure against whichever is smaller: the viewport or the element.
          const reference = Math.min(
            entry.rootBounds?.height ?? window.innerHeight,
            entry.boundingClientRect.height,
          );
          orderVisible =
            reference > 0 && entry.intersectionRect.height / reference >= HIDE_AT;
          recompute();
        },
        { threshold: STEPS },
      );
      io.observe(orderSection);
      observers.push(io);
    }
  }

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      observers.forEach((io) => io.disconnect());
      observers = [];
      setSpace(0);
    }
  };
}

export function useStickyCta(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => visible,
    () => false,
  );
}
