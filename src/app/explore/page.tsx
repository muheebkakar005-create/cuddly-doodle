import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { ExploreClient } from "./ExploreClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const salons = sortByRank(
    await prisma.salon.findMany({
      where: { approvalStatus: "APPROVED" },
      include: { services: true },
    }),
  );

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
