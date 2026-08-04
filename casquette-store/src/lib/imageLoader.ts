"use client";

import type { ImageLoaderProps } from "next/image";

/** Widths emitted by scripts/prepare-assets.mjs — keep in sync. */
const GENERATED_WIDTHS = [128, 256, 420, 640, 828, 1080, 1440];

/**
 * Global next/image loader (next.config.ts → images.loaderFile).
 * Our pipeline pre-generates AVIF renditions at fixed widths; this maps any
 * requested width onto the nearest generated file. No runtime optimizer →
 * static-export compatible. Non-templated srcs pass through untouched.
 */
export default function imageLoader({ src, width }: ImageLoaderProps): string {
  if (!src.includes("{w}")) return src;
  const nearest = GENERATED_WIDTHS.reduce((best, w) =>
    Math.abs(w - width) < Math.abs(best - width) ? w : best,
  );
  return src.replace("{w}", String(nearest));
}
