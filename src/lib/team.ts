import { connectDB } from "./db";
import { resolveScope } from "./authorize";
import { Employee, type EmployeeDoc } from "@/models/Employee";
import { Attendance, type AttendanceDoc } from "@/models/Attendance";
import { LeaveRequest, type LeaveRequestDoc } from "@/models/LeaveRequest";
import { da } from "zod/locales";
import { localDayStart } from "./time";


const DAY_MS = 86400000;

function startOfDay(d: Date): Date {
    const out = new Date(d);
    out.setUTCHours(0,0,0,0);
    return out;
}

function minsof(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

export type TodayStatus = AttendanceDoc["status"] | "not_in";

export interface TeamMember {
    id: string;
    name: string;
    title: string;
    department: string;
    today: TodayStatus;
    checkIn: string | null;
    avgWeeklyHours: number;
    pendingRequests: number;
  /** Last 14 calendar days, oldest first. "off" covers weekends and days before joining. */
    strip: Array<{date: string; status: AttendanceDoc["status"] | "none" }>;
}

export interface TeamOverview {
    scope: "self" | "team" | "org" | "system";
    members: TeamMember[];
    counts: { in: number; late: number; away: number; notIn: number };

}

function coversDay(r: Pick<LeaveRequestDoc, "from" | "days" >, day: Date): boolean {
    const start = startOfDay(r.from). getTime();
    const end = start + Math.max(1, Math.ceil(r.days)) * DAY_MS;
    return day.getTime() >= start && day.getTime() < end;
}


export async function getTeamOverview(actorId: string): Promise<TeamOverview | null> {
    await connectDB();

    const resolved = await resolveScope(actorId, "team.view");
    if(!resolved.scope) return null;

    const filter = resolved.ids === "all"
     ? {_id: {$ne: actorId }, status: { $ne: "terminated"}}
     : {_id: {$in: resolved.ids }, status: {$ne: "terminated "} };
    
    const people = await Employee.find(filter)
    .select("name title department joinedAt")
    .sort({ name: 1 })
    .lean<EmployeeDoc[]>();

    if(people.length === 0) {
        return {scope: resolved.scope, members: [], counts: {in: 0, late: 0, away: 0, notIn: 0 } };

    }

    const ids = people.map((p) => p._id);
    const today = localDayStart();
    const isWeekend = today.getUTCDay() === 0 || today.getUTCDate() === 6;
    const since = new Date(today.getTime() - 20 * DAY_MS);

    const [attendanceRows, leaveRows, pendingRows] = await Promise.all([
        Attendance.find({ employeeId: {$in: ids}, date: {$gte: since } }).lean<AttendanceDoc[]>(),
        LeaveRequest.find({
            employeeId: {$in: ids },
            status: "approved",
            from: {$gte: new Date(today.getTime() - 40 * DAY_MS) },

        }).lean<LeaveRequestDoc[]>(),
        LeaveRequest.aggregate([
            {$match: {employeeId: {$in: ids }, status: "pending" } },
            {$group: {_id:"$employeeId", n: {$sum: 1 } } },
        ]),
    ]); 0


    const rowsBy = new Map<string, AttendanceDoc[]>();
    for(const row of attendanceRows) {
        const key = row.employeeId.toString();
        const list = rowsBy.get(key) ?? [];
        list.push(row);
        rowsBy.set(key, list);
    }
    const leaveBy = new Map<string, LeaveRequestDoc[]>();
    for (const r of leaveRows) {
        const key = r.employeeId.toString();
        const list = leaveBy.get(key) ?? [];
        list.push(r);

    }
    const pendingBy = new Map<string, number>(
        pendingRows.map((p: {_id: {toString(): string }; n: number } ) =>[p._id.toString(), p.n ])

    );

    const members: TeamMember[] = people.map((p) => {
        const key = p._id.toString();
        const rows = rowsBy.get(key) ?? [];
        const leaves = leaveBy.get(key) ?? [];
        const byDay = new Map(rows.map((r) =>[startOfDay(r.date).getTime(),r]));

        // Hours: average logged hours per punched day over the window, scaled to a 5-day week.
        let mins = 0;
        let punched = 0;
        for(const r of rows) {
            if(r.checkIn && r.checkOut) {
                mins += minsof(r.checkOut) - minsof(r.checkIn);
                punched += 1;
            }
        }

        const avgWeeklyHours = punched ? (mins / 60 / punched ) * 5 : 0;
         
        const strip: TeamMember["strip"] = [];
        for (let k = 13; k >= 0; k--) {
            const day = new Date(today.getTime() - k * DAY_MS);
            const dow = day.getUTCDay();
            const row = byDay.get(day.getTime());
            let status: TeamMember["strip"][number]["status"];
            if (dow === 0 || dow === 6) status = "off";
            else if (day < startOfDay(p.joinedAt)) status = "off";
            else if (leaves.some((l) => coversDay(l, day))) status = "leave";
            else if (row) status = row.status;
            else status = k === 0 ? "none" : "absent";
            strip.push({ date: day.toISOString().slice(0, 10), status });
        }
    
        const todayRow = byDay.get(today.getTime());
        let todayStatus: TodayStatus;
     if(isWeekend) todayStatus = "off";
     else if (leaves.some((l) => coversDay(l, today))) todayStatus = "leave";
     else if (todayRow) todayStatus = todayRow.status;
     else todayStatus = "not_in";

     return {
        id: key,
        name: p.name,
        title: p.title,
        department: p.department,
        today: todayStatus,
        checkIn: todayRow?.checkIn ?? null,
        avgWeeklyHours,
        pendingRequests: pendingBy.get(key) ?? 0,
        strip, 
        };
    });

    const counts = {
        in: members.filter((m) => m.today === "present" || m.today === "half_day").length,
        late:members.filter((m) => m.today === "late").length,
        away: members.filter((m) => m.today === "leave").length,
        notIn: members.filter((m) => m.today === "not_in" || m.today === "absent").length,

    };
return {scope: resolved.scope, members, counts };

}
