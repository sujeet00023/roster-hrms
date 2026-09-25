import { connectDB } from "./db";
import { Attendance, type AttendanceDoc } from "@/app/models/Attendance";
import { Employee  } from "@/app/models/Employee";
import { start } from "node:repl";

function minsOf(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

function startOfDay(d: Date): Date {
    const out = new Date(d);
    out.setUTCHours(0,0,0,0);
    return out;
}
/** Grades a punch against the employee's own shift start. Late = more than 15 minutes after shift start. */
export function gradePunch(
   shiftStart: string,
   checkIn: string,
   checkOut: string,
): "present" | "late" | "half_day" {
    const loggedMinutes = minsOf(checkOut) - minsOf(checkIn);
    if(loggedMinutes < 240 ) return "half_day";
    return minsOf(checkIn) - minsOf(shiftStart) > 15 ? "late": "present";
} 

export interface AttendanceRow {
    date: Date;
    status: AttendanceDoc["status"];
    checkIn: string | null;
    checkOut: string | null;
}
/** Last `days` calendar days of attendance for one employee, oldest first. */
export async function getAttendanceHistory(
    employeeId: string,
    days = 30
): Promise<AttendanceRow[]> {
    await connectDB();
    const since = startOfDay(new Date(Date.now()- days * 86400000));
    const rows = await Attendance.find({ employeeId, date: { $gte: since } } )
      .sort({ date: 1 })
      .lean<AttendanceDoc[]>();

    return rows.map((r) => ({
        date: r.date,
        status: r.status,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
      }));
}
/** Today's row for one employee, or null if nothing recorded yet. */
export async function getTodayAttendance(employeeId: string): Promise<AttendanceRow | null> {
    await connectDB();
    const today = startOfDay(new Date());
    const row = await Attendance.findOne({ employeeId, date: today }).lean<AttendanceDoc>();
    if(!row) return null;
    return {date: row.date, status: row.status, checkIn: row.checkIn, checkOut: row.checkOut };

}
/** Average hours per working day over the last 21 calendar days. */
export async function getAverageWeeklyHours(employeeId: string): Promise<number> {
    const history = await getAttendanceHistory(employeeId, 21);
    let mins = 0;
    let workingDays = 0;
    for (const row of history) {
        if(row.checkIn && row.checkOut) {
            mins += minsOf(row.checkOut) - minsOf(row.checkIn);
            workingDays += 1;
        }
    }
    if(workingDays === 0) return 0;
    return (mins / 60 / workingDays) * 5;
}
/** Records (or overwrites) today's check-in for the given employee. */
export async function checkIn(employeeId: string): Promise<AttendanceRow> {
    await connectDB();
    const employee = await Employee.findById(employeeId).select("shiftStart");
    if(!employee) throw new Error("Employee not found");

    const today = startOfDay(new Date());
    const now = new Date();
    const hhmm = `${String(now.getUTCHours()).padStart(2, "0")}: ${String(
        now.getUTCMinutes()
    ).padStart(2, "0") }`;

    const status = minsOf(hhmm) - minsOf(employee.shiftStart) > 15 ? "late" : "present";
    const doc = await Attendance.findOneAndUpdate(
        {employeeId, date: today },
        {$set: {checkIn: hhmm, status } },
        {upsert: true, new: true }
    ).lean<AttendanceDoc>();

    return {date: doc!.date, status: doc!.status, checkIn: doc!.checkIn, checkOut: doc!.checkOut };

}
/** Records today's check-out and re-grades the day (e.g. into half_day if it was short). */
export async function checkOut(employeeId: string): Promise<AttendanceRow> {
    await connectDB();
    const employee = await Employee.findById(employeeId).select("shiftStart");
    if(!employee) throw new Error("employee not found ");

    const today = startOfDay(new Date());
    const existing = await Attendance.findOne({ employeeId, date: today } );
    if(!existing || !existing.checkIn){
        throw new Error("Check in before checking out.");
    }

    const now = new Date();
    const hhmm = `${String(now.getUTCHours()).padStart(2, "0")}: ${String(
        now.getUTCMinutes()

    ).padStart(2, " 0")}`

    const status = gradePunch(employee.shiftStart, existing.checkIn, hhmm);
    existing.checkOut = hhmm;
    existing.status = status;
    await existing.save();

    return {date:existing.date, status: existing.status, checkIn: existing.checkIn, checkOut:existing.checkOut };
}