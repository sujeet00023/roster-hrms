import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { formatDay } from "@/lib/format";
import { formatINR, monthLabel } from "@/lib/payroll";
import { listRuns, recentCompletedMonths } from "@/lib/payrollRun";
import { IconArrowRight, IconInfo } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { can } from "@/lib/authorize";

export const metadata = {title: "Payroll" };


export default async function PayrollPage() {
    const session = await getSession();
  /*   const allowed = await can(
  session!.employeeId,
  "payroll.run",
  undefined,
  { silent: true }
);

console.log("PAYROLL ACCESS:", allowed); */
    const runs = await listRuns(session!.employeeId);
    if(!runs) notFound();
   /*  console.log("PAYROLL RUNS RESULT:", runs);
console.log("IS ARRAY:", Array.isArray(runs)); */

    const done = new Set(runs.map((r) => r.month ));
    const ready = recentCompletedMonths().filter((m) => !done.has(m));

    return(
        <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Payroll"
        subtitle="Run payroll once a month has ended. Employees see a live estimate until you publish; publishing fixes the figures."
      />

      <p className="flex items-start gap-2.5 rounded-2xl bg-watch-soft px-4 py-3.5 text-sm leading-relaxed text-watch">
        <IconInfo className="mt-0.5 h-4 w-4 flex-none" />
        <span>
          <strong>Deductions are illustrative.</strong> Provident fund, professional tax and income tax use simple placeholder rules. Have them set up to your actual statutory requirements before paying anyone with this.
        </span>
      </p>

      <Panel title="Ready to run" note="Completed months that haven't been published">
        {ready.length === 0 ? (
          <p className="px-5 pb-6 pt-3 text-sm text-ink-2 sm:px-6">You&apos;re up to date. The next month becomes available once it ends.</p>
        ) : (
          <div className="mt-2 divide-y divide-line">
            {ready.map((m) => (
              <Link key={m} href={`/dashboard/payroll/${m}`} className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface-2 sm:px-6">
                <span className="font-display text-base font-bold">{monthLabel(m)}</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
                  Review <IconArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Published runs">
        {runs.length === 0 ? (
          <p className="px-5 pb-6 pt-3 text-sm text-ink-2 sm:px-6">Nothing published yet.</p>
        ) : (
          <div className="mt-2 divide-y divide-line">
            {runs.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4 sm:px-6">
                <div>
                  <p className="font-display text-base font-bold">{monthLabel(r.month)}</p>
                  <p className="text-xs text-ink-3">
                    {r.employeeCount} payslip{r.employeeCount === 1 ? "" : "s"} · {r.totalUnpaidDays} unpaid day{r.totalUnpaidDays === 1 ? "" : "s"} · published {formatDay(r.publishedAt)}
                  </p>
                </div>
                <p className="font-display text-lg font-extrabold text-present">{formatINR(r.totalNet)}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
    )
    
}