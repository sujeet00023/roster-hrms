import { getSession } from "@/lib/auth";
import { getLeaveSummary } from "@/lib/leave";
import { Panel } from "@/components/Panel";
import { StatusPill } from "@/components/StatusPil";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";

export default async function LeavePage() {
    const session = await getSession();
    const leave = await getLeaveSummary(session!.employeeId);

    return (
         <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Leave</h1>
        <p className="mt-1 text-sm text-ink-2">
          Requests of 2 days or fewer clear automatically when your balance and team coverage allow it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="p-4">
          <p className="text-xs text-ink-2">Earned</p>
          <p className="mt-1 font-display text-xl font-bold">{leave.balance.earned}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs text-ink-2">Casual</p>
          <p className="mt-1 font-display text-xl font-bold">{leave.balance.casual}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs text-ink-2">Sick</p>
          <p className="mt-1 font-display text-xl font-bold">{leave.balance.sick}</p>
        </Panel>
      </div>

      <Panel title="Request leave">
        <LeaveRequestForm />
      </Panel>

      <Panel title="History">
        {leave.requests.length === 0 ? (
          <p className="p-5 text-sm text-ink-2">Nothing requested yet.</p>
        ) : (
          <div className="flex flex-col">
            {leave.requests.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:px-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize">
                    {r.type} · {r.days} day{r.days > 1 ? "s" : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-2">
                    From {new Date(r.from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — {r.reason}
                  </p>
                  {r.decisionNote && <p className="mt-0.5 text-xs text-ink-3">{r.decisionNote}</p>}
                </div>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
    )
}