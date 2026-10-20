export const WEEKDAYS = [
  { id: 0, label: "Sunday" },
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
  { id: 6, label: "Saturday" },
] as const;

export function parseWorkingDays(json: string | null | undefined): number[] {
  try {
    const arr = JSON.parse(json || "[]");
    if (!Array.isArray(arr)) return [0, 1, 2, 3, 4, 5, 6];
    return arr.map(Number).filter((n) => n >= 0 && n <= 6);
  } catch {
    return [0, 1, 2, 3, 4, 5, 6];
  }
}

export function karachiNow(): Date {
  const s = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });
  return new Date(s);
}

export function karachiDateISO(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
}

export function weekdayForDate(dateISO: string): number {
  const [y, m, day] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, day).getDay();
}

export function isWorkingDay(workingDaysJson: string, dateISO: string): boolean {
  return parseWorkingDays(workingDaysJson).includes(weekdayForDate(dateISO));
}

export function toMinutes(hhmm: string): number {
  if (!hhmm || !hhmm.includes(":")) return -1;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function overlapsBreak(slotStart: number, slotEnd: number, breakStart: string, breakEnd: string): boolean {
  const b0 = toMinutes(breakStart);
  const b1 = toMinutes(breakEnd);
  if (b0 < 0 || b1 < 0 || b1 <= b0) return false;
  return slotStart < b1 && slotEnd > b0;
}
