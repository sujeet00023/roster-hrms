/**
 * One company timezone for everything that means "today" or "9:30".
 *
 * Shift starts, punches and "today's status" are all wall-clock concepts, so
 * they must be read in the company's timezone, not the server's (which is
 * usually UTC in production). Attendance rows are keyed by the *local*
 * calendar date, stored as that date at 00:00 UTC.
 *
 * Override with APP_TIMEZONE in .env.local (any IANA name, e.g. "Europe/London").
 */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/kolkata";

export function localParts(d: Date = new Date(), tz: string = APP_TIMEZONE){
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day:"2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(d);
      const get = (type: string) => Number(parts.find((p) => p.type === type) !.value);
      return {
        year: get("year"),
        month: get("month"),
        day: get("day"),
        hour: get("hour"),
        minute: get("minute"),
      };
}

/** The company-local calendar date of `d`, as a Date at 00:00 UTC. This is the key attendance rows use. */
export function localDayStart(d: Date = new Date()): Date {
    const p = localParts(d);
    return new Date(Date.UTC(p.year, p.month - 1, p.day));
}

/** Company-local wall-clock time of `d` as "HH:MM". */
export function localHHMM(d: Date = new Date()): string {
    const p = localParts(d);
    return `${String(p.hour). padStart(2, "0")}: ${String(p.minute).padStart(2, "0")}`;

}

/**
 * Does a leave request cover the calendar day `ms` (00:00 UTC of that date)?
 *
 * Leave is counted in *working* days: a 2-day request starting on a Friday
 * covers Friday and the following Monday, not Friday and Saturday. Weekends
 * inside the range are skipped, and a request that starts on a weekend begins
 * on the next weekday. A half-day request still covers its whole day.
 *
 * Shared by the attendance calendar, the team view and payroll so they can
 * never disagree about whether someone was on leave.
 */
export function leaveCoversDay(fromMs: number, days: number, ms: number): boolean {
  const DAY = 86400000;
  if(ms < fromMs ) return false;

  let remaining = Math.max(1, Math.ceil(days));
  for (let cur = fromMs; remaining > 0 && cur <= ms; cur += DAY) {
    const dow = new Date(cur).getUTCDay();
    if(dow === 0 || dow === 6) continue;
    if(cur === ms) return true;
    remaining -= 1;
  }
  return false;
}