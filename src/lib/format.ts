import { isWorkingDay, karachiDateISO, karachiNow, overlapsBreak, toMinutes } from "./hours";

export function formatPkr(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")} PKR`;
}

export function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  let h = Number(hStr);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} mins`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} mins` : `${h} hr`;
}

export function isOpenNow(
  openTime: string,
  closeTime: string,
  opts?: { workingDaysJson?: string; breakStart?: string; breakEnd?: string; dateISO?: string },
): boolean {
  const dateISO = opts?.dateISO || karachiDateISO();
  if (opts?.workingDaysJson && !isWorkingDay(opts.workingDaysJson, dateISO)) return false;
  const now = karachiNow();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);
  if (minutes < open || minutes >= close) return false;
  if (opts?.breakStart && opts?.breakEnd && overlapsBreak(minutes, minutes + 1, opts.breakStart, opts.breakEnd)) {
    return false;
  }
  return true;
}

export function startingPrice(prices: number[]): number | null {
  if (!prices.length) return null;
  return Math.min(...prices);
}
