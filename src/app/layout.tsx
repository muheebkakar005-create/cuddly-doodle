import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Script from "next/script";
import { SiteShell } from "@/components/SiteShell";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const dm = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Q_Salons | Every Salon. One Booking Platform. – Quetta",
    template: "%s | Q_Salons Quetta",
  },
  description:
    "Discover & book top barber shops, ladies parlours and luxury spas across Quetta, Balochistan. Compare prices in PKR, check reviews, and confirm instantly on WhatsApp.",
  keywords: [
    "Quetta Salons",
    "Q_Salons",
    "Q Salons Quetta",
    "Barber in Quetta",
    "Ladies Parlour Quetta",
    "Beauty Salon Quetta",
    "Quetta Cantt Salon",
    "Model Town Quetta Salon",
    "HydraFacial Quetta",
    "Bridal Makeup Quetta",
    "Balochistan Salon Booking",
  ],
  authors: [
    { name: "Muheeb ullah kakar", url: siteUrl },
    { name: "Devbase", url: siteUrl }
  ],
  creator: "Muheeb ullah kakar (Devbase)",
  publisher: "Devbase",
  applicationName: "Q_Salons",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Q_Salons",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Q_Salons – Style For Everyone | Quetta",
    description: "Book verified salons across Quetta, Balochistan. Real PKR pricing and instant WhatsApp confirmation.",
    url: siteUrl,
    siteName: "Q_Salons",
    locale: "en_PK",
    type: "website",
    images: [{ url: "/logo-web.png", width: 1200, height: 630, alt: "Q_Salons Quetta" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Q_Salons – Style For Everyone",
    description: "Book verified salons across Quetta, Balochistan.",
    images: ["/logo-web.png"],
  },
  // Explicitly remove noindex: instruct Google & Bing to index and follow all public pages
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Google Search Console & Bing Webmaster Tools automated verification hooks
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "",
    },
  },
  // NOTE: Do NOT set alternates.canonical here in the root layout.
  // Each individual page sets its own self-referencing canonical URL.
  // Setting it here would incorrectly canonicalize every page to the homepage.
};

export const viewport: Viewport = {
  themeColor: "#0C0C0E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Q_Salons",
    alternateName: "Quetta Salon Connect",
    url: siteUrl,
    description: "Quetta's Premier Salon Discovery and Booking Platform",
    inLanguage: "en-PK",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/explore?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Q_Salons",
    alternateName: "Quetta Salon Connect",
    url: siteUrl,
    logo: `${siteUrl}/logo-web.png`,
    description: "Q_Salons connects customers with verified salons, barbers, and beauty parlours across Quetta, Balochistan, Pakistan.",
    areaServed: {
      "@type": "City",
      name: "Quetta",
      containedInPlace: { "@type": "AdministrativeArea", name: "Balochistan, Pakistan" },
    },
    founder: { "@type": "Person", name: "Muheeb Ullah Kakar" },
    sameAs: [],
  };

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className="dark bg-[#0C0C0E]">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Q_Salons" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Resource Preconnect for Instant Image Loading (Core Web Vitals & PageSpeed) */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body
        className={`${dm.variable} ${display.variable} antialiased bg-[#0C0C0E] text-white min-h-screen selection:bg-[#E5C378]/30 selection:text-white`}
      >
        {/* Google Analytics 4 (GA4) Tag - Activates automatically when NEXT_PUBLIC_GA_ID is set */}
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="google-analytics-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
