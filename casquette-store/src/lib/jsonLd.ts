import { config } from "@/config/site.config";
import { REVIEWS, REVIEWS_SUMMARY } from "@/data/reviews";

/**
 * Structured data built from the same source the page renders — the reviews
 * below are the ones actually on the page, which is what makes the
 * aggregateRating legitimate. Never describe content that isn't rendered.
 */
export function productJsonLd(ogImage: string) {
  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: config.store.productTitle,
    description: config.store.shortDescription,
    image: [ogImage],
    brand: { "@type": "Brand", name: config.store.name },
    offers: {
      "@type": "Offer",
      url: config.seo.siteUrl,
      priceCurrency: config.currency.code,
      price: config.pricing.price,
      priceValidUntil: priceValidUntil.toISOString().slice(0, 10),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: config.store.name },
    },
    // Only valid because these exact reviews are rendered on the page.
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: REVIEWS_SUMMARY.rating,
      reviewCount: REVIEWS_SUMMARY.count,
      bestRating: 5,
    },
    review: REVIEWS.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
      },
      reviewBody: r.body,
    })),
  };
}

