"use client";

import { useEffect, useState } from "react";
import { formatPkr } from "@/lib/format";
import { WalletIcon } from "@/components/Icons";

type AccountItem = {
  id: string;
  salonId: string;
  provider: string;
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
  salon: {
    id: string;
    name: string;
    slug: string;
    quettaArea: string;
    phone: string;
    whatsappNumber: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  auditLogs?: {
    id: string;
    action: string;
    changedBy: string;
    createdAt: string;
  }[];
};

type SettlementLedgerItem = {
  salonId: string;
  salonName: string;
  slug: string;
  quettaArea: string;
  phone: string;
  paymentAccount: {
    id: string;
    provider: string;
    accountHolderName: string;
    accountNumber: string;
    bankName?: string;
    verificationStatus: string;
  } | null;
  totalAdvanceCollectedPkr: number;
  pendingSettlementPkr: number;
  settledPkr: number;
  unsettledPaymentsCount: number;
};

type PayoutItem = {
  id: string;
  salonId: string;
  amountPkr: number;
  provider: string;
  accountHolderName: string;
  accountNumber: string;
  payoutRef: string;
  status: string;
  notes?: string;
  processedBy?: string;
  createdAt: string;
  salon: {
    name: string;
    slug: string;
    quettaArea: string;
  };
};

export default function AdminPayoutsPage() {
  const [activeTab, setActiveTab] = useState<"ACCOUNTS" | "SETTLEMENTS" | "HISTORY">("ACCOUNTS");
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [ledger, setLedger] = useState<SettlementLedgerItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [totals, setTotals] = useState({
    totalCollectedPkr: 0,
    totalPendingSettlementPkr: 0,
    totalSettledPkr: 0,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Settlement Execution Modal
  const [selectedSalon, setSelectedSalon] = useState<SettlementLedgerItem | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutRef, setPayoutRef] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [processingPayout, setProcessingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState("");

  // Rejection prompt state
  const [rejectingAccountId, setRejectingAccountId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const sp = statusFilter ? `?status=${statusFilter}` : "";
      const [accRes, payRes] = await Promise.all([
        fetch(`/api/admin/payment-accounts${sp}`),
        fetch(`/api/admin/payouts`),
      ]);

      const accData = await accRes.json();
      const payData = await payRes.json();

      setAccounts(accData.accounts || []);
      setLedger(payData.settlementLedger || []);
      setPayouts(payData.recentPayouts || []);
      if (payData.platformTotals) {
        setTotals(payData.platformTotals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function updateAccountStatus(id: string, verificationStatus: string, reason?: string) {
    try {
      const res = await fetch(`/api/admin/payment-accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus, rejectionReason: reason }),
      });
      if (res.ok) {
        setRejectingAccountId(null);
        setRejectionReason("");
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRecordPayout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSalon) return;
    setProcessingPayout(true);
    setPayoutError("");
    setPayoutSuccess("");

    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: selectedSalon.salonId,
          amountPkr: payoutAmount,
          payoutRef,
          notes: payoutNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayoutError(data.error || "Failed to record settlement payout.");
      } else {
        setPayoutSuccess(data.message || "Payout recorded successfully!");
        setPayoutRef("");
        setPayoutNotes("");
        setTimeout(() => {
          setSelectedSalon(null);
          setPayoutSuccess("");
          loadData();
        }, 1500);
      }
    } catch {
      setPayoutError("Network error while recording payout.");
    } finally {
      setProcessingPayout(false);
    }
  }

  return (
    <div className="space-y-6 text-white pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-gold" />
            <span>Salon Owner Payment Accounts & Settlements</span>
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Verify salon owner payout destinations, manage centralized disbursements, and track advance balances.
          </p>
        </div>

        <button
          onClick={loadData}
          className="rounded-xl border border-white/10 bg-[#16161D] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/10 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Platform Ledger Metrics */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">Total Customer Advances Collected</p>
          <p className="text-2xl font-bold text-white mt-1">{formatPkr(totals.totalCollectedPkr)}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Held in centralized QSalon merchant gateway</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-[#16161D] p-4 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Total Outstanding Settlements</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{formatPkr(totals.totalPendingSettlementPkr)}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Unsettled salon funds awaiting disbursement</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-[#16161D] p-4 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Completed Payouts Disbursed</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{formatPkr(totals.totalSettledPkr)}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Transferred to verified salon bank/wallets</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("ACCOUNTS")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "ACCOUNTS"
              ? "bg-white text-black shadow-md"
              : "text-white/70 hover:bg-white/10"
          }`}
        >
          Payment Accounts Verification ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab("SETTLEMENTS")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "SETTLEMENTS"
              ? "bg-white text-black shadow-md"
              : "text-white/70 hover:bg-white/10"
          }`}
        >
          Salons Settlement Ledger ({ledger.length})
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "HISTORY"
              ? "bg-white text-black shadow-md"
              : "text-white/70 hover:bg-white/10"
          }`}
        >
          Disbursement Payout History ({payouts.length})
        </button>
      </div>

      {/* Tab 1: Payment Accounts Verification */}
      {activeTab === "ACCOUNTS" && (
        <div className="space-y-3">
          <div className="flex gap-2 max-w-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-white/10 bg-[#16161D] px-3 text-xs text-white outline-none focus:border-white"
            >
              <option value="">All Verification Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="VERIFIED">Verified & Active</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="space-y-3">
            {accounts.map((acc) => {
              const isVerified = acc.verificationStatus === "VERIFIED";
              const isPending = acc.verificationStatus === "PENDING";
              const isRejecting = rejectingAccountId === acc.id;

              return (
                <div key={acc.id} className="rounded-2xl border border-white/10 bg-[#16161D] p-4 shadow-lg space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-sm text-white">{acc.salon.name}</h2>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                          {acc.salon.quettaArea}
                        </span>
                        {isVerified ? (
                          <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
                            ✓ Verified
                          </span>
                        ) : isPending ? (
                          <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold animate-pulse">
                            ⏳ Pending Review
                          </span>
                        ) : (
                          <span className="rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold">
                            {acc.verificationStatus}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-white/50 mt-0.5">
                        Owner: <span className="text-white font-medium">{acc.owner.name}</span> ({acc.owner.email} • {acc.owner.phone})
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {!isVerified && (
                        <button
                          onClick={() => updateAccountStatus(acc.id, "VERIFIED")}
                          className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors cursor-pointer"
                        >
                          ✓ Approve & Verify
                        </button>
                      )}

                      {acc.verificationStatus !== "REJECTED" && (
                        <button
                          onClick={() => setRejectingAccountId(acc.id)}
                          className="rounded-xl bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      )}

                      {isVerified && (
                        <button
                          onClick={() => updateAccountStatus(acc.id, "SUSPENDED")}
                          className="rounded-xl border border-white/10 bg-[#1C1C24] px-3 py-1.5 text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Financial Account Card */}
                  <div className="grid gap-2 sm:grid-cols-3 rounded-xl bg-[#1C1C24] border border-white/5 p-3 text-xs">
                    <div>
                      <span className="text-white/50 block text-[10px]">Method & Holder:</span>
                      <span className="font-bold text-gold">{acc.provider}</span> —{" "}
                      <span className="text-white font-medium">{acc.accountHolderName}</span>
                    </div>

                    <div>
                      <span className="text-white/50 block text-[10px]">Wallet / IBAN Number:</span>
                      <span className="font-mono text-white font-bold">{acc.accountNumber}</span>
                      {acc.bankName && <p className="text-[10px] text-white/60">Bank: {acc.bankName}</p>}
                    </div>

                    <div>
                      <span className="text-white/50 block text-[10px]">CNIC / Business:</span>
                      <span className="text-white font-mono">{acc.cnic || "None provided"}</span>
                      {acc.businessTitle && (
                        <p className="text-[10px] text-white/60 truncate">{acc.businessTitle}</p>
                      )}
                    </div>
                  </div>

                  {acc.rejectionReason && (
                    <p className="text-xs text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      Rejection Reason: {acc.rejectionReason}
                    </p>
                  )}

                  {/* Rejection Input */}
                  {isRejecting && (
                    <div className="pt-2 border-t border-white/10 flex gap-2">
                      <input
                        className="h-9 flex-1 rounded-xl border border-rose-500/40 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none"
                        placeholder="Specify reason for rejection (e.g. Account name mismatch, invalid IBAN)…"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <button
                        onClick={() => updateAccountStatus(acc.id, "REJECTED", rejectionReason)}
                        className="rounded-xl bg-rose-600 px-4 text-xs font-bold text-white"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => setRejectingAccountId(null)}
                        className="rounded-xl bg-white/10 px-3 text-xs text-white/60"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {!loading && !accounts.length && (
              <div className="rounded-3xl border border-dashed border-white/10 bg-[#16161D] p-12 text-center text-xs text-white/50">
                No salon payment accounts match the filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Salons Settlement Ledger */}
      {activeTab === "SETTLEMENTS" && (
        <div className="rounded-3xl border border-white/10 bg-[#16161D] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white">Salons Settlement Balances</h2>
              <p className="text-xs text-white/50">
                Track how much customer advance funds are held for each salon and disburse payouts.
              </p>
            </div>
            <span className="text-xs font-bold text-gold">{ledger.length} active salons</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-[#1C1C24] text-[10px] uppercase text-white/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Salon & Area</th>
                  <th className="px-4 py-3">Verified Payout Account</th>
                  <th className="px-4 py-3">Total Collected</th>
                  <th className="px-4 py-3">Pending Settlement</th>
                  <th className="px-4 py-3">Already Settled</th>
                  <th className="px-4 py-3 text-right">Disburse Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ledger.map((s) => {
                  const isAccountVerified = s.paymentAccount?.verificationStatus === "VERIFIED";
                  const hasPendingFunds = s.pendingSettlementPkr > 0;

                  return (
                    <tr key={s.salonId} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{s.salonName}</p>
                        <p className="text-[10px] text-white/50">{s.quettaArea} • {s.phone}</p>
                      </td>

                      <td className="px-4 py-3">
                        {s.paymentAccount ? (
                          <div>
                            <p className="font-semibold text-white">
                              {s.paymentAccount.provider}: {s.paymentAccount.accountHolderName}
                            </p>
                            <p className="font-mono text-[10px] text-white/50">{s.paymentAccount.accountNumber}</p>
                            {isAccountVerified ? (
                              <span className="text-[9px] text-emerald-400 font-bold">✓ VERIFIED</span>
                            ) : (
                              <span className="text-[9px] text-amber-400 font-bold">⏳ {s.paymentAccount.verificationStatus}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-rose-400 text-[11px] font-semibold">No payout account</span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-bold text-white">
                        {formatPkr(s.totalAdvanceCollectedPkr)}
                      </td>

                      <td className="px-4 py-3 font-bold text-amber-300 text-sm">
                        {formatPkr(s.pendingSettlementPkr)}
                        <span className="block text-[9px] text-white/40 font-normal">
                          {s.unsettledPaymentsCount} bookings
                        </span>
                      </td>

                      <td className="px-4 py-3 font-bold text-emerald-400">
                        {formatPkr(s.settledPkr)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          disabled={!isAccountVerified || !hasPendingFunds}
                          onClick={() => {
                            setSelectedSalon(s);
                            setPayoutAmount(s.pendingSettlementPkr);
                            setPayoutRef("");
                            setPayoutNotes("");
                            setPayoutError("");
                            setPayoutSuccess("");
                          }}
                          className="rounded-xl bg-gold px-3.5 py-1.5 text-xs font-bold text-black shadow-sm hover:bg-gold-light transition-all disabled:opacity-30 cursor-pointer"
                        >
                          Record Payout
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payout History */}
      {activeTab === "HISTORY" && (
        <div className="rounded-3xl border border-white/10 bg-[#16161D] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white">Platform Disbursement History</h2>
              <p className="text-xs text-white/50">
                Audit record of all payouts processed from centralized collection to salon owners.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400">{payouts.length} disbursements</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-[#1C1C24] text-[10px] uppercase text-white/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Disbursement Ref</th>
                  <th className="px-4 py-3">Salon & Area</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Destination Account</th>
                  <th className="px-4 py-3">Processed By</th>
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

                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{po.salon.name}</p>
                      <p className="text-[10px] text-white/50">{po.salon.quettaArea}</p>
                    </td>

                    <td className="px-4 py-3 font-bold text-emerald-400 text-sm">
                      {formatPkr(po.amountPkr)}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{po.accountHolderName}</p>
                      <p className="text-[10px] font-mono text-white/50">{po.provider}: {po.accountNumber}</p>
                    </td>

                    <td className="px-4 py-3 text-white/70">
                      {po.processedBy || "Super Admin"}
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
                No disbursements recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Payout Modal */}
      {selectedSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#16161D] p-6 shadow-2xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Record Settlement Payout</h2>
              <p className="text-xs text-white/50 mt-0.5">
                Disburse advance funds collected for <strong>{selectedSalon.salonName}</strong>.
              </p>
            </div>

            {/* Destination Info */}
            <div className="rounded-xl bg-[#1C1C24] p-3 text-xs space-y-1 border border-white/5">
              <p className="text-white/60">
                Destination: <span className="font-bold text-gold">{selectedSalon.paymentAccount?.provider}</span>
              </p>
              <p className="text-white">
                Account Holder: <span className="font-semibold">{selectedSalon.paymentAccount?.accountHolderName}</span>
              </p>
              <p className="font-mono text-white/80">
                Account Number: {selectedSalon.paymentAccount?.accountNumber}
              </p>
              <p className="text-amber-300 font-bold pt-1">
                Pending Settlement Balance: {formatPkr(selectedSalon.pendingSettlementPkr)}
              </p>
            </div>

            <form onSubmit={handleRecordPayout} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Payout Amount (PKR) *
                </label>
                <input
                  type="number"
                  max={selectedSalon.pendingSettlementPkr}
                  min={1}
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white font-bold"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseInt(e.target.value, 10) || 0)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Bank / Wallet Transaction Ref (payoutRef) *
                </label>
                <input
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white font-mono"
                  placeholder="e.g. JC-DISB-987654 or FT241025..."
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Internal Notes (Optional)
                </label>
                <input
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white"
                  placeholder="e.g. Settled weekly advance via JazzCash portal"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                />
              </div>

              {payoutError && <p className="text-xs text-rose-400 font-semibold">{payoutError}</p>}
              {payoutSuccess && <p className="text-xs text-emerald-400 font-semibold">{payoutSuccess}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={processingPayout}
                  className="flex-1 rounded-xl bg-gold py-2.5 text-xs font-bold text-black shadow-md hover:bg-gold-light transition-all disabled:opacity-50 cursor-pointer"
                >
                  {processingPayout ? "Recording Settlement…" : "Confirm & Settle"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSalon(null)}
                  className="rounded-xl border border-white/10 bg-[#1C1C24] px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
