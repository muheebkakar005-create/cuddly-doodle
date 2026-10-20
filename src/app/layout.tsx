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

export const metadata: Metadata = {
  title: "Q_Salons | Every Salon. One Booking Platform. – Quetta",
  description:
    "Book barber shops, ladies parlors and luxury spas across Quetta, Balochistan. Search by area, compare PKR prices, and confirm on WhatsApp.",
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
    title: "Q_Salons – Style For Everyone",
    description: "Book salons across Quetta, Balochistan. Compare prices in PKR.",
    siteName: "Q_Salons",
    locale: "en_PK",
    type: "website",
    images: [{ url: "/logo-web.png", width: 1200, height: 630, alt: "Q_Salons" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Q_Salons – Style For Everyone",
    description: "Book salons across Quetta, Balochistan.",
    images: ["/logo-web.png"],
  },
};

export const viewport: Viewport = {
  // Q_Salons brand: midnight blue background, gold theme
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#DAaf37" },
    { media: "(prefers-color-scheme: light)", color: "#DAaf37" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark bg-[#0C0C0E]">
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
