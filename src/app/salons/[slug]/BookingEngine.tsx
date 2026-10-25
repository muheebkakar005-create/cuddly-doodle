"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { formatDuration, formatPkr, formatTime12 } from "@/lib/format";
import { isValidPakistaniPhone, normalizePakistaniPhone } from "@/lib/phone";
import { nextSevenDays } from "@/lib/slots";
import { CheckIcon } from "@/components/Icons";
import { calculateAdvancePayment } from "@/lib/payments/calculation";
import { PaymentProvider } from "@/lib/payments/types";

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
  const [provider, setProvider] = useState<PaymentProvider>("JAZZCASH");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const picked = salon.services.filter((s) => selected.includes(s.id));
  const total = picked.reduce((a, s) => a + s.pricePkr, 0);
  const duration = picked.reduce((a, s) => a + s.durationMinutes, 0) || 45;

  // 50% Advance Online Payment Calculation
  const { advanceAmountPkr, remainingAmountPkr } =
    total > 0 ? calculateAdvancePayment(total) : { advanceAmountPkr: 0, remainingAmountPkr: 0 };

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

  async function handleProceedToPayment() {
    setError("");
    if (!picked.length) return setError("Please select at least one service.");
    if (!time) return setError("Please choose an available appointment time slot.");
    if (!name.trim()) return setError("Please enter your full name.");
    if (!isValidPakistaniPhone(phone)) {
      return setError("Please enter a valid Pakistani mobile number (e.g. 0300-1234567).");
    }

    setLoading(true);

    try {
      // 1. Create appointment in PENDING status (with 15 min reservation)
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
      if (!res.ok) {
        setLoading(false);
        setError(data.error || "Could not reserve appointment slot. Please try another slot.");
        return;
      }

      const appointmentId = data.appointment.id;

      // Save appointment reference in customer local storage
      try {
        const ids: string[] = JSON.parse(localStorage.getItem("qsc_bookings") || "[]");
        if (!ids.includes(appointmentId)) {
          ids.unshift(appointmentId);
          localStorage.setItem("qsc_bookings", JSON.stringify(ids.slice(0, 20)));
        }
        localStorage.setItem("qsc_phone", normalizePakistaniPhone(phone) || phone);
      } catch {}

      // 2. Initiate 50% Online Advance Payment via selected Provider
      const payRes = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          provider,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        setLoading(false);
        setError(payData.error || "Failed to initialize payment gateway. Please retry.");
        return;
      }

      // 3. Provider Checkout Redirection
      if (payData.checkoutType === "REDIRECT_POST" && payData.formFields) {
        // Dynamically create and submit HTML form to gateway URL
        const form = document.createElement("form");
        form.method = "POST";
        form.action = payData.checkoutUrl;
        Object.entries(payData.formFields as Record<string, string>).forEach(([k, v]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = v;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } else if (payData.checkoutUrl) {
        // Redirect to sandbox simulator or GET checkout URL
        window.location.href = payData.checkoutUrl;
      } else {
        setLoading(false);
        setError("Invalid gateway response. Please try again.");
      }
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Network error. Please try again.";
      setError(msg);
    }
  }

  return (
    <div className="space-y-4 pb-32">
      {/* Step 1: Select Services */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] text-white p-3.5 sm:p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black font-bold text-xs">
              1
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white">Select Services</h3>
          </div>
          {picked.length > 0 && (
            <span className="rounded-full bg-gold/15 border border-gold/30 px-2.5 py-0.5 text-[10px] font-bold text-gold">
              {picked.length} selected ({formatPkr(total)})
            </span>
          )}
        </div>

        <div className="space-y-3">
          {grouped.map(([cat, list]) => (
            <div key={cat} className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{cat}</p>
              <div className="grid gap-1.5">
                {list.map((s) => {
                  const on = selected.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className={`flex items-center justify-between rounded-xl p-2.5 sm:p-3 text-left transition-all border cursor-pointer ${
                        on
                          ? "border-gold/50 bg-gold/10 text-white shadow-sm"
                          : "border-white/5 bg-[#1C1C24] text-white/80 hover:bg-[#22222C]"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-white leading-tight truncate">{s.name}</p>
                        <p className="text-[10px] text-white/50 mt-0.5">{formatDuration(s.durationMinutes)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-gold">{formatPkr(s.pricePkr)}</span>
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                            on ? "border-gold bg-gold text-black" : "border-white/20"
                          }`}
                        >
                          {on && <CheckIcon className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Step 2: Pick Date */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] text-white p-3.5 sm:p-4 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black font-bold text-xs">
            2
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-white">Choose Date</h3>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {days.map((d) => {
            const isPicked = date === d.date;
            return (
              <button
                type="button"
                key={d.date}
                onClick={() => setDate(d.date)}
                className={`shrink-0 flex flex-col items-center justify-center rounded-xl p-2 w-16 border transition-all cursor-pointer ${
                  isPicked
                    ? "border-white bg-white text-black font-bold shadow-md"
                    : "border-white/10 bg-[#1C1C24] text-white/70 hover:bg-[#22222C]"
                }`}
              >
                <span className="text-[9px] uppercase tracking-wider">{d.dayName}</span>
                <span className="text-sm font-bold mt-0.5">{d.dayNum}</span>
                <span className="text-[9px] opacity-75">{d.monthName}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 3: Pick Available Time Slot */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] text-white p-3.5 sm:p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black font-bold text-xs">
              3
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white">Available Time Slot</h3>
          </div>
          <span className="text-[10px] text-white/50">{formatDuration(duration)} estimated</span>
        </div>

        {slotsLoading ? (
          <p className="text-xs text-white/50 py-3 text-center">Checking real-time slot availability…</p>
        ) : slots.length === 0 ? (
          <p className="text-xs text-amber-300 py-3 text-center">
            No slots available for this date. The salon may be closed or fully booked.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto no-scrollbar pr-1">
            {slots.map((s) => {
              const on = time === s.time;
              return (
                <button
                  type="button"
                  key={s.time}
                  disabled={!s.available}
                  onClick={() => setTime(s.time)}
                  className={`rounded-xl py-2 px-1 text-center text-xs font-semibold transition-all border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    on
                      ? "border-gold bg-gold text-black font-bold shadow-md"
                      : s.available
                      ? "border-white/10 bg-[#1C1C24] text-white hover:bg-white/10"
                      : "border-transparent bg-[#16161D] text-white/30"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Step 4: Staff Specialist */}
      {salon.staff.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-[#16161D] text-white p-3.5 sm:p-4 shadow-lg space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black font-bold text-xs">
              4
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white">Select Specialist (Optional)</h3>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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

      {/* Step 5: Customer Details */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] text-white p-3.5 sm:p-4 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black font-bold text-xs">
            5
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-white">Your Contact Details</h3>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Full Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zubair Kakar"
              className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Mobile / WhatsApp Number *
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
              placeholder="e.g., urgent cut, specific hair color shade…"
              className="w-full rounded-xl border border-white/10 bg-[#1C1C24] p-2.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
            />
          </div>
        </div>
      </section>

      {/* Step 6: 50% Online Advance Payment Method Selection */}
      <section className="rounded-2xl border border-gold/30 bg-gradient-to-br from-[#1c1c24] to-[#121217] text-white p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-black font-bold text-xs">
              6
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Mandatory 50% Advance Online Payment
            </h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Secure Gateway
          </span>
        </div>

        {/* Clear Pricing Breakdown Required by Policy */}
        <div className="rounded-xl bg-black/40 border border-white/10 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>Total Service Price:</span>
            <span className="font-bold text-white">{formatPkr(total)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gold font-bold pt-1 border-t border-white/10">
            <span>50% Advance Required Now:</span>
            <span className="text-sm font-black">{formatPkr(advanceAmountPkr)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span>Remaining 50% Payable at Salon:</span>
            <span>{formatPkr(remainingAmountPkr)}</span>
          </div>
        </div>

        <p className="text-[10px] text-white/60 leading-relaxed">
          Select your online payment method. You will be redirected to complete the 50% advance payment to reserve your time slot.
        </p>

        {/* Provider Radio Options */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setProvider("JAZZCASH")}
            className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all cursor-pointer ${
              provider === "JAZZCASH"
                ? "border-red-500 bg-red-950/40 ring-1 ring-red-400 text-white"
                : "border-white/10 bg-[#16161D] text-white/70 hover:bg-[#202028]"
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white font-black text-xs shadow-md mb-1">
              JC
            </div>
            <span className="text-xs font-bold text-white">JazzCash</span>
            <span className="text-[9px] text-white/50">Mobile / Debit Card</span>
          </button>

          <button
            type="button"
            onClick={() => setProvider("EASYPAISA")}
            className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all cursor-pointer ${
              provider === "EASYPAISA"
                ? "border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-400 text-white"
                : "border-white/10 bg-[#16161D] text-white/70 hover:bg-[#202028]"
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-xs shadow-md mb-1">
              EP
            </div>
            <span className="text-xs font-bold text-white">Easypaisa</span>
            <span className="text-[9px] text-white/50">Mobile / App / QR</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/20 border border-rose-500/40 p-2.5 text-xs font-medium text-rose-300">
            {error}
          </div>
        )}
      </section>

      {/* Floating Bottom Sticky Bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#121217]/95 border-t border-white/10 px-4 py-3 backdrop-blur-xl shadow-2xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gold">
                Advance: {formatPkr(advanceAmountPkr)}
              </span>
              <span className="text-[10px] text-white/50">
                (Total: {formatPkr(total)})
              </span>
            </div>
            <span className="block text-[10px] text-white/60 truncate">
              Bal: {formatPkr(remainingAmountPkr)} at salon · {time ? formatTime12(time) : "pick time"}
            </span>
          </div>

          <button
            type="button"
            disabled={loading || picked.length === 0 || !time}
            onClick={handleProceedToPayment}
            className={`rounded-2xl px-5 py-3 text-xs font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              provider === "JAZZCASH"
                ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
            }`}
          >
            {loading ? "Connecting to Gateway…" : `Pay PKR ${advanceAmountPkr.toLocaleString()} via ${provider === "JAZZCASH" ? "JazzCash" : "Easypaisa"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
