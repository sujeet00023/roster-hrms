import { getSession } from "@/lib/auth";
import { getCurrentPayslip, formatINR } from "@/lib/payroll";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { IconInfo } from "@/components/Icons";

function Line ({label, value, muted = false, negative = false}: {label: string; value: string; muted?: boolean, negative?: boolean } ) {
    return (
      <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6">
      <span className={`text-sm ${muted ? "pl-3 text-ink-3" : "text-ink-2"}`}>{label}</span>
      <span className={`text-sm font-semibold ${negative ? "text-away" : muted ? "text-ink-3" : "text-ink"}`}>{value}</span>
    </div>
    );
}

export default async function PayslipPage() {
    const session = await getSession();
    const slip = await getCurrentPayslip(session!.employeeId);

    const tax = slip.tds + slip.professionalTax;
    const pct = (n: number) => (slip.gross > 0 ? Math.max(0, (n / slip.gross ) * 100): 0);
    const segments =[
      {label: "Take-home", value: slip.net, color: "var(--present)" },
      {label: "Provident fund", value: slip.providentFund, color: "var(--brand)" },
      {label: "Tax", value: tax , color: "var(--watch)" },
      {label: "Loss of pay", value: slip.lopDeduction, color: "var(--away)" },
    ].filter((s) => s.value > 0 );
  
    return (
     <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader title="Payslip" subtitle={`${slip.month}, worked out from this month's attendance.`} />

      <section
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-pop sm:p-8"
        style={{ backgroundImage: "var(--grad)" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium text-white/80">Estimated take-home</p>
          <p className="mt-1 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">{formatINR(slip.net)}</p>
          <p className="mt-2 text-sm text-white/80">
            from a gross of {formatINR(slip.gross)}
            {slip.unpaidDays > 0 ? ` · ${slip.unpaidDays} unpaid day${slip.unpaidDays > 1 ? "s" : ""}` : ""}
          </p>

          <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-white/20" role="img" aria-label="How your gross salary splits between take-home and deductions">
            {segments.map((s) => (
              <div key={s.label} style={{ width: `${pct(s.value)}%`, background: s.color }} className="h-full" />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-white/85">
            {segments.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full ring-1 ring-white/60" style={{ background: s.color }} />
                {s.label} · {Math.round(pct(s.value))}%
              </span>
            ))}
          </div>
        </div>
      </section>

      <Panel title="Breakdown">
        <div className="mt-2 divide-y divide-line">
          <Line label="Gross salary" value={formatINR(slip.gross)} />
          <Line label="of which basic" value={formatINR(slip.basic)} muted />
          <Line
            label={`Loss of pay${slip.unpaidDays ? ` (${slip.unpaidDays} day${slip.unpaidDays > 1 ? "s" : ""})` : ""}`}
            value={`− ${formatINR(slip.lopDeduction)}`}
            negative={slip.lopDeduction > 0}
          />
          <Line label="Provident fund" value={`− ${formatINR(slip.providentFund)}`} negative />
          <Line label="Professional tax" value={`− ${formatINR(slip.professionalTax)}`} negative />
          <Line label="TDS" value={`− ${formatINR(slip.tds)}`} negative />
          <div className="flex items-center justify-between gap-4 bg-present-soft px-5 py-4 sm:px-6">
            <span className="text-sm font-bold text-present">Net pay</span>
            <span className="font-display text-xl font-extrabold text-present">{formatINR(slip.net)}</span>
          </div>
        </div>
      </Panel>

      <p className="flex items-start gap-2.5 rounded-2xl bg-surface-2 px-4 py-3.5 text-sm leading-relaxed text-ink-2">
        <IconInfo className="mt-0.5 h-4 w-4 flex-none text-ink-3" />
        <span>This is a live estimate for the month so far. Final figures are fixed when HR runs payroll.</span>
      </p>
    </div>
    );

}