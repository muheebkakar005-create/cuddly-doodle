"use client";

import { AREAS, CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { formatPkr } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";

export type SalonFormValues = {
  id?: string;
  name: string;
  category: string;
  quettaArea: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  openTime: string;
  closeTime: string;
  imageUrl: string;
  mapsUrl: string;
  featured?: boolean;
  services?: { id: string; name: string; durationMinutes: number; pricePkr: number; category: string }[];
};

export function SalonForm({ initial }: { initial?: SalonFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<SalonFormValues>(
    initial || {
      name: "",
      category: "GENTS",
      quettaArea: AREAS[0],
      address: "",
      phone: "",
      whatsappNumber: "",
      openTime: "11:00",
      closeTime: "22:00",
      imageUrl: "",
      mapsUrl: "",
      featured: false,
      services: [],
    }
  );

  const [svc, setSvc] = useState({
    name: "",
    durationMinutes: 45,
    pricePkr: 800,
    category: "Men",
  });
  const [savingService, setSavingService] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof SalonFormValues>(key: K, value: SalonFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Salon name is required.");
    if (!form.address.trim()) return setError("Detailed street address is required.");
    if (!form.phone.trim()) return setError("Contact phone number is required.");
    if (!form.whatsappNumber.trim()) return setError("WhatsApp number is required.");

    setLoading(true);
    const url = form.id ? `/api/salons/${form.id}` : "/api/salons";
    const res = await fetch(url, {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || "Save failed");

    router.push(`/admin/salons/${data.salon.id}`);
    router.refresh();
  }

  async function addService() {
    if (!form.id) return setError("Please save the salon first before adding services.");
    if (!svc.name.trim()) return setError("Service name is required.");

    setSavingService(true);
    const res = await fetch(`/api/salons/${form.id}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(svc),
    });
    setSavingService(false);
    if (res.ok) {
      setSvc({ name: "", durationMinutes: 45, pricePkr: 800, category: form.category === "LADIES" ? "Women" : "Men" });
      router.refresh();
    }
  }

  async function removeService(id: string) {
    if (!confirm("Are you sure you want to remove this service?")) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function removeSalon() {
    if (!form.id || !confirm("Are you sure you want to permanently delete this salon? All its services and appointments will also be deleted.")) {
      return;
    }
    await fetch(`/api/salons/${form.id}`, { method: "DELETE" });
    router.push("/admin/salons");
    router.refresh();
  }

  return (
    <div className="space-y-6 text-white">
      <form onSubmit={save} className="space-y-4 rounded-2xl border border-white/10 bg-[#16161D] p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white">
              {form.id ? `Edit: ${form.name}` : "Add New Quetta Salon"}
            </h2>
            <p className="text-[11px] text-white/50">
              Configure salon profile, working hours, and location in Quetta.
            </p>
          </div>
          {form.id && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-mono text-white/60">
              ID: {form.id.slice(0, 8)}
            </span>
          )}
        </div>

        {/* Salon Name & Category */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Salon Name *
            </label>
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
              placeholder="e.g. The Hair Lab Quetta, Noor Bridal Studio"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Primary Category *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white cursor-pointer"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1C1C24] text-white">
                  {c.label} ({CATEGORY_LABELS[c.id]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quetta Neighborhood & Detailed Address */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Quetta Neighborhood / Area *
            </label>
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

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Detailed Street Address *
            </label>
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
              placeholder="e.g. Shop 12, Jinnah Market, M.A. Jinnah Road, Quetta"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
        </div>

        {/* Contacts: Phone & WhatsApp */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Contact Phone Number *
            </label>
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
              placeholder="e.g. 0812821101 or 03331234567"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Active WhatsApp Number (For Booking API) *
            </label>
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
              placeholder="03XX-XXXXXXX or +923XXXXXXXXX"
              value={form.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
            />
          </div>
        </div>

        {/* Working Hours */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Opening Time
            </label>
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white"
              type="time"
              value={form.openTime}
              onChange={(e) => set("openTime", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Closing Time
            </label>
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white"
              type="time"
              value={form.closeTime}
              onChange={(e) => set("closeTime", e.target.value)}
            />
          </div>
        </div>

        {/* Media: Cover photo & Google Maps Link */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) => set("imageUrl", url)}
              label="Cover Photo (Cloudinary Direct Upload)"
              hint="Tap to upload image file from device or camera"
              folder="salons"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Google Maps Embed / Direct Link
            </label>
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
              placeholder="https://maps.google.com/?q=..."
              value={form.mapsUrl}
              onChange={(e) => set("mapsUrl", e.target.value)}
            />
          </div>
        </div>

        <div className="pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-white/80">
            <input
              type="checkbox"
              checked={!!form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="rounded text-white focus:ring-white"
            />
            <span>Featured Salon (Showcases on Quetta homepage carousel)</span>
          </label>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-2.5 text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-white px-5 py-2 text-xs font-bold text-black shadow-md hover:bg-white/90 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Saving…" : form.id ? "Update Salon" : "Create Salon"}
          </button>

          {form.id && (
            <button
              type="button"
              onClick={removeSalon}
              className="rounded-xl border border-rose-500/30 bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
            >
              Delete Salon
            </button>
          )}
        </div>
      </form>

      {/* Services Management Per Salon */}
      {form.id && (
        <div className="rounded-2xl border border-white/10 bg-[#16161D] p-5 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white">Services & PKR Pricing</h3>
              <p className="text-[11px] text-white/50">
                Manage service offerings, durations, and pricing in Pakistani Rupee (PKR).
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-gold">
              {(initial?.services || []).length} Services
            </span>
          </div>

          {/* Existing Services List */}
          <div className="divide-y divide-white/5">
            {(initial?.services || []).map((s) => (
              <div key={s.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white text-xs block">{s.name}</span>
                  <span className="text-[10px] text-white/50">
                    {s.durationMinutes} mins • Category: {s.category || "General"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-xs text-gold">
                    {formatPkr(s.pricePkr)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeService(s.id)}
                    className="rounded-lg bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {(!initial?.services || initial.services.length === 0) && (
              <p className="py-3 text-xs text-white/40 text-center">No services listed yet for this salon.</p>
            )}
          </div>

          {/* Add New Custom Service Form */}
          <div className="rounded-xl bg-[#1C1C24] border border-white/10 p-3.5 space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/70">Add Custom Service</h4>
            <div className="grid gap-2 sm:grid-cols-4">
              <input
                className="h-9 rounded-lg border border-white/10 bg-[#16161D] px-2.5 text-xs sm:col-span-2 outline-none text-white placeholder:text-white/40"
                placeholder="Service name (e.g. Charcoal Facial, HydraFacial)"
                value={svc.name}
                onChange={(e) => setSvc({ ...svc, name: e.target.value })}
              />
              <input
                className="h-9 rounded-lg border border-white/10 bg-[#16161D] px-2.5 text-xs outline-none text-white placeholder:text-white/40"
                type="number"
                placeholder="Duration (Mins)"
                value={svc.durationMinutes}
                onChange={(e) => setSvc({ ...svc, durationMinutes: Number(e.target.value) })}
              />
              <input
                className="h-9 rounded-lg border border-white/10 bg-[#16161D] px-2.5 text-xs outline-none text-white placeholder:text-white/40"
                type="number"
                placeholder="Price (PKR)"
                value={svc.pricePkr}
                onChange={(e) => setSvc({ ...svc, pricePkr: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-lg border border-white/10 bg-[#16161D] px-2.5 text-xs outline-none text-white cursor-pointer"
                value={svc.category}
                onChange={(e) => setSvc({ ...svc, category: e.target.value })}
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
                <option value="Custom">Custom</option>
              </select>
              <button
                type="button"
                disabled={savingService}
                onClick={addService}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black shadow-sm hover:bg-white/90 cursor-pointer disabled:opacity-60"
              >
                {savingService ? "Adding…" : "+ Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
