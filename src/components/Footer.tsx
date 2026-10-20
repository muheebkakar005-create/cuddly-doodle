"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AREAS, CATEGORIES } from "@/lib/constants";
import { CalendarIcon, MapPinIcon, ShieldLockIcon, WhatsAppIcon } from "./Icons";

export function Footer() {
  const pathname = usePathname();

  // Hide on admin/owner dashboard screens to keep the dashboard focused
  if (
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/shop-owner") ||
    (pathname.startsWith("/admin") && pathname !== "/admin/login") ||
    (pathname.startsWith("/owner") && pathname !== "/owner/login" && pathname !== "/owner/register")
  ) {
    return null;
  }

  return (
    <footer className="border-t border-white/10 bg-[#0C0C0E] text-white">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Column 1: Brand Info & Guarantee (takes 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-web.png"
                alt="Q Salons – Style For Everyone"
                width={190}
                height={52}
                className="h-10 w-auto object-contain"
              />
            </Link>

            <p className="text-xs leading-relaxed text-white/60 max-w-sm">
              Quetta’s premier salon booking platform. Discover top-rated barbers, ladies parlours, and luxury spas across Quetta with verified prices in PKR and instant WhatsApp confirmation.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#16161D] px-3 py-1 text-[11px] font-medium text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Verified Salons
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#16161D] px-3 py-1 text-[11px] font-medium text-white/80">
                <WhatsAppIcon className="h-3 w-3 text-emerald-400" />
                WhatsApp Confirmation
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#16161D] px-3 py-1 text-[11px] font-medium text-white/80">
                Zero Advance Fees
              </span>
            </div>

            {/* Quetta Location Note */}
            <div className="flex items-center gap-2 pt-2 text-xs text-white/50">
              <MapPinIcon className="h-3.5 w-3.5 text-gold shrink-0" />
              <span>Serving Quetta, Balochistan, Pakistan</span>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Categories</h3>
            <ul className="mt-3 space-y-2 text-xs">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={cat.id === "ALL" ? "/explore" : `/explore?category=${cat.id}`}
                    className="text-white/60 hover:text-gold transition-colors inline-block py-0.5"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/explore?q=Bridal"
                  className="text-white/60 hover:text-gold transition-colors inline-block py-0.5"
                >
                  Bridal & Grooming Packages
                </Link>
              </li>
              <li>
                <Link
                  href="/explore?q=Facial"
                  className="text-white/60 hover:text-gold transition-colors inline-block py-0.5"
                >
                  HydraFacial & Skincare
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quetta Neighborhoods */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Popular Areas</h3>
            <ul className="mt-3 space-y-2 text-xs">
              {AREAS.slice(0, 6).map((area) => (
                <li key={area}>
                  <Link
                    href={`/explore?area=${encodeURIComponent(area)}`}
                    className="text-white/60 hover:text-gold transition-colors inline-block py-0.5"
                  >
                    {area}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/explore"
                  className="text-gold font-medium hover:underline inline-block py-0.5"
                >
                  View All Areas →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Portals & Help */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Portals & Support</h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-white/80 hover:text-white font-medium transition-colors"
                >
                  <ShieldLockIcon className="h-3.5 w-3.5 text-gold" />
                  <span>Portal Sign In</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/owner/register"
                  className="text-white/60 hover:text-gold transition-colors inline-block py-0.5"
                >
                  Register Your Salon
                </Link>
              </li>
              <li>
                <Link
                  href="/bookings"
                  className="inline-flex items-center gap-1.5 text-white/60 hover:text-gold transition-colors py-0.5"
                >
                  <CalendarIcon className="h-3 w-3 text-gold" />
                  <span>Track Appointments</span>
                </Link>
              </li>
              <li className="pt-2">
                <a
                  href="https://wa.me/923000000000?text=Hello%20Q_Salons%20Help%20Desk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span>WhatsApp Support</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar — Copyright & Safe Area for Mobile Dock */}
      <div className="border-t border-white/10 bg-[#08080A] px-4 py-6 pb-28 md:pb-6 text-xs text-white/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} Q_Salons (Quetta Salon Connect). All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span>سلونز آف کوئٹہ</span>
            <span>•</span>
            <span className="text-white/70">100% Free Booking</span>
            <span>•</span>
            <span className="text-gold font-medium">Balochistan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
