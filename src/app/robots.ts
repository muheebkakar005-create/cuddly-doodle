import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cuddly-doodle-jh1y.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/owner/", "/super-admin/", "/shop-owner/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
