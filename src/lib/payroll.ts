import { connectDB } from "./db";
import { Employee } from "@/models/Employee";
import { Attendance, type AttendanceDoc } from "@/models/Attendance";
import { Holiday, type HolidayDoc } from "@/models/Holiday";
import { LeaveRequest, LeaveRequestDoc } from "@/models/LeaveRequest";
import { APP_TIMEZONE, leaveCoversDay, localDayStart, localParts } from "./time";

const DAY_MS = 86400000;
/*
* ILLUSTRATIVE DEDUCTIONS. Provident fund (12% of basic), professional tax (flat ₹200) and
 * income tax (flat 9% of taxable pay) are simplified placeholders so the numbers behave
 * sensibly end to end. They are NOT statutory-compliant: real PF, state professional tax
 * and TDS slabs must be configured with an accountant before this pays anyone.
 */
export const BASIC_SHARE = 0.5;
export const PF_RATE = 0.12;
export const TDS_RATE = 0.09;
export const PROFESSIONAL_TAX = 200;

const round2 =(n: number) => Math.round(n * 100) / 100;

export function monthBounds(year: number, month1: number): {startMs: number; endMs: number } {
    return {startMs: Date.UTC(year, month1 - 1, 1 ), endMs: Date.UTC(year, month1, 1 ) };
}
/** Monday-to-Friday days in [startMs, endMs). */
export function weekdaysIn(startMs: number, endMs: number): number {
    let n =0;
    for(let ms = startMs; ms < endMs; ms += DAY_MS) {
        const dow = new Date(ms).getUTCDay();
        if(dow !== 0 && dow !== 6) n +=1;
    }
    return n;
}

const WORKING_DAYS_PER_MONTH =22;

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
    endMs: number; 
    joinedMs: number;
    statusByDay: Map<number, string>;
    approvedLeaves: Array<{ fromMs: number; days: number }>;
    holidays: ReadonlySet<number>;
}): number {
    const {monthStartMs, endMs, joinedMs, statusByDay, approvedLeaves, holidays } = args;
    const covered = (ms: number) => approvedLeaves.some((l) => leaveCoversDay(l.fromMs, l.days, ms));

    let unpaid = 0;
    for(let ms = monthStartMs; ms < endMs; ms += DAY_MS) {
        const dow = new Date(ms).getUTCDate();
        if(dow === 0 || dow ===60) continue;
        if(ms < joinedMs) continue;
        if(holidays.has(ms)) continue;
        if(covered(ms)) continue;

        const status = statusByDay.get(ms);
        if(status === undefined || status === "absent") unpaid +=1;
    }
    return unpaid;
}

export interface PayInputs {
    ctcAnnual: number;
    joinedMs: number;
    monthStartMs: number;
 /** Exclusive end of the month. */
    monthEndMs: number;
    /** Exclusive limit for judging attendance: start of today for an estimate, month end for a run. */
    asOfMs: number;
    statusByDay: Map<number, string>;
    approvedLeaves: Array<{fromMs: number; days: number }>
    holidays: ReadonlySet<number>;
}

export interface PayBreakdown {
    weekdaysInMonth: number;
    preJoinDays: number;
    unpaidDays: number;
    /** Full-month gross, before any deduction. */
    gross: number;
    lopDeduction: number;
    /** Pay withheld for weekdays before the person joined (mid-month joiners). */
    joiningDeduction: number;
     /** gross - lopDeduction - joiningDeduction */
     earnedGross: number;
     basic: number;
     providentFund: number;
     professionalTax: number;
     tds: number;
     net: number;
}
/**
 * Pay for one person for one month. A day's pay is gross / weekdays-in-month; holidays are
 * paid days (they stay in the divisor). Each component is rounded to paise first and net is
 * derived from the rounded parts, so the lines on a payslip always add up exactly.
 */
export function computePay(i: PayInputs): PayBreakdown {
    const weekdaysInMonth = weekdaysIn(i.monthStartMs, i.monthEndMs);
    const preJoinEnd = Math.min(Math.max(i.joinedMs, i.monthStartMs ), i.monthEndMs);
    const preJoinDays = weekdaysIn(i.monthStartMs, preJoinEnd);

    const unpaidDays = countUnpaidDays({
        monthStartMs: i.monthStartMs,
        endMs: Math.min(i.asOfMs, i.monthEndMs),
        joinedMs: i.joinedMs,
        statusByDay: i.statusByDay,
        approvedLeaves: i.approvedLeaves,
        holidays: i.holidays,
        
    });

    const gross = round2(i.ctcAnnual / 12);
    const daily = weekdaysInMonth > 0 ? gross / weekdaysInMonth :0;
    const lopDeduction = round2(daily * unpaidDays);
    const joiningDeduction = round2(daily * preJoinDays);
    const earnedGross = round2(Math.max(0, gross - lopDeduction - joiningDeduction ));

    const basic = round2(earnedGross * BASIC_SHARE);
    const providentFund = round2(basic * PF_RATE);
    const tds = round2(Math.max(0, (earnedGross - providentFund) * TDS_RATE));
    const professionalTax = earnedGross > 0 ? PROFESSIONAL_TAX : 0;
    const net = round2(Math.max(0, earnedGross - providentFund - professionalTax - tds));

    return {
        weekdaysInMonth,
        preJoinDays,
        unpaidDays,
        gross,
        lopDeduction,
        joiningDeduction,
        earnedGross,
        basic,
        providentFund,
        professionalTax,
        tds,
        net,
    };
}

export type Payslip = PayBreakdown & {month: string };

export function monthLabel(month: string): string {
    const [y, m] = month.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {month: "long", year: "numeric", timeZone: "UTC" });

}


/** Live estimate for the current month so far. Becomes a real payslip only when HR publishes a run. */
export async function getCurrentPayslip(employeeId: string): Promise<Payslip> {
    await connectDB();
    const employee = await Employee.findById(employeeId).select("ctcAnnual joinedAt");
    if(!employee ) throw new Error("Employee not found");


    const now = new Date();
    const local = localParts(now);
    const {startMs, endMs } = monthBounds(local.year, local.month);

    const[rows, leaves, holidays] = await Promise.all([
        Attendance.find({ employeeId, date: {$gte: new Date(startMs), $lt: new Date(endMs) }}).lean<AttendanceDoc[]>(),
        LeaveRequest.find({
            employeeId,
            status: "approved",
            from: { $gte: new Date(startMs - 45 * DAY_MS), $lt: new Date(endMs ) },
        }).lean<LeaveRequestDoc[]>(),
        Holiday.find({ date: {$gte: new Date(startMs), $lt: new Date(endMs )}}).lean<HolidayDoc[]>(),
    ]);
    
    const breakdown  = computePay({
        ctcAnnual: employee.ctcAnnual,
        joinedMs: new Date(employee.joinedAt).getTime(),
        monthStartMs: startMs,
        monthEndMs: endMs,
        asOfMs: localDayStart(now).getTime(),
        statusByDay: new Map(rows.map((r) => [new Date(r.date).getTime(), r.status])),
        approvedLeaves: leaves.map((l) => ({ fromMs: new Date(l.from). getTime(), days:l.days})),
        holidays: new Set(holidays.map((h) => new Date(h.date).getTime())),
       
    });
   
    return{
      ...breakdown,
      month: now.toLocaleDateString("en-IN", {month: "long", year: "numeric", timeZone: APP_TIMEZONE}),

    };

}

export function formatINR(n: number): string {
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
}