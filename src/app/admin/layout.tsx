"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, HomeIcon, ScissorsIcon, ShieldLockIcon } from "@/components/Icons";

const links = [
  { href: "/admin", label: "Dashboard", icon: HomeIcon },
  { href: "/admin/salons", label: "Salons", icon: ScissorsIcon },
  { href: "/admin/appointments", label: "Bookings", icon: CalendarIcon },
  { href: "/admin/approvals", label: "Approvals", icon: ShieldLockIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="text-white min-h-screen">
      {/* Desktop Grid Layout with Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block h-fit rounded-[2rem] bg-[#161820] border border-white/5 p-5 shadow-xl sticky top-20">
          <div className="border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#F5B82E] text-zinc-950 font-black text-sm shadow-md">
                Q
              </span>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Q-Salons</p>
                <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
                  Super Admin
                </p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-zinc-400 truncate">
              muheebkakar005@gmail.com
            </p>
          </div>

          <nav className="mt-4 space-y-1.5 text-xs">
            {links.map((l) => {
              const Icon = l.icon;
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 font-semibold transition-all ${
                    active
                      ? "bg-white text-zinc-950 shadow-md font-bold"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-zinc-950" : "text-zinc-400"}`} />
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-white/5 pt-4 space-y-2">
            <Link
              href="/"
              className="block text-center rounded-xl border border-white/10 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-white/10 transition-colors"
            >
              ← Customer View
            </Link>
            <button
              className="w-full rounded-xl bg-rose-500/10 border border-rose-500/20 py-2 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0">{children}</div>
      </div>

      {/* Floating Glassmorphic Bottom Dock for Mobile (Matching reference mockup pill dock) */}
      <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none lg:hidden">
        <nav className="pointer-events-auto flex items-center justify-around gap-2 rounded-full bg-[#12141A]/95 backdrop-blur-2xl border border-white/10 px-4 py-2 shadow-2xl shadow-black/90 max-w-sm w-full">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all ${
                  active
                    ? "text-[#F5B82E] font-bold scale-105"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-[#F5B82E]" : "text-zinc-400"}`} />
                <span className="text-[9px] tracking-tight">{l.label}</span>
                {active && (
                  <span className="h-1 w-4 rounded-full bg-[#F5B82E] mt-0.5" />
                )}
              </Link>
            );
          })}

          {/* Quick link back to Marketplace / User Portal */}
          <Link
            href="/"
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-zinc-400 hover:text-white transition-all"
            title="Customer View"
          >
            <span className="text-base leading-none">🌐</span>
            <span className="text-[9px] tracking-tight">Market</span>
          </Link>

          {/* Mobile Sign Out button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
            title="Sign Out"
          >
            <span className="text-base leading-none">🚪</span>
            <span className="text-[9px] tracking-tight text-rose-400 font-bold">Logout</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
