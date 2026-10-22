import { Metadata } from "next";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { SalonCard } from "@/components/SalonCard";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Salons in Satellite Town Quetta | Book Online – Q_Salons",
  description:
    "Find the best barbers and salons in Satellite Town, Quetta. Browse verified gents and ladies salons in this popular Quetta neighbourhood and book via WhatsApp.",
  alternates: { canonical: `${SITE_URL}/quetta/satellite-town` },
  openGraph: {
    title: "Salons in Satellite Town Quetta | Book Online – Q_Salons",
    description: "Verified salons in Satellite Town, Quetta. Book via WhatsApp.",
    url: `${SITE_URL}/quetta/satellite-town`,
    siteName: "Q_Salons",
    type: "website",
  },
};

export default async function SatelliteTownPage() {
  let salons: Awaited<
    ReturnType<typeof prisma.salon.findMany<{ include: { services: true } }>>
  > = [];

  try {
    const raw = await withRetry(() =>
      prisma.salon.findMany({
        where: { approvalStatus: "APPROVED", quettaArea: "Satellite Town" },
        include: { services: true },
        orderBy: { rating: "desc" },
      })
    );
    salons = sortByRank(raw);
  } catch {
    // fall back silently
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Quetta Salons", item: `${SITE_URL}/quetta/salons` },
      { "@type": "ListItem", position: 3, name: "Satellite Town", item: `${SITE_URL}/quetta/satellite-town` },
    ],
  };

  return (
    <div className="space-y-6 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <nav aria-label="Breadcrumb" className="text-[11px] text-white/50 flex items-center gap-1.5">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href="/quetta/salons" className="hover:text-white transition-colors">Quetta</Link>
        <span>/</span>
        <span className="text-white/80">Satellite Town</span>
      </nav>

      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Salons in Satellite Town, Quetta
        </h1>
        <p className="mt-2 text-sm text-white/60 max-w-2xl">
          Browse verified salons and barbers in Satellite Town — one of Quetta&apos;s
          busiest residential neighbourhoods. Compare services and prices, then
          book your appointment directly via WhatsApp.
        </p>
      </section>

      <nav aria-label="Neighborhood links" className="flex flex-wrap gap-2">
        <Link href="/quetta/salons" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">All Quetta</Link>
        <Link href="/quetta/jinnah-road" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Jinnah Road</Link>
        <Link href="/quetta/model-town" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Model Town</Link>
        <Link href="/quetta/zarghoon-road" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Zarghoon Road</Link>
        <Link href="/quetta/airport-road" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Airport Road</Link>
      </nav>

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">{salons.length} verified salons in Satellite Town</p>
        <Link href="/explore" className="text-xs font-semibold text-gold hover:underline">All Quetta salons →</Link>
      </div>

      {salons.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {salons.map((s) => <SalonCard key={s.id} salon={s} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#16161D] p-10 text-center">
          <p className="text-white/50 text-sm">No salons listed for Satellite Town yet.</p>
          <Link href="/quetta/salons" className="mt-3 inline-block text-xs font-bold text-gold hover:underline">Browse all Quetta salons →</Link>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#16161D] p-5 space-y-2">
        <h2 className="font-display text-lg font-bold text-white">About Satellite Town, Quetta</h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Satellite Town is a well-known residential and commercial area in Quetta
          with a dense population of families and young professionals. It hosts
          popular local barbershops and gents salons catering to the
          neighbourhood&apos;s daily grooming needs.
        </p>
      </section>
    </div>
  );
}
