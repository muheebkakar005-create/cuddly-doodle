import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { ScissorsIcon, WhatsAppIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function AdminSalonsPage() {
  const salons = await prisma.salon.findMany({
    include: { _count: { select: { services: true, appointments: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Salon Management</h1>
          <p className="text-xs text-white/50 mt-0.5">
            Super Admin access: Add, edit, or delete salons and their service menus in Quetta.
          </p>
        </div>
        <Link
          href="/admin/salons/new"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black shadow-md hover:bg-white/90 transition-all cursor-pointer"
        >
          <ScissorsIcon className="h-4 w-4 text-black" />
          <span>+ Add New Salon</span>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#16161D] shadow-lg">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="border-b border-white/10 bg-[#1C1C24] text-white/50 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Salon Name</th>
              <th className="px-4 py-3">Neighborhood</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Services</th>
              <th className="px-4 py-3">Appointments</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {salons.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span>{s.name}</span>
                    {s.featured && (
                      <span className="rounded-full bg-gold/20 text-gold border border-gold/30 px-2 py-0.5 text-[9px] font-bold">
                        Featured
                      </span>
                    )}
                  </div>
                  <span className="text-white/40 block text-[11px] font-normal mt-0.5">
                    {s.phone}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-white/80">
                    {s.quettaArea}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/60">
                  {CATEGORY_LABELS[s.category] || s.category}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      s.approvalStatus === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : s.approvalStatus === "PENDING"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {s.approvalStatus}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-white">
                  {s._count.services} services
                </td>
                <td className="px-4 py-3 font-semibold text-gold">
                  {s._count.appointments} bookings
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <a
                    href={whatsappChatUrl(s.whatsappNumber, `Salam ${s.name}!`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[#25D366] hover:opacity-80 align-middle"
                    title="WhatsApp Shop"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                  </a>
                  <Link
                    href={`/salons/${s.slug}`}
                    target="_blank"
                    className="inline-block text-xs font-semibold text-white/60 hover:text-white"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/salons/${s.id}`}
                    className="inline-block rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!salons.length && (
          <div className="py-12 text-center text-xs text-white/50">
            No salons listed yet. Click &quot;Add New Salon&quot; to create one.
          </div>
        )}
      </div>
    </div>
  );
}
