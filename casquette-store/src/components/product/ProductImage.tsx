import Image from "next/image";
import { cn } from "@/lib/cn";
import type { ProductImage as ProductImageData } from "@/types";

interface ProductImageProps {
  image: ProductImageData;
  /** Only the hero (LCP) sets this */
  priority?: boolean;
  sizes: string;
  className?: string;
  imgClassName?: string;
}

/**
 * Every product photo goes through here: AVIF via the global custom loader,
 * explicit dimensions + LQIP blur placeholder (CLS 0), lazy by default.
 * The frame enforces the 4/5 (mobile) / 3/4 (desktop) crop with object-cover.
 *
 * The photos' own studio background is #F6F6F6 — 1.23:1 against the white page,
 * so without an edge the product bleeds into the layout. The --surface-alt
 * plate plus a 1px --line hairline give the frame a definite boundary.
 */
export function ProductImage({
  image,
  priority = false,
  sizes,
  className,
  imgClassName,
}: ProductImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-line bg-surface-alt aspect-[4/5] md:aspect-[3/4]",
        className,
      )}
    >
      <Image
        src={image.src.avif}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        loading={priority ? undefined : "lazy"}
        decoding={priority ? undefined : "async"}
        placeholder="blur"
        blurDataURL={image.lqip}
        className={cn("absolute inset-0 h-full w-full object-cover object-center", imgClassName)}
      />
    </div>
  );
}
