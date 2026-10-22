import { Metadata } from "next";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { SalonCard } from "@/components/SalonCard";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best Beauty Parlours & Ladies Salons in Quetta | Book Online – Q_Salons",
  description:
    "Find the best ladies beauty parlours and women's salons in Quetta. From facials and threading to bridal makeup and HydraFacial – browse verified beauty parlours and book via WhatsApp.",
  alternates: { canonical: `${SITE_URL}/quetta/beauty-parlours` },
  openGraph: {
    title: "Best Beauty Parlours & Ladies Salons in Quetta | Book Online – Q_Salons",
    description:
      "Find the best ladies beauty parlours and women's salons in Quetta. Browse verified parlours and book via WhatsApp.",
    url: `${SITE_URL}/quetta/beauty-parlours`,
    siteName: "Q_Salons",
    type: "website",
  },
};

export default async function QuettaBeautyParloursPage() {
  let salons: Awaited<
    ReturnType<typeof prisma.salon.findMany<{ include: { services: true } }>>
  > = [];

  try {
    const raw = await withRetry(() =>
      prisma.salon.findMany({
        where: { approvalStatus: "APPROVED", category: "LADIES" },
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
    name: "Best Beauty Parlours & Ladies Salons in Quetta",
    description:
      "Verified ladies beauty parlours and women's salons in Quetta, Pakistan.",
    url: `${SITE_URL}/quetta/beauty-parlours`,
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
        name: "Beauty Parlours",
        item: `${SITE_URL}/quetta/beauty-parlours`,
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
        <span className="text-white/80">Beauty Parlours</span>
      </nav>

      {/* Hero */}
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Beauty Parlours &amp; Ladies Salons in Quetta
        </h1>
        <p className="mt-2 text-sm text-white/60 max-w-2xl">
          Browse verified ladies beauty parlours and women&apos;s salons across
          Quetta. From everyday threading and facials to full bridal makeup
          packages and HydraFacial treatments — find and book your appointment
          via WhatsApp.
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
          className="rounded-full border border-gold/60 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-gold"
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
          {salons.length} verified beauty parlours in Quetta
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
            No beauty parlours found in this category yet.
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
          Ladies Beauty Services in Quetta
        </h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Quetta&apos;s ladies beauty sector offers everything from traditional
          threading and mehendi to advanced skin treatments and full bridal
          packages. Areas like Quetta Cantt, Samungli Road, and Model Town host
          well-established parlours catering to women of all ages. Whether
          you&apos;re preparing for a wedding or looking for a weekly skincare
          routine, Q_Salons makes it easy to compare services and prices.
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          All beauty parlours listed on Q_Salons are manually verified and
          approved. Prices are shown in PKR and you can reach any parlour
          directly on WhatsApp to confirm your appointment — at no extra cost.
        </p>
        <h3 className="font-semibold text-white/80 text-sm pt-1">
          Popular beauty services available in Quetta
        </h3>
        <ul className="text-sm text-white/60 leading-relaxed list-disc list-inside space-y-1">
          <li>Bridal makeup &amp; full bridal packages</li>
          <li>HydraFacial &amp; skin rejuvenation treatments</li>
          <li>Threading, waxing &amp; eyebrow shaping</li>
          <li>Hair coloring, highlights &amp; smoothing</li>
          <li>Manicure, pedicure &amp; nail art</li>
          <li>Mehendi (henna) design</li>
          <li>Facial &amp; deep cleansing treatments</li>
        </ul>
      </section>
    </div>
  );
}
