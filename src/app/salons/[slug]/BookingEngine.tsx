"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDuration, formatPkr, formatTime12 } from "@/lib/format";
import { isValidPakistaniPhone, normalizePakistaniPhone } from "@/lib/phone";
import { nextSevenDays } from "@/lib/slots";
import { buildBookingMessage, whatsappChatUrl } from "@/lib/whatsapp";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, WhatsAppIcon } from "@/components/Icons";
import { saveOfflineBooking } from "@/lib/offlineSync";

type Service = { id: string; name: string; durationMinutes: number; pricePkr: number; category: string };
type Staff = { id: string; name: string; specialty: string; photoUrl?: string };
type Slot = { time: string; label: string; available: boolean };

const STAFF_AVATARS: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
  "Umar Kakar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
  "Bilal Shah": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
  "Imran Ali": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80",
  "Ayesha Baloch": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
  "Sana Ahmed": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
  "Dr. Naila (aesthetic)": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80",
  "Jane Doe": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
  "Stacy Lee": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
};

export function BookingEngine({
  salon,
}: {
  salon: {
    id: string;
    name: string;
    quettaArea: string;
    whatsappNumber: string;
    services: Service[];
    staff: Staff[];
  };
}) {
  const router = useRouter();
  const days = nextSevenDays();
  const [selected, setSelected] = useState<string[]>([]);
  const [staffName, setStaffName] = useState("Any Available");
  const [date, setDate] = useState(days[0].date);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const picked = salon.services.filter((s) => selected.includes(s.id));
  const total = picked.reduce((a, s) => a + s.pricePkr, 0);
  const duration = picked.reduce((a, s) => a + s.durationMinutes, 0) || 45;

  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of salon.services) {
      const key = s.category || "General Services";
      map.set(key, [...(map.get(key) || []), s]);
    }
    return [...map.entries()];
  }, [salon.services]);

  useEffect(() => {
    setSlotsLoading(true);
    const params = new URLSearchParams({ salonId: salon.id, date, duration: String(duration) });
    fetch(`/api/slots?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.slots || []);
        setTime("");
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [salon.id, date, duration]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function confirm(openWhatsApp: boolean) {
    setError("");
    if (!picked.length) return setError("Please select at least one service.");
    if (!time) return setError("Please choose an available appointment time slot.");
    if (!name.trim()) return setError("Please enter your full name.");
    if (!isValidPakistaniPhone(phone)) {
      return setError("Please enter a valid Pakistani WhatsApp number (e.g. 0300-1234567).");
    }

    setLoading(true);

    // If device is offline, store in pending offline queue immediately
    if (typeof window !== "undefined" && !navigator.onLine) {
      const offline = saveOfflineBooking({
        salonId: salon.id,
        salonName: salon.name,
        salonWhatsApp: salon.whatsappNumber,
        customerName: name.trim(),
        customerPhone: phone,
        appointmentDate: date,
        appointmentTime: time,
        serviceIds: selected,
        serviceNames: picked.map((s) => s.name),
        totalPricePkr: total,
        staffName,
        specialNotes: notes,
      });

      const message = buildBookingMessage({
        salonName: salon.name,
        customerName: name.trim(),
        phone: normalizePakistaniPhone(phone) || phone,
        area: salon.quettaArea,
        services: picked.map((s) => s.name),
        total,
        date,
        time: formatTime12(time),
      });

      if (openWhatsApp) {
        window.open(whatsappChatUrl(salon.whatsappNumber, message), "_blank");
      }

      setLoading(false);
      router.push(`/bookings/confirmed?id=${offline.tempId}&offline=true`);
      return;
    }

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: salon.id,
          customerName: name.trim(),
          customerPhone: phone,
          appointmentDate: date,
          appointmentTime: time,
          serviceIds: selected,
          specialNotes: notes,
          staffName,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || "Could not confirm appointment. Please try again.");
        return;
      }

      try {
        const ids: string[] = JSON.parse(localStorage.getItem("qsc_bookings") || "[]");
        ids.unshift(data.appointment.id);
        localStorage.setItem("qsc_bookings", JSON.stringify(ids.slice(0, 20)));
        localStorage.setItem("qsc_phone", normalizePakistaniPhone(phone) || phone);
      } catch {
        // ignore
      }

      const message = buildBookingMessage({
        salonName: salon.name,
        customerName: name.trim(),
        phone: normalizePakistaniPhone(phone) || phone,
        area: salon.quettaArea,
        services: picked.map((s) => s.name),
        total,
        date,
        time: formatTime12(time),
      });

      if (openWhatsApp) {
        window.open(whatsappChatUrl(salon.whatsappNumber, message), "_blank");
      }
      router.push(`/bookings/confirmed?id=${data.appointment.id}`);
    } catch {
      // Network failure: queue offline automatically
      const offline = saveOfflineBooking({
        salonId: salon.id,
        salonName: salon.name,
        salonWhatsApp: salon.whatsappNumber,
        customerName: name.trim(),
        customerPhone: phone,
        appointmentDate: date,
        appointmentTime: time,
        serviceIds: selected,
        serviceNames: picked.map((s) => s.name),
        totalPricePkr: total,
        staffName,
        specialNotes: notes,
      });

      setLoading(false);
      router.push(`/bookings/confirmed?id=${offline.tempId}&offline=true`);
    }
  }

  const currentMonthYear = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-3.5 pb-20">
      {/* Step 1: Services Selection Matrix */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] text-white p-3.5 sm:p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">1. Select Services</h2>
            <p className="text-[11px] text-white/50">Rates in Pakistani Rupee (PKR)</p>
          </div>
          {picked.length > 0 && (
            <div className="rounded-xl bg-[#1C1C24] border border-white/10 px-2.5 py-1 text-right">
              <span className="block text-[10px] font-semibold text-gold">
                {picked.length} selected · ~{duration}m
              </span>
              <span className="block text-xs font-bold text-white">
                {formatPkr(total)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-3.5">
          {grouped.map(([cat, list]) => (
            <div key={cat} className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold/90">
                {cat}
              </span>

              <div className="grid gap-1.5 sm:grid-cols-2">
                {list.map((s) => {
                  const on = selected.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all ${
                        on
                          ? "border-white bg-white/15 shadow-sm ring-1 ring-white/30"
                          : "border-white/10 bg-[#1C1C24] hover:bg-[#22222C]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                            on ? "border-white bg-white text-black" : "border-white/30 bg-transparent"
                          }`}
                        >
                          {on && <CheckIcon className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white leading-tight truncate">{s.name}</p>
                          <p className="text-[10px] text-white/50">{formatDuration(s.durationMinutes)}</p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-white ml-2 shrink-0">
                        {formatPkr(s.pricePkr)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Step 2: Calendar Card (matches Screen 2 in reference UI) */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] text-white p-3.5 sm:p-4 shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            {currentMonthYear}
          </h3>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Days of week row */}
        <div className="mt-2.5 grid grid-cols-7 text-center text-[10px] font-semibold text-white/50">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        {/* Date Selector Row */}
        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
          {days.map((d) => {
            const isSelected = date === d.date;
            const dayNum = d.date.split("-")[2];

            return (
              <button
                type="button"
                key={d.date}
                onClick={() => setDate(d.date)}
                className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-white text-black shadow-md scale-105"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 3: Available Slot Grid */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] text-white p-3.5 sm:p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs sm:text-sm font-bold text-white">Available Slot</h3>
          <span className="text-[10px] text-white/50">
            {slots.filter((s) => s.available).length} slots open
          </span>
        </div>

        {slotsLoading ? (
          <div className="py-4 text-center text-xs text-white/50">
            Checking slots…
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-xl bg-white/5 p-3 text-center text-xs text-white/60">
            No open slots on this date.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
            {slots.map((s) => {
              const isChosen = time === s.time;
              return (
                <button
                  type="button"
                  key={s.time}
                  disabled={!s.available}
                  onClick={() => setTime(s.time)}
                  className={`rounded-full py-1.5 px-2 text-center text-[11px] font-semibold transition-all cursor-pointer ${
                    !s.available
                      ? "cursor-not-allowed bg-white/5 text-white/20 line-through"
                      : isChosen
                      ? "bg-white text-black shadow-md scale-105"
                      : "bg-[#22222A] text-white/90 hover:bg-[#2C2C36] border border-white/10"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Step 4: Select Specialist Carousel */}
      {salon.staff && salon.staff.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-[#16161D] text-white p-3.5 sm:p-4 shadow-lg">
          <h3 className="text-xs sm:text-sm font-bold text-white mb-2.5">
            Select Specialist
          </h3>

          <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
            {/* Any Available option */}
            <button
              type="button"
              onClick={() => setStaffName("Any Available")}
              className={`shrink-0 flex flex-col items-center justify-center rounded-xl p-2 w-20 border transition-all cursor-pointer ${
                staffName === "Any Available"
                  ? "border-white bg-white/15 ring-1 ring-white/50"
                  : "border-white/10 bg-[#1C1C24] hover:bg-[#22222C]"
              }`}
            >
              <div className="h-10 w-10 rounded-full border border-white/30 mb-1 flex items-center justify-center bg-white/10 text-sm">
                ✂️
              </div>
              <span className="text-[10px] font-bold text-white text-center">Any</span>
              <span className="text-[9px] text-white/50">Fastest</span>
            </button>

            {salon.staff.map((st) => {
              const isPicked = staffName === st.name;
              const avatar = st.photoUrl || STAFF_AVATARS[st.name] || STAFF_AVATARS.default;

              return (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setStaffName(st.name)}
                  className={`shrink-0 flex flex-col items-center justify-center rounded-xl p-2 w-20 border transition-all cursor-pointer ${
                    isPicked
                      ? "border-white bg-white/15 ring-1 ring-white/50"
                      : "border-white/10 bg-[#1C1C24] hover:bg-[#22222C]"
                  }`}
                >
                  <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/30 mb-1 bg-black/40">
                    <Image
                      src={avatar}
                      alt={st.name}
                      fill
                      className="object-cover"
                      unoptimized={avatar.startsWith("/uploads/") || avatar.startsWith("data:")}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white text-center truncate w-full">
                    {st.name}
                  </span>
                  <span className="text-[9px] text-white/50 truncate w-full text-center">
                    {st.specialty}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 5: Customer Details Form */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] text-white p-3.5 sm:p-4 shadow-lg space-y-3">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white">Your Information</h3>
          <p className="text-[10px] text-white/50">
            Booking confirmation will be delivered to your WhatsApp.
          </p>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">Full Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zubair Kakar"
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              WhatsApp Number *
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03XX-XXXXXXX or +923XXXXXXXXX"
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Special Request (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g., urgent slot, extra hot towel…"
              className="w-full rounded-xl border border-white/10 bg-[#1C1C24] p-2.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/20 border border-rose-500/40 p-2.5 text-xs font-medium text-rose-300">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Compact Bottom Action Bar - Anchored to bottom without blocking screen */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#121217]/95 border-t border-white/10 px-4 py-2.5 backdrop-blur-xl shadow-2xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-[10px] text-white/60 truncate">
              {picked.length} serv · {time ? formatTime12(time) : "pick slot"}
            </span>
            <span className="block text-sm sm:text-base font-bold text-gold">
              {formatPkr(total)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={loading}
              onClick={() => confirm(false)}
              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black shadow-md hover:bg-white/90 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Confirming…" : "Confirm"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => confirm(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#1eb957] transition-all disabled:opacity-60 cursor-pointer"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
