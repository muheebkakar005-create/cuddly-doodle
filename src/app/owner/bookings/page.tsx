"use client";

import { BOOKING_STATUSES } from "@/lib/constants";
import { formatPkr, formatTime12 } from "@/lib/format";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/Icons";

type Row = {
  id: string;
  customerName: string;
  customerPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  totalPricePkr: number;
  advanceAmountPkr?: number;
  paidAmountPkr?: number;
  remainingAmountPkr?: number;
  paymentStatus?: string;
  paymentProvider?: string;
  paymentRef?: string;
  status: string;
  specialNotes?: string;
  services: { service: { name: string } }[];
  payments?: {
    id: string;
    paymentMethod: string;
    amountPaidPkr: number;
    providerRef?: string;
    status: string;
  }[];
};

export default function OwnerBookingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const sp = new URLSearchParams();
    if (date) sp.set("date", date);
    const res = await fetch(`/api/appointments?${sp}`);
    const data = await res.json();
    setRows(data.appointments || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "CONFIRMED":
        return "border-emerald-500/40 bg-emerald-500/20 text-emerald-300";
      case "COMPLETED":
        return "border-blue-500/40 bg-blue-500/20 text-blue-300";
      case "CANCELLED":
        return "border-rose-500/40 bg-rose-500/20 text-rose-300";
      default:
        return "border-amber-500/40 bg-amber-500/20 text-amber-300";
    }
  }

  return (
    <div className="space-y-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Incoming Salon Bookings</h1>
          <p className="text-xs text-white/50 mt-0.5">
            Manage customer appointments, 50% advance online payments, and balance collection.
          </p>
        </div>
        <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-gold">
          {rows.length} Bookings
        </span>
      </div>

      <div className="flex gap-2 rounded-2xl border border-white/10 bg-[#16161D] p-3 shadow-lg max-w-sm">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 flex-1 rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white"
        />
        <button
          onClick={load}
          className="h-9 rounded-xl bg-white px-4 text-xs font-bold text-black shadow-sm hover:bg-white/90 transition-colors cursor-pointer"
        >
          Filter
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((r) => {
          const isPaid = r.paymentStatus === "PAID" || r.status === "CONFIRMED";
          const advance = r.paidAmountPkr || r.advanceAmountPkr || Math.round(r.totalPricePkr / 2);
          const balance = r.remainingAmountPkr != null ? r.remainingAmountPkr : (r.totalPricePkr - advance);

          return (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-[#16161D] p-4 shadow-lg space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-white">{r.customerName}</p>
                    {isPaid ? (
                      <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
                        50% Advance Paid ({r.paymentProvider || "Online"})
                      </span>
                    ) : (
                      <span className="rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold">
                        Advance Pending
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-white/60 mt-0.5">
                    {r.appointmentDate} • {formatTime12(r.appointmentTime)} •{" "}
                    <span className="font-bold text-white">Total: {formatPkr(r.totalPricePkr)}</span>
                  </p>

                  <p className="text-gold/90 text-xs mt-1 font-medium">
                    {r.services.map((s) => s.service.name).join(" + ")}
                  </p>

                  {/* Financial Breakdown for Salon Owner */}
                  <div className="mt-2 grid grid-cols-2 gap-2 max-w-sm rounded-xl bg-[#1C1C24] p-2.5 border border-white/5 text-[11px]">
                    <div>
                      <span className="text-white/50 block text-[10px]">Online Advance Received:</span>
                      <span className="font-bold text-emerald-400">
                        {isPaid ? formatPkr(advance) : "Rs. 0"}
                      </span>
                      {r.paymentRef && (
                        <span className="block text-[9px] text-white/40 truncate font-mono">
                          Ref: {r.paymentRef}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-white/50 block text-[10px]">Collect at Counter:</span>
                      <span className="font-bold text-gold">
                        {isPaid ? formatPkr(balance) : formatPkr(r.totalPricePkr)}
                      </span>
                    </div>
                  </div>

                  {r.specialNotes && (
                    <p className="mt-2 rounded-lg bg-white/5 border border-white/10 p-1.5 text-[11px] text-white/70">
                      📝 {r.specialNotes}
                    </p>
                  )}
                </div>

                <select
                  value={r.status}
                  onChange={(e) => setStatus(r.id, e.target.value)}
                  className={`rounded-xl border px-2.5 py-1 text-xs font-bold outline-none cursor-pointer ${getStatusBadgeClass(
                    r.status
                  )}`}
                >
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-[#1C1C24] text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[11px] text-white/40 font-mono">{r.customerPhone}</span>
                <a
                  href={whatsappChatUrl(
                    r.customerPhone,
                    `Salam ${r.customerName}! ✂️ Regarding your appointment scheduled for ${r.appointmentDate} at ${formatTime12(r.appointmentTime)}.${isPaid ? ` Your 50% advance (${formatPkr(advance)}) is verified. Remaining balance to pay at our counter: ${formatPkr(balance)}.` : ` Please note 50% advance online payment is required.`}`
                  )}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#1eb957] transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  <span>WhatsApp Customer</span>
                </a>
              </div>
            </div>
          );
        })}

        {!loading && !rows.length && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#16161D] p-8 text-center text-xs text-white/50">
            No bookings found for the selected date.
          </div>
        )}
      </div>
    </div>
  );
}
