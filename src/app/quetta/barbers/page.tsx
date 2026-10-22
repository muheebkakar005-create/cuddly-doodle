import { Metadata } from "next";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { SalonCard } from "@/components/SalonCard";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best Barbers & Men's Salons in Quetta | Book Online – Q_Salons",
  description:
    "Find the best barbers and men's grooming salons in Quetta. From classic haircuts to beard trims and hot-towel shaves — browse verified gents salons and book via WhatsApp.",
  alternates: { canonical: `${SITE_URL}/quetta/barbers` },
  openGraph: {
    title: "Best Barbers & Men's Salons in Quetta | Book Online – Q_Salons",
    description:
      "Find the best barbers and men's grooming salons in Quetta. Browse verified gents salons and book via WhatsApp.",
    url: `${SITE_URL}/quetta/barbers`,
    siteName: "Q_Salons",
    type: "website",
  },
};

export default async function QuettaBarbersPage() {
  let salons: Awaited<
    ReturnType<typeof prisma.salon.findMany<{ include: { services: true } }>>
  > = [];

  try {
    const raw = await withRetry(() =>
      prisma.salon.findMany({
        where: { approvalStatus: "APPROVED", category: "GENTS" },
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
    name: "Best Barbers & Men's Salons in Quetta",
    description:
      "Verified gents barbers and men's grooming salons in Quetta, Pakistan.",
    url: `${SITE_URL}/quetta/barbers`,
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
        name: "Quetta",
        item: `${SITE_URL}/quetta/salons`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Barbers",
        item: `${SITE_URL}/quetta/barbers`,
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
        <Link
          href="/quetta/salons"
          className="hover:text-white transition-colors"
        >
          Quetta
        </Link>
        <span>/</span>
        <span className="text-white/80">Barbers</span>
      </nav>

      {/* Hero */}
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Barbers &amp; Men&apos;s Salons in Quetta
        </h1>
        <p className="mt-2 text-sm text-white/60 max-w-2xl">
          Browse verified gents barbers and men&apos;s grooming studios across
          Quetta. From precision haircuts and beard trims to hot-towel shaves
          and men&apos;s facials — find and book your next appointment via
          WhatsApp.
        </p>
      </section>

      {/* Category nav pills */}
      <nav aria-label="Category links" className="flex flex-wrap gap-2">
        <Link
          href="/quetta/salons"
          className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors"
        >
          All Salons
        </Link>
        <Link
          href="/quetta/barbers"
          className="rounded-full border border-gold/60 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-gold"
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
          {salons.length} verified barbers in Quetta
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
          <p className="text-white/50 text-sm">
            No barbers found in this category yet.
          </p>
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
          Men&apos;s Grooming in Quetta
        </h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Quetta&apos;s barbering culture blends traditional craftsmanship with
          modern men&apos;s grooming. You&apos;ll find classic neighbourhood
          barbers in areas like Satellite Town, Liaqat Bazaar, and Jinnah Road
          alongside contemporary men&apos;s studios offering full grooming
          packages including beard styling, skin treatments, and hair colouring.
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          All gents salons on Q_Salons are manually verified. Prices are
          displayed in PKR and you can contact any barber directly on WhatsApp
          to confirm availability or book an appointment — zero platform fees.
        </p>
      </section>
    </div>
  );
}
