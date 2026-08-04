"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { config, type ColorId } from "@/config/site.config";
import { t } from "@/config/copy.fr";
import { track } from "@/lib/analytics";
import { VARIANT_IMAGES } from "@/data/gallery.generated";
import { useProduct } from "@/components/product/ProductProvider";
import { useRef, type KeyboardEvent } from "react";

/**
 * The signature element: a row of tall image chips showing the actual cap in
 * each color. Selecting one cross-fades the hero. Variants without a photo
 * fall back to a swatch-filled chip. Full radiogroup keyboard support.
 */
export function ColorSelector({ className }: { className?: string }) {
  const { colorId, setColor } = useProduct();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (id: ColorId, index: number) => {
    setColor(id);
    track("color_select", { color: id });
    refs.current[index]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = config.colors.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = index === last ? 0 : index + 1;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = index === 0 ? last : index - 1;
    }
    if (next !== null) {
      e.preventDefault();
      select(config.colors[next].id, next);
    }
  };

  return (
    <div className={className}>
      <p className="eyebrow mb-2" id="color-selector-label">
        {t("hero.colorLabel")} —{" "}
        <span className="text-ink normal-case tracking-normal">
          {config.colors.find((c) => c.id === colorId)?.label}
        </span>
      </p>
      <div
        role="radiogroup"
        aria-labelledby="color-selector-label"
        className="flex gap-3"
      >
        {config.colors.map((color, i) => {
          const image = VARIANT_IMAGES[color.id];
          const checked = colorId === color.id;
          return (
            <button
              key={color.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={color.label}
              tabIndex={checked ? 0 : -1}
              onClick={() => select(color.id, i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative h-24 w-18 shrink-0 overflow-hidden rounded-md border border-line-strong bg-surface",
                "transition-[scale,box-shadow] duration-[180ms] ease-soft active:scale-[.97]",
                checked &&
                  "outline outline-1 outline-offset-[3px] outline-primary",
              )}
            >
              {image ? (
                <Image
                  src={image.src.avif}
                  alt=""
                  width={128}
                  height={Math.round((128 * image.height) / image.width)}
                  sizes="72px"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  placeholder="blur"
                  blurDataURL={image.lqip}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ backgroundColor: color.swatch }}
                />
              )}
              <span className="sr-only">{color.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
