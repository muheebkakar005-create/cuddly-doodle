type BookingEvent = {
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
};

type Listener = (event: BookingEvent) => void;

class LiveEventEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(salonId: string, listener: Listener) {
    if (!this.listeners.has(salonId)) {
      this.listeners.set(salonId, new Set());
    }
    this.listeners.get(salonId)!.add(listener);

    return () => {
      const set = this.listeners.get(salonId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(salonId);
        }
      }
    };
  }

  emit(event: BookingEvent) {
    const set = this.listeners.get(event.salonId);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error("Error dispatching booking event to listener", err);
        }
      });
    }
  }
}

// Global singleton to persist across requests in Node.js runtime
const globalForLiveEvents = globalThis as unknown as { liveEventEmitter?: LiveEventEmitter };
export const liveEvents = globalForLiveEvents.liveEventEmitter || new LiveEventEmitter();
if (process.env.NODE_ENV !== "production") {
  globalForLiveEvents.liveEventEmitter = liveEvents;
}
export type { BookingEvent };
