import Image from "next/image";
import Link from "next/link";
import { AREAS } from "@/lib/constants";
import { Prisma } from "@prisma/client";
import { Metadata } from "next";
import { prisma, withRetry } from "@/lib/prisma";
import { sortByRank } from "@/lib/rank";

type SalonWithServices = Prisma.SalonGetPayload<{ include: { services: true } }>;
import { SalonCard } from "@/components/SalonCard";
import { StarIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qsalons.vercel.app";

export const metadata: Metadata = {
  alternates: {
    canonical: siteUrl,
  },
};

const CATEGORY_TILES = [
  {
    name: "Styling",
    query: "Haircut",
    img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Haircut",
    query: "Haircut",
    img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Coloring",
    query: "Hair Color",
    img: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Spa",
    category: "UNISEX",
    img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Shampoo",
    query: "HydraFacial",
    img: "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Shaving",
    query: "Beard Trim",
    img: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80",
  },
];

const SPECIALISTS = [
  {
    name: "Hamza Kakar",
    specialty: "Modern Fades • Keune Hair Spa",
    salon: "The Hair Lab Quetta",
    slug: "the-hair-lab-quetta",
    rating: 4.9,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Zarmina Khan",
    specialty: "Bridal Glam • HydraFacial",
    salon: "The House of Beauty",
    slug: "the-house-of-beauty-salon",
    rating: 4.9,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Ustad Rasheed",
    specialty: "Razor Shave • Beard Hot Towel",
    salon: "Continental Hair Salon",
    slug: "continental-hair-salon",
    rating: 4.8,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Dr. Naila Aesthetic",
    specialty: "HydraFacial • Rejuvenation Spa",
    salon: "Avalon Beauty & Spa",
    slug: "avalon-beauty-salon-spa",
    rating: 4.9,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
  },
];

export default async function HomePage() {
  let featured: SalonWithServices[] = [];
  try {
    const raw = await withRetry(() =>
      prisma.salon.findMany({
        where: { approvalStatus: "APPROVED" },
        include: { services: true },
      })
    );
    featured = sortByRank(raw).slice(0, 6);
  } catch (error) {
    console.error("Failed to query featured salons:", error);
  }

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Hero Promo Card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E1E26] via-[#252530] to-[#181820] text-white shadow-lg border border-white/10">
        <div className="grid grid-cols-[100px_1fr] sm:grid-cols-2 items-center">
          <div className="relative h-36 sm:h-48 w-full overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80"
              alt="Quetta Salon Styling"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1E1E26]/40 to-[#1E1E26]" />
          </div>

          <div className="p-3.5 sm:p-6 space-y-1.5">
            <h1 className="text-base sm:text-2xl font-bold leading-tight text-white">
              Find Salons &amp; Barbers in Quetta
            </h1>
            <div>
              <span className="inline-block rounded-full bg-white/15 border border-white/25 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white backdrop-blur-md">
                Get 15% off
              </span>
            </div>
            <p className="text-[9px] text-white/50 tracking-wider font-semibold">
              *T&amp;C applied • Quetta, Balochistan
            </p>
          </div>
        </div>
      </section>

      {/* 2. "What do you want to do today?" - 6-photo grid */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-white">
            What do you want to do today?
          </h2>
          <Link href="/explore" className="text-[11px] font-semibold text-white/60 hover:text-white transition-colors">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {CATEGORY_TILES.map((tile) => {
            const href = tile.category
              ? `/explore?category=${tile.category}`
              : `/explore?q=${encodeURIComponent(tile.query || tile.name)}`;

            return (
              <Link
                key={tile.name}
                href={href}
                className="group relative overflow-hidden rounded-xl bg-[#1C1C24] border border-white/10 shadow-sm aspect-[4/3] flex flex-col justify-end p-2 sm:p-2.5 transition-transform hover:scale-[1.02]"
              >
                <Image
                  src={tile.img}
                  alt={tile.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <span className="relative z-10 text-[11px] sm:text-xs font-bold text-white text-left leading-tight truncate">
                  {tile.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Hair Specialist */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-white">Hair Specialist</h2>
          <Link href="/explore" className="text-[11px] font-semibold text-white/60 hover:text-white transition-colors">
            View All
          </Link>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {SPECIALISTS.map((s) => (
            <Link
              key={s.name}
              href={`/salons/${s.slug}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#16161D] p-2.5 shadow-sm hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20">
                  <Image src={s.avatar} alt={s.name} fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white leading-tight group-hover:text-gold transition-colors truncate">
                    {s.name}
                  </h3>
                  <p className="text-[10px] text-white/60 truncate">{s.specialty}</p>
                  <p className="text-[9px] font-semibold text-gold/90 truncate">{s.salon}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-full bg-black/60 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-gold shrink-0">
                <StarIcon className="h-2.5 w-2.5 fill-gold" />
                <span>{s.rating}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Quick Quetta Neighborhoods Pills */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
            Quetta Neighborhoods
          </p>
          <span className="text-[10px] text-white/40">11 Areas</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {AREAS.map((a) => (
            <Link
              key={a}
              href={`/explore?area=${encodeURIComponent(a)}`}
              className="shrink-0 rounded-full border border-white/10 bg-[#16161D] px-3 py-1.5 text-[11px] font-medium text-white/90 shadow-sm hover:border-white/30 hover:bg-white/10 transition-colors"
            >
              {a}
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Featured Salons in Quetta */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Featured Salons in Quetta
            </h2>
            <p className="text-[11px] text-white/60">Verified barbers, bridal parlors & spas with PKR rates.</p>
          </div>
          <Link href="/explore" className="text-[11px] font-semibold text-gold hover:underline shrink-0">
            See all ({featured.length}) →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <SalonCard key={s.id} salon={s} />
          ))}
        </div>
      </section>

      {/* 6. How it works 3-Step Trust Card */}
      <section className="grid gap-2 rounded-2xl border border-white/10 bg-[#16161D] p-3.5 sm:grid-cols-3 shadow-lg">
        {[
          {
            n: "01",
            t: "Choose Salon in Area",
            d: "Filter Jinnah Road, Liaqat Bazaar, Model Town & 11 Quetta neighborhoods.",
          },
          {
            n: "02",
            t: "Pick Service & Slot",
            d: "Multi-select services with real PKR pricing and pick available time.",
          },
          {
            n: "03",
            t: "Confirm via WhatsApp",
            d: "Pre-formatted WhatsApp message confirms your booking with the salon.",
          },
        ].map((step) => (
          <div key={step.n} className="rounded-xl bg-[#1C1C24] p-3 border border-white/5">
            <p className="text-lg font-bold text-gold">{step.n}</p>
            <h3 className="mt-0.5 text-xs font-bold text-white">{step.t}</h3>
            <p className="mt-0.5 text-[10px] text-white/60 leading-relaxed">{step.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
