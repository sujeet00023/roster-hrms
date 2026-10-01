import { getSession } from "@/lib/auth";
import { getTodayAttendance, getAverageWeeklyHours } from "@/lib/attendance";
import { getLeaveSummary } from "@/lib/leave";
import { Panel } from "@/components/Panel";
import { StatusPill } from "@/components/StatusPil";
import { CheckInOut } from "@/components/CheckInOut";

export default async function TodayPage() {
    const session =await getSession();
    const employeeId = session!.employeeId;
    
    const [today, hours, leave] = await Promise.all([
        getTodayAttendance(employeeId),
        getAverageWeeklyHours(employeeId),
        getLeaveSummary(employeeId),
    ]);

    const pendingRequests = leave.requests.filter((r) => r.status === "pending");
    const totalBalance = leave.balance.earned + leave.balance.casual + leave.balance.sick;

    return(
         <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Today</h1>
        <p className="mt-1 text-sm text-ink-2">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="p-4">
          <p className="text-xs text-ink-2">Status</p>
          <div className="mt-1.5">{today ? <StatusPill status={today.status} /> : <StatusPill status="off" />}</div>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs text-ink-2">Average hours / week</p>
          <p className="mt-1 font-display text-xl font-bold">{hours.toFixed(1)}h</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs text-ink-2">Leave balance</p>
          <p className="mt-1 font-display text-xl font-bold">{totalBalance} days</p>
        </Panel>
      </div>

      <Panel title="Attendance">
        <div className="p-4 sm:p-5">
          <CheckInOut checkIn={today?.checkIn ?? null} checkOut={today?.checkOut ?? null} />
        </div>
      </Panel>

      <Panel title="Leave requests" note={`${pendingRequests.length} pending`}>
        {leave.requests.length === 0 ? (
          <p className="p-5 text-sm text-ink-2">No leave requested yet.</p>
        ) : (
          <div className="flex flex-col">
            {leave.requests.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:px-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize">
                    {r.type} · {r.days} day{r.days > 1 ? "s" : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-2">
                    From {new Date(r.from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {r.decisionNote ? ` — ${r.decisionNote}` : ""}
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