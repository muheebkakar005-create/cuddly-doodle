"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AREAS, CATEGORIES } from "@/lib/constants";
import { ImageUpload } from "@/components/ImageUpload";

export default function OwnerRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    salonName: "",
    category: "GENTS",
    quettaArea: AREAS[0] as string,
    address: "",
    whatsappNumber: "",
    openTime: "11:00",
    closeTime: "22:00",
    imageUrl: "",
    // Payment Account Fields (Mandatory Onboarding)
    paymentProvider: "JAZZCASH" as "JAZZCASH" | "EASYPAISA" | "BANK",
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    branchCode: "",
    cnic: "",
    businessTitle: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#16161D] p-6 sm:p-8 text-white shadow-2xl my-4 sm:my-8">
      {/* Header */}
      <div className="text-center pb-4 border-b border-white/10">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Register Your Salon in Quetta</h1>
        <p className="mt-1 text-xs text-white/50">
          Join Quetta&apos;s digital salon booking network. Complete your shop registration and payout settings to begin accepting verified advance bookings.
        </p>

        {/* 3-Step Process Flow Indicator */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/10 border border-white/20 p-2">
            <span className="block text-[10px] font-bold text-gold uppercase">Step 1</span>
            <span className="text-[11px] font-semibold text-white">Shop & Payout Setup</span>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-2">
            <span className="block text-[10px] font-bold text-amber-400 uppercase">Step 2</span>
            <span className="text-[11px] font-semibold text-white/80">Account Verification</span>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-2">
            <span className="block text-[10px] font-bold text-emerald-400 uppercase">Step 3</span>
            <span className="text-[11px] font-semibold text-white/80">Accept Bookings</span>
          </div>
        </div>
      </div>

      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError("");

          if (!form.accountNumber || !form.accountHolderName) {
            setError("Please fill in your payment account holder name and account/wallet number.");
            setLoading(false);
            return;
          }

          if (form.paymentProvider === "BANK" && !form.bankName) {
            setError("Please provide the bank name for your bank account/IBAN.");
            setLoading(false);
            return;
          }

          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              whatsappNumber: form.whatsappNumber || form.phone,
            }),
          });
          const data = await res.json();
          setLoading(false);
          if (!res.ok) return setError(data.error || "Could not register");
          router.push("/owner");
          router.refresh();
        }}
      >
        {/* Section 1: Basic Information */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gold">1. Salon & Owner Info</h2>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Owner Full Legal Name *</label>
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
              placeholder="e.g. Muheeb Ullah Kakar"
              value={form.ownerName}
              onChange={(e) => {
                set("ownerName", e.target.value);
                if (!form.accountHolderName) set("accountHolderName", e.target.value);
              }}
              required
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Login Email *</label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                type="email"
                placeholder="e.g. salon@gmail.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Password *</label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Mobile / WhatsApp Number *</label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                placeholder="0300-1234567"
                value={form.phone}
                onChange={(e) => {
                  set("phone", e.target.value);
                  if (!form.accountNumber && form.paymentProvider !== "BANK") {
                    set("accountNumber", e.target.value);
                  }
                }}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Salon / Parlour Name *</label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                placeholder="e.g. The Hair Lab Quetta"
                value={form.salonName}
                onChange={(e) => set("salonName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Category *</label>
              <select
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white cursor-pointer"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#1C1C24] text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Quetta Area *</label>
              <select
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white cursor-pointer"
                value={form.quettaArea}
                onChange={(e) => set("quettaArea", e.target.value)}
              >
                {AREAS.map((a) => (
                  <option key={a} value={a} className="bg-[#1C1C24] text-white">
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Street Address in Quetta *</label>
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
              placeholder="Shop #, Street / Market, Quetta"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Open Time</label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none"
                type="time"
                value={form.openTime}
                onChange={(e) => set("openTime", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Close Time</label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none"
                type="time"
                value={form.closeTime}
                onChange={(e) => set("closeTime", e.target.value)}
              />
            </div>
          </div>

          <div>
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) => set("imageUrl", url)}
              label="Salon Cover Photo"
              hint="Upload your shop banner directly"
              folder="registration"
            />
          </div>
        </div>

        {/* Section 2: Mandatory Salon Owner Payment Account Registration */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center justify-between">
              <span>2. Mandatory Payment & Settlement Account</span>
              <span className="text-[10px] text-amber-300 font-semibold lowercase">required for payouts</span>
            </h2>
            <p className="text-[11px] text-white/60 mt-0.5">
              Specify your verified mobile wallet or bank account where QSalon will settle advance payments collected for your appointments.
            </p>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Preferred Payout Destination *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => set("paymentProvider", "JAZZCASH")}
                className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                  form.paymentProvider === "JAZZCASH"
                    ? "border-red-500 bg-red-950/40 text-white font-bold ring-1 ring-red-500"
                    : "border-white/10 bg-[#1C1C24] text-white/70 hover:bg-white/5"
                }`}
              >
                <span className="block text-xs">🔴 JazzCash</span>
                <span className="block text-[9px] text-white/50">Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => set("paymentProvider", "EASYPAISA")}
                className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                  form.paymentProvider === "EASYPAISA"
                    ? "border-emerald-500 bg-emerald-950/40 text-white font-bold ring-1 ring-emerald-500"
                    : "border-white/10 bg-[#1C1C24] text-white/70 hover:bg-white/5"
                }`}
              >
                <span className="block text-xs">🟢 Easypaisa</span>
                <span className="block text-[9px] text-white/50">Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => set("paymentProvider", "BANK")}
                className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                  form.paymentProvider === "BANK"
                    ? "border-blue-500 bg-blue-950/40 text-white font-bold ring-1 ring-blue-500"
                    : "border-white/10 bg-[#1C1C24] text-white/70 hover:bg-white/5"
                }`}
              >
                <span className="block text-xs">🏛️ Bank IBAN</span>
                <span className="block text-[9px] text-white/50">Direct Account</span>
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Account Holder Full Name *
              </label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                placeholder="Name as registered on account"
                value={form.accountHolderName}
                onChange={(e) => set("accountHolderName", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                {form.paymentProvider === "BANK" ? "IBAN / Account Number *" : "Wallet Mobile Number *"}
              </label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white font-mono"
                placeholder={form.paymentProvider === "BANK" ? "PKXX BANK 0000 0000 0000 00" : "03XX-XXXXXXX"}
                value={form.accountNumber}
                onChange={(e) => set("accountNumber", e.target.value)}
                required
              />
            </div>
          </div>

          {form.paymentProvider === "BANK" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Bank Name *</label>
                <input
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                  placeholder="e.g. Meezan Bank, HBL, UBL"
                  value={form.bankName}
                  onChange={(e) => set("bankName", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Branch Code (Optional)</label>
                <input
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                  placeholder="e.g. 0123"
                  value={form.branchCode}
                  onChange={(e) => set("branchCode", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Owner CNIC (Optional for verification)</label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white font-mono"
                placeholder="54400-XXXXXXX-X"
                value={form.cnic}
                onChange={(e) => set("cnic", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Business / Trade Title (Optional)</label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                placeholder="Registered business title"
                value={form.businessTitle}
                onChange={(e) => set("businessTitle", e.target.value)}
              />
            </div>
          </div>

          {/* Security & Verification Disclaimer */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-[11px] text-amber-200 space-y-1">
            <p className="font-bold flex items-center gap-1 text-amber-300">
              <span>🔒</span> Security & Verification Notice
            </p>
            <p className="text-white/80 leading-relaxed">
              QSalon will <strong>NEVER</strong> ask for your wallet MPIN, ATM PIN, OTP, or password. Payout accounts are reviewed and verified by QSalon administrators before online advance payments are unlocked for your salon.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-2.5 text-xs font-medium text-rose-300">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="mt-2 h-11 w-full rounded-2xl bg-gold font-bold text-black text-xs shadow-md hover:bg-gold-light transition-all cursor-pointer disabled:opacity-60"
        >
          {loading ? "Registering Shop & Payout Account…" : "Submit Registration for Verification"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-white/50">
        Already registered?{" "}
        <Link href="/owner/login" className="text-gold font-semibold underline">
          Shop Owner Login
        </Link>
      </p>
    </div>
  );
}
