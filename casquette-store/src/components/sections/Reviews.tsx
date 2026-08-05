import { t } from "@/config/copy.fr";
import { REVIEWS, REVIEWS_SUMMARY } from "@/data/reviews";
import { Rating } from "@/components/ui/Rating";
import { Reveal } from "@/components/ui/Reveal";
import type { Review } from "@/types";

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-11 shrink-0 place-items-center rounded-pill border border-line-strong bg-surface-alt font-medium text-primary"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex h-full w-[82%] shrink-0 snap-start flex-col gap-3 rounded-lg border border-line bg-surface p-5 shadow-card sm:w-[46%] lg:w-auto lg:shrink">
      <div className="flex items-center gap-3">
        <Avatar name={review.name} />
        <div className="min-w-0">
          <p className="font-medium text-ink">
            {review.name}
            <span className="font-normal text-muted"> · {review.wilaya}</span>
          </p>
          <Rating value={review.rating} />
        </div>
      </div>
      <p className="text-small text-ink/90">{review.body}</p>
      {review.verified && (
        <p className="mt-auto flex items-center gap-1.5 text-micro tracking-[0.08em] text-success uppercase">
          <svg
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3l7 3v5c0 4.4-3 8.4-7 10-4-1.6-7-5.6-7-10V6l7-3z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          {t("reviews.verified")}
        </p>
      )}
    </article>
  );
}

export function Reviews() {
  return (
    <section
      aria-labelledby="reviews-title"
      className="mx-auto max-w-6xl px-4 py-16 md:py-28"
    >
      <Reveal className="mb-8 md:mb-12">
        <p className="eyebrow mb-2">{t("reviews.eyebrow")}</p>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h2 id="reviews-title" className="font-display text-h2 text-ink">
            {t("reviews.title")}
          </h2>
          <p className="flex items-center gap-2 text-small text-muted">
            <Rating value={REVIEWS_SUMMARY.rating} />
            {t("reviews.summary", {
              rating: String(REVIEWS_SUMMARY.rating).replace(".", ","),
              count: REVIEWS_SUMMARY.count,
            })}
          </p>
        </div>
      </Reveal>
      {/* Horizontal snap-scroll on mobile, 3-col grid on desktop */}
      <Reveal>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0">
          {REVIEWS.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
