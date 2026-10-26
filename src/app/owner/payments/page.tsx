"use client";

import { useEffect, useState } from "react";
import { formatPkr } from "@/lib/format";
import { WalletIcon } from "@/components/Icons";

type PaymentAccount = {
  id: string;
  provider: "JAZZCASH" | "EASYPAISA" | "BANK";
  accountHolderName: string;
  accountNumber: string;
  bankName?: string;
  branchCode?: string;
  cnic?: string;
  businessTitle?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  updatedAt: string;
  auditLogs?: {
    id: string;
    action: string;
    changedBy: string;
    createdAt: string;
  }[];
};

type PaymentItem = {
  id: string;
  customerName: string;
  customerPhone: string;
  provider: string;
  internalRef: string;
  amountPaidPkr: number;
  remainingBalancePkr: number;
  commissionPkr?: number;
  salonSharePkr?: number;
  status: string;
  settlementStatus: string;
  paidAt?: string;
  createdAt: string;
};

type PayoutItem = {
  id: string;
  amountPkr: number;
  provider: string;
  accountHolderName: string;
  accountNumber: string;
  bankName?: string;
  payoutRef: string;
  status: string;
  notes?: string;
  processedBy?: string;
  createdAt: string;
  completedAt?: string;
};

export default function OwnerPaymentsPage() {
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [stats, setStats] = useState({
    totalAdvanceCollectedPkr: 0,
    totalPlatformCommissionPkr: 0,
    totalNetSalonSharePkr: 0,
    pendingSettlementPkr: 0,
    settledPkr: 0,
    totalPaymentsCount: 0,
  });
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"SETTINGS" | "TRANSACTIONS" | "PAYOUTS">("SETTINGS");

  // Form State
  const [provider, setProvider] = useState<"JAZZCASH" | "EASYPAISA" | "BANK">("JAZZCASH");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [cnic, setCnic] = useState("");
  const [businessTitle, setBusinessTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/owner/payment-account");
      const data = await res.json();
      if (res.ok) {
        setAccount(data.paymentAccount);
        if (data.paymentAccount) {
          setProvider(data.paymentAccount.provider);
          setAccountHolderName(data.paymentAccount.accountHolderName);
          setAccountNumber(data.paymentAccount.accountNumber);
          setBankName(data.paymentAccount.bankName || "");
          setBranchCode(data.paymentAccount.branchCode || "");
          setCnic(data.paymentAccount.cnic || "");
          setBusinessTitle(data.paymentAccount.businessTitle || "");
        }
        setStats(data.stats || stats);
        setPayments(data.payments || []);
        setPayouts(data.payouts || []);
      }
    } catch {
      setError("Failed to load payment account details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");
    setError("");

    try {
      const res = await fetch("/api/owner/payment-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          accountHolderName,
          accountNumber,
          bankName,
          branchCode,
          cnic,
          businessTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save payment settings.");
      } else {
        setMsg(data.message || "Payment details saved successfully.");
        loadData();
      }
    } catch {
      setError("Network error while saving settings.");
    } finally {
      setSubmitting(false);
    }
  }

  const isVerified = account?.verificationStatus === "VERIFIED";

  function renderStatusBadge(status?: string) {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Verified &amp; Active
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Verification Rejected
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Pending Verification
          </span>
        );
    }
  }

  return (
    <div className="space-y-6 text-white pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-gold" />
            <span>Payout Settings &amp; Financial Settlements</span>
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Manage your payout destination and track customer advance settlements (90% salon allocation after 10% platform fee).
            {loading && <span className="ml-2 text-gold animate-pulse">Loading…</span>}
          </p>
        </div>

        <div>{renderStatusBadge(account?.verificationStatus)}</div>
      </div>

      {/* Verification Notice Banner */}
      {!isVerified && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-amber-300">
            <span>⚠️</span> Online Advance Bookings Paused
          </p>
          <p className="text-white/80 leading-relaxed text-[11px]">
            {account?.verificationStatus === "REJECTED" ? (
              <>
                Your payment account was rejected by Super Admin:{" "}
                <span className="text-rose-300 font-semibold">{account.rejectionReason || "Details could not be verified"}</span>.
                Please correct your legal name and account number below and resubmit.
              </>
            ) : account?.verificationStatus === "SUSPENDED" ? (
              <>
                Your payout destination has been temporarily suspended. Please contact QSalon support at muheebkakar005@gmail.com.
              </>
            ) : (
              <>
                Your payout details are currently <strong>under review</strong> by QSalon administrators. According to QSalon policy, customer online advance bookings are only enabled once your payout account is verified.
              </>
            )}
          </p>
        </div>
      )}

      {isVerified && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 flex items-center justify-between">
          <div>
            <p className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span>✓</span> Live &amp; Active for Online Bookings
            </p>
            <p className="text-white/80 text-[11px] mt-0.5">
              Customers can book appointments and pay the mandatory 50% advance online. Advances are settled to your {account?.provider} account.
            </p>
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4 shadow-lg space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">Gross Customer Advances</p>
          <p className="text-2xl font-bold text-white">{formatPkr(stats.totalAdvanceCollectedPkr)}</p>
          <p className="text-[10px] text-white/40">{stats.totalPaymentsCount} online bookings</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4 shadow-lg space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">QSalon 10% Fee</p>
          <p className="text-2xl font-bold text-gold">{formatPkr(stats.totalPlatformCommissionPkr)}</p>
          <p className="text-[10px] text-white/40">10% platform commission on advance</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-[#16161D] p-4 shadow-lg space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Net Salon Allocation (90%)</p>
          <p className="text-2xl font-bold text-emerald-300">{formatPkr(stats.totalNetSalonSharePkr)}</p>
          <p className="text-[10px] text-white/40">Total salon share from advances</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-[#16161D] p-4 shadow-lg space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Pending Settlement</p>
          <p className="text-2xl font-bold text-amber-300">{formatPkr(stats.pendingSettlementPkr)}</p>
          <p className="text-[10px] text-white/40">Awaiting transfer to your account</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("SETTINGS")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "SETTINGS"
              ? "bg-white text-black shadow-md"
              : "text-white/70 hover:bg-white/10"
          }`}
        >
          Payout Destination
        </button>
        <button
          onClick={() => setActiveTab("TRANSACTIONS")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "TRANSACTIONS"
              ? "bg-white text-black shadow-md"
              : "text-white/70 hover:bg-white/10"
          }`}
        >
          Customer Advances ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab("PAYOUTS")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "PAYOUTS"
              ? "bg-white text-black shadow-md"
              : "text-white/70 hover:bg-white/10"
          }`}
        >
          Disbursement History ({payouts.length})
        </button>
      </div>

      {/* Tab 1: Payout Destination Settings Form */}
      {activeTab === "SETTINGS" && (
        <div className="rounded-3xl border border-white/10 bg-[#16161D] p-6 shadow-xl max-w-2xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Salon Owner Payout Destination</h2>
            <p className="text-xs text-white/50 mt-1">
              Select your payment method. Advances will be transferred directly to this account by QSalon administrators.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Provider Switcher */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2">
                Select Preferred Payment Method *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["JAZZCASH", "EASYPAISA", "BANK"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setProvider(m)}
                    className={`rounded-2xl border p-3 text-center transition-all cursor-pointer ${
                      provider === m
                        ? "border-gold bg-gold/15 text-gold font-bold ring-1 ring-gold"
                        : "border-white/10 bg-[#1C1C24] text-white/60 hover:bg-white/5"
                    }`}
                  >
                    <p className="text-xs">
                      {m === "JAZZCASH" ? "🔴 JazzCash" : m === "EASYPAISA" ? "🟢 Easypaisa" : "🏦 Bank Account"}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {m === "BANK" ? "IBAN Transfer" : "Mobile Wallet"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Holder Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Account Holder Full Legal Name *
              </label>
              <input
                required
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Must match your CNIC and Bank / Wallet title"
                className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold transition-all"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Name registered on your mobile account or bank passbook.
              </p>
            </div>

            {/* Account / Mobile Number */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                {provider === "BANK" ? "Bank Account Number or IBAN (24 characters) *" : "Registered Mobile Wallet Number *"}
              </label>
              <input
                required
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={provider === "BANK" ? "PK36MEZN0001234567890101" : "03001234567"}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold font-mono transition-all"
              />
            </div>

            {/* Bank Specific Details */}
            {provider === "BANK" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Bank Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Meezan Bank, HBL, Bank of Balochistan"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Branch Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    placeholder="e.g. 0102"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold transition-all"
                  />
                </div>
              </div>
            )}

            {/* Verification Fields: CNIC & Business Title */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Owner CNIC Number (13 Digits)
                </label>
                <input
                  type="text"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="54400-XXXXXXX-X"
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold font-mono transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Business / Salon Title on Account
                </label>
                <input
                  type="text"
                  value={businessTitle}
                  onChange={(e) => setBusinessTitle(e.target.value)}
                  placeholder="e.g. The Hair Lab Quetta"
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold transition-all"
                />
              </div>
            </div>

            {/* Zero Secrets Callout */}
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300">
              🛡️ <strong>Security Guarantee:</strong> QSalon will never ask for your JazzCash PIN, Easypaisa OTP, or account password.
            </div>

            {msg && (
              <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-300">
                {msg}
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-3 text-xs font-semibold text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl bg-gold font-bold text-black text-xs shadow-md hover:bg-gold-light active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving Payment Account…" : "Save & Submit for Verification"}
            </button>
          </form>

          {/* Audit Trail */}
          {account?.auditLogs && account.auditLogs.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Audit Trail</p>
              <div className="space-y-1.5 text-xs">
                {account.auditLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center rounded-lg bg-[#1C1C24] p-2 text-[11px]">
                    <div>
                      <span className="font-bold text-white">{log.action}</span>
                      <span className="text-white/40 ml-2">by {log.changedBy}</span>
                    </div>
                    <span className="text-white/40 font-mono text-[10px]">
                      {new Date(log.createdAt).toLocaleString("en-PK")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Customer Advance Payments Ledger */}
      {activeTab === "TRANSACTIONS" && (
        <div className="rounded-3xl border border-white/10 bg-[#16161D] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white">Customer Advance Payments</h2>
              <p className="text-xs text-white/50">
                Online 50% advances collected for your appointments. QSalon retains 10% platform fee and allocates 90% to your payout balance.
              </p>
            </div>
            <span className="text-xs font-bold text-gold">{payments.length} transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-[#1C1C24] text-[10px] uppercase text-white/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Customer &amp; Ref</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">50% Advance Paid</th>
                  <th className="px-4 py-3 text-gold">10% Platform Fee</th>
                  <th className="px-4 py-3 text-emerald-400">90% Salon Share</th>
                  <th className="px-4 py-3">Remaining at Counter</th>
                  <th className="px-4 py-3">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p) => {
                  const comm = p.commissionPkr !== undefined && p.commissionPkr > 0 ? p.commissionPkr : Math.round(p.amountPaidPkr * 0.10);
                  const share = p.salonSharePkr !== undefined && p.salonSharePkr > 0 ? p.salonSharePkr : (p.amountPaidPkr - comm);

                  return (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{p.customerName}</p>
                        <p className="text-[10px] font-mono text-white/50">{p.internalRef}</p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-white/80">{p.provider}</span>
                      </td>

                      <td className="px-4 py-3 font-bold text-white">
                        {formatPkr(p.amountPaidPkr)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-gold">
                        -{formatPkr(comm)}
                      </td>

                      <td className="px-4 py-3 font-bold text-emerald-400">
                        {formatPkr(share)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-white/70">
                        {formatPkr(p.remainingBalancePkr)}
                      </td>

                      <td className="px-4 py-3">
                        {p.settlementStatus === "SETTLED" ? (
                          <span className="rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 text-[10px] font-bold">
                            ✓ SETTLED
                          </span>
                        ) : (
                          <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold">
                            PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!payments.length && (
              <div className="p-8 text-center text-xs text-white/50">
                No customer advance payments received yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Disbursement Payout History */}
      {activeTab === "PAYOUTS" && (
        <div className="rounded-3xl border border-white/10 bg-[#16161D] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white">Disbursement Settlements History</h2>
              <p className="text-xs text-white/50">
                Transfers executed by QSalon administration to your verified payout destination.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400">{payouts.length} payouts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-[#1C1C24] text-[10px] uppercase text-white/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Disbursement Ref</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payouts.map((po) => (
                  <tr key={po.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-mono font-bold text-gold">
                      {po.payoutRef}
                    </td>

                    <td className="px-4 py-3 font-bold text-emerald-400 text-sm">
                      {formatPkr(po.amountPkr)}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{po.accountHolderName}</p>
                      <p className="font-mono text-[10px] text-white/50">{po.provider}: {po.accountNumber}</p>
                    </td>

                    <td className="px-4 py-3 text-white/60">
                      {new Date(po.createdAt).toLocaleDateString("en-PK")}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!payouts.length && (
              <div className="p-8 text-center text-xs text-white/50">
                No payouts have been disbursed yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
