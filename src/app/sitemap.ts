import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    // Homepage — highest priority
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    // Explore — most-used discovery page
    { url: `${siteUrl}/explore`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },

    // ── Category landing pages ──────────────────────────────────────────────
    { url: `${siteUrl}/quetta/salons`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/quetta/barbers`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/quetta/beauty-parlours`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/quetta/spas`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteUrl}/quetta/hammam`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },

    // ── Neighborhood landing pages ──────────────────────────────────────────
    { url: `${siteUrl}/quetta/jinnah-road`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/quetta/model-town`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/quetta/samungli-road`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/quetta/satellite-town`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/quetta/zarghoon-road`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/quetta/quetta-cantt`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/quetta/airport-road`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },

    // ── User-facing utility routes ──────────────────────────────────────────
    { url: `${siteUrl}/bookings`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/owner/register`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const salons = await prisma.salon.findMany({
      where: { approvalStatus: "APPROVED" },
      select: { slug: true, updatedAt: true },
    });

    const salonRoutes: MetadataRoute.Sitemap = salons.map((salon) => ({
      url: `${siteUrl}/salons/${salon.slug}`,
      lastModified: salon.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

    return [...staticRoutes, ...salonRoutes];
  } catch (error) {
    console.warn("Sitemap: could not query salons:", error);
    return staticRoutes;
  }
}
