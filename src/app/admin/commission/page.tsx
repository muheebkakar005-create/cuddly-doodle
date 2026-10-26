"use client";

import { useEffect, useState } from "react";
import { formatPkr } from "@/lib/format";
import { WalletIcon, BankIcon } from "@/components/Icons";

type CommissionItem = {
  id: string;
  paymentId: string;
  appointmentId: string;
  salonId: string;
  advanceAmountPkr: number;
  rateBps: number;
  commissionPkr: number;
  salonAllocationPkr: number;
  provider: string;
  providerRef?: string;
  status: string;
  settlementStatus: string;
  createdAt: string;
  salon: {
    id: string;
    name: string;
    slug: string;
    quettaArea: string;
    phone: string;
  };
  payment: {
    internalRef: string;
    customerName: string;
    customerPhone: string;
    totalBookingPkr: number;
    amountPaidPkr: number;
    paidAt?: string;
  };
};

type ConfigData = {
  accountHolderName: string;
  provider: string;
  accountNumber: string;
  bankName?: string;
  branchCode?: string;
  businessName: string;
};

type MetricsData = {
  totalCommissionsEarnedPkr: number;
  totalAdvanceVolumeProcessedPkr: number;
  totalSalonAllocationDisbursablePkr: number;
  jazzCashCommissionsPkr: number;
  easypaisaCommissionsPkr: number;
  totalTransactionsCount: number;
  commissionRateBps: number;
  commissionPercentage: number;
};

export default function AdminCommissionPage() {
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({
    totalCommissionsEarnedPkr: 0,
    totalAdvanceVolumeProcessedPkr: 0,
    totalSalonAllocationDisbursablePkr: 0,
    jazzCashCommissionsPkr: 0,
    easypaisaCommissionsPkr: 0,
    totalTransactionsCount: 0,
    commissionRateBps: 1000,
    commissionPercentage: 10,
  });
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");

  // Edit Platform Destination Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [holderName, setHolderName] = useState("");
  const [destProvider, setDestProvider] = useState("JAZZCASH");
  const [accountNum, setAccountNum] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (statusFilter) sp.set("status", statusFilter);
      if (providerFilter) sp.set("provider", providerFilter);

      const res = await fetch(`/api/admin/commission?${sp.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setCommissions(data.commissions || []);
        if (data.metrics) setMetrics(data.metrics);
        if (data.config) {
          setConfig(data.config);
          setHolderName(data.config.accountHolderName);
          setDestProvider(data.config.provider);
          setAccountNum(data.config.accountNumber);
          setBankName(data.config.bankName || "");
          setBranchCode(data.config.branchCode || "");
          setBusinessName(data.config.businessName || "");
        }
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
  }, [statusFilter, providerFilter]);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    setConfigMsg("");

    try {
      const res = await fetch("/api/admin/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountHolderName: holderName,
          provider: destProvider,
          accountNumber: accountNum,
          bankName,
          branchCode,
          businessName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfigMsg("Platform destination updated!");
        setTimeout(() => {
          setShowConfigModal(false);
          loadData();
        }, 1000);
      } else {
        setConfigMsg(data.error || "Failed to update configuration.");
      }
    } catch {
      setConfigMsg("Network error.");
    } finally {
      setSavingConfig(false);
    }
  }

  return (
    <div className="space-y-6 text-white pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span>Platform Commission Dashboard</span>
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Automated 10% platform commission on 50% customer advance online payments (1,000 basis points).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/admin/commission/export"
            download
            className="rounded-xl border border-white/10 bg-[#16161D] px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Export CSV Report</span>
          </a>
          <button
            onClick={() => setShowConfigModal(true)}
            className="rounded-xl bg-gold px-3.5 py-2 text-xs font-bold text-black hover:bg-gold-light transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <WalletIcon className="h-4 w-4" />
            <span>Platform Account</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-4">
        {/* Total Earned */}
        <div className="rounded-2xl border border-gold/30 bg-[#16161D] p-4 shadow-lg space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gold">QSalon Net Commission</p>
          <p className="text-2xl font-bold text-white">{formatPkr(metrics.totalCommissionsEarnedPkr)}</p>
          <div className="flex items-center justify-between text-[10px] text-white/50 pt-1 border-t border-white/5">
            <span>Fixed Platform Rate:</span>
            <span className="font-bold text-emerald-400">10% (1,000 bps)</span>
          </div>
        </div>

        {/* Total Customer Advance Volume */}
        <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4 shadow-lg space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">Gross Advance Processed</p>
          <p className="text-2xl font-bold text-white">{formatPkr(metrics.totalAdvanceVolumeProcessedPkr)}</p>
          <p className="text-[10px] text-white/40">From {metrics.totalTransactionsCount} verified advance payments</p>
        </div>

        {/* Salon Share Disbursable */}
        <div className="rounded-2xl border border-emerald-500/20 bg-[#16161D] p-4 shadow-lg space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Salons 90% Allocation</p>
          <p className="text-2xl font-bold text-emerald-300">{formatPkr(metrics.totalSalonAllocationDisbursablePkr)}</p>
          <p className="text-[10px] text-white/40">Allocated to verified salon bank/wallets</p>
        </div>

        {/* Gateway Distribution */}
        <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4 shadow-lg space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">Commission by Provider</p>
          <div className="space-y-1 text-xs pt-1">
            <div className="flex justify-between">
              <span className="text-rose-400">🔴 JazzCash:</span>
              <span className="font-bold text-white">{formatPkr(metrics.jazzCashCommissionsPkr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-400">🟢 Easypaisa:</span>
              <span className="font-bold text-white">{formatPkr(metrics.easypaisaCommissionsPkr)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Verified Business Payment Destination Card */}
      {config && (
        <div className="rounded-2xl border border-white/10 bg-[#1C1C24] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gold">Platform Revenue Account</p>
            <p className="text-sm font-bold text-white">
              {config.accountHolderName} • <span className="text-gold">{config.provider}</span> ({config.accountNumber})
            </p>
            <p className="text-[11px] text-white/50">
              {config.businessName} {config.bankName ? `• ${config.bankName}` : ""}
            </p>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="rounded-xl border border-white/10 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Update Destination
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-white/10 bg-[#16161D] px-3 text-xs text-white outline-none focus:border-white"
          >
            <option value="">All Statuses</option>
            <option value="EARNED">Earned / Retained</option>
            <option value="REVERSED">Reversed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="h-9 rounded-xl border border-white/10 bg-[#16161D] px-3 text-xs text-white outline-none focus:border-white"
          >
            <option value="">All Providers</option>
            <option value="JAZZCASH">JazzCash</option>
            <option value="EASYPAISA">Easypaisa</option>
          </select>
        </div>

        <span className="text-xs text-white/50">{commissions.length} commission ledger records</span>
      </div>

      {/* Commission Ledger Table */}
      <div className="rounded-3xl border border-white/10 bg-[#16161D] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-[#1C1C24] text-[10px] uppercase text-white/50 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Date & Booking</th>
                <th className="px-4 py-3">Salon & Area</th>
                <th className="px-4 py-3">Total Service</th>
                <th className="px-4 py-3">50% Advance Paid</th>
                <th className="px-4 py-3 text-gold">QSalon 10% Commission</th>
                <th className="px-4 py-3 text-emerald-400">Salon 90% Allocation</th>
                <th className="px-4 py-3">Provider Ref</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-mono text-white font-bold">{c.appointmentId.slice(0, 8)}</p>
                    <p className="text-[10px] text-white/50">{new Date(c.createdAt).toLocaleDateString("en-PK")}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-bold text-white">{c.salon.name}</p>
                    <p className="text-[10px] text-white/50">{c.salon.quettaArea}</p>
                  </td>

                  <td className="px-4 py-3 font-semibold text-white/80">
                    {formatPkr(c.payment.totalBookingPkr)}
                  </td>

                  <td className="px-4 py-3 font-bold text-white">
                    {formatPkr(c.advanceAmountPkr)}
                  </td>

                  <td className="px-4 py-3 font-bold text-gold text-sm">
                    {formatPkr(c.commissionPkr)}
                    <span className="block text-[9px] text-white/40 font-normal">10% of advance</span>
                  </td>

                  <td className="px-4 py-3 font-bold text-emerald-400">
                    {formatPkr(c.salonAllocationPkr)}
                    <span className="block text-[9px] text-white/40 font-normal">90% of advance</span>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-mono text-[10px] text-white/70">{c.providerRef || c.payment.internalRef}</p>
                    <span className="text-[9px] text-white/40">{c.provider}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && !commissions.length && (
            <div className="p-12 text-center text-xs text-white/50">
              No platform commission entries recorded yet. Verified online advance payments will populate here automatically.
            </div>
          )}
        </div>
      </div>

      {/* Edit Platform Destination Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#16161D] p-6 shadow-2xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BankIcon className="h-5 w-5 text-gold" />
                <span>Configure Platform Destination Account</span>
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                Set QSalon&apos;s verified business account where retained platform commissions are held.
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["JAZZCASH", "EASYPAISA", "BANK"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDestProvider(m)}
                      className={`rounded-xl border py-2 text-xs font-bold transition-all cursor-pointer ${
                        destProvider === m
                          ? "border-gold bg-gold/15 text-gold"
                          : "border-white/10 bg-[#1C1C24] text-white/60"
                      }`}
                    >
                      {m === "JAZZCASH" ? "🔴 JazzCash" : m === "EASYPAISA" ? "🟢 Easypaisa" : "🏦 Bank"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Business / Holder Name *
                </label>
                <input
                  required
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white"
                  placeholder="e.g. QSalon Digital / Devbase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Account Number / IBAN *
                </label>
                <input
                  required
                  value={accountNum}
                  onChange={(e) => setAccountNum(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white font-mono"
                  placeholder="e.g. 03001234567 or PK36MEZN..."
                />
              </div>

              {destProvider === "BANK" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                    Bank Name
                  </label>
                  <input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white outline-none focus:border-white"
                    placeholder="e.g. Meezan Bank, HBL"
                  />
                </div>
              )}

              {configMsg && (
                <p className="text-xs text-emerald-400 font-semibold">{configMsg}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="flex-1 rounded-xl bg-gold py-2.5 text-xs font-bold text-black shadow-md hover:bg-gold-light transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingConfig ? "Saving…" : "Save Destination Account"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
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
