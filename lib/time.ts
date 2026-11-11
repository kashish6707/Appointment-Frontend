// Dates and times are shown in Asia/Kolkata, whatever the device's timezone is.

const TZ = "Asia/Kolkata";

/** Today's date in India as YYYY-MM-DD. */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function hourIST(): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(new Date()));
}

export function partOfDay(hour = hourIST()): "morning" | "afternoon" | "evening" {
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
}

/** A YYYY-MM-DD date as a Date at noon UTC, so formatting never shifts it to another day. */
function day(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

/** "Wednesday, 11 November 2026" */
export function longDate(date: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
      .formatToParts(day(date))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`;
}

/** "11 Nov" */
export function shortDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(day(date));
}

/** "November 2026" */
export function monthName(month: string): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(day(`${month}-01`));
}

/** "9:42 am" from an ISO timestamp. */
export function clockTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ })
    .format(new Date(iso))
    .toLowerCase();
}

/** "10:00" (24h from the backend) as "10:00 am". */
export function hhmm(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

export function addDays(date: string, n: number): string {
  const d = day(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function addMonths(month: string, n: number): string {
  const d = day(`${month}-01`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}

/** 0 = Monday … 6 = Sunday */
export function weekdayIndex(date: string): number {
  return (day(date).getUTCDay() + 6) % 7;
}

/** The Monday-to-Sunday week that contains `date`. */
export function weekOf(date: string): string[] {
  const monday = addDays(date, -weekdayIndex(date));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
