"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPkr } from "@/lib/format";

interface BookingNotification {
  appointmentId: string;
  salonId: string;
  customerName: string;
  customerPhone: string;
  services: string[];
  totalPricePkr: number;
  appointmentDate: string;
  appointmentTime: string;
  staffName?: string;
  createdAt: string;
}

function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // First tone (high harmonic)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Second tone (pleasant chord resolution)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.15); // E6
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.7);
  } catch {
    // AudioContext blocked or unsupported, fail gracefully
  }
}

export function OwnerLiveNotificationListener({ salonId }: { salonId: string }) {
  const [activeAlert, setActiveAlert] = useState<BookingNotification | null>(null);
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!salonId || typeof window === "undefined") return;

    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let lastSeenId = "";

    try {
      eventSource = new EventSource(`/api/owner/live-bookings?salonId=${salonId}`);

      eventSource.addEventListener("connected", () => {
        setIsConnected(true);
      });

      eventSource.addEventListener("new_booking", (e) => {
        try {
          const booking: BookingNotification = JSON.parse(e.data);
          handleNewBooking(booking);
        } catch (err) {
          console.error("Error parsing live booking event", err);
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      // Fallback polling if SSE is not available
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/appointments?salonId=${salonId}`);
          if (res.ok) {
            const data = await res.json();
            const latest = data.appointments?.[0];
            if (latest && latest.id !== lastSeenId) {
              if (lastSeenId !== "") {
                handleNewBooking({
                  appointmentId: latest.id,
                  salonId: latest.salonId,
                  customerName: latest.customerName,
                  customerPhone: latest.customerPhone,
                  services: latest.services.map((s: { service: { name: string } }) => s.service.name),
                  totalPricePkr: latest.totalPricePkr,
                  appointmentDate: latest.appointmentDate,
                  appointmentTime: latest.appointmentTime,
                  staffName: latest.staffName,
                  createdAt: latest.createdAt,
                });
              }
              lastSeenId = latest.id;
            }
          }
        } catch {
          // ignore
        }
      }, 5000);
    }

    function handleNewBooking(booking: BookingNotification) {
      playNotificationChime();
      setActiveAlert(booking);
      setNotifications((prev) => [booking, ...prev]);

      // Update tab title
      document.title = `🔔 (1) New Booking! | ${booking.customerName}`;
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [salonId]);

  return (
    <>
      {/* Real-time Connection Indicator */}
      <div className="flex items-center gap-2 text-[10px] text-white/50">
        <span
          className={`h-2 w-2 rounded-full ${
            isConnected ? "bg-emerald-400 animate-pulse" : "bg-white/30"
          }`}
        />
        <span>{isConnected ? "Live Instant Sync Connected (0s delay)" : "Connecting Live Feed…"}</span>
        {notifications.length > 0 && (
          <span className="rounded-full bg-gold/20 text-gold px-2 py-0.5 font-bold">
            {notifications.length} New Live Booking{notifications.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Prominent Live Notification Alert Banner at Top */}
      {activeAlert && (
        <div className="rounded-2xl border border-gold/50 bg-gradient-to-r from-[#1E190E] via-[#16161D] to-[#1C1C24] p-4 text-white shadow-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-black text-xl shadow-md font-bold">
                🔔
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gold/20 text-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Instant Live Notification
                  </span>
                  <span className="text-[10px] text-white/40">Just now</span>
                </div>
                <h3 className="mt-1 text-sm font-bold text-white">
                  You have a new booking from {activeAlert.customerName}!
                </h3>
                <p className="mt-0.5 text-xs text-white/70">
                  {activeAlert.services.join(" + ")} · {formatPkr(activeAlert.totalPricePkr)}
                </p>
                <p className="mt-1 text-[11px] text-gold font-medium">
                  📅 {activeAlert.appointmentDate} at {activeAlert.appointmentTime} · Specialist: {activeAlert.staffName || "Any"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/owner/bookings"
                className="rounded-xl bg-gold px-3.5 py-1.5 text-xs font-bold text-black shadow-md hover:bg-gold/90 transition-all cursor-pointer"
              >
                View in Bookings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setActiveAlert(null);
                  document.title = "Shop Owner Portal | Quetta Salon Connect";
                }}
                className="h-8 w-8 rounded-lg text-white/50 hover:bg-white/10 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
