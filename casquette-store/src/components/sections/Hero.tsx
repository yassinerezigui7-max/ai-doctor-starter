import { config } from "@/config/site.config";
import { t } from "@/config/copy.fr";
import { ColorSelector } from "@/components/product/ColorSelector";
import { HeroImage } from "@/components/product/HeroImage";
import { PriceBlock } from "@/components/product/PriceBlock";
import { ScrollCta } from "@/components/ui/ScrollCta";

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-2 text-small text-muted">
      <span aria-hidden="true" className="text-primary">
        {icon}
      </span>
      {label}
    </li>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-6xl px-4">
      <div className="grid items-center gap-8 py-8 md:grid-cols-2 md:gap-14 md:py-16">
        {/* Image first on mobile, right column on desktop.
            At 390×844 the 4/5 frame is 448px and the title and price stay above
            the fold. The cap only bites on shorter phones (SE-class, ≤700px),
            where the frame would otherwise swallow the price. object-cover
            crops; it never letterboxes. */}
        <HeroImage className="max-h-[58svh] rounded-lg shadow-card md:order-2 md:max-h-none" />

        <div className="flex flex-col gap-5 md:order-1">
          <p className="eyebrow">{t("hero.eyebrow")}</p>
          <h1 className="font-display text-display text-ink">
            {config.store.productTitle}
          </h1>
          <p className="max-w-prose text-muted">
            {config.store.shortDescription}
          </p>

          <PriceBlock />
          <ColorSelector />

          <ScrollCta id="hero-cta" size="xl" className="w-full sm:w-auto sm:self-start">
            {t("common.orderCta")}
          </ScrollCta>

          <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
            {config.pricing.freeShipping && (
              <TrustItem
                label={t("hero.trustFreeShipping")}
                icon={
                  <svg className="size-4" viewBox="0 0 24 24" {...stroke}>
                    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
                    <circle cx="7" cy="18" r="1.6" />
                    <circle cx="17" cy="18" r="1.6" />
                  </svg>
                }
              />
            )}
            <TrustItem
              label={t("hero.trust1")}
              icon={
                <svg className="size-4" viewBox="0 0 24 24" {...stroke}>
                  <rect x="3" y="6" width="18" height="13" rx="2.5" />
                  <path d="M3 10h18M7 15h4" />
                </svg>
              }
            />
            <TrustItem
              label={t("hero.trust2")}
              icon={
                <svg className="size-4" viewBox="0 0 24 24" {...stroke}>
                  <path d="M4 9V5.5M4 9h3.5M4 9l2.6-2.6a8 8 0 1 1-2.2 7.1" />
                </svg>
              }
            />
            <TrustItem
              label={t("hero.trust3")}
              icon={
                <svg className="size-4" viewBox="0 0 24 24" {...stroke}>
                  <path d="M12 3l7 3v5c0 4.4-3 8.4-7 10-4-1.6-7-5.6-7-10V6l7-3z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              }
            />
          </ul>
        </div>
      </div>
    </section>
  );
}
