"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { whatsappChatUrl } from "@/lib/whatsapp";

type Shop = {
  id: string;
  name: string;
  quettaArea: string;
  category: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  imageUrl?: string;
  approvalStatus: string;
  rejectionReason: string;
  owner?: {
    name: string;
    email: string;
    phone?: string;
  };
};

export default function ApprovalsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [actionNotice, setActionNotice] = useState("");

  async function load() {
    const res = await fetch("/api/salons");
    const data = await res.json();
    setShops(data.salons || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, approvalStatus: string) {
    const rejReason = reason[id] || "";
    if (approvalStatus === "REJECTED" && !rejReason.trim()) {
      alert("Please enter a rejection reason before rejecting.");
      return;
    }

    await fetch(`/api/salons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalStatus, rejectionReason: rejReason }),
    });

    setActionNotice(`Status updated to ${approvalStatus}! Choose WhatsApp or Email notification below.`);
    load();
  }

  const pending = shops.filter((s) => s.approvalStatus === "PENDING");
  const others = shops.filter((s) => s.approvalStatus !== "PENDING" && s.approvalStatus !== "APPROVED");

  return (
    <div className="space-y-6 text-white max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Salon Owner Registrations & Approvals</h1>
        <p className="text-xs text-white/50 mt-0.5">
          Review salon owner applications. Only explicitly APPROVED salons appear on the public marketplace. Send immediate notifications via WhatsApp or Email.
        </p>
      </div>

      {actionNotice && (
        <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-300">
          ✓ {actionNotice}
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-white mb-3">
          Pending Verification ({pending.length})
        </h2>

        <ul className="space-y-4">
          {pending.length === 0 && (
            <li className="rounded-2xl border border-white/10 bg-[#16161D] p-6 text-center text-xs text-white/40">
              No new salon registration requests waiting for verification.
            </li>
          )}

          {pending.map((s) => {
            const ownerName = s.owner?.name || "Salon Owner";
            const ownerEmail = s.owner?.email || "";
            const wpNumber = s.whatsappNumber || s.phone;
            const currentReason = reason[s.id] || "Missing or incomplete documents";

            const approvalMessage = `Assalam-o-Alaikum ${ownerName}!\n\nCongratulations! Your salon "${s.name}" (${s.quettaArea}) has been officially APPROVED by Super Admin on Quetta Salon Connect.\n\nYour shop is now LIVE and bookable publicly. Login to your dashboard:\nhttps://quetta-salon-connect.pk/owner/login`;

            const rejectionMessage = `Assalam-o-Alaikum ${ownerName}.\n\nYour registration request for "${s.name}" on Quetta Salon Connect has been reviewed.\n\nStatus: Action Required / Rejected\nReason: ${currentReason}\n\nPlease update your profile and resubmit for approval.`;

            return (
              <li key={s.id} className="rounded-2xl border border-white/10 bg-[#16161D] p-5 space-y-3.5 shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {s.imageUrl && (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                        <Image src={s.imageUrl} alt={s.name} fill className="object-cover" unoptimized />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white">{s.name}</h3>
                        <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                          Pending Verification
                        </span>
                      </div>
                      <p className="text-xs text-gold/90 font-medium mt-0.5">
                        Category: {s.category} · Area: {s.quettaArea}
                      </p>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        Address: {s.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Owner Information Card */}
                <div className="grid gap-2 sm:grid-cols-3 rounded-xl bg-[#1C1C24] border border-white/5 p-3 text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 uppercase font-bold block">Owner Name</span>
                    <span className="font-semibold text-white">{s.owner?.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase font-bold block">Login Email</span>
                    <span className="font-mono text-white/90">{ownerEmail || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase font-bold block">WhatsApp / Phone</span>
                    <span className="font-mono text-emerald-400 font-bold">{wpNumber}</span>
                  </div>
                </div>

                {/* Rejection Reason Input */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                    Rejection Reason (Required only if rejecting)
                  </label>
                  <input
                    className="h-9 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
                    placeholder="e.g. Please provide valid shop address or clear cover photo"
                    value={reason[s.id] || ""}
                    onChange={(e) => setReason((r) => ({ ...r, [s.id]: e.target.value }))}
                  />
                </div>

                {/* Manual Admin Approval / Rejection Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/10">
                  <div className="flex gap-2">
                    <button
                      onClick={() => decide(s.id, "APPROVED")}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      ✓ Approve & Make Live
                    </button>
                    <button
                      onClick={() => decide(s.id, "REJECTED")}
                      className="rounded-xl border border-rose-500/40 bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
                    >
                      ✕ Reject Request
                    </button>
                  </div>

                  {/* Multi-Channel Notification Options: WhatsApp & Email */}
                  <div className="flex items-center gap-2">
                    <a
                      href={whatsappChatUrl(wpNumber, s.approvalStatus === "REJECTED" ? rejectionMessage : approvalMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#1eb957] transition-all cursor-pointer"
                      title="Send message directly to owner's WhatsApp"
                    >
                      <span>💬 WhatsApp Notice</span>
                    </a>

                    {ownerEmail && (
                      <a
                        href={`mailto:${ownerEmail}?subject=${encodeURIComponent(
                          `Quetta Salon Connect Application: ${s.name}`
                        )}&body=${encodeURIComponent(
                          s.approvalStatus === "REJECTED" ? rejectionMessage : approvalMessage
                        )}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer"
                        title="Send email to owner"
                      >
                        <span>✉️ Send Email</span>
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {others.length > 0 && (
        <div className="pt-4">
          <h2 className="text-sm font-bold text-white mb-2">Rejected Salons ({others.length})</h2>
          <ul className="space-y-2 text-xs">
            {others.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-white/5 bg-[#16161D] p-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-white">{s.name}</span>
                  <span className="text-white/40 ml-2">({s.quettaArea})</span>
                  <p className="text-[11px] text-rose-300 mt-0.5">
                    Reason: {s.rejectionReason || "Requirements not met"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={whatsappChatUrl(
                      s.whatsappNumber || s.phone,
                      `Assalam-o-Alaikum. Regarding your salon "${s.name}": ${s.rejectionReason}`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#25D366] font-bold hover:underline"
                  >
                    Resend WhatsApp
                  </a>
                  <button
                    onClick={() => decide(s.id, "APPROVED")}
                    className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-white/20"
                  >
                    Re-Approve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
