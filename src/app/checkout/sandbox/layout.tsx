import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Payment Gateway | Q_Salons",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
