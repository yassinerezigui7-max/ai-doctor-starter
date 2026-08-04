"use client";

import useEmblaCarousel from "embla-carousel-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";
import { config } from "@/config/site.config";
import { t } from "@/config/copy.fr";
import { GALLERY_IMAGES, VARIANTS_WITH_PHOTOS } from "@/data/gallery.generated";
import { ProductImage } from "@/components/product/ProductImage";
import { useProduct } from "@/components/product/ProductProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { ProductImage as ProductImageData } from "@/types";

const ImageZoom = dynamic(() => import("@/components/product/ImageZoom"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/90">
      <Skeleton className="aspect-[4/5] w-[70%] max-w-sm" />
    </div>
  ),
});

type Filter = "all" | string;

/**
 * Embla carousel: one full card + 12% peek of the next, snap scrolling,
 * dots, drag, arrow keys. Follows the hero color selection (with a
 * "Tout voir" chip to clear); tapping a slide opens the zoom.
 */
export function GalleryCarousel() {
  const { colorId } = useProduct();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [zoomed, setZoomed] = useState<ProductImageData | null>(null);
  const zoomTrigger = useRef<HTMLElement | null>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Follow the hero selector: selecting a color filters the gallery (only
  // when that variant has photos). State-adjustment-during-render pattern.
  const [lastColor, setLastColor] = useState(colorId);
  if (colorId !== lastColor) {
    setLastColor(colorId);
    if (VARIANTS_WITH_PHOTOS.includes(colorId)) setFilter(colorId);
  }

  const [viewportRef, embla] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    duration: reducedMotion ? 0 : 25,
  });

  const images =
    filter === "all"
      ? GALLERY_IMAGES
      : GALLERY_IMAGES.filter((img) => img.variant === filter);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    const onReInit = () => {
      setSnaps(embla.scrollSnapList());
      onSelect();
    };
    onReInit();
    embla.on("select", onSelect).on("reInit", onReInit);
    return () => {
      embla.off("select", onSelect).off("reInit", onReInit);
    };
  }, [embla]);

  // Re-measure when the filter changes the slide list.
  useEffect(() => {
    embla?.reInit();
    embla?.scrollTo(0, true);
  }, [embla, filter]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        embla?.scrollNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        embla?.scrollPrev();
      }
    },
    [embla],
  );

  const openZoom = (img: ProductImageData, target: HTMLElement) => {
    zoomTrigger.current = target;
    setZoomed(img);
  };
  const closeZoom = () => {
    setZoomed(null);
    zoomTrigger.current?.focus();
  };

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: t("common.seeAll") },
    ...config.colors
      .filter((c) => VARIANTS_WITH_PHOTOS.includes(c.id))
      .map((c) => ({ id: c.id as Filter, label: c.label })),
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("gallery.title")}>
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={filter === chip.id}
            onClick={() => setFilter(chip.id)}
            className={cn(
              "h-11 rounded-pill border border-line-strong bg-white px-5 text-small font-medium text-ink",
              "transition-[background-color,border-color,color] duration-[180ms] ease-soft",
              filter === chip.id && "border-primary bg-primary text-white",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Carousel */}
      <div
        ref={viewportRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("gallery.carouselLabel")}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="overflow-hidden"
      >
        <div className="flex touch-pan-y gap-4">
          {images.map((img, i) => (
            <div
              key={img.id}
              role="group"
              aria-roledescription="slide"
              aria-label={t("gallery.slideLabel", { n: i + 1, m: images.length })}
              className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_60%] md:flex-[0_0_44%]"
            >
              <button
                type="button"
                onClick={(e) => openZoom(img, e.currentTarget)}
                className="block w-full cursor-zoom-in"
                aria-label={`${img.alt} — ${t("gallery.zoomHint")}`}
              >
                <ProductImage
                  image={img}
                  sizes="(min-width: 768px) 44vw, 88vw"
                  className="rounded-lg shadow-card"
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live announcement of the current slide */}
      <p aria-live="polite" className="sr-only">
        {t("gallery.slideLabel", { n: selected + 1, m: images.length })}
      </p>

      {/* Dots */}
      {snaps.length > 1 && (
        <div className="flex justify-center gap-2">
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={
                i === selected
                  ? `${t("gallery.slideLabel", { n: i + 1, m: snaps.length })} (actuelle)`
                  : t("gallery.slideLabel", { n: i + 1, m: snaps.length })
              }
              aria-current={i === selected || undefined}
              onClick={() => embla?.scrollTo(i)}
              className="grid size-11 place-items-center"
            >
              <span
                className={cn(
                  "size-2 rounded-pill bg-line-strong transition-[background-color,scale] duration-[180ms] ease-soft",
                  i === selected && "scale-125 bg-primary",
                )}
              />
            </button>
          ))}
        </div>
      )}

      {zoomed && <ImageZoom image={zoomed} onClose={closeZoom} />}
    </div>
  );
}
