"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";

/**
 * Super Admin Protected Route Example
 * Demonstrates role-based access control using <ProtectedRoute allowedRoles={["admin"]}>
 */
export default function SuperAdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Seamlessly routes to the master admin dashboard view
    router.replace("/admin");
  }, [router]);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-2 border-white/10 border-t-gold animate-spin" />
          <div className="absolute grid h-6 w-6 place-items-center rounded-full bg-white text-black text-[10px] font-black">
            👑
          </div>
        </div>
        <p className="mt-4 text-xs font-bold text-white">Opening Super Admin Dashboard…</p>
        <p className="text-[10px] text-white/50 mt-1">Authenticated as Muheeb Kakar</p>
      </div>
    </ProtectedRoute>
  );
}
