"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AREAS, CATEGORIES } from "@/lib/constants";
import { MapPinIcon, ShieldLockIcon, WhatsAppIcon } from "./Icons";

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
      <div className="mx-auto max-w-6xl lg:max-w-7xl xl:max-w-[1536px] 2xl:max-w-[1780px] px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Column 1: Brand Info & Guarantee */}
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
              Quetta&apos;s premier salon booking platform. Discover top-rated barbers, ladies parlours, and luxury spas across Quetta with verified prices in PKR, 50% advance protection, and instant WhatsApp confirmation.
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#16161D] px-3 py-1 text-[11px] font-medium text-gold">
                <span>🛡️</span>
                50% Advance Guarantee
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
                  Bridal &amp; Grooming Packages
                </Link>
              </li>
              <li>
                <Link
                  href="/explore?q=Facial"
                  className="text-white/60 hover:text-gold transition-colors inline-block py-0.5"
                >
                  HydraFacial &amp; Skincare
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

          {/* Column 4: Company & Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Company &amp; Legal</h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/about" className="text-white/60 hover:text-gold transition-colors inline-block py-0.5">
                  About Q_Salons
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/60 hover:text-gold transition-colors inline-block py-0.5">
                  Contact &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/60 hover:text-gold transition-colors inline-block py-0.5">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/60 hover:text-gold transition-colors inline-block py-0.5">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-white/60 hover:text-gold transition-colors inline-block py-0.5">
                  50% Refund Policy
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  href="/owner/register"
                  className="text-gold font-semibold hover:underline inline-block py-0.5"
                >
                  Register Your Salon →
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-white/80 hover:text-white font-medium transition-colors"
                >
                  <ShieldLockIcon className="h-3.5 w-3.5 text-gold" />
                  <span>Portal Sign In</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar — Copyright, Creator Credit & Safe Area for Mobile Dock */}
      <div className="border-t border-white/10 bg-[#08080A] px-4 py-6 pb-28 md:pb-6 text-xs text-white/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <div className="space-y-1">
            <p>© {new Date().getFullYear()} Q_Salons (Quetta Salon Connect). All rights reserved.</p>
            <p className="text-[11px] text-white/60">
              Made by <span className="font-semibold text-white">Muheeb ullah kakar</span> &nbsp;|&nbsp; Company: <span className="font-semibold text-gold">Devbase</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <Link href="/terms" className="text-white/60 hover:text-white">Terms</Link>
            <span>•</span>
            <Link href="/privacy" className="text-white/60 hover:text-white">Privacy</Link>
            <span>•</span>
            <Link href="/refund-policy" className="text-white/60 hover:text-white">Refunds</Link>
            <span>•</span>
            <span className="text-gold font-medium">Quetta, Balochistan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
