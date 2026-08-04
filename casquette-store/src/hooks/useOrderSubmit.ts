"use client";

import { config } from "@/config/site.config";
import { t } from "@/config/copy.fr";
import { track } from "@/lib/analytics";
import { generateOrderId } from "@/lib/orderId";
import { pendingStorage } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderPayload, OrderResponse, SubmitPhase } from "@/types";

/** Module-level guard: blocks double taps / Enter repeats across re-renders. */
let inFlight = false;

const BACKOFF_MS = [1000, 3000];

class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

async function postOnce(payload: OrderPayload): Promise<OrderResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.order.timeoutMs);
  try {
    // Usually "/api/order" (the proxy route) — see .env.example.
    const res = await fetch(config.order.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) throw new HttpError(res.status);
    return (await res.json()) as OrderResponse;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sends one order. Mock mode when no endpoint is configured (900ms simulated
 * request, payload logged). Real mode retries on network errors and 5xx only,
 * with 1s/3s backoff.
 */
async function sendOrder(payload: OrderPayload): Promise<OrderResponse> {
  if (config.order.endpoint === "") {
    await new Promise((r) => setTimeout(r, 900));
    console.info("[mock order] payload that would be sent:", payload);
    return { ok: true, orderId: payload.orderId };
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= config.order.retries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) =>
        setTimeout(r, BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)]),
      );
    }
    try {
      return await postOnce(payload);
    } catch (err) {
      lastError = err;
      // 4xx: never retry — the request is wrong, not the network.
      if (err instanceof HttpError && err.status < 500) {
        return { ok: false, code: `http_${err.status}` };
      }
    }
  }
  throw lastError;
}

interface UseOrderSubmit {
  phase: SubmitPhase;
  orderId: string | null;
  /** Submit a payload (without orderId — managed here, stable across retries). */
  submit: (data: Omit<OrderPayload, "orderId">) => Promise<void>;
  retry: () => Promise<void>;
  /** Back to idle (closing modals). `completed` also rotates the order id. */
  acknowledge: (completed: boolean) => void;
  lastPayload: OrderPayload | null;
}

export function useOrderSubmit(onSuccess: (orderId: string) => void): UseOrderSubmit {
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  // Refs drive the logic (synchronous, stable across retries);
  // the state mirrors exist only for rendering.
  const orderIdRef = useRef<string | null>(null);
  const lastPayloadRef = useRef<OrderPayload | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<OrderPayload | null>(null);
  const { toast } = useToast();

  const run = useCallback(
    async (payload: OrderPayload) => {
      if (inFlight) return;
      inFlight = true;
      setPhase("submitting");
      track("order_submit", { orderId: payload.orderId });
      try {
        const res = await sendOrder(payload);
        if (res.ok) {
          pendingStorage.remove(payload.orderId);
          setPhase("success");
          track("order_success", { orderId: payload.orderId });
          onSuccess(payload.orderId);
        } else {
          setPhase("error");
          track("order_error", { code: res.code });
        }
      } catch {
        // Network failure (or repeated 5xx): queue it — never drop an order.
        pendingStorage.push(payload);
        setPhase("error");
        track("order_error", { code: "network" });
      } finally {
        inFlight = false;
      }
    },
    [onSuccess],
  );

  const submit = useCallback(
    async (data: Omit<OrderPayload, "orderId">) => {
      // One id per form session, reused across retries → no duplicate rows.
      orderIdRef.current ??= generateOrderId();
      setOrderId(orderIdRef.current);
      const payload: OrderPayload = { ...data, orderId: orderIdRef.current };
      lastPayloadRef.current = payload;
      setLastPayload(payload);
      await run(payload);
    },
    [run],
  );

  const retry = useCallback(async () => {
    if (lastPayloadRef.current) await run(lastPayloadRef.current);
  }, [run]);

  const acknowledge = useCallback((completed: boolean) => {
    setPhase("idle");
    if (completed) {
      orderIdRef.current = null;
      lastPayloadRef.current = null;
      setOrderId(null);
      setLastPayload(null);
    }
  }, []);

  // Flush queued orders on mount and whenever the connection returns.
  useEffect(() => {
    let cancelled = false;
    const flush = async () => {
      for (const payload of pendingStorage.load()) {
        if (cancelled || inFlight) return;
        try {
          const res = await sendOrder(payload);
          if (res.ok || (res.code?.startsWith("http_4") ?? false)) {
            pendingStorage.remove(payload.orderId);
            if (res.ok) toast(t("order.queued.sent"), "success");
          }
        } catch {
          return; // still offline — keep the queue intact
        }
      }
    };
    void flush();
    window.addEventListener("online", flush);
    return () => {
      cancelled = true;
      window.removeEventListener("online", flush);
    };
  }, [toast]);

  return { phase, orderId, submit, retry, acknowledge, lastPayload };
}
