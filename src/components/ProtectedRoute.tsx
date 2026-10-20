"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ShieldLockIcon } from "./Icons";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "owner")[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, role, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // 1. If unauthenticated, redirect to login with return path
    if (!isAuthenticated) {
      const returnUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
      router.replace(returnUrl);
    }
  }, [isAuthenticated, loading, pathname, redirectTo, router]);

  // 2. Loading State: Sleek spinner to prevent flash of content or premature redirect
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-2 border-white/10 border-t-gold animate-spin" />
          <div className="absolute grid h-6 w-6 place-items-center rounded-full bg-white text-black text-[10px] font-black">
            Q
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold text-white/70">
          Verifying security credentials…
        </p>
        <p className="text-[10px] text-white/40 mt-1">
          Quetta Salon Connect · Secure Portal
        </p>
      </div>
    );
  }

  // 3. Not authenticated yet
  if (!isAuthenticated) {
    return null;
  }

  // 4. Role Authorization Check
  if (allowedRoles && allowedRoles.length > 0 && role) {
    if (!allowedRoles.includes(role)) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <ShieldLockIcon className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
            Your account ({user?.email}) is authorized as a{" "}
            <span className="text-gold font-bold uppercase">{role}</span>, which does not have permission to view this section.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <Link
              href={role === "admin" ? "/super-admin/dashboard" : "/shop-owner/dashboard"}
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/90 shadow-md transition-all"
            >
              Go to Your Dashboard →
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-[#16161D] px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all"
            >
              Marketplace
            </Link>
          </div>
        </div>
      );
    }
  }

  // 5. Authorized! Render children seamlessly
  return <>{children}</>;
}
