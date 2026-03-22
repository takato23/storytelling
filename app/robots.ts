import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getCanonicalSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/cuenta"],
    },
    sitemap: baseUrl ? `${baseUrl}/sitemap.xml` : undefined,
    host: baseUrl ?? undefined,
  };
}
