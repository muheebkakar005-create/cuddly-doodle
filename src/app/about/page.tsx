import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, MapPinIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "About Us | Q_Salons Quetta",
  description: "Learn about Q_Salons, Quetta's premier digital salon booking platform developed by Devbase and founder Muheeb Ullah Kakar.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6 sm:py-10 px-4 text-white">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16161D] border border-white/10 text-white hover:bg-white/20 transition-all shadow-sm"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">About Q_Salons</h1>
          <p className="text-xs text-white/50">Balochistan&apos;s First Digital Salon &amp; Grooming Ecosystem</p>
        </div>
      </div>

      <div className="space-y-6 text-sm text-white/80 leading-relaxed">
        {/* Mission Statement */}
        <section className="rounded-3xl border border-white/10 bg-[#16161D] p-6 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/15 px-2.5 py-1 rounded-full border border-gold/30">
            Our Mission
          </span>
          <h2 className="font-display text-xl font-bold text-white">
            Transforming Salon &amp; Personal Care in Quetta
          </h2>
          <p>
            Historically in Quetta, booking a salon appointment meant waiting in long crowded lines at local barber shops or dealing with uncertain walk-in timings at bridal parlours. <strong>Q_Salons</strong> was engineered to solve this challenge once and for all.
          </p>
          <p>
            We bring all verified salons, executive barbers, and luxury beauty parlours across Quetta onto a single transparent booking platform with genuine PKR rates, verified customer reviews, automated time slot reservations, and instant WhatsApp confirmations.
          </p>
        </section>

        {/* Areas Served */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-gold" />
            <span>Serving Every Neighborhood Across Quetta</span>
          </h2>
          <p>
            From Jinnah Road and Liaqat Bazaar to Quetta Cantt, Model Town, Samungli Road, Airport Road, Zarghoon Road, Satellite Town, and Hazara Town — we connect customers with top-rated barbers, nail artists, skin therapists, and bridal makeup specialists right around their corner.
          </p>
        </section>

        {/* Why Q_Salons */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4">
            <p className="text-2xl font-bold text-gold">100%</p>
            <p className="text-xs font-bold text-white mt-1">Verified PKR Pricing</p>
            <p className="text-[11px] text-white/50 mt-1">No hidden charges or surprise rates at the counter.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4">
            <p className="text-2xl font-bold text-emerald-400">50%</p>
            <p className="text-xs font-bold text-white mt-1">Advance Online Guarantee</p>
            <p className="text-[11px] text-white/50 mt-1">Guarantees your slot with JazzCash &amp; Easypaisa.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4">
            <p className="text-2xl font-bold text-blue-400">11+</p>
            <p className="text-xs font-bold text-white mt-1">Quetta Neighborhoods</p>
            <p className="text-[11px] text-white/50 mt-1">Comprehensive local coverage across the valley.</p>
          </div>
        </section>

        {/* Founder & Company Profile */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1C1C24] to-[#121217] p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold text-gold">
              MK
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Muheeb Ullah Kakar</h3>
              <p className="text-xs text-gold font-medium">Founder &amp; Principal Software Engineer</p>
              <p className="text-[11px] text-white/50">Company: Devbase • Quetta, Pakistan</p>
            </div>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            Q_Salons is conceived and developed by <strong>Muheeb Ullah Kakar</strong> under his technology venture <strong>Devbase</strong>. Our focus is delivering world-class, ultra-fast progressive web applications designed specifically for Pakistan&apos;s local commercial landscape with offline support, local payment gateways, and multilingual WhatsApp integration.
          </p>
        </section>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/explore"
            className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black shadow-md hover:bg-white/90 transition-all"
          >
            Explore Salons
          </Link>
          <Link
            href="/owner/register"
            className="rounded-xl border border-white/10 bg-[#16161D] px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all"
          >
            Partner Your Salon
          </Link>
          <Link
            href="/contact"
            className="rounded-xl border border-white/10 bg-[#16161D] px-5 py-2.5 text-xs font-bold text-gold hover:bg-white/10 transition-all"
          >
            Contact Help Desk
          </Link>
        </div>
      </div>
    </div>
  );
}
