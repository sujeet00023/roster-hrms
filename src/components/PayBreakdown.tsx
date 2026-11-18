import { formatINR } from "@/lib/payroll";

export interface PayLines {
    gross: number;
    lopDeduction: number;
    joiningDeduction: number;
    earnedGross: number;
    providentFund: number;
    professionalTax: number;
    tds: number;
    net: number;
    unpaidDays: number;
    preJoinDays: number;

}

function Line({ label, value, tone = "plain", strong = false }: {label: string; value: string; tone?: "plain" | "minus" | "good"; strong?: boolean}) {
    const color = tone === "minus" ? "text-away" : tone === "good" ? "text-present" : "text-link";
    return (
        <div className={`flex items-center justify-between gap-4 px-5 py-3 sm:px-6 ${tone === "good" ? "bg-present-soft" : ""}`}>
      <span className={`text-sm ${strong || tone === "good" ? "font-bold" : "text-ink-2"} ${tone === "good" ? "text-present" : ""}`}>{label}</span>
      <span className={`text-sm ${strong || tone === "good" ? "font-extrabold" : "font-semibold"} ${color}`}>{value}</span>
    </div>
    )

}


export function PayBreakdown({ p }: {p: PayLines }){

    return(
          <div className="divide-y divide-line">
      <Line label="Gross salary (full month)" value={formatINR(p.gross)} />
      {p.lopDeduction > 0 && (
        <Line label={`Unpaid days (${p.unpaidDays})`} value={`− ${formatINR(p.lopDeduction)}`} tone="minus" />
      )}
      {p.joiningDeduction > 0 && (
        <Line label={`Before you joined (${p.preJoinDays} working days)`} value={`− ${formatINR(p.joiningDeduction)}`} tone="minus" />
      )}
      {(p.lopDeduction > 0 || p.joiningDeduction > 0) && <Line label="Pay earned" value={formatINR(p.earnedGross)} strong />}
      <Line label="Provident fund" value={`− ${formatINR(p.providentFund)}`} tone="minus" />
      <Line label="Professional tax" value={`− ${formatINR(p.professionalTax)}`} tone="minus" />
      <Line label="Income tax" value={`− ${formatINR(p.tds)}`} tone="minus" />
      <Line label="Take-home" value={formatINR(p.net)} tone="good" />
    </div>
    );
}