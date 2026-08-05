import type { MetadataRoute } from "next";
import { config } from "@/config/site.config";

// Replaces the old static public/robots.txt so the sitemap URL follows
// config.seo.siteUrl instead of being hardcoded to a placeholder domain.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${config.seo.siteUrl}/sitemap.xml`,
  };
}
