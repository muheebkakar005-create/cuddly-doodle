import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy and Data Protection Policy for Q_Salons in Quetta, Balochistan, Pakistan.",
};

export default function PrivacyPage() {
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-xs text-white/50">Effective Date: October 2026 • Devbase / Q_Salons Quetta</p>
        </div>
      </div>

      <div className="space-y-6 text-sm text-white/80 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">1. Information We Collect</h2>
          <p>
            When you use Q_Salons to discover salons or book appointments in Quetta, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Customer Contact Details:</strong> Name, WhatsApp mobile number, email address, and booking preferences.</li>
            <li><strong>Booking &amp; Transaction Data:</strong> Date, time slot, chosen salon services, and payment references from JazzCash or Easypaisa.</li>
            <li><strong>Salon Owner Verification (KYC):</strong> Legal name, CNIC number, business address, and registered payout account details (JazzCash, Easypaisa, or Bank IBAN).</li>
            <li><strong>Technical &amp; Analytics Data:</strong> IP address, device type, browser information, and appointment cookies for session persistence.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">2. How We Use Your Information</h2>
          <p>
            We use your data solely to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Confirm and reserve appointment slots with your chosen Quetta salon.</li>
            <li>Send instant WhatsApp booking confirmations and digital receipts.</li>
            <li>Process verified 50% online advance transactions securely.</li>
            <li>Disburse earned revenues accurately to verified salon owners.</li>
            <li>Prevent fraud, abusive slot reservation, and unauthorized access.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">3. Financial Credentials &amp; Transaction Security</h2>
          <p>
            Q_Salons <strong>never asks for or stores</strong> your JazzCash MPIN, Easypaisa OTP, bank account passwords, or CVV codes. All payments are processed through secure hosted payment gateways and HMAC-verified webhooks directly provided by licensed Pakistani payment providers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">4. Sharing With Salons</h2>
          <p>
            When you book an appointment, the relevant salon owner and staff receive your name, contact phone number, and requested services so they can welcome and prepare for your visit. We never sell or rent your personal information to third-party advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">5. Data Retention &amp; Customer Rights</h2>
          <p>
            You may request deletion or correction of your profile and appointment history at any time by contacting our support desk. All passwords are encrypted with industry-standard bcrypt hashing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gold">6. Contact Our Privacy Officer</h2>
          <p>
            For privacy-related questions or data deletion requests, contact us at <code>privacy@qsalons.pk</code> or via WhatsApp through our{" "}
            <Link href="/contact" className="text-gold underline">
              Contact Center
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
