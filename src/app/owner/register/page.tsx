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
          Join Quetta&apos;s digital salon booking network. Customers search by area and book directly with your barbers and stylists.
        </p>

        {/* 3-Step Process Flow Indicator */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/10 border border-white/20 p-2">
            <span className="block text-[10px] font-bold text-gold uppercase">Step 1</span>
            <span className="text-[11px] font-semibold text-white">Register Shop</span>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-2">
            <span className="block text-[10px] font-bold text-amber-400 uppercase">Step 2</span>
            <span className="text-[11px] font-semibold text-white/80">Admin Review</span>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-2">
            <span className="block text-[10px] font-bold text-emerald-400 uppercase">Step 3</span>
            <span className="text-[11px] font-semibold text-white/80">Go Live (PWA)</span>
          </div>
        </div>
      </div>

      <form
        className="mt-4 space-y-2.5"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError("");
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, whatsappNumber: form.whatsappNumber || form.phone }),
          });
          const data = await res.json();
          setLoading(false);
          if (!res.ok) return setError(data.error || "Could not register");
          router.push("/owner");
          router.refresh();
        }}
      >
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Owner Name *</label>
          <input
            className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
            placeholder="Owner full name"
            value={form.ownerName}
            onChange={(e) => set("ownerName", e.target.value)}
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
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">WhatsApp Number *</label>
          <input
            className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
            placeholder="03XX-XXXXXXX"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Salon / Parlour Name *</label>
          <input
            className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
            placeholder="e.g. Royal Cuts, Star Beauty Parlour"
            value={form.salonName}
            onChange={(e) => set("salonName", e.target.value)}
          />
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
            label="Salon Cover Photo (Direct Upload)"
            hint="Upload your shop banner directly from device"
            folder="registration"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-2 text-xs font-medium text-rose-300">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="mt-2 h-10 w-full rounded-xl bg-white font-bold text-black text-xs shadow-md hover:bg-white/90 transition-all cursor-pointer disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Submit for Super Admin Approval"}
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
