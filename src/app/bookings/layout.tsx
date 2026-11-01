import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const metadata: Metadata = {
  title: "My Appointments & Bookings | Q_Salons Quetta",
  description:
    "View your booked salon appointments, digital payment receipts, booking codes, and status updates across Quetta.",
  alternates: {
    canonical: `${siteUrl}/bookings`,
  },
  openGraph: {
    title: "My Appointments | Q_Salons Quetta",
    description: "Manage your salon appointments and advance bookings across Quetta.",
    url: `${siteUrl}/bookings`,
  },
};

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
