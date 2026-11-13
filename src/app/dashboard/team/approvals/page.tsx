import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/authorize";
import { listPendingApprovals } from "@/lib/approvals";
import { formatDay } from "@/lib/format";
import { ApprovalActions } from "@/components/ApprovalActions";
import { Avatar } from "@/components/Avatar";
import { IconAlert,IconCheck, IconInfo, IconPlane } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";


export default async function ApprovalsPage() {
    const session = await getSession();
    const actorId = session!.employeeId;

    if(!(await can (actorId, "leave.approve", undefined, {silent: true}))) notFound();

    const queue = await listPendingApprovals(actorId);

    return (
        <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Approvals"
        subtitle="Short, well-covered requests clear on their own. What lands here is what the rules couldn't settle."
      />

      {queue.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-present-soft text-present">
            <IconCheck className="h-7 w-7" />
          </span>
          <h2 className="font-display text-lg font-bold">You&apos;re all caught up</h2>
          <p className="max-w-sm text-sm leading-relaxed text-ink-2">Every request in your scope has been decided. New ones will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {queue.map((r) => {
            const after = r.balanceForType - r.days;
            const over = after < 0;
            return (
              <article key={r.id} className="card p-5 sm:p-6">
                <div className="flex items-center gap-3.5">
                  <Avatar name={r.employee.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{r.employee.name}</p>
                    <p className="truncate text-xs text-ink-3">{r.employee.title}</p>
                  </div>
                  <span className="text-xs text-ink-3">{formatDay(r.submittedAt)}</span>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-2 p-3.5">
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand-soft text-brand-ink">
                    <IconPlane className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold capitalize">
                      {r.type} · {r.days} day{r.days > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-ink-2">From {formatDay(r.from, { weekday: "short", day: "numeric", month: "short" })}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-ink-2">&ldquo;{r.reason}&rdquo;</p>

                <p className={`mt-3 flex items-start gap-2 text-xs leading-relaxed ${over ? "text-away" : "text-ink-3"}`}>
                  {over ? <IconAlert className="mt-0.5 h-3.5 w-3.5 flex-none" /> : <IconInfo className="mt-0.5 h-3.5 w-3.5 flex-none" />}
                  <span>
                    {over
                      ? `${r.employee.name.split(" ")[0]} only has ${r.balanceForType} ${r.type} day${r.balanceForType === 1 ? "" : "s"} left, so this can't be approved as asked.`
                      : `${r.balanceForType} ${r.type} day${r.balanceForType === 1 ? "" : "s"} left now, ${after} after this.`}
                    {r.deferredBecause ? ` Why it came to you: ${r.deferredBecause}` : ""}
                  </span>
                </p>

                <ApprovalActions requestId={r.id} />
              </article>
            );
          })}
        </div>
      )}
    </div>
    );
    
}