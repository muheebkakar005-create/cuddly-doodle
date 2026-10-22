import { Metadata } from "next";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { SalonCard } from "@/components/SalonCard";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best Salons in Quetta 2025 | Book Online – Q_Salons",
  description:
    "Discover and book the best salons in Quetta. Browse verified gents barbers, ladies beauty parlours, spas, and hammam – all in one place on Q_Salons.",
  alternates: { canonical: `${SITE_URL}/quetta/salons` },
  openGraph: {
    title: "Best Salons in Quetta 2025 | Book Online – Q_Salons",
    description:
      "Discover and book the best salons in Quetta. Browse verified gents barbers, ladies beauty parlours, spas, and hammam – all in one place on Q_Salons.",
    url: `${SITE_URL}/quetta/salons`,
    siteName: "Q_Salons",
    type: "website",
  },
};

export default async function QuettaSalonsPage() {
  let salons: Awaited<
    ReturnType<typeof prisma.salon.findMany<{ include: { services: true } }>>
  > = [];

  try {
    const raw = await withRetry(() =>
      prisma.salon.findMany({
        where: { approvalStatus: "APPROVED" },
        include: { services: true },
        orderBy: { rating: "desc" },
      })
    );
    salons = sortByRank(raw);
  } catch {
    // silently fall back to empty list
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Best Salons in Quetta",
    description:
      "A curated list of verified salons in Quetta, Pakistan — gents barbers, ladies beauty parlours, spas, and hammam.",
    url: `${SITE_URL}/quetta/salons`,
    numberOfItems: salons.length,
    itemListElement: salons.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `${SITE_URL}/salons/${s.slug}`,
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Quetta Salons",
        item: `${SITE_URL}/quetta/salons`,
      },
    ],
  };

  return (
    <div className="space-y-6 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* Breadcrumb nav */}
      <nav
        aria-label="Breadcrumb"
        className="text-[11px] text-white/50 flex items-center gap-1.5"
      >
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-white/80">Quetta Salons</span>
      </nav>

      {/* Hero */}
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Salons in Quetta
        </h1>
        <p className="mt-2 text-sm text-white/60 max-w-2xl">
          Browse all verified salons in Quetta — from gents barbers and men&apos;s
          grooming studios to ladies beauty parlours, spas, and traditional
          hammam. Book directly via WhatsApp or view full service menus and
          pricing.
        </p>
      </section>

      {/* Category nav pills */}
      <nav aria-label="Category links" className="flex flex-wrap gap-2">
        <Link
          href="/quetta/salons"
          className="rounded-full border border-gold/60 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-gold"
        >
          All Salons
        </Link>
        <Link
          href="/quetta/barbers"
          className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors"
        >
          Barbers
        </Link>
        <Link
          href="/quetta/beauty-parlours"
          className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors"
        >
          Beauty Parlours
        </Link>
        <Link
          href="/quetta/spas"
          className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors"
        >
          Spas
        </Link>
        <Link
          href="/quetta/hammam"
          className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors"
        >
          Hammam
        </Link>
      </nav>

      {/* Count + explore link */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">
          {salons.length} verified salons in Quetta
        </p>
        <Link
          href="/explore"
          className="text-xs font-semibold text-gold hover:underline"
        >
          Advanced filters →
        </Link>
      </div>

      {/* Grid */}
      {salons.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {salons.map((s) => (
            <SalonCard key={s.id} salon={s} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#16161D] p-10 text-center">
          <p className="text-white/50 text-sm">No salons found yet.</p>
          <Link
            href="/explore"
            className="mt-3 inline-block text-xs font-bold text-gold hover:underline"
          >
            Browse all Quetta salons →
          </Link>
        </div>
      )}

      {/* SEO content */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] p-5 space-y-3">
        <h2 className="font-display text-lg font-bold text-white">
          About Quetta&apos;s Salon Scene
        </h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Quetta is home to a diverse and growing beauty and grooming industry.
          Whether you&apos;re looking for a quick haircut in Satellite Town, a
          luxury bridal package near Airport Road, or a traditional hammam
          experience in Kandahari Bazaar, Q_Salons connects you with the best
          verified salons across every neighbourhood in the city.
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          All salons listed on Q_Salons are manually approved and verified. You
          can view real service menus, live pricing in PKR, opening hours, and
          contact each salon directly on WhatsApp — no middleman, no booking
          fees.
        </p>
      </section>
    </div>
  );
}
