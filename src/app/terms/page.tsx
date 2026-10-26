import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and Conditions governing the use of Q_Salons platform in Quetta, Balochistan.",
};

export default function TermsPage() {
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Terms of Service</h1>
          <p className="text-xs text-white/50">Last updated: October 2026 • Quetta, Balochistan, Pakistan</p>
        </div>
      </div>

      <div className="space-y-6 text-sm text-white/80 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">1. Acceptance of Terms</h2>
          <p>
            By accessing, browsing, or utilizing the <strong>Q_Salons</strong> platform (website, web applications, or mobile Progressive Web App), operated by <strong>Devbase</strong> (founded by Muheeb Ullah Kakar in Quetta, Pakistan), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service and all related policies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">2. Nature of Platform</h2>
          <p>
            Q_Salons connects customers seeking salon, barber, spa, and beauty grooming services across Quetta with independently owned and operated salons and parlours. Q_Salons facilitates online discovery, scheduled booking slots, and secure 50% advance payments. Each listed salon is responsible for providing the booked physical service in accordance with professional quality standards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">3. Mandatory 50% Advance Online Payment</h2>
          <p>
            To eliminate phantom bookings and guarantee customer time slots in Quetta, Q_Salons enforces a <strong>mandatory 50% advance online payment</strong> calculated in Pakistani Rupees (PKR) using official integer-paisa server calculations. Advance payments are processed through secure authorized channels including JazzCash and Easypaisa. The remaining 50% balance must be settled directly at the salon counter upon completion of service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">4. Customer Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide a genuine, active Pakistani WhatsApp mobile number (e.g. 03XX-XXXXXXX).</li>
            <li>Arrive on time at the booked salon location in Quetta.</li>
            <li>Pay the remaining 50% balance at the salon after service delivery.</li>
            <li>Cancel appointments at least 4 hours in advance if unable to attend.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">5. Salon Partner Obligations &amp; Payouts</h2>
          <p>
            Salon owners registered on Q_Salons must verify their CNIC and valid payout account (JazzCash, Easypaisa, or Pakistani Bank Account) to accept online bookings. Salons must honor confirmed bookings, adhere to listed prices in PKR, and provide sanitary, dignified services. Customer advances collected online are disbursed according to the platform settlement schedule minus agreed platform commission.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">6. Governing Law &amp; Jurisdiction</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of Balochistan and the Islamic Republic of Pakistan. Any dispute arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Quetta, Pakistan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">7. Contact &amp; Inquiries</h2>
          <p>
            For legal inquiries or questions regarding these terms, please contact Devbase at{" "}
            <Link href="/contact" className="text-gold underline">
              our Contact Page
            </Link>{" "}
            or email us at <code>support@qsalons.pk</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
