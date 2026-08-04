/**
 * Analytics stub — no third-party SDK ships with the page (performance
 * budget). Events are logged in dev; wire a provider here later if needed.
 */
type EventName =
  | "cta_click"
  | "color_select"
  | "order_submit"
  | "order_success"
  | "order_error"
  | "whatsapp_click";

export function track(event: EventName, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[analytics] ${event}`, data ?? {});
  }
}
