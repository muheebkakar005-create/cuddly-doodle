"use client";

import { AREAS, BOOKING_STATUSES } from "@/lib/constants";
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
  status: string;
  specialNotes: string;
  salon: { name: string; quettaArea: string };
  services: { service: { name: string } }[];
};

export default function AdminAppointmentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [date, setDate] = useState("");
  const [area, setArea] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [salonFilter, setSalonFilter] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const sp = new URLSearchParams();
    if (date) sp.set("date", date);
    if (area) sp.set("area", area);
    if (statusFilter) sp.set("status", statusFilter);
    try {
      const res = await fetch(`/api/appointments?${sp}`);
      const data = await res.json();
      let list: Row[] = data.appointments || [];
      if (salonFilter) {
        list = list.filter((r) =>
          r.salon.name.toLowerCase().includes(salonFilter.toLowerCase())
        );
      }
      setRows(list);
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-xl sm:text-2xl font-bold text-white">Appointment Master Board</h1>
          <p className="text-xs text-white/50 mt-0.5">
            Monitor, approve, complete, or cancel incoming bookings from all Quetta salons.
          </p>
        </div>
        <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-gold">
          {rows.length} Appointment{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4 shadow-lg">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Quetta Area</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="h-9 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white cursor-pointer"
            >
              <option value="" className="bg-[#1C1C24] text-white">All Quetta Areas</option>
              {AREAS.map((a) => (
                <option key={a} value={a} className="bg-[#1C1C24] text-white">
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white cursor-pointer"
            >
              <option value="" className="bg-[#1C1C24] text-white">All Statuses</option>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#1C1C24] text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Search Salon</label>
            <input
              value={salonFilter}
              onChange={(e) => setSalonFilter(e.target.value)}
              placeholder="e.g. The Hair Lab, Avalon…"
              className="h-9 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={load}
              className="h-9 flex-1 rounded-xl bg-white px-3 text-xs font-bold text-black shadow-sm hover:bg-white/90 transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                setDate("");
                setArea("");
                setStatusFilter("");
                setSalonFilter("");
                setTimeout(() => load(), 50);
              }}
              className="h-9 rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#16161D] shadow-lg">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-white/10 bg-[#1C1C24] text-white/50 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Schedule & Total</th>
              <th className="px-4 py-3">Customer & Phone</th>
              <th className="px-4 py-3">Salon & Area</th>
              <th className="px-4 py-3">Services</th>
              <th className="px-4 py-3">Status Toggle</th>
              <th className="px-4 py-3 text-right">One-Click WhatsApp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => {
              const waMessage = `Salam ${r.customerName}! ✂️ This is Super Admin regarding your booking at ${r.salon.name} for ${r.appointmentDate} at ${formatTime12(r.appointmentTime)}. Current status: ${r.status}. Total: Rs. ${r.totalPricePkr.toLocaleString()} PKR.`;

              return (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-white block">{r.appointmentDate}</span>
                    <span className="text-white/50 block text-[11px]">{formatTime12(r.appointmentTime)}</span>
                    <span className="font-bold text-gold block mt-0.5">
                      {formatPkr(r.totalPricePkr)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-bold text-white block">{r.customerName}</span>
                    <span className="font-mono text-white/50 block text-[11px]">{r.customerPhone}</span>
                    {r.specialNotes && (
                      <p className="mt-1 rounded-lg bg-white/5 border border-white/10 p-1.5 text-[11px] text-white/70 max-w-[200px]">
                        📝 {r.specialNotes}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-bold text-white block">{r.salon.name}</span>
                    <span className="inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70 mt-1">
                      {r.salon.quettaArea}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="space-y-0.5 max-w-[220px]">
                      {r.services.map((s, idx) => (
                        <span key={idx} className="block text-white/90 font-medium text-xs">
                          • {s.service.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-3">
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
                  </td>

                  <td className="px-4 py-3 text-right">
                    <a
                      href={whatsappChatUrl(r.customerPhone, waMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#1eb957] transition-colors"
                      title="Direct WhatsApp Customer"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && (
          <div className="py-12 text-center text-xs text-white/50">Updating appointments list…</div>
        )}

        {!loading && !rows.length && (
          <div className="py-12 text-center text-xs text-white/50">
            No appointments match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
