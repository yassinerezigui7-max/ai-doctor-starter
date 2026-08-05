"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import { useEffect, useRef, useState } from "react";

/**
 * The form pulls in zod, react-hook-form and the 1 524-commune dataset — about
 * 100 KB gzipped that nothing above the fold needs. Loading it here keeps the
 * initial bundle small without ever making the customer wait:
 *
 *   • fetched during the first idle moment after hydration, so on a normal
 *     connection it is ready long before anyone scrolls this far;
 *   • also fetched as soon as the section comes within 600px of the viewport,
 *     which covers slow connections and instant jumps from the CTA;
 *   • the skeleton reserves the real height, so nothing shifts (CLS 0).
 */
const OrderForm = dynamic(
  () => import("@/components/order/OrderForm").then((m) => m.OrderForm),
  { ssr: false, loading: () => <OrderFormSkeleton /> },
);

/**
 * Mirrors the real form row-for-row (83/83/83/83/75/71/186/107/60/21 px,
 * gap-4, p-5 → 1037px), so the swap moves nothing. Re-measure with
 * `[...form.children].map(el => el.getBoundingClientRect().height)`
 * if you add or resize a field.
 */
function OrderFormSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card"
    >
      {/* name · phone · wilaya · commune — label + 56px control */}
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex h-[83px] flex-col gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-14 w-full" />
        </div>
      ))}
      {/* color segments */}
      <div className="flex h-[75px] flex-col gap-1.5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-full" />
      </div>
      {/* quantity stepper */}
      <div className="flex h-[71px] flex-col gap-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-11 w-40" />
      </div>
      {/* delivery type — legend + two cards */}
      <div className="flex h-[186px] flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-[70px] w-full" />
        <Skeleton className="h-[70px] w-full" />
      </div>
      {/* summary */}
      <div className="flex h-[107px] flex-col gap-2 border-t border-dashed border-line pt-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-7 w-full" />
      </div>
      <Skeleton className="h-[60px] w-full rounded-pill" />
      <Skeleton className="mx-auto h-[21px] w-64" />
    </div>
  );
}

export function OrderFormLoader() {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) return;
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setShow(true);
    };

    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = hasIdle
      ? window.requestIdleCallback(reveal, { timeout: 2500 })
      : window.setTimeout(reveal, 1500);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { rootMargin: "600px 0px" },
    );
    if (ref.current) io.observe(ref.current);

    return () => {
      cancelled = true;
      io.disconnect();
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [show]);

  return <div ref={ref}>{show ? <OrderForm /> : <OrderFormSkeleton />}</div>;
}
