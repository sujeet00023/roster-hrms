import { getSession } from "@/lib/auth";
import { getCurrnentPayslip, formatINR } from "@/lib/payroll";
import { Panel } from "@/components/Panel";

function Row ({label, value, subtle = false}: {label: string; value: string; subtle?: boolean } ) {
    return (
         <div className="flex items-center justify-between border-b border-line px-4 py-2.5 last:border-b-0 sm:px-5">
      <span className={`text-sm ${subtle ? "text-ink-2" : "text-ink"}`}>{label}</span>
      <span className={`text-sm ${subtle ? "text-ink-2" : "font-medium text-ink"}`}>{value}</span>
    </div>
    );
}


export default async function PayslipPage() {
    const session = await getSession();
    const slip = await getCurrnentPayslip(session!.employeeId);

    return (
        <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Payslip</h1>
        <p className="mt-1 text-sm text-ink-2">{slip.month}, computed from this month&apos;s attendance.</p>
      </div>

      <Panel className="p-5 sm:p-6">
        <p className="text-xs text-ink-2">Net pay</p>
        <p className="mt-1 font-display text-3xl font-extrabold text-present">{formatINR(slip.net)}</p>
      </Panel>

      <Panel title="Breakdown">
        <Row label="Gross salary" value={formatINR(slip.gross)} />
        <Row label="Basic" value={formatINR(slip.basic)} subtle />
        <Row
          label={`Loss of pay${slip.unpaidDays ? ` (${slip.unpaidDays} day${slip.unpaidDays > 1 ? "s" : ""})` : ""}`}
          value={`-${formatINR(slip.lopDeduction)}`}
        />
        <Row label="Provident fund" value={`-${formatINR(slip.providentFund)}`} />
        <Row label="Professional tax" value={`-${formatINR(slip.professionalTax)}`} />
        <Row label="TDS" value={`-${formatINR(slip.tds)}`} />
        <Row label="Net pay" value={formatINR(slip.net)} />
      </Panel>
    </div>
    );

}