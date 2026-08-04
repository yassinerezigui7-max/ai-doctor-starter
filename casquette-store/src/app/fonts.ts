import localFont from "next/font/local";

/**
 * One self-hosted variable family, latin subset (French accents included;
 * avoid 'œ' in copy). Inter Tight covers both display and UI — see DECISIONS.md
 * for why the serif was dropped. Zero network font requests at runtime.
 */
export const fontBody = localFont({
  src: "./fonts/InterTight-400-600-latin.woff2",
  variable: "--font-body",
  display: "swap",
  weight: "400 600",
  style: "normal",
});
