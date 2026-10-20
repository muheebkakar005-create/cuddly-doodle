"use client";

export interface OfflineBookingPayload {
  tempId: string;
  salonId: string;
  salonName: string;
  salonWhatsApp: string;
  customerName: string;
  customerPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceIds: string[];
  serviceNames: string[];
  totalPricePkr: number;
  staffName: string;
  specialNotes?: string;
  createdAt: number;
}

const STORAGE_KEY = "qsc_offline_bookings_queue";

export function getPendingOfflineBookings(): OfflineBookingPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineBooking(payload: Omit<OfflineBookingPayload, "tempId" | "createdAt">): OfflineBookingPayload {
  const item: OfflineBookingPayload = {
    ...payload,
    tempId: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };

  const queue = getPendingOfflineBookings();
  queue.push(item);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to store offline booking", e);
  }
  return item;
}

export function removeOfflineBooking(tempId: string) {
  if (typeof window === "undefined") return;
  const queue = getPendingOfflineBookings().filter((b) => b.tempId !== tempId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export async function syncPendingOfflineBookings(
  onSuccess?: (synced: { tempId: string; serverId: string; customerName: string }) => void
): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;
  const queue = getPendingOfflineBookings();
  if (queue.length === 0) return 0;

  let syncedCount = 0;

  for (const item of queue) {
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: item.salonId,
          customerName: item.customerName,
          customerPhone: item.customerPhone,
          appointmentDate: item.appointmentDate,
          appointmentTime: item.appointmentTime,
          serviceIds: item.serviceIds,
          specialNotes: item.specialNotes || "(Booked offline - synced automatically)",
          staffName: item.staffName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        removeOfflineBooking(item.tempId);
        syncedCount++;

        // Add to confirmed bookings history
        try {
          const ids: string[] = JSON.parse(localStorage.getItem("qsc_bookings") || "[]");
          ids.unshift(data.appointment.id);
          localStorage.setItem("qsc_bookings", JSON.stringify(ids.slice(0, 20)));
        } catch {
          // ignore
        }

        if (onSuccess) {
          onSuccess({
            tempId: item.tempId,
            serverId: data.appointment.id,
            customerName: item.customerName,
          });
        }
      }
    } catch (err) {
      console.warn("Could not sync booking yet, will retry on next online event", err);
    }
  }

  return syncedCount;
}
