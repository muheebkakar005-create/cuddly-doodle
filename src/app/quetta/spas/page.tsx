import { Metadata } from "next";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { SalonCard } from "@/components/SalonCard";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best Spas & Wellness Centers in Quetta | Book Online – Q_Salons",
  description:
    "Discover luxury spas and wellness centers in Quetta. From relaxing massages and facials to full-body treatments — browse verified spas and book your session via WhatsApp.",
  alternates: { canonical: `${SITE_URL}/quetta/spas` },
  openGraph: {
    title: "Best Spas & Wellness Centers in Quetta | Book Online – Q_Salons",
    description:
      "Discover luxury spas and wellness centers in Quetta. Browse verified spas and book via WhatsApp.",
    url: `${SITE_URL}/quetta/spas`,
    siteName: "Q_Salons",
    type: "website",
  },
};

export default async function QuettaSpasPage() {
  let salons: Awaited<
    ReturnType<typeof prisma.salon.findMany<{ include: { services: true } }>>
  > = [];

  try {
    const raw = await withRetry(() =>
      prisma.salon.findMany({
        where: { approvalStatus: "APPROVED", category: "UNISEX" },
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
    name: "Best Spas & Wellness Centers in Quetta",
    description:
      "Verified luxury spas and wellness centers in Quetta, Balochistan, Pakistan.",
    url: `${SITE_URL}/quetta/spas`,
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
        name: "Spas",
        item: `${SITE_URL}/quetta/spas`,
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
        <span className="text-white/80">Spas</span>
      </nav>

      {/* Hero */}
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Spas &amp; Wellness Centers in Quetta
        </h1>
        <p className="mt-2 text-sm text-white/60 max-w-2xl">
          Discover luxury spas and wellness centers in Quetta offering relaxing
          massages, skin treatments, facials, and full-body rejuvenation
          experiences. Find verified spas open to both men and women — book
          your session directly via WhatsApp.
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
          className="rounded-full border border-gold/60 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-gold"
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
          {salons.length} verified spas in Quetta
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
            No spas found in this category yet.
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
          Spa &amp; Wellness in Quetta
        </h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Quetta&apos;s wellness scene includes established luxury spas,
          bridal &amp; beauty centers, and holistic wellness clubs. Venues
          like Serena Maisha Spa &amp; Health Club and Chiltan Luxury Bridal &amp; Spa
          offer high-end treatments including massages, skin rejuvenation, and
          exclusive bridal packages — all set against the backdrop of
          Balochistan&apos;s natural beauty.
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          Q_Salons lists verified unisex spas and wellness centers that welcome
          both male and female guests. Prices are displayed in PKR and bookings
          are confirmed directly with the venue on WhatsApp — no commission,
          no platform fee.
        </p>
        <h3 className="font-semibold text-white/80 text-sm pt-1">
          Spa treatments available in Quetta
        </h3>
        <ul className="text-sm text-white/60 leading-relaxed list-disc list-inside space-y-1">
          <li>Swedish &amp; deep-tissue massage</li>
          <li>HydraFacial &amp; skin rejuvenation</li>
          <li>Full-body scrubs &amp; exfoliation</li>
          <li>Bridal glow &amp; pre-wedding spa packages</li>
          <li>Aromatherapy &amp; relaxation treatments</li>
          <li>Hair spa &amp; keratin treatments</li>
        </ul>
      </section>
    </div>
  );
}
