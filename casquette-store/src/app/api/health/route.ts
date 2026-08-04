import { NextResponse } from "next/server";

/**
 * Deployment self-check: answers "is this site wired to the sheet?" without
 * revealing any secret. Reports only whether each variable is present, its
 * length, and the host of the endpoint — never the values themselves.
 *
 * Use it whenever orders stop arriving:  curl https://<site>/api/health
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const endpoint = process.env.ORDER_ENDPOINT ?? "";
  const token = process.env.ORDER_TOKEN ?? "";
  const publicEndpoint = process.env.NEXT_PUBLIC_ORDER_ENDPOINT ?? "";

  let endpointHost: string | null = null;
  try {
    endpointHost = endpoint ? new URL(endpoint).host : null;
  } catch {
    endpointHost = "INVALID_URL";
  }

  const ready = endpoint !== "" && token !== "" && publicEndpoint !== "";

  return NextResponse.json(
    {
      ordersReachTheSheet: ready,
      verdict: ready
        ? "Configured — orders are forwarded to Google Sheets."
        : "MOCK MODE — orders are accepted and silently discarded. Set the missing variables below, then redeploy with 'Clear cache and deploy site'.",
      variables: {
        NEXT_PUBLIC_ORDER_ENDPOINT: publicEndpoint || "(missing)",
        ORDER_ENDPOINT: endpoint
          ? `set — host: ${endpointHost}, length: ${endpoint.length}`
          : "(missing)",
        ORDER_TOKEN: token ? `set — length: ${token.length}` : "(missing)",
      },
      // Helps spot a whitespace/newline pasted into a value.
      warnings: [
        endpoint !== endpoint.trim() && "ORDER_ENDPOINT has leading/trailing whitespace",
        token !== token.trim() && "ORDER_TOKEN has leading/trailing whitespace",
        endpoint !== "" && !endpoint.endsWith("/exec") &&
          "ORDER_ENDPOINT should end with /exec",
      ].filter(Boolean),
      siteUrl: process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? null,
      builtAt: process.env.BUILD_ID ?? null,
      /**
       * Which IP header this host actually sends. If every entry is null the
       * rate limiter cannot identify callers and deliberately stops limiting,
       * rather than lumping all customers into one bucket.
       */
      rateLimiting: {
        detected: [
          "x-nf-client-connection-ip",
          "x-forwarded-for",
          "x-real-ip",
        ].find((h) => request.headers.get(h)) ?? "none — rate limiting disabled",
        maxPer10Min: 30,
      },
    },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
