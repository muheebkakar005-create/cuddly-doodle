import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Confirmed! | Q_Salons Quetta",
  description: "Your salon appointment has been confirmed. View your booking code and appointment summary.",
  robots: {
    index: false, // Transactional confirmation screen should not be indexed as duplicate search result
    follow: true,
  },
};

export default function BookingConfirmedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
