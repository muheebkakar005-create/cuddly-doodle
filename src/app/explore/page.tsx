import { Suspense } from "react";
import { Prisma } from "@prisma/client";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { ExploreClient } from "./ExploreClient";

export const dynamic = "force-dynamic";

type SalonWithServices = Prisma.SalonGetPayload<{ include: { services: true } }>;

export const metadata = {
  title: "Explore Salons & Parlours in Quetta",
  description: "Browse and filter the best gents salons, ladies beauty parlours, and luxury spas in Quetta, Balochistan.",
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
