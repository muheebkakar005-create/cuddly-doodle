import { Metadata } from "next";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { SalonCard } from "@/components/SalonCard";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hammam & Turkish Bath in Quetta | Book Online – Q_Salons",
  description:
    "Find traditional hammam and steam bath services in Quetta. Enjoy classic hot-towel shaves, steam treatments, and traditional grooming at verified hammam venues — book via WhatsApp.",
  alternates: { canonical: `${SITE_URL}/quetta/hammam` },
  openGraph: {
    title: "Hammam & Turkish Bath in Quetta | Book Online – Q_Salons",
    description:
      "Find traditional hammam and steam bath services in Quetta. Book verified venues via WhatsApp.",
    url: `${SITE_URL}/quetta/hammam`,
    siteName: "Q_Salons",
    type: "website",
  },
};

export default async function QuettaHammamPage() {
  // Hammam-specific venues: we show GENTS salons (which include hammam services)
  // particularly Kandahari Barber & Hammam and similar traditional grooming venues
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
    name: "Hammam & Steam Bath Venues in Quetta",
    description:
      "Traditional hammam, steam bath, and hot-towel grooming venues in Quetta, Balochistan, Pakistan.",
    url: `${SITE_URL}/quetta/hammam`,
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
        name: "Hammam",
        item: `${SITE_URL}/quetta/hammam`,
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
        <span className="text-white/80">Hammam</span>
      </nav>

      {/* Hero */}
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Hammam &amp; Steam Bath in Quetta
        </h1>
        <p className="mt-2 text-sm text-white/60 max-w-2xl">
          Experience traditional hammam and steam grooming in Quetta. The city&apos;s
          barbering culture carries centuries of craftsmanship — from hot-towel
          razor shaves to full steam treatments. Find and book at verified
          hammam-style venues via WhatsApp.
        </p>
      </section>

      {/* Highlight card — Kandahari Barber & Hammam */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-[#1E1C10] to-[#16161D] p-4">
        <p className="text-xs font-semibold text-gold uppercase tracking-widest mb-1">
          Featured Hammam Venue
        </p>
        <p className="text-sm text-white font-semibold">
          Kandahari Barber &amp; Hammam
        </p>
        <p className="text-xs text-white/50 mt-0.5 mb-3">
          Shahrah-e-Iqbal (Kandahari Bazaar) · Traditional hammam, hot-towel
          shaves &amp; grooming
        </p>
        <Link
          href="/salons/kandahari-barber-hammam"
          className="inline-block rounded-full bg-gold/10 border border-gold/40 px-3 py-1 text-xs font-bold text-gold hover:bg-gold/20 transition-colors"
        >
          View Profile →
        </Link>
      </div>

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
          className="rounded-full border border-gold/60 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-gold"
        >
          Hammam
        </Link>
      </nav>

      {/* Count + explore link */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">
          {salons.length} verified gents salons &amp; hammam venues in Quetta
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
            No hammam venues found yet.
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
          Traditional Hammam Culture in Quetta
        </h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Hammam — also spelled hamam — is a centuries-old South Asian and
          Middle Eastern bathing and grooming tradition. In Quetta, hammam-style
          barbershops blend classic techniques with everyday men&apos;s grooming:
          hot-towel razor shaves, steam treatments, and deep scalp massages.
          The Kandahari Bazaar area on Shahrah-e-Iqbal is particularly known
          for traditional hammam culture, reflecting the city&apos;s rich
          Pashtun and Baloch heritage.
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          Q_Salons lists verified gents salons that offer hammam-style
          treatments alongside standard barbering services. All venues are
          manually approved, prices are shown in PKR, and bookings are
          arranged directly on WhatsApp with zero platform fees.
        </p>
        <h3 className="font-semibold text-white/80 text-sm pt-1">
          Common hammam &amp; traditional grooming services
        </h3>
        <ul className="text-sm text-white/60 leading-relaxed list-disc list-inside space-y-1">
          <li>Hot-towel razor shave</li>
          <li>Steam &amp; exfoliation treatment</li>
          <li>Traditional beard grooming &amp; trim</li>
          <li>Scalp massage &amp; hot oil treatment</li>
          <li>Classic haircut &amp; styling</li>
          <li>Face scrub &amp; men&apos;s facial</li>
        </ul>
      </section>
    </div>
  );
}
