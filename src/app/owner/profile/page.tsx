"use client";

import { AREAS, CATEGORIES } from "@/lib/constants";
import { WEEKDAYS, parseWorkingDays } from "@/lib/hours";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageUpload } from "@/components/ImageUpload";

type Service = { id: string; name: string; durationMinutes: number; pricePkr: number; category: string };
type Staff = { id: string; name: string; specialty: string; photoUrl: string };

export default function OwnerProfilePage() {
  const router = useRouter();
  const [salonId, setSalonId] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "GENTS",
    quettaArea: AREAS[0] as string,
    address: "",
    phone: "",
    whatsappNumber: "",
    openTime: "11:00",
    closeTime: "22:00",
    breakStart: "",
    breakEnd: "",
    imageUrl: "",
    mapsUrl: "",
    galleryText: "",
  });
  const [gallery, setGallery] = useState<string[]>([]);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [services, setServices] = useState<Service[]>([]);
  const [svc, setSvc] = useState({ name: "", durationMinutes: 30, pricePkr: 800, category: "Custom" });
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newStaff, setNewStaff] = useState({ name: "", specialty: "Hair & Beard Stylist", photoUrl: "" });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);

  useEffect(() => {
    fetch("/api/owner/salon")
      .then((r) => r.json())
      .then((d) => {
        if (!d.salon) return;
        const s = d.salon;
        setSalonId(s.id);
        setStatus(s.approvalStatus);
        setForm({
          name: s.name,
          category: s.category,
          quettaArea: s.quettaArea,
          address: s.address,
          phone: s.phone,
          whatsappNumber: s.whatsappNumber,
          openTime: s.openTime,
          closeTime: s.closeTime,
          breakStart: s.breakStart || "",
          breakEnd: s.breakEnd || "",
          imageUrl: s.imageUrl,
          mapsUrl: s.mapsUrl,
          galleryText: "",
        });
        const gList: string[] = JSON.parse(s.galleryJson || "[]");
        setGallery(gList);
        setDays(parseWorkingDays(s.workingDaysJson));
        setServices(s.services || []);
        setStaff(s.staff || []);
      });
  }, []);

  function toggleDay(id: number) {
    setDays((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort()));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved("");
    setSaving(true);
    const res = await fetch("/api/owner/salon", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, workingDays: days, gallery }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || "Save failed");
    setSaved("Profile updated successfully! Live updates reflect after verification.");
    router.refresh();
  }

  async function addService() {
    if (!salonId || !svc.name.trim()) return;
    setAddingService(true);
    const res = await fetch(`/api/salons/${salonId}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(svc),
    });
    const data = await res.json();
    setAddingService(false);
    if (res.ok) {
      setServices((prev) => [...prev, data.service]);
      setSvc({ name: "", durationMinutes: 30, pricePkr: 800, category: form.category === "LADIES" ? "Women" : "Men" });
    }
  }

  async function removeService(id: string) {
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  async function addStaffMember() {
    if (!salonId || !newStaff.name.trim()) return;
    setAddingStaff(true);
    const res = await fetch(`/api/salons/${salonId}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStaff),
    });
    const data = await res.json();
    setAddingStaff(false);
    if (res.ok) {
      setStaff((prev) => [...prev, data.staff]);
      setNewStaff({ name: "", specialty: "Hair & Beard Stylist", photoUrl: "" });
    }
  }

  async function removeStaffMember(id: string) {
    if (!confirm("Are you sure you want to remove this hairdresser/specialist?")) return;
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    setStaff((prev) => prev.filter((st) => st.id !== id));
  }

  return (
    <div className="space-y-5 text-white max-w-3xl">
      {/* Page Header with Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">Shop Profile & Settings</h1>
          <p className="text-[11px] text-white/50 mt-0.5">
            Configure working hours, break periods, and salon info. Off-days automatically block appointment slots.
          </p>
        </div>

        <div>
          {status === "APPROVED" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live on Marketplace
            </span>
          )}
          {status === "PENDING" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Pending Admin Verification
            </span>
          )}
          {status === "REJECTED" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-[11px] font-bold text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Changes Requested
            </span>
          )}
        </div>
      </div>

      <form onSubmit={save} className="space-y-4">
        {/* Basic Details Card */}
        <section className="rounded-2xl border border-white/10 bg-[#16161D] p-4 sm:p-5 shadow-lg space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/70">1. Salon Details</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Salon / Parlour Name *
              </label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Salon Name"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Category *
              </label>
              <select
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white cursor-pointer"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#1C1C24] text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Quetta Neighborhood / Area *
              </label>
              <select
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white cursor-pointer"
                value={form.quettaArea}
                onChange={(e) => setForm({ ...form, quettaArea: e.target.value })}
              >
                {AREAS.map((a) => (
                  <option key={a} value={a} className="bg-[#1C1C24] text-white">
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Street Address in Quetta *
              </label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
                placeholder="Shop #, Street / Market, Quetta"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Phone Number *
              </label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
                placeholder="0812821101 or 03XX-XXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Active WhatsApp (For Booking API) *
              </label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
                placeholder="03XX-XXXXXXX or +923XXXXXXXXX"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Operating Hours & Off-Days Card */}
        <section className="rounded-2xl border border-white/10 bg-[#16161D] p-4 sm:p-5 shadow-lg space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/70">2. Operating Hours & Schedule</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Open Time
              </label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white"
                type="time"
                value={form.openTime}
                onChange={(e) => setForm({ ...form, openTime: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Close Time
              </label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white"
                type="time"
                value={form.closeTime}
                onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Break Start (Optional)
              </label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white"
                type="time"
                value={form.breakStart}
                onChange={(e) => setForm({ ...form, breakStart: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Break End
              </label>
              <input
                className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white"
                type="time"
                value={form.breakEnd}
                onChange={(e) => setForm({ ...form, breakEnd: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Working Days (Tap to Toggle Open Days)
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => {
                const isWork = days.includes(d.id);
                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => toggleDay(d.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      isWork
                        ? "bg-white text-black shadow-sm"
                        : "bg-[#1C1C24] border border-white/10 text-white/40 hover:bg-white/5"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isWork ? "bg-black" : "bg-white/30"}`} />
                    <span>{d.label.slice(0, 3)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Media & Photos */}
        <section className="rounded-2xl border border-white/10 bg-[#16161D] p-4 sm:p-5 shadow-lg space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/70">3. Media & Location</h2>

          <div>
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              label="Salon Cover Photo (Cloudinary Direct Upload)"
              hint="Tap to choose image file from device camera or storage (or paste link)"
              folder="salons"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
              Google Maps Link
            </label>
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
              placeholder="https://maps.google.com/?q=..."
              value={form.mapsUrl}
              onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60">
                Shop Gallery Photos ({gallery.length})
              </label>
              <span className="text-[10px] text-white/40">Shows on salon booking page</span>
            </div>

            {/* Existing Gallery Thumbnails */}
            {gallery.length > 0 && (
              <div className="mb-2.5 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gallery.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40">
                    <Image
                      src={url}
                      alt={`Gallery ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized={url.startsWith("/uploads/") || url.startsWith("data:")}
                    />
                    <button
                      type="button"
                      onClick={() => setGallery((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                      title="Remove Photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Direct Image Upload for Gallery */}
            <ImageUpload
              value=""
              onChange={(newUrl) => {
                if (newUrl) setGallery((prev) => [...prev, newUrl]);
              }}
              label="Add New Gallery Photo (Cloudinary Direct Upload)"
              hint="Tap to add shop interior, chairs, or equipment photo"
              folder="gallery"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-2 text-xs font-semibold text-rose-300">
              {error}
            </div>
          )}

          {saved && (
            <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 p-2 text-xs font-semibold text-emerald-300">
              ✓ {saved}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-10 w-full rounded-xl bg-white font-bold text-black text-xs shadow-md hover:bg-white/90 transition-all cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Profile & Hours"}
          </button>
        </section>
      </form>

      {/* Services & PKR Pricing Management */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] p-4 sm:p-5 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/70">4. Service Menu & Pricing (PKR)</h2>
            <p className="text-[10px] text-white/50">Add or remove services shown to customers.</p>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-gold">
            {services.length} Services
          </span>
        </div>

        {/* Existing Services List */}
        <div className="divide-y divide-white/5">
          {services.map((s) => (
            <div key={s.id} className="py-2 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-white text-xs block">{s.name}</span>
                <span className="text-[10px] text-white/50">
                  {s.durationMinutes} mins • Category: {s.category || "General"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-xs text-gold">Rs. {s.pricePkr.toLocaleString()} PKR</span>
                <button
                  type="button"
                  onClick={() => removeService(s.id)}
                  className="rounded-lg bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {!services.length && (
            <p className="py-3 text-xs text-white/40 text-center">No services added yet. Use the form below to add services.</p>
          )}
        </div>

        {/* Add Service Box */}
        <div className="rounded-xl bg-[#1C1C24] border border-white/10 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Add New Service</p>
          <div className="grid gap-2 sm:grid-cols-4">
            <input
              className="h-9 rounded-lg border border-white/10 bg-[#16161D] px-2.5 text-xs sm:col-span-2 outline-none text-white placeholder:text-white/40"
              placeholder="e.g. Executive Haircut, HydraFacial"
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
              disabled={addingService}
              onClick={addService}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black shadow-sm hover:bg-white/90 cursor-pointer disabled:opacity-60"
            >
              {addingService ? "Adding…" : "+ Add Service"}
            </button>
          </div>
        </div>
      </section>

      {/* 5. Hairdressers & Specialists (Staff Management) */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] p-4 sm:p-5 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/70">5. Hairdressers & Specialists</h2>
            <p className="text-[10px] text-white/50">
              Manage your barbers, hair dressers, and stylists. Customers can pick their preferred specialist when booking.
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-gold">
            {staff.length} Hairdressers
          </span>
        </div>

        {/* Existing Hairdressers Grid */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {staff.map((st) => (
            <div
              key={st.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#1C1C24] p-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-black/40 flex items-center justify-center text-xs font-bold text-gold">
                  {st.photoUrl ? (
                    <Image
                      src={st.photoUrl}
                      alt={st.name}
                      fill
                      className="object-cover"
                      unoptimized={st.photoUrl.startsWith("/uploads/") || st.photoUrl.startsWith("data:")}
                    />
                  ) : (
                    <span>{st.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{st.name}</p>
                  <p className="text-[10px] text-white/50 truncate">{st.specialty}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeStaffMember(st.id)}
                className="shrink-0 rounded-lg bg-rose-500/20 px-2 py-1 text-[10px] font-semibold text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          ))}

          {!staff.length && (
            <p className="sm:col-span-2 py-3 text-xs text-white/40 text-center">
              No specific hairdressers added yet. Customers currently book with &quot;Any Available&quot;.
            </p>
          )}
        </div>

        {/* Add New Hairdresser Card */}
        <div className="rounded-xl bg-[#1C1C24] border border-white/10 p-3.5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
            Add New Hairdresser / Specialist
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Hairdresser / Barber Name *
              </label>
              <input
                className="h-9 w-full rounded-lg border border-white/10 bg-[#16161D] px-2.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                placeholder="e.g. Hamza Kakar, Bilal Shah"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                Specialty / Skill Title
              </label>
              <input
                className="h-9 w-full rounded-lg border border-white/10 bg-[#16161D] px-2.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                placeholder="e.g. Modern Fade & Beard, Hair Coloring, Keune Spa"
                value={newStaff.specialty}
                onChange={(e) => setNewStaff({ ...newStaff, specialty: e.target.value })}
              />
            </div>
          </div>

          <div>
            <ImageUpload
              value={newStaff.photoUrl}
              onChange={(url) => setNewStaff({ ...newStaff, photoUrl: url })}
              label="Hairdresser Photo (Cloudinary Direct Upload)"
              hint="Upload stylist portrait directly from camera or device"
              folder="staff"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={addingStaff || !newStaff.name.trim()}
              onClick={addStaffMember}
              className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-black shadow-sm hover:bg-white/90 cursor-pointer disabled:opacity-50"
            >
              {addingStaff ? "Adding…" : "+ Add Hairdresser to Salon"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
