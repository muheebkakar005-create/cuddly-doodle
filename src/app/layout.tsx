import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cuddly-doodle-jh1y.vercel.app";

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
  authors: [{ name: "Q_Salons Team", url: siteUrl }],
  creator: "Q_Salons",
  publisher: "Q_Salons",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-app.png",
    apple: "/logo-app.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Q_Salons",
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
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0C0E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Q_Salons",
    url: siteUrl,
    description: "Quetta's Premier Salon and Beauty Parlour Booking Platform",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/explore?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className="dark bg-[#0C0C0E]">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${dm.variable} ${display.variable} antialiased bg-[#0C0C0E] text-white min-h-screen selection:bg-[#E5C378]/30 selection:text-white`}
      >
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
