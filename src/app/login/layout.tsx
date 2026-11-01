import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const metadata: Metadata = {
  title: "Sign In to Your Account | Q_Salons Quetta",
  description:
    "Sign in to your Q_Salons account to view your bookings, manage your salon profile, or access shop owner tools.",
  alternates: {
    canonical: `${siteUrl}/login`,
  },
  openGraph: {
    title: "Sign In | Q_Salons Quetta",
    description: "Access your Q_Salons account.",
    url: `${siteUrl}/login`,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
