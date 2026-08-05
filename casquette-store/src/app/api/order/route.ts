import { NextResponse } from "next/server";
import { config } from "@/config/site.config";
import { computeTotals } from "@/lib/format";
import { orderPayloadSchema } from "@/lib/validation";
import { findWilaya } from "@/data/wilayas";

/**
 * Server proxy to the Google Apps Script endpoint.
 * - hides the Apps Script URL from the browser (and avoids CORS)
 * - recomputes ALL money fields from the bundled wilaya data (clients lie)
 * - adds an Africa/Algiers timestamp + status
 * - rate-limits 5 requests / 10 min / IP
 * Requires a Node runtime (documented in DEPLOYMENT.md).
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((ts) => now - ts < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Opportunistic cleanup so the map cannot grow unbounded.
  if (hits.size > 5000) {
    for (const [key, list] of hits) {
      if (list.every((ts) => now - ts >= WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

/** ISO timestamp in Africa/Algiers (UTC+01, no DST). */
function algiersTimestamp(): string {
  const local = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Africa/Algiers",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date());
  return `${local.replace(" ", "T")}+01:00`;
}

/**
 * Server-side only. Prints the exact body we sent (token redacted) plus what
 * came back, so a misconfigured Apps Script deployment is diagnosable without
 * guessing. Never runs in production and never reaches the client.
 */
function logUpstreamFailure(
  body: Record<string, unknown>,
  reason: string,
  res: Response,
  raw?: string,
) {
  if (process.env.NODE_ENV === "production") return;
  const safe = { ...body };
  delete safe.token; // never print the shared secret
  console.error(
    `\n[order] upstream rejected the order — ${reason}\n` +
      `  status      : ${res.status} ${res.statusText}\n` +
      `  content-type: ${res.headers.get("content-type") ?? "?"}\n` +
      `  forwarded   : ${JSON.stringify(safe, null, 2).replace(/\n/g, "\n  ")}\n` +
      (raw
        ? `  response    : ${raw.slice(0, 200).replace(/\s+/g, " ")}${raw.length > 200 ? "…" : ""}\n`
        : "") +
      (res.status === 401 || /accounts\.google\.com/.test(raw ?? "")
        ? `  → Google is asking for a login. In Apps Script: Deploy ▸ Manage\n` +
          `    deployments ▸ edit ▸ "Who has access" = Anyone, then redeploy.\n`
        : ""),
  );
}

/**
 * Dev-only receipt of what actually went to the sheet, in column order, so a
 * row can be diffed against it without guessing. Token never printed.
 */
function logForwarded(body: Record<string, unknown>, duplicate: boolean) {
  if (process.env.NODE_ENV === "production") return;
  const columns = [
    "timestamp", "orderId", "name", "phone", "wilaya", "commune",
    "color", "quantity", "deliveryType", "shippingPrice", "total", "status",
  ];
  console.info(
    `\n[order] ${duplicate ? "DUPLICATE — script skipped the append" : "row appended"}\n` +
      columns
        .map((c, i) => `  ${String(i + 1).padStart(2)}. ${c.padEnd(14)} ${JSON.stringify(body[c])}`)
        .join("\n") +
      "\n",
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "bad_json" }, { status: 400 });
  }

  const parsed = orderPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  }
  const order = parsed.data;

  // Money is OURS to compute — ignore whatever the client sent.
  const wilaya = findWilaya(order.wilaya);
  if (!wilaya) {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  }
  const totals = computeTotals(order.quantity, wilaya, order.deliveryType);

  const upstreamBody = {
    token: process.env.ORDER_TOKEN ?? "",
    timestamp: algiersTimestamp(),
    orderId: order.orderId,
    name: order.name,
    phone: order.phone,
    wilaya: `${wilaya.code} — ${wilaya.name}`,
    commune: order.commune,
    color: order.color,
    quantity: order.quantity,
    deliveryType: order.deliveryType,
    shippingPrice: totals.shipping ?? 0,
    total: totals.total,
    status: config.order.defaultStatus,
  };

  const endpoint = process.env.ORDER_ENDPOINT;
  if (!endpoint) {
    // Mock mode server-side too: accept and log, so the flow is testable.
    console.info("[mock order] no ORDER_ENDPOINT set; would forward:", upstreamBody);
    return NextResponse.json({ ok: true, orderId: order.orderId });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.order.timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-order-token": process.env.ORDER_TOKEN ?? "",
      },
      body: JSON.stringify(upstreamBody),
      signal: controller.signal,
      redirect: "follow", // Apps Script answers via a 302 to script.googleusercontent.com
    });
    if (!res.ok) {
      logUpstreamFailure(upstreamBody, `HTTP ${res.status}`, res);
      return NextResponse.json({ ok: false, code: "upstream" }, { status: 502 });
    }
    type UpstreamReply = { ok?: boolean; duplicate?: boolean } | null;
    const raw = await res.text();
    let data: UpstreamReply = null;
    try {
      data = JSON.parse(raw) as UpstreamReply;
    } catch {
      // Apps Script returned HTML (sign-in page, error page) instead of JSON.
      logUpstreamFailure(upstreamBody, "non-JSON response", res, raw);
      return NextResponse.json({ ok: false, code: "upstream" }, { status: 502 });
    }
    if (!data?.ok) {
      // Never leak upstream error text to the client.
      logUpstreamFailure(upstreamBody, "script returned ok:false", res, raw);
      return NextResponse.json({ ok: false, code: "upstream" }, { status: 502 });
    }
    logForwarded(upstreamBody, data.duplicate ?? false);
    return NextResponse.json({
      ok: true,
      orderId: order.orderId,
      duplicate: data.duplicate ?? false,
    });
  } catch {
    return NextResponse.json({ ok: false, code: "timeout" }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}
