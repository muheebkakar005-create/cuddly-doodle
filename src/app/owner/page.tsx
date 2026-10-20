import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { karachiDateISO } from "@/lib/hours";
import { formatPkr, formatTime12 } from "@/lib/format";
import { OwnerLiveNotificationListener } from "@/components/OwnerLiveNotificationListener";

export const dynamic = "force-dynamic";

export default async function OwnerHome() {
  const session = await getSession();
  if (!session) redirect("/owner/login");
  if (session.role === "admin") redirect("/admin");
  if (!session.salonId) {
    return <p className="text-white/50 text-xs">No shop is linked to this account yet.</p>;
  }

  const today = karachiDateISO();
  const salon = await prisma.salon.findUnique({
    where: { id: session.salonId },
    include: {
      _count: { select: { appointments: true, services: true, reviews: true } },
      appointments: {
        where: { appointmentDate: today },
        include: { services: { include: { service: true } } },
        orderBy: { appointmentTime: "asc" },
      },
    },
  });
  if (!salon) redirect("/owner/login");

  const statusBadge =
    salon.approvalStatus === "APPROVED" ? (
      <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 text-xs font-bold">
        ● Live on Marketplace
      </span>
    ) : salon.approvalStatus === "PENDING" ? (
      <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 text-xs font-bold">
        ● Pending Super Admin Verification
      </span>
    ) : (
      <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 text-xs font-bold">
        ● Rejected: {salon.rejectionReason || "Contact Super Admin"}
      </span>
    );

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{salon.name}</h1>
          <p className="text-xs text-white/50 mt-0.5">{salon.address} • {salon.quettaArea}</p>
        </div>
        {statusBadge}
      </div>

      {/* Instant Real-Time Booking Alert & Listener */}
      <OwnerLiveNotificationListener salonId={salon.id} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Today’s Bookings" value={salon.appointments.length} />
        <Stat label="Profile Views" value={salon.viewCount} />
        <Stat label="Rating" value={`${salon.rating.toFixed(1)} ★`} />
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Link
          href="/owner/profile"
          className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black shadow-md hover:bg-white/90 transition-all"
        >
          Edit Shop & Hours
        </Link>
        <Link
          href="/owner/bookings"
          className="rounded-xl border border-white/10 bg-[#16161D] px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all"
        >
          All Appointments
        </Link>
        <Link
          href={`/salons/${salon.slug}`}
          target="_blank"
          className="rounded-xl border border-white/10 bg-[#16161D] px-4 py-2 text-xs font-semibold text-gold hover:bg-white/10 transition-all"
        >
          View Public Listing ↗
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#16161D] p-5 shadow-lg space-y-3">
        <h2 className="text-base font-bold text-white">Today’s Schedule (Quetta Time)</h2>
        <div className="divide-y divide-white/5">
          {salon.appointments.length === 0 && (
            <p className="py-4 text-xs text-white/40 text-center">No bookings scheduled for today.</p>
          )}
          {salon.appointments.map((a) => (
            <div key={a.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-white text-sm block">
                  {a.customerName} ({formatTime12(a.appointmentTime)})
                </span>
                <p className="text-gold/90 text-xs mt-0.5">
                  {a.services.map((s) => s.service.name).join(" + ")}
                </p>
                <p className="text-white/50 text-[11px] font-mono mt-0.5">{a.customerPhone}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-gold">{formatPkr(a.totalPricePkr)}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {a.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#16161D] p-4 shadow-md space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
