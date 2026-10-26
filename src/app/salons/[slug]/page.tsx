import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatTime12, isOpenNow } from "@/lib/format";
import { prisma, withRetry } from "@/lib/prisma";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { ChevronLeftIcon, StarIcon, WhatsAppIcon } from "@/components/Icons";
import { BookingEngine } from "./BookingEngine";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const salon = await prisma.salon.findUnique({
      where: { slug },
      select: { name: true, quettaArea: true, category: true, imageUrl: true },
    });
    if (!salon) return { title: "Salon Not Found" };

    const categoryLabel =
      salon.category === "GENTS"
        ? "Gents Barber"
        : salon.category === "LADIES"
        ? "Ladies Beauty Parlour"
        : "Unisex Spa";

    return {
      title: `${salon.name} – ${categoryLabel} in ${salon.quettaArea}, Quetta | Q_Salons`,
      description: `Book an appointment at ${salon.name}, a ${categoryLabel} in ${salon.quettaArea}, Quetta. View real PKR pricing, services, opening hours, and book directly via WhatsApp.`,
      alternates: {
        canonical: `${SITE_URL}/salons/${slug}`,
      },
      openGraph: {
        title: `${salon.name} | ${salon.quettaArea}, Quetta – Q_Salons`,
        description: `${categoryLabel} in ${salon.quettaArea}, Quetta. Book via WhatsApp on Q_Salons.`,
        url: `${SITE_URL}/salons/${slug}`,
        images: [salon.imageUrl || "/logo-web.png"],
        type: "website",
        siteName: "Q_Salons",
      },
    };
  } catch {
    return { title: "Salon Details | Q_Salons Quetta" };
  }
}

export default async function SalonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let salon = null;
  try {
    salon = await withRetry(() =>
      prisma.salon.findUnique({
        where: { slug },
        include: {
          services: true,
          staff: true,
          reviews: { orderBy: { createdAt: "desc" }, take: 12 },
          paymentAccount: true,
        },
      })
    );
  } catch (error) {
    console.error("Database error looking up salon slug:", slug, error);
  }

  if (!salon || salon.approvalStatus !== "APPROVED") notFound();

  try {
    await prisma.salon.update({
      where: { id: salon.id },
      data: { viewCount: { increment: 1 } },
    });
  } catch (err) {
    console.warn("Could not increment salon viewCount:", err);
  }

  const gallery: string[] = JSON.parse(salon.galleryJson || "[]");
  const images = gallery.length ? gallery : [salon.imageUrl];
  const open = isOpenNow(salon.openTime, salon.closeTime, {
    workingDaysJson: salon.workingDaysJson,
    breakStart: salon.breakStart,
    breakEnd: salon.breakEnd,
  });

  // Schema.org LocalBusiness JSON-LD — type varies by category
  const schemaType =
    salon.category === "GENTS"
      ? "HairSalon"
      : salon.category === "LADIES"
      ? "BeautySalon"
      : "DaySpa";

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: salon.name,
    url: `${SITE_URL}/salons/${slug}`,
    image: salon.imageUrl || `${SITE_URL}/logo-web.png`,
    description: `${salon.name} is a verified ${CATEGORY_LABELS[salon.category]} in ${salon.quettaArea}, Quetta, Pakistan. Browse services, prices, and book via WhatsApp.`,
    address: {
      "@type": "PostalAddress",
      streetAddress: salon.address || salon.quettaArea,
      addressLocality: "Quetta",
      addressRegion: "Balochistan",
      addressCountry: "PK",
    },
    geo: {
      "@type": "GeoCoordinates",
      // Quetta city center coordinates as fallback (not individual salon GPS)
      latitude: "30.1798",
      longitude: "66.9750",
    },
    openingHours:
      salon.openTime && salon.closeTime
        ? `Mo-Su ${salon.openTime}-${salon.closeTime}`
        : undefined,
    aggregateRating:
      salon.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: salon.rating.toFixed(1),
            reviewCount: salon.reviewCount,
            bestRating: "5",
            worstRating: "1",
          }
        : undefined,
    priceRange: "PKR",
    servesCuisine: undefined,
    hasMap: salon.mapsUrl || undefined,
    telephone: undefined, // not exposing phone numbers publicly
    sameAs: [],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Explore", item: `${SITE_URL}/explore` },
      { "@type": "ListItem", position: 3, name: salon.name, item: `${SITE_URL}/salons/${slug}` },
    ],
  };

  return (
    <div className="space-y-5 max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto pb-24 px-1 sm:px-4">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between py-1">
        <Link
          href="/explore"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16161D] border border-white/10 text-white hover:bg-white/20 transition-all shadow-sm"
          title="Back to Explore"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Link>
        <h1 className="text-sm sm:text-base lg:text-lg font-bold text-white text-center">
          Book Appointment
        </h1>
        <div className="w-9" />
      </div>

      {/* Salon Mini Profile Card */}
      <section className="rounded-2xl lg:rounded-3xl border border-white/10 bg-[#16161D] p-3.5 sm:p-5 lg:p-6 shadow-lg space-y-3 lg:space-y-4">
        <div className="relative h-40 sm:h-52 lg:h-72 xl:h-80 w-full overflow-hidden rounded-xl lg:rounded-2xl border border-white/10">
          <Image
            src={images[0]}
            alt={`${salon.name} – ${CATEGORY_LABELS[salon.category]} in ${salon.quettaArea}, Quetta`}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold text-gold">
              {salon.quettaArea}
            </span>
            <span className="rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white/90">
              {CATEGORY_LABELS[salon.category]}
            </span>
          </div>

          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                {salon.name}
              </h2>
              <p className="text-[11px] text-white/70 truncate max-w-[240px] sm:max-w-md">
                {salon.address}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 px-2 py-0.5 text-[11px] font-bold text-gold shrink-0">
              <StarIcon className="h-3 w-3 fill-gold" />
              <span>{salon.rating.toFixed(1)}</span>
              <span className="text-white/50 text-[10px]">({salon.reviewCount})</span>
            </div>
          </div>
        </div>

        {/* Quick Info & Action Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[11px] text-white/70">
            <span className={`h-2 w-2 rounded-full ${open ? "bg-emerald-400" : "bg-rose-400"}`} />
            <span className="font-semibold text-white">{open ? "Open Now" : "Closed"}</span>
            <span className="text-white/50">• {formatTime12(salon.openTime)}–{formatTime12(salon.closeTime)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={salon.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/20 transition-colors"
            >
              Directions
            </a>
            <a
              href={whatsappChatUrl(salon.whatsappNumber)}
              className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#1eb957] transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon className="h-3 w-3" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* Dynamic Booking Engine */}
      <BookingEngine salon={salon} />

      {/* Customer Reviews */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] p-4 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-white">Verified Customer Reviews</h3>
        <ul className="space-y-2">
          {salon.reviews.map((r) => {
            const liked: string[] = JSON.parse(r.likedTagsJson || "[]");
            return (
              <li key={r.id} className="rounded-xl bg-[#1C1C24] border border-white/5 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-white">{r.customerName}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold">
                    <StarIcon className="h-3 w-3 fill-gold" />
                    <span>{r.rating}</span>
                  </span>
                </div>
                {r.comment && <p className="text-[11px] text-white/70 leading-relaxed">{r.comment}</p>}
                {liked.length > 0 && (
                  <p className="text-[10px] font-semibold text-gold/80">{liked.join(" · ")}</p>
                )}
              </li>
            );
          })}
          {!salon.reviews.length && (
            <li className="text-[11px] text-white/50">No written reviews yet. Be the first to book and review!</li>
          )}
        </ul>
      </section>

      {/* SEO cross-links */}
      <nav aria-label="Related pages" className="flex flex-wrap gap-2 pt-1">
        <Link
          href="/quetta/salons"
          className="text-xs text-white/50 hover:text-white transition-colors"
        >
          ← All Quetta Salons
        </Link>
        {salon.category === "GENTS" && (
          <Link href="/quetta/barbers" className="text-xs text-white/50 hover:text-white transition-colors">
            Barbers in Quetta
          </Link>
        )}
        {salon.category === "LADIES" && (
          <Link href="/quetta/beauty-parlours" className="text-xs text-white/50 hover:text-white transition-colors">
            Beauty Parlours in Quetta
          </Link>
        )}
        {salon.category === "UNISEX" && (
          <Link href="/quetta/spas" className="text-xs text-white/50 hover:text-white transition-colors">
            Spas in Quetta
          </Link>
        )}
      </nav>
    </div>
  );
}
