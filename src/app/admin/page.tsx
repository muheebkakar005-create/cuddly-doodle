import { prisma } from "@/lib/prisma";
import { karachiDateISO } from "@/lib/hours";
import { formatPkr, formatTime12 } from "@/lib/format";
import Link from "next/link";
import {
  CalendarIcon,
  CheckCircleIcon,
  WhatsAppIcon,
  BellIcon,
} from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const today = karachiDateISO();
  const [
    totalSalons,
    liveSalons,
    pendingSalons,
    bookingsToday,
    appointments,
    recentBookings,
    pendingList,
  ] = await Promise.all([
    prisma.salon.count(),
    prisma.salon.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.salon.count({ where: { approvalStatus: "PENDING" } }),
    prisma.appointment.count({
      where: { appointmentDate: today, status: { not: "CANCELLED" } },
    }),
    prisma.appointment.findMany({ include: { salon: true } }),
    prisma.appointment.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { salon: true, services: { include: { service: true } } },
    }),
    prisma.salon.findMany({
      where: { approvalStatus: "PENDING" },
      take: 2,
      orderBy: { createdAt: "desc" },
      include: { owner: true },
    }),
  ]);

  const totalVolumePkr = appointments
    .filter((x) => x.status !== "CANCELLED")
    .reduce((sum, a) => sum + a.totalPricePkr, 0);

  const healthPercent = totalSalons > 0 ? Math.round((liveSalons / totalSalons) * 100) : 100;
  const circumference = 2 * Math.PI * 30;
  const strokeDashoffset = circumference - (healthPercent / 100) * circumference;

  const completedToday = appointments.filter(
    (a) => a.appointmentDate === today && a.status === "COMPLETED"
  ).length;

  return (
    <div className="space-y-3 pb-24 md:pb-6 text-white max-w-5xl mx-auto px-1">

      {/* ═══════ ROW 1 — HEADER (Avatar + Welcome + action icons) ═══════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center border-2 border-white/15 shadow-lg">
              <span className="font-bold text-[11px] text-white tracking-wide">MK</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-[2.5px] border-[#0c0c0e]" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] text-zinc-500 font-medium">Welcome back,</p>
            <p className="text-[15px] font-bold text-white tracking-tight">Muheeb Kakar</p>
          </div>
        </div>

        {/* Small action icons */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/admin/approvals"
            className="relative h-8 w-8 rounded-full bg-[#1A1C24] border border-white/8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <BellIcon className="h-3.5 w-3.5" />
            {pendingSalons > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 flex items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-black ring-[2px] ring-[#0c0c0e]">
                {pendingSalons}
              </span>
            )}
          </Link>
          <Link
            href="/admin/appointments"
            className="h-8 w-8 rounded-full bg-[#1A1C24] border border-white/8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            title="Calendar & Appointments"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
          </Link>
          <a
            href="/api/auth/logout?redirect=/"
            title="Sign Out"
            className="h-8 w-8 rounded-full bg-[#1A1C24] border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors text-[11px]"
          >
            🚪
          </a>
        </div>
      </div>

      {/* ═══════ ROW 2 — GOLDEN HERO CARD (Daily Score + Donut) ═══════ */}
      <div className="relative overflow-hidden rounded-[1.25rem] bg-[#F5B82E] p-4 shadow-lg">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-[22px] font-black text-black leading-tight tracking-tight">Daily Score</h2>
            <p className="text-[11px] font-semibold text-black/70">
              {liveSalons}/{totalSalons} salons active
            </p>
          </div>

          {/* Donut gauge — matching reference size */}
          <div className="relative h-[60px] w-[60px] shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="8" />
              <circle
                cx="36" cy="36" r="30" fill="none" stroke="#1A1C24" strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[13px] font-black text-black">{healthPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ ROW 3 — EMOJI PILL ROW (like "Choose your mood") ═══════ */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-zinc-500 px-0.5">Platform shortcuts</p>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { href: "/admin/approvals", icon: "🛡️", badge: pendingSalons > 0 },
            { href: "/admin/salons", icon: "✂️" },
            { href: "/admin/appointments", icon: "📅" },
            { href: "/admin/salons/new", icon: "➕" },
            { href: "/", icon: "🌐" },
          ].map((p, i) => (
            <Link key={i} href={p.href} className="shrink-0 group">
              <div className="relative h-11 w-11 rounded-full bg-[#1A1C24] border border-white/8 flex items-center justify-center text-[15px] group-hover:border-amber-400/40 transition-all shadow-sm">
                {p.icon}
                {p.badge && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse ring-2 ring-[#0c0c0e]" />}
              </div>
            </Link>
          ))}
          {/* Glowing sun — matches the orange circle in reference */}
          <div className="shrink-0">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/25 text-[15px]">☀️</div>
          </div>
        </div>
      </div>

      {/* ═══════ ROW 4 — 2×2 BENTO STAT CARDS (matching reference exactly) ═══════ */}
      {/* Reference: each card has a small colored circle icon badge, a large bold value,
          a label, and a tiny "Good start" subtitle. Cards are tight & compact. */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">

        {/* Card: Today's Bookings */}
        <Link href="/admin/appointments" className="relative rounded-2xl bg-[#1A1C24] border border-white/5 p-3.5 hover:border-white/10 transition-all group">
          {/* Circle badge — top right (like reference Zz sleep icon) */}
          <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
            <span className="text-[13px]">📅</span>
          </div>
          <div className="pt-1">
            <p className="text-[28px] font-extrabold text-white leading-none tracking-tight">{bookingsToday}</p>
            <p className="text-[11px] font-bold text-white/90 mt-1">Bookings</p>
            <p className="text-[9px] text-zinc-500 mt-0.5">{completedToday > 0 ? `${completedToday} completed` : "Good start, keep going"}</p>
          </div>
        </Link>

        {/* Card: Pending Approvals — like "Sunlight / 3h" card */}
        <Link href="/admin/approvals" className="relative rounded-2xl bg-[#1A1C24] border border-white/5 p-3.5 hover:border-white/10 transition-all group">
          <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <span className="text-[13px]">🛡️</span>
          </div>
          <div className="pt-1">
            <p className="text-[28px] font-extrabold text-white leading-none tracking-tight">{pendingSalons}</p>
            <p className="text-[11px] font-bold text-white/90 mt-1">Pending</p>
            <p className="text-[9px] text-zinc-500 mt-0.5">{pendingSalons > 0 ? "Action required" : "All clear ✓"}</p>
          </div>
        </Link>

        {/* Card: Live Salons — like "Fasting / 1h 23m" card */}
        <Link href="/admin/salons" className="relative rounded-2xl bg-[#1A1C24] border border-white/5 p-3.5 hover:border-white/10 transition-all group">
          <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-[13px]">✂️</span>
          </div>
          <div className="pt-1">
            <p className="text-[28px] font-extrabold text-white leading-none tracking-tight">{liveSalons}</p>
            <p className="text-[11px] font-bold text-white/90 mt-1">Salons</p>
            <p className="text-[9px] text-zinc-500 mt-0.5">{totalSalons} total on platform</p>
          </div>
        </Link>

        {/* Card: Revenue — like "Supplements / 15 pcs" card */}
        <Link href="/admin/appointments" className="relative rounded-2xl bg-[#1A1C24] border border-white/5 p-3.5 hover:border-white/10 transition-all group">
          <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
            <span className="text-[13px]">💰</span>
          </div>
          <div className="pt-1">
            <p className="text-[22px] font-extrabold text-white leading-none tracking-tight truncate">{formatPkr(totalVolumePkr)}</p>
            <p className="text-[11px] font-bold text-white/90 mt-1">Revenue</p>
            <p className="text-[9px] text-zinc-500 mt-0.5">{appointments.length} total bookings</p>
          </div>
        </Link>

      </div>

      {/* ═══════ ROW 5 — PENDING APPROVAL QUICK ACTION (if any) ═══════ */}
      {pendingList.length > 0 && (
        <div className="rounded-2xl bg-[#1A1C24] border border-amber-500/25 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">New Registration</span>
            </div>
            <Link href="/admin/approvals" className="text-[10px] font-bold text-amber-400">View All →</Link>
          </div>

          {pendingList.map((shop) => (
            <div key={shop.id} className="flex items-center justify-between gap-2 rounded-xl bg-black/30 border border-white/5 px-3 py-2">
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-white truncate">{shop.name}</p>
                <p className="text-[9px] text-zinc-400 truncate">📍 {shop.quettaArea}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/admin/approvals#salon-${shop.id}`}
                  className="rounded-lg bg-amber-400 text-black px-2.5 py-1.5 text-[10px] font-black flex items-center gap-1"
                >
                  <CheckCircleIcon className="h-3 w-3" /> Review
                </Link>
                {shop.whatsappNumber && (
                  <a
                    href={`https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${shop.owner?.name || shop.name}, this is Super Admin from Quetta Salon Connect.`)}`}
                    target="_blank" rel="noreferrer"
                    className="h-7 w-7 rounded-lg bg-[#25D366]/20 border border-[#25D366]/25 flex items-center justify-center"
                  >
                    <WhatsAppIcon className="h-3 w-3 text-[#25D366]" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════ ROW 6 — RECENT BOOKINGS (compact list) ═══════ */}
      <div className="rounded-2xl bg-[#1A1C24] border border-white/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-white">Recent Bookings</p>
          <Link href="/admin/appointments" className="text-[10px] font-bold text-amber-400">All →</Link>
        </div>

        <div className="divide-y divide-white/5">
          {recentBookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2 py-2 first:pt-0">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{b.customerName}</p>
                <p className="text-[9px] text-zinc-500 truncate">{b.salon.name} · {formatTime12(b.appointmentTime)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-bold text-amber-400">{formatPkr(b.totalPricePkr)}</p>
                <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-white/8 text-zinc-300">{b.status}</span>
              </div>
            </div>
          ))}
          {!recentBookings.length && (
            <p className="py-3 text-center text-[10px] text-zinc-500">No bookings yet</p>
          )}
        </div>
      </div>

    </div>
  );
}
