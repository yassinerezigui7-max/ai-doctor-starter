"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { HERO_IMAGE, VARIANT_IMAGES } from "@/data/gallery.generated";
import { useProduct } from "@/components/product/ProductProvider";
import type { ProductImage } from "@/types";

const SIZES = "(min-width: 768px) 50vw, 100vw";

/**
 * The LCP element. All variant images are stacked; selecting a color
 * cross-fades (320ms opacity + 1.02→1 scale settle) — pure CSS transitions.
 * Variants without a photo keep the base hero visible.
 */
export function HeroImage({ className }: { className?: string }) {
  const { colorId } = useProduct();

  // Unique images: base hero + one per variant that has a photo.
  const layers: ProductImage[] = [HERO_IMAGE];
  for (const img of Object.values(VARIANT_IMAGES)) {
    if (!layers.some((l) => l.id === img.id)) layers.push(img);
  }
  const active = VARIANT_IMAGES[colorId] ?? HERO_IMAGE;

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-line bg-surface-alt aspect-[4/5] md:aspect-[3/4]",
        className,
      )}
    >
      {layers.map((img) => {
        const isActive = img.id === active.id;
        const isBase = img.id === HERO_IMAGE.id;
        return (
          <Image
            key={img.id}
            src={img.src.avif}
            alt={isActive ? active.alt : ""}
            width={img.width}
            height={img.height}
            sizes={SIZES}
            priority={isBase}
            fetchPriority={isBase ? "high" : undefined}
            loading={isBase ? undefined : "lazy"}
            placeholder="blur"
            blurDataURL={img.lqip}
            aria-hidden={!isActive || undefined}
            className={cn(
              "absolute inset-0 h-full w-full object-cover object-center",
              "transition-[opacity,scale] duration-[320ms] ease-soft",
              isActive ? "z-10 scale-100 opacity-100" : "z-0 scale-[1.02] opacity-0",
            )}
          />
        );
      })}
    </div>
  );
}
