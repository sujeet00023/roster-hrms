import { Types } from "mongoose";
import { connectDB } from "./db";
import { assertCan, resolveScope } from "./authorize";
import { computePay, monthBounds, type PayBreakdown } from "./payroll";
import { localDayStart, localParts } from "./time";
import { Attendance, type AttendanceDoc } from "@/models/Attendance";
import { AuditLog } from "@/models/AuditLog";
import { Employee, type EmployeeDoc } from "@/models/Employee";
import { Holiday, type HolidayDoc } from "@/models/Holiday";
import { LeaveRequest, type LeaveRequestDoc } from "@/models/LeaveRequest";
import { PayrollRun, type PayrollRunDoc } from "@/models/PayrollRun";
import { PayslipRecord, type PayslipRecordDoc } from "@/models/PayslipRecord";

const DAY_MS = 86400000;
const round2 = (n: number) => Math.round(n * 100) / 100;

export class PayrollError extends Error {
    constructor(
        message: string,
        public status: number
    ){
        super(message);
    }
}

export function parseMonth(month: string): { year: number; month1: number, startMs: number, endMs: number} | null {
    const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
    if(!m) return null;
    const year = Number(m[1]);
    const month1 = Number(m[2]);
    return {year, month1, ...monthBounds(year, month1) };

}

export function recentCompletedMonths(now: Date = new Date(), count = 3): string[] {
    const {year, month } = localParts(now);
    const out: string[] = [];
    let y = year;
    let m = month;
    for(let i = 0; i< count; i++ ){
        m -= 1;
        if(m === 0) {
            m =12;
            y -= 1;
        }
        out.push(`${y}-${String(m).padStart(2, "0")}`);
    }
    return out;
}

export interface RunRow extends PayBreakdown {
    employeeId: string;
    name: string;
    title: string;
    department: string;
}

export interface RunPreview {
    month: string;
    rows: RunRow[];
/** People left out because no salary is set on their record. */
    skippedNoSalary: number;
    totals: {employees: number; gross: number; earnedGross: number; net: number; unpaidDays: number };

}

async function requireRunAccess(actorId: string ) {
    try {
        await assertCan(actorId, "payroll.run", undefined, {silent: true });

    }catch {
        throw new PayrollError("You don't have permission to run payroll", 403);

    }
}

async function compute(month: string): Promise<RunPreview> {
    const parsed = parseMonth(month);
    if(!parsed) throw new PayrollError("Choose a valid month", 400);

    if(parsed.endMs > localDayStart().getTime()) {
        throw new PayrollError("That month hasn't ended yet, so it can't be run", 400);

    }
    if(await PayrollRun.exists({ month })){
        throw new PayrollError("Payroll for that month has already been published.", 409);

    }

    const {startMs, endMs } = parsed;
    const people = await Employee.find({status: {$ne: "terminated"}, joinedAt: {$lt: new Date(endMs)} })
    .select("name title department ctcAnnual joinedAt" )
    .sort({name: 1 })
    .lean<EmployeeDoc[]>();

    const paid = people.filter((p) => p.ctcAnnual > 0);
    const ids = paid.map((p) => p._id );

    const [attendance, leaves, holidays] = await Promise.all([
        Attendance.find({ employeeId: {$in: ids }, date: {$gte: new Date(startMs), $lt: new Date(endMs) }})
        .select("employeeId date status")
        .lean<AttendanceDoc[]>(),
        LeaveRequest.find({
            employeeId: { $in: ids },
            status: "approved",
            from: {$gte: new Date(startMs - 45 * DAY_MS), $lt: new Date(endMs) },
        }).lean<LeaveRequestDoc[]>(),
        Holiday.find({date: {$gte: new Date(startMs), $lt: new Date(endMs) }}).lean<HolidayDoc[]>(),

    ]);

    const holidaySet = new Set(holidays.map((h) => new Date(h.date).getTime()));
    const statusBy = new Map<string, Map<number, string>>();
    for (const a of attendance) {
        const key = a.employeeId.toString();
        const m = statusBy.get(key) ?? new Map<number, string>();
        m.set(new Date(a.date).getTime(), a.status);
        statusBy.set(key, m);
    }
    const leavesBy = new Map<string, Array<{ fromMs: number; days: number}>>();
    for (const l of leaves) {
        const key = l.employeeId.toString();
        const list = leavesBy.get(key) ?? [];
        list.push({ fromMs: new Date(l.from).getTime(), days: l.days });
        leavesBy.set(key, list);
    }

    const rows: RunRow[] = paid.map((p) => {
        const key = p._id.toString();
        const pay = computePay({
            ctcAnnual: p.ctcAnnual,
            joinedMs: new Date(p.joinedAt).getTime(),
            monthStartMs: startMs,
            monthEndMs: endMs,
            asOfMs: endMs,
            statusByDay: statusBy.get(key) ?? new Map(),
            approvedLeaves: leavesBy.get(key) ?? [],
            holidays: holidaySet,
            
        });
        return {
            employeeId: key, name: p.name, title:p.title, department: p.department, ...pay
        };
    });

    const sum = (f: (r: RunRow) => number) => round2(rows.reduce((a, r) => a+ f(r), 0));
    return {
        month,
        rows,
        skippedNoSalary: people.length - paid.length,
        totals: {
            employees: rows.length,
            gross: sum((r) => r.gross),
            earnedGross: sum((r) => r.earnedGross),
            net: sum((r) => r.net),
            unpaidDays: rows.reduce((a, r) => a+ r.unpaidDays, 0),
        },
    };
}

    export async function previewRun(actorId: string, month: string): Promise<RunPreview> {
        await connectDB();
        await requireRunAccess(actorId);
        const preview = await compute(month);
        await AuditLog.create({
            actorId,
            action: "payroll.preview",
            scope: "org",
            metadata: {month, employees: preview.totals.employees },
        });
        return preview;

    }

    /**
 * Publishes the run. The figures are recomputed here on the server - never taken from the
 * browser - and the unique month on PayrollRun is what makes a double publish impossible.
 */
export async function publishRun(actorId: string, month: string): Promise<{month: string; employees: number }> {
    await connectDB();
    await requireRunAccess(actorId);

    const preview = await compute(month);
    if(preview.rows.length === 0) throw new PayrollError("There is nobody with a salary to pay for that month.", 400);

    let run;
    try {
        run = await PayrollRun.create({
            month,
            employeeCount: preview.totals.gross,
            totalNet: preview.totals.net,
            totalUnpaidDays: preview.totals.unpaidDays,
            createdBy: new Types.ObjectId(actorId),
        });

    }catch(err) {
        if((err as {code?: number}).code === 11000) {
            throw new PayrollError("Payroll for that month has already been published.", 409);
        }
        throw err;
    }
    try {
        await PayslipRecord.insertMany(
            preview.rows.map((r) => ({
                runId: run._id,
                month,
                employeeId: new Types.ObjectId(r.employeeId),
                name: r.name,
                title: r.title,
                department: r.department,
                weekdaysInMonth: r.weekdaysInMonth,
                preJoinDays: r.preJoinDays,
                unpaidDays: r.unpaidDays,
                gross: r.gross,
                lopDeduction:r.lopDeduction,
                joiningDeduction: r.joiningDeduction,
                earnedGross: r.earnedGross,
                basic: r.basic,
                providentFund: r.providentFund,
                professionalTax: r.professionalTax,
                tds: r.tds,
                net:r.net,
            }))
        );
    }catch(err) {

        await PayslipRecord.deleteMany({runId: run._id });
        await PayrollRun.deleteOne({ _id: run._id });
        throw err;
    }

    await AuditLog.create({
        actorId,
        action: "payroll.publish",
        scope: "org",
        metadata: {month, employees: preview.totals.employees },
    });
    return {month, employees: preview.totals.employees };
}

export interface RunSummary {
    id: string;
    month: string;
    employeeCount: number;
    totalNet: number;
    totalUnpaidDays: number;
    publishedAt: Date;
}

/** Past runs for HR. Null when the viewer holds no payroll access. */
export async function listRuns(actorId: string ): Promise<RunSummary[] | null> {
    await connectDB();
    const scope =await resolveScope(actorId, "payroll.run");
    if(scope.scope !== "org") return null;

    const runs = await PayrollRun.find({}).sort({month: -1 }).limit(24).lean<PayrollRunDoc[]>();
    return runs.map((r) => ({
        id: r._id.toString(),
        month: r.month,
        employeeCount: r.employeeCount,
        totalNet: r.totalNet,
        totalUnpaidDays: r.totalUnpaidDays,
        publishedAt: r.publishedAt,
    }));
}

export async function getMyPayslips(employeeId: string): Promise<PayslipRecordDoc[]>{
    await connectDB();
    return PayslipRecord.find({ employeeId}).sort({ month: -1 }).limit(24).lean<PayslipRecordDoc[]>();
}
