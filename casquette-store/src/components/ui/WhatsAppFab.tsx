"use client";

import { config } from "@/config/site.config";
import { t } from "@/config/copy.fr";
import { track } from "@/lib/analytics";

/** Bottom-left so it never collides with BackToTop (bottom-right). */
export function WhatsAppFab() {
  if (config.store.whatsapp === "") return null;

  const href = `https://wa.me/${config.store.whatsapp}?text=${encodeURIComponent(
    t("whatsapp.prefill", { product: config.store.productTitle }),
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("whatsapp.label")}
      onClick={() => track("whatsapp_click", { from: "fab" })}
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom)+var(--sticky-cta-space,0px))] left-4 z-30 grid size-12 place-items-center rounded-pill bg-success text-white shadow-card transition-[scale] duration-[180ms] ease-soft active:scale-[.97]"
    >
      <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.86 9.86 0 0 0 4.74 1.21c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.02c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.15.82.84-3.07-.2-.32a8.2 8.2 0 0 1-1.26-4.38c0-4.53 3.69-8.21 8.22-8.21 4.53 0 8.21 3.68 8.21 8.21s-3.68 8.29-8.11 8.29zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.22-.09-.39-.13-.55.12s-.63.8-.77.96c-.14.17-.28.19-.53.06a6.7 6.7 0 0 1-1.97-1.22 7.4 7.4 0 0 1-1.37-1.7c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.31s-.84.82-.84 2 .86 2.32.98 2.48c.12.17 1.7 2.6 4.12 3.65.58.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.46-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.28z" />
      </svg>
    </a>
  );
}
