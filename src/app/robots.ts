import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

  const publicAllowed = [
    "/",
    "/explore",
    "/salons/",
    "/quetta/",
    "/bookings",
    "/install",
    "/owner/register",
    "/about",
    "/terms",
    "/privacy",
    "/refund-policy",
    "/contact",
  ];

  const privateDisallowed = [
    "/api/",
    "/admin/",
    "/owner/dashboard",
    "/owner/bookings",
    "/owner/profile",
    "/super-admin/",
    "/shop-owner/",
    "/_next/",
  ];

  return {
    rules: [
      // 1. General web search crawlers (Google, Bing, Yahoo, DuckDuckGo)
      {
        userAgent: "*",
        allow: publicAllowed,
        disallow: privateDisallowed,
      },
      // 2. ChatGPT Search & OpenAI Web Crawlers (Enables AI answers & citations for Q_Salons)
      {
        userAgent: ["OAI-SearchBot", "ChatGPT-User", "GPTBot"],
        allow: publicAllowed,
        disallow: privateDisallowed,
      },
      // 3. Perplexity AI Search Crawler
      {
        userAgent: ["PerplexityBot"],
        allow: publicAllowed,
        disallow: privateDisallowed,
      },
      // 4. Anthropic Claude AI Search & Citations
      {
        userAgent: ["ClaudeBot", "anthropic-ai"],
        allow: publicAllowed,
        disallow: privateDisallowed,
      },
      // 5. Google Gemini / AI Overviews, Applebot & Bingbot
      {
        userAgent: ["Google-Extended", "Bingbot", "Applebot"],
        allow: publicAllowed,
        disallow: privateDisallowed,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
