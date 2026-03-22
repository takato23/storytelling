import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl } from "@/lib/config";
import { STORIES } from "@/lib/stories";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getCanonicalSiteUrl();
  if (!baseUrl) return [];

  const now = new Date();
  const staticRoutes = [
    "",
    "/crear",
    "/contacto",
    "/soporte",
    "/terminos",
    "/privacidad",
    "/cookies",
    "/envios",
    "/devoluciones",
    "/nuestros-libros",
    "/stickers",
    "/temas",
    "/edades",
    "/voz-magica",
    "/buzon-magico",
    "/illustrator",
    "/login",
    "/register",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: route === "" ? "daily" as const : "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...STORIES.map((story) => ({
      url: `${baseUrl}/cuentos/${story.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
