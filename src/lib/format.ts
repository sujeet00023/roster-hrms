/**
 * Stored dates (leave start, joined date, attendance day) are calendar dates
 * kept at 00:00 UTC, so they must be *displayed* in UTC or they can slide to
 * the neighbouring day on a server in another timezone.
 */

export function formatDay(
    d: Date | string,
    opts: Intl.DateTimeFormatOptions = {day : "numeric", month: "short" }

): string {
    return new Date(d).toLocaleDateString("en-In", {...opts, timeZone: "UTC" } );
}


export function formatDuration(totalMinutes: number ) : string {
    const m = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(m / 60 );
    const rest = m % 60;
    if( h === 0) return `${rest}m`;
    return rest ===0 ? `${h}h` : `${h}h ${rest}m` ;

}

export function minutesOf(hhmm: string): number {
    const [h , m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

export function initialsOf(name: string): string {
    return name
    .split(" ")
    .filter(Boolean) 
    .map((w) => w [0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

