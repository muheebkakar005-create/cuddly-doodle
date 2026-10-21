"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AREAS, CATEGORIES } from "@/lib/constants";
import { Logo } from "./Logo";
import { BellIcon, CalendarIcon, MapPinIcon, SearchIcon, ShieldLockIcon } from "./Icons";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { user: currentUser, logout } = useAuth();
  const [q, setQ] = useState(params.get("q") || "");
  const [area, setArea] = useState(params.get("area") || "");
  const [open, setOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const category = params.get("category") || "ALL";

  useEffect(() => {
    setQ(params.get("q") || "");
    setArea(params.get("area") || "");
  }, [params]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    const areaHits = AREAS.filter((a) => a.toLowerCase().includes(needle)).map((a) => ({
      type: "Neighborhood",
      label: a,
      href: `/explore?area=${encodeURIComponent(a)}`,
    }));
    const serviceHits = [
      "Executive Haircut",
      "Beard Trim & Hot Towel",
      "Charcoal Facial",
      "Hair Color / Dye",
      "Groom Package",
      "Party Makeup",
      "Signature Bridal Makeup",
      "HydraFacial",
      "Hair Cut & Blowdry",
      "Keratin / Rebonding",
      "Manicure & Pedicure",
      "Mehndi / Henna",
    ]
      .filter((s) => s.toLowerCase().includes(needle))
      .map((s) => ({ type: "Service", label: s, href: `/explore?q=${encodeURIComponent(s)}` }));
    return [...areaHits, ...serviceHits].slice(0, 6);
  }, [q]);

  function goExplore(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const merged = {
      q: next.q !== undefined ? next.q : q,
      area: next.area !== undefined ? next.area : area,
      category: next.category !== undefined ? next.category : category,
    };
    if (merged.q) sp.set("q", merged.q);
    if (merged.area) sp.set("area", merged.area);
    if (merged.category && merged.category !== "ALL") sp.set("category", merged.category);
    router.push(`/explore?${sp.toString()}`);
    setOpen(false);
  }

  // Hide on admin, owner, and salon booking detail pages for a dedicated clean experience
  if (pathname.startsWith("/admin") || pathname.startsWith("/owner") || pathname.startsWith("/salons")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0C0C0E]/95 backdrop-blur-xl">
      {/* 1. Desktop & Tablet Header - Rich PC Navigation Menu */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between gap-4 px-4 py-3 md:flex">
        <Logo />

        {/* Desktop Nav Links */}
        <nav className="flex items-center gap-1.5 text-xs font-semibold">
          <Link
            href="/explore"
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all ${
              pathname === "/explore"
                ? "bg-white text-black font-bold shadow-sm"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>✂️ Explore All Salons</span>
          </Link>

          {/* Quick Category Filters on Desktop */}
          {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => {
            const active = category === c.id;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => goExplore({ category: active ? undefined : c.id })}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-gold text-black font-bold shadow-sm"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {c.short}
              </button>
            );
          })}
        </nav>

        {/* Area Filter & Search Bar */}
        <div className="flex flex-1 max-w-md items-center gap-2">
          <select
            value={area}
            onChange={(e) => {
              const val = e.target.value;
              setArea(val);
              goExplore({ area: val || undefined });
            }}
            className="h-9 rounded-2xl border border-white/10 bg-[#16161D] px-3 text-[11px] font-medium text-white outline-none focus:ring-1 focus:ring-gold/50 cursor-pointer"
            aria-label="Filter Quetta Area"
          >
            <option value="" className="bg-[#16161D] text-white">All Quetta</option>
            {AREAS.map((a) => (
              <option key={a} value={a} className="bg-[#16161D] text-white">
                {a}
              </option>
            ))}
          </select>

          <div ref={searchContainerRef} className="relative flex-1">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goExplore({ q });
                }}
                placeholder="Search salons, cuts, facial…"
                className="h-9 w-full rounded-2xl border border-white/10 bg-[#16161D] pl-9 pr-3 text-[11px] font-medium text-white placeholder:text-white/40 outline-none ring-gold/40 focus:ring-1"
              />
              <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40 pointer-events-none" />
            </div>

            {open && suggestions.length > 0 && (
              <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#16161D] shadow-2xl animate-in fade-in slide-in-from-top-1">
                {suggestions.map((s) => (
                  <li key={s.href + s.label}>
                    <Link
                      href={s.href}
                      className="flex items-center justify-between px-3.5 py-2 text-xs text-white hover:bg-white/10 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <span className="font-medium">{s.label}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gold bg-gold/15 px-2 py-0.5 rounded-full border border-gold/30">
                        {s.type}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Action Links */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("trigger-pwa-install"))}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
            title="Install Quetta Salon Connect App"
          >
            <span>📱 Install App</span>
          </button>

          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#16161D] px-3.5 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-gold" />
            <span>My Bookings</span>
          </Link>

          {currentUser?.role === "admin" ? (
            <>
              <Link
                href="/super-admin/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-black hover:bg-white/90 shadow-sm transition-colors"
              >
                <ShieldLockIcon className="h-3.5 w-3.5 text-black" />
                <span>Admin Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <span>Logout</span>
              </button>
            </>
          ) : currentUser?.role === "owner" ? (
            <>
              <Link
                href="/shop-owner/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-bold text-gold hover:bg-gold/20 transition-colors"
              >
                <span>Shop Portal</span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black hover:bg-white/90 shadow-sm transition-colors"
            >
              <ShieldLockIcon className="h-3.5 w-3.5 text-black" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Mobile Top Bar - Clean compact header */}
      <div className="flex items-center justify-between px-3 py-2 md:hidden">
        {/* Left: Mobile Logo & Location Pin / Area Selector */}
        <div className="flex items-center gap-2 min-w-0">
          <Logo mobileOnly />
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
              <MapPinIcon className="h-3.5 w-3.5 text-gold" />
            </div>
            <div className="min-w-0">
              <div className="relative flex items-center gap-1">
                <span className="text-[11px] font-bold text-white leading-tight truncate">
                  {area || "All Quetta"}
                </span>
                <span className="text-[8px] text-white/50">▼</span>
                <select
                  value={area}
                  onChange={(e) => {
                    const val = e.target.value;
                    setArea(val);
                    goExplore({ area: val || undefined });
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Change Quetta Area"
                >
                  <option value="" className="bg-[#16161D] text-white">All Quetta</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a} className="bg-[#16161D] text-white">
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[8px] text-white/50 uppercase tracking-wider font-semibold truncate">
                Balochistan • PKR
              </p>
            </div>
          </div>
        </div>

        {/* Right: Search, Notifications & Auth shortcuts */}
        <div className="flex items-center gap-1.5">
          {currentUser?.role === "admin" ? (
            <Link
              href="/super-admin/dashboard"
              className="flex h-8 items-center px-2.5 rounded-full bg-white text-black text-[10px] font-bold shadow-sm"
              title="Super Admin Dashboard"
            >
              <span>Admin</span>
            </Link>
          ) : currentUser?.role === "owner" ? (
            <Link
              href="/shop-owner/dashboard"
              className="flex h-8 items-center px-2.5 rounded-full bg-gold/20 border border-gold/30 text-gold text-[10px] font-bold shadow-sm"
              title="Shop Owner Dashboard"
            >
              <span>Portal</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex h-8 items-center px-2.5 rounded-full bg-white text-black text-[10px] font-bold shadow-sm"
              title="Sign In"
            >
              <span>Sign In</span>
            </Link>
          )}

          {currentUser && (
            <button
              type="button"
              onClick={() => logout()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs cursor-pointer"
              title="Sign Out"
            >
              🚪
            </button>
          )}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("trigger-pwa-install"))}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181820] border border-white/10 text-white hover:bg-white/20 transition-all shadow-sm cursor-pointer"
            title="Install App on Phone"
          >
            <span className="text-xs">📱</span>
          </button>
          <Link
            href="/explore"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181820] border border-white/10 text-white hover:bg-white/20 transition-all shadow-sm"
            title="Search Salons"
          >
            <SearchIcon className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/bookings"
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#181820] border border-white/10 text-white hover:bg-white/20 transition-all shadow-sm"
            title="My Appointments"
          >
            <BellIcon className="h-3.5 w-3.5" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-[#0C0C0E]" />
          </Link>
        </div>
      </div>

      {/* 3. Category Filter Pills - ONLY on /explore */}
      {pathname === "/explore" && (
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-2.5 no-scrollbar md:hidden">
          {CATEGORIES.map((c) => {
            const active = category === c.id || (c.id === "ALL" && !params.get("category"));
            return (
              <button
                key={c.id}
                onClick={() => goExplore({ category: c.id })}
                className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  active
                    ? "bg-white text-black shadow-md"
                    : "bg-[#181820] text-white/70 border border-white/10 hover:bg-white/10"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
