import Link  from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { formatINR, monthLabel } from "@/lib/payroll";
import { PayrollError, previewRun, type RunPreview } from "@/lib/payrollRun";
import { Avatar } from "@/components/Avatar";
import { IconCheck } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { PublishPayrollButton } from "@/components/PublishPayrollButton";

export const metadata = {title: "Review payroll" };

function Line({ label, value, negative = false }: {label: string; value: string; negative?: boolean }) {
    return (
        <div className="flex justify-between gap-3 py-1 text-xs">
      <span className="text-ink-3">{label}</span>
      <span className={negative ? "font-semibold text-away" : "font-semibold"}>{value}</span>
    </div>
    );
}

export default async function PayrollMonthPage({params} : {params: Promise<{month: string}>}) {
    const session = await getSession();
    const {month} = await params;

    let preview: RunPreview;
    try {
      preview = await previewRun(session!.employeeId, month );

    }catch(err) {
      if(err instanceof PayrollError && err.status === 409) {
        return (
          <div className="card mx-auto mt-6 flex max-w-md flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-present-soft text-present">
            <IconCheck className="h-7 w-7" />
          </span>
          <h1 className="font-display text-xl font-bold">Already published</h1>
          <p className="text-sm leading-relaxed text-ink-2">Payroll for {monthLabel(month)} has been run, and its figures are fixed.</p>
          <Link href="/dashboard/payroll" className="btn btn-primary mt-1">
            Back to payroll
          </Link>
        </div>
        );
      }
      
      // No access, a malformed month, or a month that hasn't ended: none of these deserve a page.
      if(err instanceof PayrollError) notFound();
      throw err;
    }

    const label = monthLabel(month);
    const {totals } = preview;

    return (
        <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader title={label} subtitle="Review everyone's pay below. Nothing is saved or visible to employees until you publish." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Payslips", value: String(totals.employees) },
          { label: "Total gross", value: formatINR(totals.gross) },
          { label: "Total take-home", value: formatINR(totals.net), cls: "text-present" },
          { label: "Unpaid days", value: String(totals.unpaidDays), cls: totals.unpaidDays > 0 ? "text-away" : "" },
        ].map((s) => (
          <div key={s.label} className="card p-4 sm:p-5">
            <p className="text-sm font-medium text-ink-2">{s.label}</p>
            <p className={`mt-1.5 font-display text-2xl font-extrabold tracking-tight sm:text-3xl ${s.cls ?? ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {preview.skippedNoSalary > 0 && (
        <p className="rounded-2xl bg-surface-2 px-4 py-3.5 text-sm leading-relaxed text-ink-2">
          {preview.skippedNoSalary} {preview.skippedNoSalary === 1 ? "person has" : "people have"} no salary set and {preview.skippedNoSalary === 1 ? "isn't" : "aren't"} included. Set a salary from the directory to include them.
        </p>
      )}

      <Panel title="Everyone's pay" note="Tap a row for the full breakdown">
        {preview.rows.length === 0 ? (
          <p className="px-5 pb-6 pt-3 text-sm text-ink-2 sm:px-6">There&apos;s nobody with a salary to pay for this month.</p>
        ) : (
          <div className="mt-2 divide-y divide-line">
            {preview.rows.map((r) => (
              <details key={r.employeeId} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3.5 px-5 py-3.5 transition hover:bg-surface-2 sm:px-6 [&::-webkit-details-marker]:hidden">
                  <Avatar name={r.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="truncate text-xs text-ink-3">
                      {r.title}
                      {r.unpaidDays > 0 ? ` · ${r.unpaidDays} unpaid day${r.unpaidDays === 1 ? "" : "s"}` : ""}
                      {r.preJoinDays > 0 ? " · joined mid-month" : ""}
                    </p>
                  </div>
                  <p className="font-display text-base font-extrabold">{formatINR(r.net)}</p>
                </summary>
                <div className="mx-5 mb-4 rounded-xl bg-surface-2 px-4 py-3 sm:mx-6">
                  <Line label="Gross (full month)" value={formatINR(r.gross)} />
                  {r.lopDeduction > 0 && <Line label={`Unpaid days (${r.unpaidDays})`} value={`− ${formatINR(r.lopDeduction)}`} negative />}
                  {r.joiningDeduction > 0 && <Line label={`Before joining (${r.preJoinDays} days)`} value={`− ${formatINR(r.joiningDeduction)}`} negative />}
                  <Line label="Provident fund" value={`− ${formatINR(r.providentFund)}`} negative />
                  <Line label="Professional tax" value={`− ${formatINR(r.professionalTax)}`} negative />
                  <Line label="Income tax" value={`− ${formatINR(r.tds)}`} negative />
                  <div className="mt-1 border-t border-line pt-1.5">
                    <Line label="Take-home" value={formatINR(r.net)} />
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </Panel>

      <div className="flex flex-wrap items-start gap-3">
        {preview.rows.length > 0 && <PublishPayrollButton month={month} label={label} employees={preview.rows.length} />}
        <Link href="/dashboard/payroll" className="btn btn-secondary">
          Back
        </Link>
      </div>
    </div>
    );
}