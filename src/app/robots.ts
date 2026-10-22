import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/explore", "/salons/", "/quetta/", "/bookings", "/owner/register", "/login"],
        disallow: ["/api/", "/admin/", "/owner/dashboard", "/owner/bookings", "/owner/profile", "/super-admin/", "/shop-owner/", "/_next/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
