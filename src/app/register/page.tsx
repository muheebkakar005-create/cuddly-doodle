"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserIcon } from "@/components/Icons";

export default function RegisterCustomerPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Registration failed. Please check your details.");
        return;
      }

      await refreshSession();
      router.push("/bookings");
    } catch {
      setLoading(false);
      setError("Network error occurred. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-md py-6 sm:py-12 px-2">
      <div className="rounded-3xl border border-white/10 bg-[#16161D] p-6 sm:p-8 text-white shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center pb-5 border-b border-white/10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
            <UserIcon className="h-6 w-6 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Create Customer Account</h1>
          <p className="text-xs text-gold font-medium mt-1">
            Book appointments, track advance payments &amp; manage receipts
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bilal Ahmed"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Pakistani WhatsApp Mobile Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0300-1234567"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
            <p className="text-[10px] text-white/40 mt-1">Used for appointment confirmations &amp; receipts</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bilal@example.com"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Create Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
          </div>

          <div className="text-[11px] text-white/50 leading-relaxed">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-gold hover:underline">
              Terms of Service
            </Link>
            ,{" "}
            <Link href="/privacy" className="text-gold hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/refund-policy" className="text-gold hover:underline">
              50% Advance Refund Policy
            </Link>
            .
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-3 text-xs font-semibold text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-white font-bold text-black text-xs shadow-md hover:bg-white/90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? "Creating Account…" : "Create Customer Account"}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2 text-center text-xs">
          <p className="text-white/60">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-gold hover:underline">
              Sign In →
            </Link>
          </p>

          <p className="text-white/40 text-[11px]">
            Own a salon or barber shop?{" "}
            <Link href="/owner/register" className="font-semibold text-white/70 hover:underline">
              Register Shop &amp; Payout Account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
