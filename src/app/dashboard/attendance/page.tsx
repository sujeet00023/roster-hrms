import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getAttendanceHistory } from "@/lib/attendance";
import { getLeaveSummary } from "@/lib/leave";
import { formatDay, formatDuration, minutesOf } from "@/lib/format";
import { leaveCoversDay, localDayStart } from "@/lib/time";
import { Employee } from "@/models/Employee";
import { AttendanceCalendar, type CalenderCell, type CellStatus } from "@/components/AttendanceCalendar";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusPill } from "@/components/StatusPil";

const DAY = 86400000;

export default async function AttendancePage() {

    const session = await getSession();
    const employeeId = session!.employeeId;

    await connectDB();
    const [history, leave, me] = await Promise.all([
      getAttendanceHistory(employeeId, 42),
      getLeaveSummary(employeeId),
      Employee.findById(employeeId).select("joinedAt").lean<{ joinedAt: Date }>(),

    ]);

    const todayMs = localDayStart().getTime();
    const joinedMs = me ? new Date(me.joinedAt).getTime() : 0;
    const byDay = new Map(history.map((r) => [new Date(r.date).getTime(), r]));
    const approved = leave.requests.filter((r) => r.status === "approved");
    const onLeave = (ms: number) => approved.some((r) => leaveCoversDay(new Date(r.from).getTime(), r.days, ms));

    const firstMs = todayMs - 34 * DAY;
    const gridStart = firstMs - ((new Date(firstMs). getUTCDay() + 6) % 7) * DAY;
    const weeks = Math.ceil((todayMs - gridStart )/ DAY / 7 + 1 / 7 );

   const cells: CalenderCell[] = [];
   for (let i = 0; i < weeks * 7; i++){
    const ms = gridStart + i * DAY;
    const d= new Date(ms);
    const dow = d.getUTCDay();
    const row = byDay.get(ms);

    let status: CellStatus;
    if(ms < todayMs) status = "future";
    else if(ms < joinedMs) status = "pre";
    else if (dow === 0 || dow === 6) status = "off";
    else if(onLeave(ms)) status = "leave";
    else if(row) status = row.status === "off" ? "off" : row.status;
    else status = ms === todayMs ? "none" : "absent";
    
    cells.push ({
      iso: d.toISOString().slice(0, 10),
      day: d. getUTCDay(),
      month: formatDay(d, {month: "short" }),
      status,
      checkIn: row?.checkIn ?? null,
      isToday: ms === todayMs,
      firstOfMonth: d.getUTCDate() === 1,
    })
   }

   const recent = cells.filter((c) => {
    const ms = new Date(c.iso).getTime();
    return ms > todayMs - 30 * DAY && ms <= todayMs;
   });
   const count = (...s: CellStatus[]) => recent.filter((c) => s.includes(c.status)).length;
  
  let punchedMinutes = 0;
  let punchedDays = 0;
  for (const r of history ) {
    if(new Date(r.date).getTime() > todayMs - 30 * DAY && r.checkIn && r.checkOut ) {
      punchedMinutes += minutesOf(r.checkOut) - minutesOf(r.checkIn);
      punchedDays += 1;
    }
  }

  const summary = [
    {label: "On Time", value: count("present"), cls: "text-present"},
    {label: "Late", value: count("late", "half_day"), cls: "text-watch" },
    {label: "No punch", value: count("absent"), cls: "text-away" },
    {label: "Avg day", vakue: punchedDays ? formatDuration(punchedDays / punchedDays) : "-", cls: "text-ink" },

  ];

  const lastSeven = [...history].filter((r) => r.checkIn).slice(-7).reverse();

    return (
      <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader title="Attendance" subtitle="Your last five weeks, graded against your own shift start — not a single company-wide time." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {summary.map((s) => (
          <div key={s.label} className="card p-4 sm:p-5">
            <p className="text-sm font-medium text-ink-2">{s.label}</p>
            <p className={`mt-1.5 font-display text-3xl font-extrabold tracking-tight ${s.cls}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-ink-3">last 30 days</p>
          </div>
        ))}
      </div>

      <Panel title="Calendar" note="Hover or long-press a day for details">
        <div className="p-5 pt-4 sm:p-6 sm:pt-4">
          <AttendanceCalendar cells={cells} />
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-ink-2">
            {(
              [
                ["bg-present", "On time"],
                ["bg-watch", "Late / half day"],
                ["bg-leave", "On leave"],
                ["bg-away", "No punch"],
                ["bg-surface-2", "Weekend"],
              ] as const
            ).map(([dot, label]) => (
              <span key={label} className="inline-flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Recent punches">
        {lastSeven.length === 0 ? (
          <p className="px-5 pb-6 pt-3 text-sm text-ink-2 sm:px-6">No punches yet. Check in from the Today page to start your record.</p>
        ) : (
          <div className="mt-2 divide-y divide-line">
            {lastSeven.map((r) => (
              <div key={r.date.toISOString()} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{formatDay(r.date, { weekday: "short", day: "numeric", month: "short" })}</p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {r.checkIn}
                    {r.checkOut ? ` – ${r.checkOut} · ${formatDuration(minutesOf(r.checkOut) - minutesOf(r.checkIn!))}` : " · still in"}
                  </p>
                </div>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );    
}