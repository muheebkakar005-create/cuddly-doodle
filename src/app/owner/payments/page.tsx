"use client";

import { useEffect, useState } from "react";
import { formatPkr } from "@/lib/format";
import { CheckIcon, WalletIcon } from "@/components/Icons";

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
      setError("Failed to load payment details");
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

    if (!accountHolderName || !accountNumber) {
      setError("Account holder name and account/wallet number are required.");
      setSubmitting(false);
      return;
    }

    if (provider === "BANK" && !bankName) {
      setError("Bank Name is required for Bank Account/IBAN payouts.");
      setSubmitting(false);
      return;
    }

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
        setError(data.error || "Failed to update payment settings.");
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

  function renderStatusBadge(status?: string) {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 text-xs font-bold">
            <CheckIcon className="h-3.5 w-3.5" />
            <span>Verified & Active</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 px-3 py-1 text-xs font-bold">
            <span>Rejected</span>
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 px-3 py-1 text-xs font-bold">
            <span>Suspended</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 text-xs font-bold">
            <span>Pending Admin Review</span>
          </span>
        );
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#16161D] p-12 text-center text-white/50 text-xs">
        Loading salon payment configuration & settlement history…
      </div>
    );
  }

  const isVerified = account?.verificationStatus === "VERIFIED";

  return (
    <div className="space-y-6 text-white pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-gold" />
            <span>Payment Settings & Settlements</span>
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Manage your payout destination (JazzCash, Easypaisa, or Bank IBAN) and track customer advance settlements.
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
              <span>✓</span> Live & Active for Online Bookings
            </p>
            <p className="text-white/80 text-[11px] mt-0.5">
              Customers can book appointments and pay the mandatory 50% advance online. Advance payments will be settled to your {account?.provider} account.
            </p>
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">Total Advance Collected</p>
          <p className="text-2xl font-bold text-white mt-1">{formatPkr(stats.totalAdvanceCollectedPkr)}</p>
          <p className="text-[10px] text-white/40 mt-0.5">{stats.totalPaymentsCount} online transactions</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-[#16161D] p-4 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Pending Settlement (Unsettled)</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{formatPkr(stats.pendingSettlementPkr)}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Awaiting transfer to your account</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-[#16161D] p-4 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Completed Payouts (Settled)</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{formatPkr(stats.settledPkr)}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Successfully transferred to salon</p>
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
          Payout Destination Settings
        </button>
        <button
          onClick={() => setActiveTab("TRANSACTIONS")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "TRANSACTIONS"
              ? "bg-white text-black shadow-md"
              : "text-white/70 hover:bg-white/10"
          }`}
        >
          Customer Advance Payments ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab("PAYOUTS")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "PAYOUTS"
              ? "bg-white text-black shadow-md"
              : "text-white/70 hover:bg-white/10"
          }`}
        >
          Payout History ({payouts.length})
        </button>
      </div>

      {/* Tab 1: Payout Destination Settings */}
      {activeTab === "SETTINGS" && (
        <div className="rounded-3xl border border-white/10 bg-[#16161D] p-5 sm:p-6 shadow-xl space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Salon Payout Destination Details</h2>
            <p className="text-xs text-white/50 mt-0.5">
              Provide your official Pakistani wallet or bank account. If you update these details, your account will be placed into PENDING status for admin re-verification to prevent fraud.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Provider Switcher */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Payout Method *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider("JAZZCASH")}
                  className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    provider === "JAZZCASH"
                      ? "border-red-500 bg-red-950/40 text-white font-bold ring-1 ring-red-500"
                      : "border-white/10 bg-[#1C1C24] text-white/70 hover:bg-white/5"
                  }`}
                >
                  <p className="text-xs">🔴 JazzCash</p>
                  <p className="text-[10px] text-white/50">Mobile Wallet</p>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider("EASYPAISA")}
                  className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    provider === "EASYPAISA"
                      ? "border-emerald-500 bg-emerald-950/40 text-white font-bold ring-1 ring-emerald-500"
                      : "border-white/10 bg-[#1C1C24] text-white/70 hover:bg-white/5"
                  }`}
                >
                  <p className="text-xs">🟢 Easypaisa</p>
                  <p className="text-[10px] text-white/50">Mobile Wallet</p>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider("BANK")}
                  className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    provider === "BANK"
                      ? "border-blue-500 bg-blue-950/40 text-white font-bold ring-1 ring-blue-500"
                      : "border-white/10 bg-[#1C1C24] text-white/70 hover:bg-white/5"
                  }`}
                >
                  <p className="text-xs">🏛️ Bank Account</p>
                  <p className="text-[10px] text-white/50">Direct IBAN</p>
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                  Account Holder Full Legal Name *
                </label>
                <input
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                  placeholder="e.g. Muheeb Ullah Kakar"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                  {provider === "BANK" ? "Bank Account Number / IBAN *" : "Mobile Wallet Number *"}
                </label>
                <input
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white font-mono"
                  placeholder={provider === "BANK" ? "PKXX BANK 0000 0000 0000 00" : "0300-1234567"}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            {provider === "BANK" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                    Bank Name *
                  </label>
                  <input
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                    placeholder="e.g. Meezan Bank, HBL, Bank of Khyber"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                    Branch Code (Optional)
                  </label>
                  <input
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                    placeholder="e.g. 0102"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                  Owner CNIC (Optional for verification)
                </label>
                <input
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white font-mono"
                  placeholder="54400-XXXXXXX-X"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                  Business / Salon Title (Optional)
                </label>
                <input
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                  placeholder="Registered business title"
                  value={businessTitle}
                  onChange={(e) => setBusinessTitle(e.target.value)}
                />
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="rounded-2xl bg-[#1C1C24] border border-white/5 p-3 text-[11px] text-white/70 space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>🛡️</span> Security & Compliance Guarantee
              </p>
              <p>
                QSalon adheres to State Bank of Pakistan (SBP) e-payment compliance guidelines. We never collect or store PINs, OTPs, or passwords. All payout changes are audited and require admin re-verification before active status is restored.
              </p>
            </div>

            {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}
            {msg && <p className="text-xs text-emerald-400 font-semibold">{msg}</p>}

            <button
              disabled={submitting}
              className="h-11 rounded-2xl bg-gold px-6 text-xs font-bold text-black shadow-lg hover:bg-gold-light transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving & Requesting Review…" : "Save Payout Details"}
            </button>
          </form>

          {/* Audit Trail of Account Changes */}
          {account?.auditLogs && account.auditLogs.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Account Change Audit Log</h3>
              <div className="space-y-1.5">
                {account.auditLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center text-[11px] rounded-xl bg-[#1C1C24] p-2 border border-white/5">
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
                Online 50% advances collected for your appointments. Payment and Settlement statuses are tracked separately.
              </p>
            </div>
            <span className="text-xs font-bold text-gold">{payments.length} transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-[#1C1C24] text-[10px] uppercase text-white/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Customer & Ref</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">50% Advance Paid</th>
                  <th className="px-4 py-3">Counter Balance</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{p.customerName}</p>
                      <p className="text-[10px] font-mono text-white/50">{p.internalRef}</p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-white/80">{p.provider}</span>
                    </td>

                    <td className="px-4 py-3 font-bold text-emerald-400">
                      {formatPkr(p.amountPaidPkr)}
                    </td>

                    <td className="px-4 py-3 font-bold text-gold">
                      {formatPkr(p.remainingBalancePkr)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
                        {p.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {p.settlementStatus === "SETTLED" ? (
                        <span className="rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 text-[10px] font-bold">
                          ✓ SETTLED
                        </span>
                      ) : (
                        <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold">
                          ⏳ PENDING
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!payments.length && (
              <div className="p-8 text-center text-xs text-white/50">
                No customer advance payments recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Payout History */}
      {activeTab === "PAYOUTS" && (
        <div className="rounded-3xl border border-white/10 bg-[#16161D] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white">Disbursement & Payout History</h2>
              <p className="text-xs text-white/50">
                Official payouts transferred by QSalon platform administrators to your registered destination.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400">{payouts.length} payouts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-[#1C1C24] text-[10px] uppercase text-white/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Payout Reference</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Processed Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Admin Notes</th>
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
                      <p className="text-[10px] font-mono text-white/50">{po.provider}: {po.accountNumber}</p>
                    </td>

                    <td className="px-4 py-3 text-white/60">
                      {po.completedAt ? new Date(po.completedAt).toLocaleDateString("en-PK") : new Date(po.createdAt).toLocaleDateString("en-PK")}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
                        {po.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-white/60 text-[11px]">
                      {po.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!payouts.length && (
              <div className="p-8 text-center text-xs text-white/50">
                No settlements or payouts transferred yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
