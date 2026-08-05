import { cn } from "@/lib/cn";
import type { ComponentPropsWithRef } from "react";

type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg" | "xl";
  loading?: boolean;
};

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-press active:bg-primary-press",
  secondary:
    "bg-white text-primary border border-line-strong hover:border-primary",
  ghost: "bg-transparent text-primary hover:bg-primary-tint",
} as const;

const sizes = {
  md: "h-11 px-5 text-small",
  lg: "h-14 px-7",
  xl: "h-[60px] px-8",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-pill font-medium",
        "transition-[background-color,border-color,scale] duration-[180ms] ease-soft",
        "active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-5 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
