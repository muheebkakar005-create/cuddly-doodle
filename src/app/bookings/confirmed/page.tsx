"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { formatPkr, formatTime12 } from "@/lib/format";
import { buildBookingMessage, whatsappChatUrl } from "@/lib/whatsapp";
import { CheckIcon, WhatsAppIcon } from "@/components/Icons";

type AppointmentData = {
  id: string;
  accessToken?: string;
  customerName: string;
  customerPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  totalPricePkr: number;
  advanceAmountPkr?: number;
  paidAmountPkr?: number;
  remainingAmountPkr?: number;
  paymentStatus: string;
  paymentProvider?: string;
  paymentRef?: string;
  status: string;
  specialNotes?: string;
  salon: { name: string; quettaArea: string; address: string; whatsappNumber: string; slug: string };
  services: { service: { name: string; pricePkr: number } }[];
  payments?: {
    id: string;
    internalRef: string;
    providerRef?: string;
    paymentMethod: string;
    amountPaidPkr: number;
    status: string;
    paidAt?: string;
  }[];
};

function Inner() {
  const params = useSearchParams();
  const id = params.get("id");
  const paymentQuery = params.get("payment");
  const [row, setRow] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryMethod, setRetryMethod] = useState<"JAZZCASH" | "EASYPAISA">("JAZZCASH");
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [remainingMethod, setRemainingMethod] = useState<"JAZZCASH" | "EASYPAISA">("JAZZCASH");
  const [payingRemaining, setPayingRemaining] = useState(false);
  const [remainingError, setRemainingError] = useState("");

  const loadAppointment = () => {
    if (!id) {
      setLoading(false);
      return;
    }

    if (id.startsWith("offline_")) {
      try {
        const queue = JSON.parse(localStorage.getItem("qsc_offline_bookings_queue") || "[]");
        const found = queue.find((x: { tempId: string }) => x.tempId === id);
        if (found) {
          const total = found.totalPricePkr || 0;
          setRow({
            id: found.tempId,
            customerName: found.customerName,
            customerPhone: found.customerPhone,
            appointmentDate: found.appointmentDate,
            appointmentTime: found.appointmentTime,
            totalPricePkr: total,
            advanceAmountPkr: Math.round(total / 2),
            paidAmountPkr: 0,
            remainingAmountPkr: total - Math.round(total / 2),
            paymentStatus: "PENDING",
            status: "PENDING",
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
      .catch(() => setRow(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRetryPayment() {
    if (!row) return;
    setRetrying(true);
    setRetryError("");
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: row.id,
          provider: retryMethod,
          paymentType: "ADVANCE",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setRetryError(data.error || "Unable to initiate payment gateway session.");
        setRetrying(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setRetryError("Connection error while connecting to payment gateway.");
      setRetrying(false);
    }
  }

  async function handlePayRemaining() {
    if (!row) return;
    setPayingRemaining(true);
    setRemainingError("");
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: row.id,
          provider: remainingMethod,
          paymentType: "REMAINING",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setRemainingError(data.error || "Unable to initiate payment session.");
        setPayingRemaining(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setRemainingError("Connection error while connecting to payment gateway.");
      setPayingRemaining(false);
    }
  }

  async function handleCancelAppointment() {
    if (!row) return;
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          token: row.accessToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not cancel appointment.");
      } else {
        loadAppointment();
      }
    } catch {
      alert("Error connecting to server. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

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

  const isPaid = row.paymentStatus === "PAID" || row.status === "CONFIRMED";
  const isCancelled = row.status === "CANCELLED";
  const advanceAmount = row.advanceAmountPkr || Math.round(row.totalPricePkr / 2);
  const remainingAmount = row.remainingAmountPkr != null ? row.remainingAmountPkr : (row.totalPricePkr - advanceAmount);
  const latestPayment = row.payments && row.payments.length > 0 ? row.payments[0] : null;
  const paymentProviderName = row.paymentProvider || (latestPayment ? latestPayment.paymentMethod : "JazzCash / Easypaisa");
  const refCode = row.paymentRef || (latestPayment ? (latestPayment.providerRef || latestPayment.internalRef) : row.id.slice(0, 8));

  const message = buildBookingMessage({
    salonName: row.salon.name,
    customerName: row.customerName,
    phone: row.customerPhone,
    area: row.salon.quettaArea,
    services: row.services.map((s) => s.service.name),
    total: row.totalPricePkr,
    date: row.appointmentDate,
    time: formatTime12(row.appointmentTime),
    advancePaid: isPaid ? (row.paidAmountPkr || advanceAmount) : 0,
    remainingDue: isPaid ? remainingAmount : row.totalPricePkr,
    paymentProvider: paymentProviderName,
    paymentRef: refCode,
    paymentStatus: row.paymentStatus,
  });

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-16">
      <div className="rounded-3xl border border-white/10 bg-[#16161D] p-6 sm:p-8 shadow-2xl text-center text-white">
        {/* Status Icon */}
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${
          isCancelled
            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
            : isPaid
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
        }`}>
          {isCancelled ? (
            <span className="text-2xl font-bold font-mono">✕</span>
          ) : isPaid ? (
            <CheckIcon className="h-8 w-8" />
          ) : (
            <span className="text-2xl font-bold font-mono">⏳</span>
          )}
        </div>

        <h1 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-white">
          {isCancelled
            ? "Appointment Cancelled"
            : isPaid
              ? "Appointment Confirmed!"
              : "Advance Payment Required"}
        </h1>
        <p className="mt-1 text-xs text-white/60">
          Booking ID: <span className="font-mono text-gold font-bold">{row.id.slice(0, 8)}</span>
          {isPaid && refCode && (
            <span className="ml-2 pl-2 border-l border-white/20">
              Txn Ref: <span className="font-mono text-emerald-400 font-bold">{refCode}</span>
            </span>
          )}
        </p>

        {/* Failed Banner if returned from canceled/failed payment */}
        {(paymentQuery === "failed" || (!isPaid && !isCancelled && row.paymentStatus === "FAILED")) && (
          <div className="mt-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-left text-xs text-rose-300">
            <p className="font-bold">Payment Was Not Completed</p>
            <p className="mt-0.5 text-white/80 text-[11px]">
              Your 50% advance online transaction could not be verified. You can retry paying the 50% advance below to lock in your appointment slot.
            </p>
          </div>
        )}

        {/* Advance Notice Banner for Pending Payment */}
        {!isPaid && !isCancelled && (
          <div className="mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-left text-xs text-amber-200 space-y-3">
            <div>
              <p className="font-bold flex items-center gap-1.5 text-amber-300 text-sm">
                <span>⚠️</span> 50% Advance Policy
              </p>
              <p className="mt-1 text-[11px] text-white/80 leading-relaxed">
                To guarantee your salon slot at {row.salon.name}, QSalon requires a <strong>50% advance online payment ({formatPkr(advanceAmount)})</strong> via JazzCash or Easypaisa. The remaining 50% ({formatPkr(remainingAmount)}) is payable at the salon counter.
              </p>
            </div>

            {/* Provider Switcher */}
            <div className="pt-2 border-t border-amber-500/20">
              <label className="block text-[10px] uppercase font-bold text-amber-300 mb-1.5">
                Choose Payment Method:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRetryMethod("JAZZCASH")}
                  className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    retryMethod === "JAZZCASH"
                      ? "border-red-500 bg-red-950/40 text-white font-bold ring-1 ring-red-500"
                      : "border-white/10 bg-[#1C1C24] text-white/70 hover:bg-white/5"
                  }`}
                >
                  <p className="text-xs">🔴 JazzCash</p>
                  <p className="text-[10px] text-white/50">App / Wallet / Card</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRetryMethod("EASYPAISA")}
                  className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    retryMethod === "EASYPAISA"
                      ? "border-emerald-500 bg-emerald-950/40 text-white font-bold ring-1 ring-emerald-500"
                      : "border-white/10 bg-[#1C1C24] text-white/70 hover:bg-white/5"
                  }`}
                >
                  <p className="text-xs">🟢 Easypaisa</p>
                  <p className="text-[10px] text-white/50">App / Mobile Account</p>
                </button>
              </div>
            </div>

            {retryError && (
              <p className="text-xs text-rose-400 font-semibold">{retryError}</p>
            )}

            <button
              type="button"
              disabled={retrying}
              onClick={handleRetryPayment}
              className="w-full rounded-2xl bg-gold py-3 text-xs font-bold text-black shadow-lg hover:bg-gold-light transition-all cursor-pointer disabled:opacity-50"
            >
              {retrying ? "Connecting to Gateway…" : `Pay 50% Advance Online (${formatPkr(advanceAmount)})`}
            </button>
          </div>
        )}

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
            <span className="text-white/60">Date &amp; Time:</span>
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

          {/* Transparent Payment Breakdown */}
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between text-white/80">
              <span>Total Service Price:</span>
              <span className="font-bold text-white">{formatPkr(row.totalPricePkr)}</span>
            </div>

            <div className="flex justify-between items-center text-emerald-400">
              <span className="flex items-center gap-1">
                <span>50% Advance Paid Online:</span>
                {isPaid && (
                  <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] font-bold border border-emerald-500/40">
                    VERIFIED
                  </span>
                )}
              </span>
              <span className="font-bold">
                {isPaid ? `-${formatPkr(row.paidAmountPkr || advanceAmount)}` : "Pending"}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10 font-display text-sm font-bold">
              <span className="text-gold">
                {remainingAmount === 0 ? "Remaining Balance Due:" : "Remaining Payable at Salon:"}
              </span>
              <span className={`text-base ${remainingAmount === 0 ? "text-emerald-400" : "text-gold"}`}>
                {remainingAmount === 0
                  ? "PKR 0 (Fully Paid Online)"
                  : isPaid
                    ? formatPkr(remainingAmount)
                    : formatPkr(row.totalPricePkr)}
              </span>
            </div>
            {isPaid && (
              <p className="text-[10px] text-white/50 text-right pt-0.5">
                Paid via {paymentProviderName} • Ref: {refCode}
              </p>
            )}
          </div>
        </div>

        {/* Subsequent Payment: Option to Pay Remaining Balance Online */}
        {isPaid && !isCancelled && remainingAmount > 0 && (
          <div className="mt-6 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 p-4 text-left text-xs text-cyan-200 space-y-3">
            <div>
              <p className="font-bold flex items-center gap-1.5 text-cyan-300 text-sm">
                <span>💳</span> Pay Remaining Balance Online
              </p>
              <p className="mt-1 text-[11px] text-white/80 leading-relaxed">
                Your 50% advance is confirmed! You can settle the remaining balance of <strong>{formatPkr(remainingAmount)}</strong> now via JazzCash or Easypaisa, or pay in cash at the salon.
              </p>
            </div>

            {/* Provider Switcher */}
            <div className="pt-2 border-t border-cyan-500/20">
              <label className="block text-[10px] uppercase font-bold text-cyan-300 mb-1.5">
                Choose Payment Method:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRemainingMethod("JAZZCASH")}
                  className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    remainingMethod === "JAZZCASH"
                      ? "border-red-500 bg-red-950/40 text-white font-bold ring-1 ring-red-500"
                      : "border-white/10 bg-[#1C1C24] text-white/70 hover:bg-white/5"
                  }`}
                >
                  <p className="text-xs">🔴 JazzCash</p>
                  <p className="text-[10px] text-white/50">App / Wallet / Card</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRemainingMethod("EASYPAISA")}
                  className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    remainingMethod === "EASYPAISA"
                      ? "border-emerald-500 bg-emerald-950/40 text-white font-bold ring-1 ring-emerald-500"
                      : "border-white/10 bg-[#1C1C24] text-white/70 hover:bg-white/5"
                  }`}
                >
                  <p className="text-xs">🟢 Easypaisa</p>
                  <p className="text-[10px] text-white/50">App / Mobile Account</p>
                </button>
              </div>
            </div>

            {remainingError && (
              <p className="text-xs text-rose-400 font-semibold">{remainingError}</p>
            )}

            <button
              type="button"
              disabled={payingRemaining}
              onClick={handlePayRemaining}
              className="w-full rounded-2xl bg-cyan-500 py-3 text-xs font-bold text-black shadow-lg hover:bg-cyan-400 transition-all cursor-pointer disabled:opacity-50"
            >
              {payingRemaining ? "Connecting to Gateway…" : `Pay Remaining Balance Online (${formatPkr(remainingAmount)})`}
            </button>
          </div>
        )}

        {isPaid && !isCancelled && remainingAmount === 0 && (
          <div className="mt-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-center text-xs text-emerald-300">
            <p className="font-bold flex items-center justify-center gap-1.5 text-emerald-400">
              <span>✓</span> Full Appointment Paid Online
            </p>
            <p className="mt-0.5 text-white/70 text-[11px]">
              The entire service total has been verified online. Zero balance is due at the salon counter.
            </p>
          </div>
        )}

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
            <span>Send WhatsApp Receipt to Salon</span>
          </a>

          <div className="flex gap-2">
            <Link
              href="/bookings"
              className="flex-1 rounded-2xl border border-white/10 bg-[#24242D] py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors text-center"
            >
              View in My Bookings
            </Link>
            <Link
              href={`/salons/${row.salon.slug || ""}`}
              className="flex-1 rounded-2xl border border-white/10 bg-[#24242D] py-2.5 text-xs font-bold text-gold hover:bg-white/10 transition-colors text-center"
            >
              Back to Salon
            </Link>
          </div>

          {!isCancelled && row.status !== "COMPLETED" && (
            <div className="pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelAppointment}
                className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel This Appointment"}
              </button>
            </div>
          )}
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
