"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { formatPkr, formatTime12 } from "@/lib/format";
import { buildBookingMessage, whatsappChatUrl } from "@/lib/whatsapp";
import { CheckIcon, WhatsAppIcon } from "@/components/Icons";

function Inner() {
  const params = useSearchParams();
  const id = params.get("id");
  const [row, setRow] = useState<{
    id: string;
    customerName: string;
    customerPhone: string;
    appointmentDate: string;
    appointmentTime: string;
    totalPricePkr: number;
    specialNotes?: string;
    salon: { name: string; quettaArea: string; address: string; whatsappNumber: string; slug: string };
    services: { service: { name: string; pricePkr: number } }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    if (id.startsWith("offline_")) {
      try {
        const queue = JSON.parse(localStorage.getItem("qsc_offline_bookings_queue") || "[]");
        const found = queue.find((x: { tempId: string }) => x.tempId === id);
        if (found) {
          setRow({
            id: found.tempId,
            customerName: found.customerName,
            customerPhone: found.customerPhone,
            appointmentDate: found.appointmentDate,
            appointmentTime: found.appointmentTime,
            totalPricePkr: found.totalPricePkr,
            specialNotes: found.specialNotes,
            salon: {
              name: found.salonName,
              quettaArea: "Quetta",
              address: "Shop Location",
              whatsappNumber: found.salonWhatsApp,
              slug: "",
            },
            services: found.serviceNames.map((n: string) => ({ service: { name: n, pricePkr: 0 } })),
          });
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }
    }

    fetch(`/api/appointments/${id}`)
      .then((r) => r.json())
      .then((d) => setRow(d.appointment || null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl bg-[#16161D] p-8 text-center border border-white/10 text-white">
        <p className="text-white/60 text-sm">Retrieving your Quetta appointment receipt…</p>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl bg-[#16161D] p-8 text-center border border-white/10 text-white space-y-4">
        <h1 className="font-display text-2xl font-bold text-white">Booking Details</h1>
        <p className="text-sm text-white/60">
          Your booking is securely saved in our database. You can track all your appointments under{" "}
          <Link href="/bookings" className="text-gold underline font-semibold">
            My Bookings
          </Link>
          .
        </p>
        <Link
          href="/explore"
          className="inline-block rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-black shadow-md hover:bg-white/90"
        >
          Explore More Salons
        </Link>
      </div>
    );
  }

  const message = buildBookingMessage({
    salonName: row.salon.name,
    customerName: row.customerName,
    phone: row.customerPhone,
    area: row.salon.quettaArea,
    services: row.services.map((s) => s.service.name),
    total: row.totalPricePkr,
    date: row.appointmentDate,
    time: formatTime12(row.appointmentTime),
  });

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-16">
      <div className="rounded-3xl border border-white/10 bg-[#16161D] p-6 sm:p-8 shadow-2xl text-center text-white">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckIcon className="h-8 w-8" />
        </div>

        <h1 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-white">
          Appointment Requested!
        </h1>
        <p className="mt-1 text-xs text-white/60">
          Booking ID: <span className="font-mono text-gold font-bold">{row.id.slice(0, 8)}</span>
        </p>

        {/* Receipt Box */}
        <div className="mt-6 rounded-2xl bg-[#1C1C24] border border-white/10 p-4 text-left text-sm space-y-2.5">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/60">Salon:</span>
            <span className="font-bold text-white text-right">{row.salon.name}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/60">Neighborhood:</span>
            <span className="font-semibold text-white">{row.salon.quettaArea}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/60">Customer:</span>
            <span className="font-semibold text-white">{row.customerName} ({row.customerPhone})</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/60">Date & Time:</span>
            <span className="font-semibold text-gold">
              {row.appointmentDate} at {formatTime12(row.appointmentTime)}
            </span>
          </div>
          <div className="border-b border-white/10 pb-2">
            <span className="text-white/60 block mb-1">Selected Services:</span>
            <ul className="space-y-1 pl-2">
              {row.services.map((s, idx) => (
                <li key={idx} className="flex justify-between text-xs font-medium text-white/90">
                  <span>• {s.service.name}</span>
                  <span>{formatPkr(s.service.pricePkr)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between pt-1 font-display text-base font-bold text-white">
            <span>Total to Pay at Salon:</span>
            <span className="text-gold">{formatPkr(row.totalPricePkr)}</span>
          </div>
        </div>

        {/* WhatsApp Preview Card */}
        <div className="mt-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 p-4 text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
            <WhatsAppIcon className="h-4 w-4" />
            <span>Pre-Formatted WhatsApp Confirmation</span>
          </p>
          <pre className="whitespace-pre-wrap font-sans text-xs text-white/90 bg-black/40 p-3 rounded-xl border border-emerald-500/20 leading-relaxed">
            {message}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <a
            href={whatsappChatUrl(row.salon.whatsappNumber, message)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#1eb957] transition-all cursor-pointer"
          >
            <WhatsAppIcon className="h-5 w-5" />
            <span>Send WhatsApp Confirmation Now</span>
          </a>

          <div className="flex gap-2">
            <Link
              href="/bookings"
              className="flex-1 rounded-2xl border border-white/10 bg-[#24242D] py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors text-center"
            >
              View in My Bookings
            </Link>
            <Link
              href={`/salons/${row.salon.slug}`}
              className="flex-1 rounded-2xl border border-white/10 bg-[#24242D] py-2.5 text-xs font-bold text-gold hover:bg-white/10 transition-colors text-center"
            >
              Back to Salon
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg rounded-3xl bg-[#16161D] p-8 text-center text-white border border-white/10">
          Loading receipt…
        </div>
      }
    >
      <Inner />
    </Suspense>
  );
}
