import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const metadata: Metadata = {
  title: "Create Customer Account | Q_Salons Quetta",
  description:
    "Register for a free Q_Salons customer account to book appointments faster, earn discounts, and track booking history in Quetta.",
  alternates: {
    canonical: `${siteUrl}/register`,
  },
  openGraph: {
    title: "Create Account | Q_Salons Quetta",
    description: "Sign up for Q_Salons to book appointments across Quetta.",
    url: `${siteUrl}/register`,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
