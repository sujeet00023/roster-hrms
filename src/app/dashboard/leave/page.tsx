import { getSession } from "@/lib/auth";
import { getLeaveSummary } from "@/lib/leave";
import { LeaveRow } from "@/components/LeaveRow";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { ProgressRing } from "@/components/ProgressRing";

// Rings fill against a 12-day yardstick. It's a visual scale, not a policy limit.
const RING_SCALE = 12;

export default async function LeavePage() {
    const session = await getSession();
    const leave = await getLeaveSummary(session!.employeeId);

    const balances = [
      {label: "Earned", value: leave.balance.earned, tone: "leave" },
      {label: "Casual", value: leave.balance.casual, tone: "brand" },
      {label: "Sick", value: leave.balance.sick, tone: "away" },
    ] as const;
    return (
      <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Leave"
        subtitle="Requests of 2 days or fewer clear automatically when your balance and your team's coverage allow it. Anything longer goes to your manager."
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {balances.map((b) => (
          <div key={b.label} className="card flex flex-col items-center gap-3 p-4 sm:p-6">
            <ProgressRing value={b.value} max={RING_SCALE} tone={b.tone} size={96} stroke={10}>
              <span className="font-display text-3xl font-extrabold">{b.value}</span>
            </ProgressRing>
            <div className="text-center">
              <p className="text-sm font-semibold">{b.label}</p>
              <p className="text-xs text-ink-3">days left</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Request leave" note="You'll see the decision straight away if it's auto-approved">
          <LeaveRequestForm />
        </Panel>

        <Panel title="History">
          {leave.requests.length === 0 ? (
            <p className="px-5 pb-6 pt-3 text-sm text-ink-2 sm:px-6">Nothing requested yet. Your requests and their outcomes will appear here.</p>
          ) : (
            <div className="mt-2 divide-y divide-line">
              {leave.requests.map((r) => (
                <LeaveRow key={r.id} r={r} detailed />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
    )
}