"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DISLIKE_TAGS, LIKE_TAGS } from "@/lib/constants";
import { formatPkr, formatTime12 } from "@/lib/format";
import { isValidPakistaniPhone } from "@/lib/phone";
import { buildBookingMessage, whatsappChatUrl } from "@/lib/whatsapp";
import { ChevronLeftIcon, WhatsAppIcon } from "@/components/Icons";

type Row = {
  id: string;
  customerName: string;
  customerPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  totalPricePkr: number;
  status: string;
  specialNotes?: string;
  salon: { name: string; slug: string; quettaArea: string; whatsappNumber: string; imageUrl?: string };
  services: { service: { name: string } }[];
  review: { id: string } | null;
};

export default function BookingsPage() {
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function load(p: string) {
    setLoading(true);
    setError("");
    try {
      let idsQuery = "";
      try {
        const savedIds: string[] = JSON.parse(localStorage.getItem("qsc_bookings") || "[]");
        if (savedIds.length > 0) {
          idsQuery = `&ids=${encodeURIComponent(savedIds.join(","))}`;
        }
      } catch {}
      const res = await fetch(`/api/appointments?phone=${encodeURIComponent(p)}${idsQuery}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load appointments.");
        setRows([]);
      } else {
        setRows(data.appointments || []);
      }
      setSearched(true);
    } catch {
      setError("Failed to load appointments. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("qsc_phone");
    if (saved) {
      setPhone(saved);
      load(saved);
    }
  }, []);

  const totalSpent = rows
    .filter((r) => r.status !== "CANCELLED")
    .reduce((sum, r) => sum + r.totalPricePkr, 0);

  function statusBadge(status: string) {
    switch (status) {
      case "CONFIRMED":
        return <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold">Confirmed</span>;
      case "COMPLETED":
        return <span className="rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold">Completed</span>;
      case "CANCELLED":
        return <span className="rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold">Cancelled</span>;
      default:
        return <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold">Pending</span>;
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-20">
      {/* Header with back button matching Screen 3 in uploaded UI */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16161D] border border-white/10 text-white hover:bg-white/20 transition-all shadow-sm"
          title="Back to Home"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-sm sm:text-base font-bold text-white text-center">
          My Appointments
        </h1>
        <div className="w-9" />
      </div>

      {/* Summary Card matching uploaded Screen 3 "My Wallet" design */}
      <section className="rounded-2xl border border-white/10 bg-[#16161D] text-white p-4 shadow-lg text-center space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
          Total Appointment Value
        </p>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {formatPkr(totalSpent)}
        </p>
        <div className="pt-1">
          <Link
            href="/explore"
            className="inline-flex items-center justify-center rounded-xl bg-[#24242D] border border-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-[#2C2C36] transition-all shadow-sm"
          >
            + Book New Appointment
          </Link>
        </div>
      </section>

      {/* WhatsApp Phone Lookup Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#16161D] p-3.5 sm:p-4 shadow-lg space-y-2">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-0.5">
            Look up by WhatsApp Number
          </label>
          <p className="text-[10px] text-white/50">
            Enter your active Pakistani WhatsApp number (e.g. 0300-1234567).
          </p>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (!isValidPakistaniPhone(phone)) {
              setError("Please enter a valid Pakistani number (e.g. 0300-1234567).");
              return;
            }
            load(phone);
          }}
        >
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 flex-1 rounded-2xl border border-white/10 bg-[#1C1C24] px-4 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
            placeholder="03XX-XXXXXXX"
          />
          <button
            disabled={loading}
            className="h-11 rounded-2xl bg-white px-5 text-xs font-bold text-black shadow-md hover:bg-white/90 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? "…" : "Find"}
          </button>
        </form>
        {error && <p className="text-xs font-semibold text-rose-400">{error}</p>}
      </div>

      {/* Appointments List matching uploaded Screen 3 "Transactions" list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Transactions</h2>
          <span className="text-xs text-white/50 font-medium">
            {rows.length} record{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="space-y-2.5">
          {rows.map((r) => {
            const message = buildBookingMessage({
              salonName: r.salon.name,
              customerName: r.customerName,
              phone: r.customerPhone,
              area: r.salon.quettaArea,
              services: r.services.map((s) => s.service.name),
              total: r.totalPricePkr,
              date: r.appointmentDate,
              time: formatTime12(r.appointmentTime),
            });

            const salonImg =
              r.salon.imageUrl ||
              "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80";

            return (
              <article
                key={r.id}
                className="rounded-3xl border border-white/10 bg-[#16161D] text-white p-4 shadow-xl transition-all hover:border-white/20 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden border border-white/20">
                      <Image src={salonImg} alt={r.salon.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white leading-tight">
                        <Link href={`/salons/${r.salon.slug}`} className="hover:text-gold transition-colors">
                          {r.salon.name}
                        </Link>
                      </h3>
                      <p className="text-[11px] text-white/60 truncate max-w-[180px]">
                        {r.services.map((s) => s.service.name).join(", ")}
                      </p>
                      <p className="text-[10px] text-gold/80 font-medium">{r.salon.quettaArea}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-display font-bold text-sm text-white">
                      {formatPkr(r.totalPricePkr)}
                    </p>
                    <p className="text-[10px] text-white/50">{r.appointmentDate}</p>
                    <div className="mt-1 flex justify-end">{statusBadge(r.status)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-xs">
                  <span className="text-[11px] text-white/60 font-medium">
                    Time: {formatTime12(r.appointmentTime)}
                  </span>
                  <a
                    href={whatsappChatUrl(r.salon.whatsappNumber, message)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md hover:bg-[#1eb957] transition-colors"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {r.status === "COMPLETED" && !r.review && (
                  <ReviewBox appointmentId={r.id} phone={phone} onDone={() => load(phone)} />
                )}
                {r.review && (
                  <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-2.5 text-[11px] text-emerald-300 font-medium">
                    ✓ Your review was submitted for this appointment.
                  </div>
                )}
              </article>
            );
          })}

          {searched && !rows.length && (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#16161D] p-8 text-center text-white">
              <p className="font-display text-base font-bold">No bookings found</p>
              <p className="mt-1 text-xs text-white/60">
                No appointments found for number {phone}.
              </p>
              <Link
                href="/explore"
                className="mt-4 inline-block rounded-2xl bg-white px-5 py-2 text-xs font-bold text-black shadow-md hover:bg-white/90 transition-colors"
              >
                Browse Quetta Salons
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ReviewBox({
  appointmentId,
  phone,
  onDone,
}: {
  appointmentId: string;
  phone: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [platformFeedback, setPlatformFeedback] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggle(list: string[], set: (v: string[]) => void, tag: string) {
    set(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  }

  return (
    <form
      className="space-y-3 rounded-2xl bg-[#1C1C24] border border-white/10 p-3.5 text-white"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId,
            customerPhone: phone,
            rating,
            comment,
            likedTags: liked,
            dislikedTags: disliked,
            platformFeedback,
          }),
        });
        const data = await res.json();
        setSubmitting(false);
        if (!res.ok) return setMsg(data.error || "Could not save review");
        onDone();
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">Rate Experience</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              className={`h-6 w-6 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                n <= rating ? "bg-gold text-black" : "bg-white/10 text-white/50"
              }`}
            >
              {n}★
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {LIKE_TAGS.map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => toggle(liked, setLiked, t)}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
              liked.includes(t) ? "bg-emerald-600 text-white font-bold" : "bg-white/10 text-white/70"
            }`}
          >
            {t}
          </button>
        ))}
        {DISLIKE_TAGS.map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => toggle(disliked, setDisliked, t)}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
              disliked.includes(t) ? "bg-rose-600 text-white font-bold" : "bg-white/10 text-white/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <textarea
        className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
        rows={2}
        placeholder="Write a brief review…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <input
        className="h-9 w-full rounded-xl bg-white/5 border border-white/10 px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white"
        placeholder="Platform suggestions (optional)"
        value={platformFeedback}
        onChange={(e) => setPlatformFeedback(e.target.value)}
      />

      {msg && <p className="text-xs text-rose-400 font-semibold">{msg}</p>}

      <button
        disabled={submitting}
        className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black shadow-md hover:bg-white/90 transition-colors cursor-pointer"
      >
        {submitting ? "Saving…" : "Submit Review"}
      </button>
    </form>
  );
}
