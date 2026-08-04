import { t } from "@/config/copy.fr";
import { GalleryCarousel } from "@/components/product/GalleryCarousel";
import { Reveal } from "@/components/ui/Reveal";

export function Gallery() {
  return (
    <section
      aria-labelledby="gallery-title"
      className="mx-auto max-w-6xl px-4 py-16 md:py-28"
    >
      <Reveal className="mb-8 md:mb-12">
        <p className="eyebrow mb-2">{t("gallery.eyebrow")}</p>
        <h2 id="gallery-title" className="font-display text-h2 text-ink">
          {t("gallery.title")}
        </h2>
      </Reveal>
      <Reveal>
        <GalleryCarousel />
      </Reveal>
    </section>
  );
}
