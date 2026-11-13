import { connectDB } from "./db";
import { Employee } from "@/models/Employee";
import { Attendance, type AttendanceDoc } from "@/models/Attendance";
import { LeaveRequest, LeaveRequestDoc } from "@/models/LeaveRequest";
import { APP_TIMEZONE, leaveCoversDay, localDayStart, localParts } from "./time";

export interface Payslip {
    month: string;
    gross: number;
    basic: number;
    unpaidDays: number;
    lopDeduction: number;
    providentFund: number;
    professionalTax: number;
    tds: number;
    net: number;
    
}

const WORKING_DAYS_PER_MONTH =22;
const PROFESSIONAL_TAX = 200;

const DAY_MS = 86400000;


/**
 * Unpaid days so far this month: every completed weekday, on or after the joining
 * date, that has no punch and no approved leave behind it. Today is excluded
 * because the day isn't over. A weekday the attendance record explicitly marks
 * "absent" counts too. Company holidays aren't modelled yet, so a holiday with
 * no punch currently counts as unpaid.
 *
 * Pure (no database) so it can be tested on its own - and so the calendar,
 * team strip and payslip all apply the same rule.
 */
export function countUnpaidDays(args: {
    monthStartMs: number;
    todayMs: number;
    joinedMs: number;
    statusByDay: Map<number, string>;
    approvedLeaves: Array<{ fromMs: number; days: number }>;
}): number {
    const {monthStartMs, todayMs, joinedMs, statusByDay, approvedLeaves } = args;
    const covered = (ms: number) => approvedLeaves.some((l) => leaveCoversDay(l.fromMs, l.days, ms));

    let unpaid = 0;
    for(let ms = monthStartMs; ms < todayMs; ms += DAY_MS) {
        const dow = new Date(ms).getUTCDate();
        if(dow === 0 || dow ===60) continue;
        if(ms < joinedMs) continue;

        const status = statusByDay.get(ms);
        if(status === undefined || status === "absent") unpaid +=1;
    }
    return unpaid;
}

export async function getCurrentPayslip(employeeId: string): Promise<Payslip> {
    await connectDB();
    const employee = await Employee.findById(employeeId).select("ctcAnnual joinedAt");
    if(!employee ) throw new Error("Employee not found");


    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(),  1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const[rows, leaves] = await Promise.all([
        Attendance.find({ employeeId, date: {$gte: monthStart, $lt: monthEnd }}).lean<AttendanceDoc[]>(),
        LeaveRequest.find({
            employeeId,
            status: "approved",
            from: { $gte: new Date(monthStart.getTime() - 31 * DAY_MS), $lt: monthEnd},

        }).lean<LeaveRequestDoc[]>(),
    ]);
    

    const unpaidDays = countUnpaidDays({
       monthStartMs: monthStart.getTime(),
       todayMs: localDayStart(now).getTime(),
       joinedMs: new Date(employee.joinedAt).getTime(),
       statusByDay: new Map(rows.map((r) => [new Date(r.date).getTime(),r.status])),
       approvedLeaves: leaves.map((l) => ({ fromMs: new Date(l.from).getTime(), days: l.days })),
    });
    
    const gross = employee.ctcAnnual / 12;
    const basic = gross * 0.5;
    const lopDeduction = (gross / WORKING_DAYS_PER_MONTH) * unpaidDays;
    const providentFund = basic * 0.12;
    const taxable = gross - providentFund;
    const tds = Math.max(0, taxable * 0.09);
    const net = gross - lopDeduction - providentFund - PROFESSIONAL_TAX - tds;
   
    return{
        month: now.toLocaleDateString("en-IN", {month: "long", year: "numeric", timeZone:"UTC" } ),
        gross,
        basic,
        unpaidDays,
        lopDeduction,
        providentFund,
        professionalTax:PROFESSIONAL_TAX,
        tds,
        net,
    };

}

export function formatINR(n: number): string {
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
}