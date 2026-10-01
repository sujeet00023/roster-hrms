import { getSession } from "@/lib/auth";
import { getAttendanceHistory } from "@/lib/attendance";
import { Panel } from "@/components/Panel";
import { StatusPill } from "@/components/StatusPil";


export default async function AttendancePage() {

    const session = await getSession();
    const history = await getAttendanceHistory(session!.employeeId, 30);
    const reversed = [...history].reverse();

    return (
         <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Attendance</h1>
        <p className="mt-1 text-sm text-ink-2">Last 30 days, graded against your own shift start.</p>
      </div>

      <Panel>
        {reversed.length === 0 ? (
          <p className="p-5 text-sm text-ink-2">No attendance recorded yet.</p>
        ) : (
          <div className="flex flex-col">
            {reversed.map((row) => (
              <div
                key={row.date.toISOString()}
                className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:px-5"
              >
                <span className="text-sm text-ink-2">
                  {new Date(row.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </span>
                <span className="text-sm text-ink-2">
                  {row.checkIn ? `${row.checkIn}${row.checkOut ? ` – ${row.checkOut}` : ""}` : "—"}
                </span>
                <StatusPill status={row.status} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
    )
    
}