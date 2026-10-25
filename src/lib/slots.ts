import { formatTime12 } from "./format";
import { isWorkingDay, karachiDateISO, karachiNow, overlapsBreak, toMinutes } from "./hours";

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type BookedSlot = {
  appointmentTime: string;
  durationMinutes: number;
  status: string;
};

export function generateSlots(params: {
  openTime: string;
  closeTime: string;
  durationMinutes: number;
  booked: BookedSlot[];
  date: string;
  intervalMinutes?: number;
  workingDaysJson?: string;
  breakStart?: string;
  breakEnd?: string;
}): { time: string; label: string; available: boolean; reason?: string }[] {
  if (params.workingDaysJson && !isWorkingDay(params.workingDaysJson, params.date)) {
    return [];
  }

  const interval = params.intervalMinutes ?? 45;
  const open = toMinutes(params.openTime);
  const close = toMinutes(params.closeTime);
  const duration = Math.max(params.durationMinutes, 30);
  const todayStr = karachiDateISO();
  const now = karachiNow();
  const nowMins = now.getHours() * 60 + now.getMinutes() + 30;

  const active = params.booked.filter((b) => b.status !== "CANCELLED" && b.status !== "COMPLETED");

  const slots: { time: string; label: string; available: boolean; reason?: string }[] = [];

  for (let t = open; t + duration <= close; t += interval) {
    const time = fromMinutes(t);
    const end = t + duration;
    const overlaps = active.some((b) => {
      const start = toMinutes(b.appointmentTime);
      const bEnd = start + b.durationMinutes;
      return t < bEnd && end > start;
    });
    const onBreak = overlapsBreak(t, end, params.breakStart || "", params.breakEnd || "");
    const past = params.date === todayStr && t < nowMins;
    const available = !overlaps && !past && !onBreak;
    slots.push({
      time,
      label: formatTime12(time),
      available,
      reason: onBreak ? "Break" : overlaps ? "Booked" : past ? "Past" : undefined,
    });
  }

  return slots;
}

export function nextSevenDays(): {
  date: string;
  label: string;
  weekday: string;
  dayName: string;
  dayNum: number;
  monthName: string;
}[] {
  const days: {
    date: string;
    label: string;
    weekday: string;
    dayName: string;
    dayNum: number;
    monthName: string;
  }[] = [];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = karachiDateISO();
  const [y, m, d] = today.split("-").map(Number);
  for (let i = 0; i < 8; i++) {
    const dt = new Date(y, m - 1, d + i);
    const date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    const weekday = weekdays[dt.getDay()];
    const dayNum = dt.getDate();
    const monthName = dt.toLocaleString("en-PK", { month: "short" });
    const label =
      i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${dayNum} ${monthName}`;
    days.push({ date, label, weekday, dayName: weekday, dayNum, monthName });
  }
  return days;
}
