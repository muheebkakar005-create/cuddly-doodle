import { Metadata } from "next";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { SalonCard } from "@/components/SalonCard";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Salons in Quetta Cantt | Book Online – Q_Salons",
  description:
    "Find the best ladies salons and beauty parlours in Quetta Cantt. Browse verified salons in the cantonment area and book your appointment via WhatsApp.",
  alternates: { canonical: `${SITE_URL}/quetta/quetta-cantt` },
  openGraph: {
    title: "Salons in Quetta Cantt | Book Online – Q_Salons",
    description: "Verified salons in Quetta Cantt. Book via WhatsApp.",
    url: `${SITE_URL}/quetta/quetta-cantt`,
    siteName: "Q_Salons",
    type: "website",
  },
};

export default async function QuettaCanttPage() {
  let salons: Awaited<
    ReturnType<typeof prisma.salon.findMany<{ include: { services: true } }>>
  > = [];

  try {
    const raw = await withRetry(() =>
      prisma.salon.findMany({
        where: { approvalStatus: "APPROVED", quettaArea: "Quetta Cantt" },
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
      { "@type": "ListItem", position: 3, name: "Quetta Cantt", item: `${SITE_URL}/quetta/quetta-cantt` },
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
        <span className="text-white/80">Quetta Cantt</span>
      </nav>

      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Salons in Quetta Cantt
        </h1>
        <p className="mt-2 text-sm text-white/60 max-w-2xl">
          Browse verified ladies salons and beauty parlours in Quetta Cantt —
          a well-established area home to quality beauty and personal-care
          establishments. Compare services, view pricing in PKR, and book
          directly via WhatsApp.
        </p>
      </section>

      <nav aria-label="Neighborhood links" className="flex flex-wrap gap-2">
        <Link href="/quetta/salons" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">All Quetta</Link>
        <Link href="/quetta/jinnah-road" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Jinnah Road</Link>
        <Link href="/quetta/model-town" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Model Town</Link>
        <Link href="/quetta/samungli-road" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Samungli Road</Link>
        <Link href="/quetta/airport-road" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Airport Road</Link>
      </nav>

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">{salons.length} verified salons in Quetta Cantt</p>
        <Link href="/explore" className="text-xs font-semibold text-gold hover:underline">All Quetta salons →</Link>
      </div>

      {salons.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {salons.map((s) => <SalonCard key={s.id} salon={s} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#16161D] p-10 text-center">
          <p className="text-white/50 text-sm">No salons listed for Quetta Cantt yet.</p>
          <Link href="/quetta/salons" className="mt-3 inline-block text-xs font-bold text-gold hover:underline">Browse all Quetta salons →</Link>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#16161D] p-5 space-y-2">
        <h2 className="font-display text-lg font-bold text-white">About Quetta Cantt</h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Quetta Cantonment is one of the city&apos;s most established and
          well-planned areas. It is home to a number of reputable ladies&apos;
          beauty salons and parlours that serve both cantonment residents and
          clients from across Quetta. The area is known for quality
          personal-care services in a safe and accessible environment.
        </p>
      </section>
    </div>
  );
}
