import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatPkr, formatTime12, isOpenNow } from "@/lib/format";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { MapPinIcon, StarIcon, WhatsAppIcon } from "./Icons";

export type SalonCardData = {
  name: string;
  slug: string;
  category: string;
  quettaArea: string;
  address: string;
  phone?: string;
  whatsappNumber: string;
  openTime: string;
  closeTime: string;
  imageUrl: string;
  rating: number;
  reviewCount?: number;
  viewCount?: number;
  workingDaysJson?: string;
  breakStart?: string;
  breakEnd?: string;
  services: { pricePkr: number; name: string }[];
};

export function SalonCard({ salon }: { salon: SalonCardData }) {
  const prices = salon.services.map((s) => s.pricePkr);
  const from = prices.length ? Math.min(...prices) : null;
  const haircut = salon.services.find((s) => /haircut/i.test(s.name));
  const open = isOpenNow(salon.openTime, salon.closeTime, {
    workingDaysJson: salon.workingDaysJson,
    breakStart: salon.breakStart,
    breakEnd: salon.breakEnd,
  });

  const categoryBadge =
    salon.category === "LADIES"
      ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
      : salon.category === "UNISEX"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
      : "bg-blue-500/20 text-blue-300 border-blue-500/30";

  return (
    <article className="card-lift group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#16161D] text-white shadow-lg transition-all hover:border-white/20">
      <div className="relative h-44 w-full overflow-hidden bg-black/40">
        <Image
          src={salon.imageUrl}
          alt={salon.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
          sizes="(max-width:768px) 100vw, 400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16161D] via-transparent to-black/50" />

        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white/90 border border-white/15 backdrop-blur-md">
            {salon.quettaArea}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md ${categoryBadge}`}>
            {CATEGORY_LABELS[salon.category] || salon.category}
          </span>
        </div>

        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/30 backdrop-blur-md">
          <StarIcon className="h-3 w-3 text-gold fill-gold" />
          <span>{salon.rating > 0 ? salon.rating.toFixed(1) : "New"}</span>
          {salon.reviewCount ? (
            <span className="font-normal text-white/60">({salon.reviewCount})</span>
          ) : null}
        </span>

        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] border border-white/10 backdrop-blur-md">
            <span
              className={`h-1.5 w-1.5 rounded-full ${open ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`}
            />
            <span className="font-semibold">{open ? "Open Now" : "Closed"}</span>
            <span className="text-white/60">
              • {formatTime12(salon.openTime)}–{formatTime12(salon.closeTime)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
            <Link href={`/salons/${salon.slug}`} className="hover:text-gold transition-colors">
              {salon.name}
            </Link>
          </h3>

          <p className="flex items-start gap-1 text-[11px] text-white/60 leading-relaxed">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-gold mt-0.5" />
            <span className="line-clamp-2">{salon.address}</span>
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/10">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Rate</span>
            <span className="text-xs font-bold text-white">
              {haircut ? (
                <>
                  Haircut from <span className="text-gold">{formatPkr(haircut.pricePkr)}</span>
                </>
              ) : from !== null ? (
                <>
                  From <span className="text-gold">{formatPkr(from)}</span>
                </>
              ) : (
                "Custom PKR"
              )}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Link
              href={`/salons/${salon.slug}`}
              className="flex items-center justify-center rounded-xl bg-white py-2 px-3 text-center text-xs font-bold text-black shadow-sm hover:bg-white/90 transition-all cursor-pointer"
            >
              View Services & Book
            </Link>
            <a
              href={whatsappChatUrl(
                salon.whatsappNumber,
                `Salam ${salon.name}! ✂️ I found your salon on Quetta Salon Connect and would like to ask about an appointment.`
              )}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1eb957] transition-all cursor-pointer"
              title="Direct WhatsApp"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
