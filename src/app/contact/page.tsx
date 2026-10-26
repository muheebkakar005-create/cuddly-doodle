import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, MapPinIcon, WhatsAppIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Contact Us | Q_Salons Quetta Support",
  description: "Get in touch with Q_Salons Quetta help desk for customer support, booking inquiries, or salon partnerships.",
};

export default function ContactPage() {
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Contact &amp; Support</h1>
          <p className="text-xs text-white/50">We are here to assist customers and salon partners across Quetta</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Customer Support */}
        <div className="rounded-3xl border border-white/10 bg-[#16161D] p-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <WhatsAppIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Customer WhatsApp Desk</h2>
            <p className="text-xs text-white/60 mt-0.5">Instant booking assistance, payments &amp; refunds</p>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            Have a question about your 50% advance payment, need to reschedule, or having trouble locating your salon in Quetta?
          </p>
          <a
            href="https://wa.me/923000000000?text=Hello%20Q_Salons%20Help%20Desk%2C%20I%20need%20assistance%20with%20my%20booking"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#1eb957] transition-all"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        {/* Salon Partnership */}
        <div className="rounded-3xl border border-white/10 bg-[#16161D] p-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20 border border-gold/30 text-gold font-bold text-lg">
            ✂️
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Salon Partnership &amp; Payouts</h2>
            <p className="text-xs text-white/60 mt-0.5">Grow your salon business with online advance bookings</p>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            Want to list your salon, barber shop, or beauty parlour on Q_Salons and receive verified advance payments?
          </p>
          <Link
            href="/owner/register"
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-black shadow-md hover:bg-gold-light transition-all"
          >
            <span>Register Your Salon</span>
          </Link>
        </div>
      </div>

      {/* Office & Devbase Details */}
      <div className="rounded-3xl border border-white/10 bg-[#16161D] p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <MapPinIcon className="h-4 w-4 text-gold" />
          <span>Devbase Headquarters</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 text-xs text-white/70">
          <div>
            <p className="font-semibold text-white">Location:</p>
            <p className="mt-0.5">Quetta, Balochistan, Pakistan</p>
          </div>
          <div>
            <p className="font-semibold text-white">Email Inquiries:</p>
            <p className="mt-0.5"><code>support@qsalons.pk</code></p>
          </div>
          <div>
            <p className="font-semibold text-white">Founder:</p>
            <p className="mt-0.5">Muheeb Ullah Kakar (Devbase)</p>
          </div>
        </div>
      </div>

      {/* FAQs link */}
      <div className="rounded-2xl border border-white/10 bg-[#121217] p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-white">Looking for cancellation or refund rules?</p>
          <p className="text-[11px] text-white/50">Read our clear 50% advance policy and 4-hour cancellation guide.</p>
        </div>
        <Link
          href="/refund-policy"
          className="text-xs font-bold text-gold hover:underline shrink-0"
        >
          Refund Policy →
        </Link>
      </div>
    </div>
  );
}
