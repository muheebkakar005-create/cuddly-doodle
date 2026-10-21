"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ShieldLockIcon } from "@/components/Icons";

function LoginFormInner() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Login failed. Please verify your credentials.");
      return;
    }

    // Role-based automatic redirect:
    // Super Admin -> /super-admin/dashboard (or /admin)
    // Shop Owner  -> /shop-owner/dashboard (or /owner or return url)
    if (res.role === "admin") {
      window.location.href = from && from.startsWith("/admin") ? from : "/super-admin/dashboard";
    } else {
      window.location.href = from || "/shop-owner/dashboard";
    }
  }

  function fillSuperAdmin() {
    setEmail("muheebkakar005@gmail.com");
    setPassword("");
    setError("");
  }

  function fillShopOwner() {
    setEmail("owner@thehairlab.pk");
    setPassword("");
    setError("");
  }

  return (
    <div className="mx-auto max-w-md py-6 sm:py-12 px-2">
      <div className="rounded-3xl border border-white/10 bg-[#16161D] p-6 sm:p-8 text-white shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center pb-5 border-b border-white/10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
            <ShieldLockIcon className="h-6 w-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Quetta Salon Connect</h1>
          <p className="text-xs text-gold font-medium mt-1">
            Single Unified Portal Login
          </p>
          <p className="text-[11px] text-white/50 mt-0.5">
            Automatic role detection for Super Admin &amp; Shop Owners
          </p>
        </div>

        {/* Single Unified Form - No tabs, no role toggle! */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@salons.pk"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70">
                Password
              </label>
              <span className="text-[10px] text-white/40 font-mono">Persistent Session</span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-3 text-xs font-semibold text-rose-300 animate-in fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-white font-bold text-black text-xs shadow-md hover:bg-white/90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In to Dashboard"}
          </button>
        </form>

        {/* 1-Click Fast Autofill Testing Buttons */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-center text-white/40">
            Quick 1-Click Demo Login:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillSuperAdmin}
              className="rounded-xl border border-white/10 bg-[#1C1C24] px-2.5 py-2 text-[11px] font-semibold text-white/90 hover:bg-white/10 hover:border-gold/40 transition-all text-left cursor-pointer"
            >
              <span className="block font-bold text-gold text-[10px]">👑 Super Admin</span>
              <span className="text-[9px] text-white/50 truncate block">muheebkakar005</span>
            </button>
            <button
              type="button"
              onClick={fillShopOwner}
              className="rounded-xl border border-white/10 bg-[#1C1C24] px-2.5 py-2 text-[11px] font-semibold text-white/90 hover:bg-white/10 hover:border-white/30 transition-all text-left cursor-pointer"
            >
              <span className="block font-bold text-white text-[10px]">💈 Shop Owner</span>
              <span className="text-[9px] text-white/50 truncate block">The Hair Lab</span>
            </button>
          </div>
        </div>

        {/* New Salon Registration link */}
        <div className="mt-5 text-center text-xs text-white/60">
          Want to list your salon?{" "}
          <Link href="/owner/register" className="font-bold text-gold hover:underline">
            Register your shop →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnifiedLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-gold animate-spin" />
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
