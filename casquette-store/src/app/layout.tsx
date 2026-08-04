import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontBody } from "./fonts";
import { config } from "@/config/site.config";
import { t } from "@/config/copy.fr";
import { validateConfig } from "@/config/site.config.schema";
import { productJsonLd } from "@/lib/jsonLd";
import { ToastProvider } from "@/components/ui/Toast";
import { ProductProvider } from "@/components/product/ProductProvider";
import { StickyCta } from "@/components/ui/StickyCta";
import { BackToTop } from "@/components/ui/BackToTop";
import { WhatsAppFab } from "@/components/ui/WhatsAppFab";
import "./globals.css";

// Runs during the build (server only): an invalid config throws here.
validateConfig();

const OG_IMAGE = `${config.seo.siteUrl}/og.jpg`;

// Every string comes from copy.fr.ts, interpolated with the config values —
// changing store.productTitle or the free-shipping flag updates all of them.
const vars = {
  product: config.store.productTitle,
  store: config.store.name,
};
const TITLE = t("seo.title", vars);
const OG_TITLE = t("seo.ogTitle", vars);
const DESCRIPTION = config.pricing.freeShipping
  ? t("seo.description", vars)
  : t("seo.descriptionPaidShipping", vars);

export const metadata: Metadata = {
  metadataBase: new URL(config.seo.siteUrl),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: config.seo.locale,
    siteName: config.store.name,
    title: OG_TITLE,
    description: DESCRIPTION,
    url: config.seo.siteUrl,
    images: [
      { url: OG_IMAGE, width: 1200, height: 630, alt: config.store.productTitle },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" className={fontBody.variable}>
      <body>
        <noscript>
          {/* Content must stay visible without JS — reveals are an enhancement */}
          <style>{`.reveal{opacity:1;translate:0 0}`}</style>
        </noscript>
        <ToastProvider>
          <ProductProvider>
            {children}
            <StickyCta />
            <BackToTop />
            <WhatsAppFab />
          </ProductProvider>
        </ToastProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd(OG_IMAGE)),
          }}
        />
      </body>
    </html>
  );
}
