import { Suspense } from "react";
import { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { ExploreClient } from "./ExploreClient";

export const dynamic = "force-dynamic";

type SalonWithServices = Prisma.SalonGetPayload<{ include: { services: true } }>;

export const metadata: Metadata = {
  title: "Explore Top Salons in Quetta | Verified Quetta Salons – Q_Salons",
  description: "Find and book top salons in Quetta. Filter verified barbers, beauty parlours, and spas across Jinnah Road, Model Town, and Satellite Town by price and rating.",
  keywords: [
    "Quetta salons",
    "salons",
    "salons in Quetta",
    "top salon",
    "top salon in Quetta",
    "best salon in Quetta",
    "salons near me",
  ],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app"}/explore`,
  },
  openGraph: {
    title: "Explore Quetta Salons & Top Salons | Q_Salons",
    description: "Filter 18+ verified salons, barbers & beauty parlours in Quetta by area, price & rating.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app"}/explore`,
  },
};

export default async function ExplorePage() {
  let salons: SalonWithServices[] = [];
  try {
    const raw = await withRetry(() =>
      prisma.salon.findMany({
        where: { approvalStatus: "APPROVED" },
        include: { services: true },
      })
    );
    salons = sortByRank(raw);
  } catch (error) {
    console.error("Failed to load explore salons:", error);
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Explore salons in Quetta</h1>
      <p className="mt-1 text-sm text-muted">
        Sorted by views, ratings and reviews. Filter by neighborhood, gents vs ladies parlour, PKR range and rating.
      </p>
      <div className="mt-6">
        <Suspense>
          <ExploreClient salons={salons} />
        </Suspense>
      </div>
    </div>
  );
}
