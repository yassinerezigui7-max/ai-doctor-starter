import Image from "next/image";
import { config } from "@/config/site.config";

/**
 * Minimal, not sticky. Renders the brand mark when config.store.logo is set,
 * otherwise the text wordmark. The logo is exported at 2× and rendered at a
 * fixed height (32px mobile / 40px desktop) with explicit width/height, so it
 * reserves its box and cannot shift layout.
 */
export function Header() {
  const { logo, name } = config.store;

  return (
    <header className="flex items-center justify-center border-b border-line py-5">
      {logo ? (
        <Image
          src={logo.src}
          alt={name}
          width={logo.width}
          height={logo.height}
          priority
          // Already generated at exactly 2× its render height by the asset
          // script; there are no alternate widths for the loader to pick.
          unoptimized
          className="h-8 w-auto md:h-10"
          style={{ aspectRatio: `${logo.width} / ${logo.height}` }}
        />
      ) : (
        <p className="font-display text-h3 tracking-[0.04em] text-primary">{name}</p>
      )}
    </header>
  );
}
