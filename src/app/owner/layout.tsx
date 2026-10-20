"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, HomeIcon, ScissorsIcon } from "@/components/Icons";

const links = [
  { href: "/owner", label: "Dashboard", icon: HomeIcon },
  { href: "/owner/profile", label: "Shop Profile & Hours", icon: ScissorsIcon },
  { href: "/owner/bookings", label: "Bookings", icon: CalendarIcon },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/owner/login" || pathname === "/owner/register") return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="text-white space-y-4">
      {/* 1. Mobile-Optimized Dashboard Header & Horizontal Nav Tabs */}
      <div className="lg:hidden rounded-2xl border border-white/10 bg-[#16161D] p-3 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-black font-bold text-xs shadow-sm">
              ✂️
            </span>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Shop Owner Portal</p>
              <p className="text-[9px] text-gold font-medium">Quetta Salon Connect</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-white/10 bg-[#1C1C24] px-2.5 py-1 text-[10px] font-medium text-white/70 hover:text-white"
            >
              Marketplace
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-500/30 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Horizontal Mobile Tabs */}
        <nav className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-white/5">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  active
                    ? "bg-white text-black shadow-sm"
                    : "bg-[#1C1C24] text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-black" : "text-white/60"}`} />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 2. Desktop Grid Layout with Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block h-fit rounded-2xl bg-[#16161D] border border-white/10 p-4 shadow-xl">
          <div className="border-b border-white/10 pb-3 mb-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Shop Owner Portal</p>
            <p className="text-[10px] text-gold font-medium mt-0.5">Quetta Salon Connect</p>
          </div>

          <nav className="space-y-1 text-xs">
            {links.map((l) => {
              const Icon = l.icon;
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 font-semibold transition-all ${
                    active
                      ? "bg-white text-black shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-black" : "text-white/60"}`} />
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 border-t border-white/10 pt-3 space-y-2">
            <Link
              href="/"
              className="block text-center rounded-xl border border-white/10 py-2 text-[11px] font-medium text-white/70 hover:bg-white/10 transition-colors"
            >
              ← View Marketplace
            </Link>
            <button
              className="w-full rounded-xl bg-rose-500/20 border border-rose-500/30 py-2 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
