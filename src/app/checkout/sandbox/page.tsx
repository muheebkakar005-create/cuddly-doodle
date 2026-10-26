"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { formatPkr } from "@/lib/format";
import { calculateFullFinancialSplit } from "@/lib/payments/calculation";

function SandboxCheckoutInner() {
  const params = useSearchParams();
  const provider = (params.get("provider") || "JAZZCASH").toUpperCase();
  const ref = params.get("ref") || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    payment?: {
      internalRef: string;
      provider: string;
      paymentType?: string;
      status: string;
      totalBookingPkr: number;
      advanceRequiredPkr: number;
      amountPaidPkr: number;
      remainingBalancePkr: number;
      commissionRateBps?: number;
      commissionPkr?: number;
      salonSharePkr?: number;
    };
    appointment?: {
      id: string;
      status: string;
      paymentStatus: string;
    };
  } | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }
    fetch(`/api/payments/status?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ref]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-[#16161D] p-8 text-center border border-white/10 text-white">
        <p className="text-white/60 text-sm">Loading secure payment portal…</p>
      </div>
    );
  }

  if (!data?.payment) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-[#16161D] p-8 text-center border border-white/10 text-white space-y-4">
        <h1 className="text-xl font-bold text-white font-display">Payment Session Not Found</h1>
        <p className="text-xs text-white/60">
          The requested payment session is missing or has expired. Please select your salon and retry booking.
        </p>
        <Link
          href="/explore"
          className="inline-block rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-black"
        >
          Explore Salons
        </Link>
      </div>
    );
  }

  const { payment } = data;
  const isJazzCash = provider === "JAZZCASH";
  const callbackUrl = isJazzCash ? "/api/payments/callback/jazzcash" : "/api/payments/callback/easypaisa";

  const split = calculateFullFinancialSplit(payment.totalBookingPkr);

  return (
    <div className="mx-auto max-w-lg px-4 py-8 text-white space-y-6">
      {/* Provider Header Banner */}
      <div
        className={`rounded-3xl p-6 border text-center shadow-xl ${
          isJazzCash
            ? "border-red-500/40 bg-gradient-to-br from-red-950/60 via-[#1c1c24] to-[#121217]"
            : "border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 via-[#1c1c24] to-[#121217]"
        }`}
      >
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold bg-white/10 border border-white/15">
          <span>{isJazzCash ? "🔴 JazzCash Sandbox Portal" : "🟢 Easypaisa Sandbox Portal"}</span>
        </div>

        <h1 className="mt-3 text-2xl font-bold font-display text-white">
          {payment.paymentType === "REMAINING" ? "Complete Remaining Balance Payment" : "Complete 50% Advance Payment"}
        </h1>
        <p className="mt-1 text-xs text-white/60">
          Transaction Reference: <span className="font-mono text-gold">{payment.internalRef}</span>
        </p>
      </div>

      {/* Payment Rule Breakdown */}
      <div className="rounded-3xl border border-white/15 bg-[#16161D] p-5 sm:p-6 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <span className="text-xs text-white/70">Total Salon Service Price</span>
          <span className="text-sm font-bold text-white">{formatPkr(payment.totalBookingPkr)}</span>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gold/10 border border-gold/30">
          <div>
            <p className="text-xs font-bold text-gold">
              {payment.paymentType === "REMAINING" ? "Remaining Balance Due" : "50% Advance Online Required"}
            </p>
            <p className="text-[10px] text-white/60">Payable now via {isJazzCash ? "JazzCash" : "Easypaisa"}</p>
          </div>
          <span className="text-lg font-black text-gold">{formatPkr(payment.advanceRequiredPkr)}</span>
        </div>

        {/* Financial Split Breakdown */}
        <div className="rounded-2xl bg-[#1C1C24] p-3 border border-white/5 space-y-1.5 text-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Automated Financial Split</p>
          <div className="flex justify-between text-white/70">
            <span>• QSalon Platform Commission ({(payment.commissionRateBps || 1000) / 100}% fee):</span>
            <span className="font-bold text-gold">
              {formatPkr(payment.commissionPkr !== undefined ? payment.commissionPkr : split.commissionPkr)}
            </span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>• Salon Allocation ({100 - (payment.commissionRateBps || 1000) / 100}% share):</span>
            <span className="font-bold text-emerald-400">
              {formatPkr(payment.salonSharePkr !== undefined ? payment.salonSharePkr : split.salonAllocationFromAdvancePkr)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs text-white/70">
          <span>
            {payment.paymentType === "REMAINING" ? "Status After Payment" : "Remaining Counter Balance"}
          </span>
          <span className="font-semibold text-white">
            {payment.paymentType === "REMAINING" ? "Zero Balance (Fully Paid)" : `${formatPkr(payment.remainingBalancePkr)} payable at salon`}
          </span>
        </div>
      </div>

      {/* Payment Action Simulation Forms */}
      <div className="rounded-3xl border border-white/10 bg-[#16161D]/80 p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-white/60 text-center">
          Payment Test Controls
        </p>

        {/* 1. Simulate Success */}
        <form method="POST" action={callbackUrl}>
          <input type="hidden" name={isJazzCash ? "pp_mpf_1" : "orderRefNum"} value={payment.internalRef} />
          <input type="hidden" name={isJazzCash ? "pp_TxnRefNo" : "transactionId"} value={`TXN_${Date.now()}`} />
          <input
            type="hidden"
            name={isJazzCash ? "pp_Amount" : "amount"}
            value={isJazzCash ? String(payment.advanceRequiredPkr * 100) : `${payment.advanceRequiredPkr}.0`}
          />
          <input type="hidden" name={isJazzCash ? "pp_ResponseCode" : "responseCode"} value={isJazzCash ? "000" : "0000"} />
          <input type="hidden" name={isJazzCash ? "pp_ResponseMessage" : "responseDesc"} value="Payment Approved Successfully" />
          <input type="hidden" name={isJazzCash ? "pp_TxnCurrency" : "currency"} value="PKR" />
          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-500 py-3.5 text-xs font-bold text-black shadow-lg hover:bg-emerald-400 active:scale-95 transition-all cursor-pointer"
          >
            ✓ Pay PKR {payment.advanceRequiredPkr.toLocaleString()} (Simulate Successful Payment)
          </button>
        </form>

        {/* 2. Simulate Failure */}
        <form method="POST" action={callbackUrl}>
          <input type="hidden" name={isJazzCash ? "pp_mpf_1" : "orderRefNum"} value={payment.internalRef} />
          <input type="hidden" name={isJazzCash ? "pp_TxnRefNo" : "transactionId"} value={`TXN_${Date.now()}`} />
          <input
            type="hidden"
            name={isJazzCash ? "pp_Amount" : "amount"}
            value={isJazzCash ? String(payment.advanceRequiredPkr * 100) : `${payment.advanceRequiredPkr}.0`}
          />
          <input type="hidden" name={isJazzCash ? "pp_ResponseCode" : "responseCode"} value={isJazzCash ? "110" : "1001"} />
          <input type="hidden" name={isJazzCash ? "pp_ResponseMessage" : "responseDesc"} value="Insufficient balance or transaction declined by customer" />
          <button
            type="submit"
            className="w-full rounded-2xl bg-rose-500/20 border border-rose-500/30 py-3 text-xs font-bold text-rose-300 hover:bg-rose-500/30 active:scale-95 transition-all cursor-pointer"
          >
            ✕ Simulate Payment Failure / Decline
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link href="/bookings" className="text-xs text-white/50 hover:underline">
            Cancel and Return to Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SandboxCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md rounded-3xl bg-[#16161D] p-8 text-center text-white border border-white/10">
          Loading checkout…
        </div>
      }
    >
      <SandboxCheckoutInner />
    </Suspense>
  );
}
