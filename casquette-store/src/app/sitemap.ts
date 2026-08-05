import type { MetadataRoute } from "next";
import { config } from "@/config/site.config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: config.seo.siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
