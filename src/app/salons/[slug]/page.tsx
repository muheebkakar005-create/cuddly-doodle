import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatTime12, isOpenNow } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { ChevronLeftIcon, StarIcon, WhatsAppIcon } from "@/components/Icons";
import { BookingEngine } from "./BookingEngine";

export const dynamic = "force-dynamic";

export default async function SalonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const salon = await prisma.salon.findUnique({
    where: { slug },
    include: {
      services: true,
      staff: true,
      reviews: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
  if (!salon || salon.approvalStatus !== "APPROVED") notFound();

  await prisma.salon.update({
    where: { id: salon.id },
    data: { viewCount: { increment: 1 } },
  });

  const gallery: string[] = JSON.parse(salon.galleryJson || "[]");
  const images = gallery.length ? gallery : [salon.imageUrl];
  const open = isOpenNow(salon.openTime, salon.closeTime, {
    workingDaysJson: salon.workingDaysJson,
    breakStart: salon.breakStart,
    breakEnd: salon.breakEnd,
  });

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-24 px-1">
      {/* Top Header - Exactly matches Screen 2 in reference UI */}
      <div className="flex items-center justify-between py-1">
        <Link
          href="/explore"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16161D] border border-white/10 text-white hover:bg-white/20 transition-all shadow-sm"
          title="Back to Explore"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Link>
        <h1 className="text-sm sm:text-base font-bold text-white text-center">
          Book Appointment
        </h1>
        <div className="w-9" />
      </div>

      {/* Salon Mini Profile Card - Compact & Clean */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] p-3.5 sm:p-4 shadow-lg space-y-3">
        {/* Single primary photo with subtle gallery previews */}
        <div className="relative h-40 sm:h-52 w-full overflow-hidden rounded-xl border border-white/10">
          <Image
            src={images[0]}
            alt={salon.name}
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

      {/* Dynamic Booking Engine (Calendar, Slots, Specialists, Compact Action Bar) */}
      <BookingEngine salon={salon} />

      {/* Customer Reviews - Compact */}
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
    </div>
  );
}
