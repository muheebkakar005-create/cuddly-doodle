import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const metadata: Metadata = {
  title: "Install Q_Salons Mobile App | Android & iOS PWA",
  description:
    "Directly install the official Q_Salons mobile app on your phone. Book salon appointments in Quetta with one tap from your home screen.",
  alternates: {
    canonical: `${siteUrl}/install`,
  },
  openGraph: {
    title: "Install Q_Salons App",
    description: "Install Q_Salons mobile app for Quetta on Android & iOS.",
    url: `${siteUrl}/install`,
  },
};

export default function InstallLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
