import { Metadata } from "next";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { SalonCard } from "@/components/SalonCard";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Salons near Airport Road Quetta | Book Online – Q_Salons",
  description:
    "Find the best salons and luxury spas near Airport Road, Quetta. Browse verified unisex and gents salons in this area and book your appointment via WhatsApp.",
  alternates: { canonical: `${SITE_URL}/quetta/airport-road` },
  openGraph: {
    title: "Salons near Airport Road Quetta | Book Online – Q_Salons",
    description: "Verified salons near Airport Road, Quetta. Book via WhatsApp.",
    url: `${SITE_URL}/quetta/airport-road`,
    siteName: "Q_Salons",
    type: "website",
  },
};

export default async function AirportRoadPage() {
  let salons: Awaited<
    ReturnType<typeof prisma.salon.findMany<{ include: { services: true } }>>
  > = [];

  try {
    const raw = await withRetry(() =>
      prisma.salon.findMany({
        where: { approvalStatus: "APPROVED", quettaArea: "Airport Road" },
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
      { "@type": "ListItem", position: 3, name: "Airport Road", item: `${SITE_URL}/quetta/airport-road` },
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
        <span className="text-white/80">Airport Road</span>
      </nav>

      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Salons near Airport Road, Quetta
        </h1>
        <p className="mt-2 text-sm text-white/60 max-w-2xl">
          Discover luxury salons and wellness centers near Airport Road, Quetta.
          This corridor is home to some of the city&apos;s premier grooming and
          bridal establishments. Browse services and book directly via WhatsApp.
        </p>
      </section>

      <nav aria-label="Neighborhood links" className="flex flex-wrap gap-2">
        <Link href="/quetta/salons" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">All Quetta</Link>
        <Link href="/quetta/zarghoon-road" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Zarghoon Road</Link>
        <Link href="/quetta/model-town" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Model Town</Link>
        <Link href="/quetta/quetta-cantt" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Quetta Cantt</Link>
        <Link href="/quetta/samungli-road" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Samungli Road</Link>
      </nav>

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">{salons.length} verified salons near Airport Road</p>
        <Link href="/explore" className="text-xs font-semibold text-gold hover:underline">All Quetta salons →</Link>
      </div>

      {salons.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {salons.map((s) => <SalonCard key={s.id} salon={s} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#16161D] p-10 text-center">
          <p className="text-white/50 text-sm">No salons listed for Airport Road yet.</p>
          <Link href="/quetta/salons" className="mt-3 inline-block text-xs font-bold text-gold hover:underline">Browse all Quetta salons →</Link>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#16161D] p-5 space-y-2">
        <h2 className="font-display text-lg font-bold text-white">About Airport Road, Quetta</h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Airport Road is one of Quetta&apos;s key commercial corridors, connecting
          the city centre to Quetta International Airport. The area is home to
          luxury hotels, wedding halls, and premium salon establishments —
          including bridal studios that cater to clients preparing for
          high-profile events and weddings.
        </p>
      </section>
    </div>
  );
}
