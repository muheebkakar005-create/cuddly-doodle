"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";

/**
 * Shop Owner Protected Route Example
 * Demonstrates role-based access control using <ProtectedRoute allowedRoles={["owner", "admin"]}>
 */
export default function ShopOwnerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Seamlessly routes to the owner dashboard view
    router.replace("/owner");
  }, [router]);

  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-2 border-white/10 border-t-gold animate-spin" />
          <div className="absolute grid h-6 w-6 place-items-center rounded-full bg-white text-black text-[10px] font-black">
            ✂️
          </div>
        </div>
        <p className="mt-4 text-xs font-bold text-white">Opening Shop Owner Dashboard…</p>
        <p className="text-[10px] text-white/50 mt-1">Quetta Salon Connect · Vendor Portal</p>
      </div>
    </ProtectedRoute>
  );
}
