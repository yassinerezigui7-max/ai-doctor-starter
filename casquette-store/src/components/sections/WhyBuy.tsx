import { t } from "@/config/copy.fr";
import { GALLERY_IMAGES, HERO_IMAGE } from "@/data/gallery.generated";
import { ProductImage } from "@/components/product/ProductImage";
import { Reveal } from "@/components/ui/Reveal";

/** Asymmetric split: tall image one side, three benefit paragraphs the other. */
export function WhyBuy() {
  // Prefer a detail/close-up shot for texture; fall back to the last gallery image.
  const image =
    GALLERY_IMAGES.find((img) => img.role === "detail") ??
    GALLERY_IMAGES[GALLERY_IMAGES.length - 1] ??
    HERO_IMAGE;

  return (
    <section
      aria-labelledby="whybuy-title"
      className="border-y border-line bg-surface-alt"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-[5fr_7fr] md:gap-14 md:py-28">
        <Reveal>
          <ProductImage
            image={image}
            sizes="(min-width: 768px) 40vw, 100vw"
            className="rounded-lg shadow-card"
          />
        </Reveal>
        <div className="flex max-w-prose flex-col gap-5">
          <Reveal>
            <p className="eyebrow mb-2">{t("whyBuy.eyebrow")}</p>
            <h2 id="whybuy-title" className="font-display text-h2 text-ink">
              {t("whyBuy.title")}
            </h2>
          </Reveal>
          <Reveal step={1}>
            <p className="text-muted">{t("whyBuy.p1")}</p>
          </Reveal>
          <Reveal step={2}>
            <p className="text-muted">{t("whyBuy.p2")}</p>
          </Reveal>
          <Reveal step={3}>
            <p className="text-muted">{t("whyBuy.p3")}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
