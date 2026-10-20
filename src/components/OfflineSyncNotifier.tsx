"use client";

import { useEffect, useState } from "react";
import { getPendingOfflineBookings, syncPendingOfflineBookings } from "@/lib/offlineSync";

export function OfflineSyncNotifier() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncedNotice, setSyncedNotice] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    setPendingCount(getPendingOfflineBookings().length);

    async function handleOnline() {
      setIsOnline(true);
      const synced = await syncPendingOfflineBookings((item) => {
        setSyncedNotice(`✓ Internet restored! Offline booking for ${item.customerName} synced directly to the salon dashboard.`);
        setTimeout(() => setSyncedNotice(""), 6000);
      });
      if (synced > 0) {
        setPendingCount(getPendingOfflineBookings().length);
      }
    }

    function handleOffline() {
      setIsOnline(false);
      setPendingCount(getPendingOfflineBookings().length);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check in case internet came back
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (syncedNotice) {
    return (
      <div className="fixed top-2 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-[#16161D]/95 px-4 py-2.5 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md">
          <span>●</span>
          <span>{syncedNotice}</span>
        </div>
      </div>
    );
  }

  if (!isOnline && pendingCount > 0) {
    return (
      <div className="fixed top-2 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-amber-500/40 bg-[#16161D]/95 px-4 py-2 text-xs font-semibold text-amber-300 shadow-2xl backdrop-blur-md">
          <span>📶 Offline Mode:</span>
          <span>{pendingCount} booking pending sync. Will auto-sync when internet reconnects.</span>
        </div>
      </div>
    );
  }

  return null;
}
