import { Metadata } from "next";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";
import { SalonCard } from "@/components/SalonCard";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Salons in Model Town Quetta | Book Online – Q_Salons",
  description:
    "Find the best salons and spas in Model Town, Quetta. Browse verified salons in this residential neighbourhood and book your appointment via WhatsApp.",
  alternates: { canonical: `${SITE_URL}/quetta/model-town` },
  openGraph: {
    title: "Salons in Model Town Quetta | Book Online – Q_Salons",
    description: "Verified salons in Model Town, Quetta. Book via WhatsApp.",
    url: `${SITE_URL}/quetta/model-town`,
    siteName: "Q_Salons",
    type: "website",
  },
};

export default async function ModelTownPage() {
  let salons: Awaited<
    ReturnType<typeof prisma.salon.findMany<{ include: { services: true } }>>
  > = [];

  try {
    const raw = await withRetry(() =>
      prisma.salon.findMany({
        where: { approvalStatus: "APPROVED", quettaArea: "Model Town" },
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
      { "@type": "ListItem", position: 3, name: "Model Town", item: `${SITE_URL}/quetta/model-town` },
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
        <span className="text-white/80">Model Town</span>
      </nav>

      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Salons in Model Town, Quetta
        </h1>
        <p className="mt-2 text-sm text-white/60 max-w-2xl">
          Discover verified salons, spas, and beauty studios in Model Town —
          one of Quetta&apos;s established residential neighbourhoods. Browse
          services, compare prices, and book directly via WhatsApp.
        </p>
      </section>

      <nav aria-label="Neighborhood links" className="flex flex-wrap gap-2">
        <Link href="/quetta/salons" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">All Quetta</Link>
        <Link href="/quetta/jinnah-road" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Jinnah Road</Link>
        <Link href="/quetta/satellite-town" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Satellite Town</Link>
        <Link href="/quetta/samungli-road" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Samungli Road</Link>
        <Link href="/quetta/airport-road" className="rounded-full border border-white/20 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 transition-colors">Airport Road</Link>
      </nav>

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">{salons.length} verified salons in Model Town</p>
        <Link href="/explore" className="text-xs font-semibold text-gold hover:underline">All Quetta salons →</Link>
      </div>

      {salons.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {salons.map((s) => <SalonCard key={s.id} salon={s} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#16161D] p-10 text-center">
          <p className="text-white/50 text-sm">No salons listed for Model Town yet.</p>
          <Link href="/quetta/salons" className="mt-3 inline-block text-xs font-bold text-gold hover:underline">Browse all Quetta salons →</Link>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#16161D] p-5 space-y-2">
        <h2 className="font-display text-lg font-bold text-white">About Model Town, Quetta</h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Model Town is a prominent residential area in Quetta with well-established
          salons and beauty studios serving local families and professionals. The
          area is known for quality personal-care services and is home to a mix
          of unisex spas and ladies&apos; beauty salons.
        </p>
      </section>
    </div>
  );
}
