import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "50% Advance Online Payment, Cancellation & Refund Policy for Q_Salons Quetta.",
};

export default function RefundPolicyPage() {
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Refund &amp; Cancellation Policy</h1>
          <p className="text-xs text-white/50">Mandatory 50% Advance Rules • Quetta, Balochistan, Pakistan</p>
        </div>
      </div>

      <div className="space-y-6 text-sm text-white/80 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">1. The 50% Advance Online Payment Policy</h2>
          <p>
            To protect both salon owners in Quetta from loss of booked business hours and customers from lost time slots, Q_Salons operates a mandatory <strong>50% advance online payment model</strong>. When an appointment is scheduled:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>50% of the total service amount is paid online via JazzCash or Easypaisa.</li>
            <li>The appointment is held tentatively for 15 minutes while payment is completed.</li>
            <li>Once confirmed, the time slot is locked and unavailable to any other customer.</li>
            <li>The remaining 50% balance is payable directly at the salon counter in cash or wallet.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">2. Customer Cancellation Window (4 Hours)</h2>
          <p>
            Customers may cancel a booked appointment through their{" "}
            <Link href="/bookings" className="text-gold underline">
              My Bookings
            </Link>{" "}
            dashboard under the following conditions:
          </p>
          <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4 space-y-2">
            <p className="font-semibold text-white">
              ✓ Cancelled &gt; 4 Hours Before Appointment:
            </p>
            <p className="text-xs text-white/70">
              Eligible for a full refund of the 50% advance payment (or platform credit voucher). Refunds are disbursed back to the original JazzCash/Easypaisa wallet within 2 to 3 business days.
            </p>
            <p className="font-semibold text-white pt-2 border-t border-white/10">
              ✕ Cancelled &lt; 4 Hours Before Appointment / No-Show:
            </p>
            <p className="text-xs text-white/70">
              Because the salon stylist has reserved the slot exclusively for you and turned away other walk-in clients in Quetta, cancellations made within 4 hours of the appointment or failure to show up are non-refundable. The advance is credited to the salon to compensate for the lost business time.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">3. Salon Cancellation or Closure</h2>
          <p>
            If a salon is unexpectedly forced to close, encounters an emergency, or cannot fulfill your booked appointment, you will receive a <strong>100% full refund</strong> of your 50% advance payment, or immediate priority rescheduling at no additional fee.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">4. How to Request a Refund</h2>
          <p>
            If you need assistance with a cancellation or refund:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Locate your Booking ID on your digital receipt or in{" "}
              <Link href="/bookings" className="text-gold underline">
                My Bookings
              </Link>.
            </li>
            <li>Click &quot;Cancel This Appointment&quot; on the booking receipt if at least 4 hours remain.</li>
            <li>For manual refund inquiries, message our WhatsApp support desk at{" "}
              <a href="https://wa.me/923000000000" className="text-emerald-400 font-semibold underline">
                WhatsApp Support
              </a>{" "}
              with your Booking ID and transaction reference number.
            </li>
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">5. Service Quality Grievances</h2>
          <p>
            If you are dissatisfied with a service received at a salon in Quetta, please submit your feedback through the post-service Review system on your bookings page and notify our support desk. We take partner quality seriously and review all partner salon standings.
          </p>
        </section>
      </div>
    </div>
  );
}
