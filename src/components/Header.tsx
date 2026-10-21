"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AREAS, CATEGORIES } from "@/lib/constants";
import { Logo } from "./Logo";
import { CalendarIcon, MapPinIcon, SearchIcon, ShieldLockIcon } from "./Icons";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { user: currentUser, logout } = useAuth();
  const [q, setQ] = useState(params.get("q") || "");
  const [area, setArea] = useState(params.get("area") || "");
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrTab, setQrTab] = useState<"local" | "prod">("local");
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
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
            onClick={() => setQrModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#16161D] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
            title="Scan QR Code to open on mobile phone"
          >
            <span>📷 App QR</span>
          </button>

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

      {/* 2. Mobile Top Bar - Spacious, clean & uncrowded */}
      <div className="flex items-center justify-between px-3.5 py-2.5 md:hidden">
        {/* Left: Mobile Logo & Location Selector */}
        <div className="flex items-center gap-2 min-w-0">
          <Logo mobileOnly />

          <div className="relative flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 px-2.5 py-1 min-w-0 transition-colors">
            <MapPinIcon className="h-3 w-3 text-gold shrink-0" />
            <span className="text-[11px] font-bold text-white truncate max-w-[105px]">
              {area || "All Quetta"}
            </span>
            <span className="text-[8px] text-white/50 shrink-0">▼</span>
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
        </div>

        {/* Right: Quick Actions & Clean User Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* QR Code Modal Trigger */}
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181820] border border-white/10 text-white hover:bg-white/20 active:scale-95 transition-all shadow-sm cursor-pointer"
            title="Scan QR Code to Open on Phone"
          >
            <span className="text-xs">📷</span>
          </button>

          {/* Search Button */}
          <Link
            href="/explore"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181820] border border-white/10 text-white hover:bg-white/20 active:scale-95 transition-all shadow-sm"
            title="Search Salons"
          >
            <SearchIcon className="h-3.5 w-3.5" />
          </Link>

          {/* User Profile / Admin Menu */}
          {currentUser ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex h-8 items-center gap-1 rounded-full bg-white text-black px-2.5 text-[11px] font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <span>{currentUser.role === "admin" ? "Admin" : "Portal"}</span>
                <span className="text-[8px] opacity-60">▼</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-white/15 bg-[#16161D] p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">
                      Signed in as
                    </p>
                    <p className="text-xs font-bold text-white truncate">
                      {currentUser.role === "admin" ? "Super Admin" : "Shop Owner"}
                    </p>
                    <p className="text-[10px] text-white/60 truncate">{currentUser.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href={currentUser.role === "admin" ? "/super-admin/dashboard" : "/shop-owner/dashboard"}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                    >
                      <span>📊</span>
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/bookings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                    >
                      <span>📅</span>
                      <span>Appointments</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        window.dispatchEvent(new Event("trigger-pwa-install"));
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span>📱</span>
                      <span>Install PWA App</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex h-8 items-center px-3 rounded-full bg-white text-black text-[11px] font-bold shadow-sm active:scale-95 transition-all"
            >
              <span>Sign In</span>
            </Link>
          )}
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

      {/* 4. App QR Code Modal for Mobile Phone Scanning */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-[#16161D] p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-black font-bold text-lg shadow-md">
                  📷
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Scan App QR Code</h3>
                  <p className="text-[10px] text-gold font-medium">Open instantly on your mobile phone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Toggle Tabs: Local Wi-Fi vs Online Production */}
            <div className="flex rounded-xl bg-black/50 p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setQrTab("local")}
                className={`flex-1 rounded-lg py-1.5 font-semibold transition-all ${
                  qrTab === "local" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                📶 Local Wi-Fi
              </button>
              <button
                type="button"
                onClick={() => setQrTab("prod")}
                className={`flex-1 rounded-lg py-1.5 font-semibold transition-all ${
                  qrTab === "prod" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                🌐 Online (Vercel)
              </button>
            </div>

            {/* QR Image Preview */}
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
              <div className="relative h-56 w-56">
                <Image
                  src={qrTab === "local" ? "/qr-app-local.png" : "/qr-app-prod.png"}
                  alt="Q_Salons App QR Code"
                  fill
                  className="rounded-lg object-contain"
                  priority
                />
              </div>
              <p className="mt-2 text-[11px] font-bold text-black text-center break-all select-all">
                {qrTab === "local" ? "http://192.168.69.151:3000" : "https://qsalons.vercel.app"}
              </p>
            </div>

            <p className="text-center text-xs text-white/70">
              Point your phone&apos;s camera at the QR code to open and install the app on your mobile screen!
            </p>

            <button
              type="button"
              onClick={() => {
                const url = qrTab === "local" ? "http://192.168.69.151:3000" : "https://qsalons.vercel.app";
                navigator.clipboard?.writeText(url);
                alert("URL copied to clipboard: " + url);
              }}
              className="w-full rounded-2xl border border-white/15 bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              📋 Copy Link
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
