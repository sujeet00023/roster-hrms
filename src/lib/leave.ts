import { connectDB } from "./db";
import { Employee, type EmployeeDoc } from "@/models/Employee";
import { LeaveRequest,type LeaveRequestDoc, type LeaveType } from "@/models/LeaveRequest";

const AUTO_APPROVE_MAX_DAYS = 2;
const TEAM_AWAY_CEILING = 1/3;

async function teamAwayShare(employee:EmployeeDoc): Promise<number> {
    if(!employee.managerId) return 0;
    const team = await Employee.find({ managerId: employee.managerId }).select("_id");
    if(team.length === 0) return 0;

    const today = new Date();
    const away = await LeaveRequest.countDocuments({
        employeeId: { $in: team.map((t) => t._id ) },
        status: "approved",
        from: { $lte: today },
    });
    return away / team.length;
}

interface Decision {
    approved: boolean;
    note: string;
}

/**
 * The rule that clears short, well-covered requests without a human in
 * the loop. Anything it declines to approve is left "pending" for a
 * manager or HR to decide in Phase 3 - this function never rejects
 * outright, only defers.
 */
async function decide(
    employee: EmployeeDoc,
    type: LeaveType,
    days: number
):Promise<Decision> {
    if(days > AUTO_APPROVE_MAX_DAYS) {
        return {approved: false, note: `${days} days is over the ${AUTO_APPROVE_MAX_DAYS}-day auto-approval limit - send for review`};
    }
    if(employee.leaveBalance[type] < days) {
        return {approved: false, note:`Only ${employee.leaveBalance[type]} ${type} day(s) left-send for review`};
    }
    const away = await teamAwayShare(employee);
    if(away >= TEAM_AWAY_CEILING) {
        return {approved: false, note:"Too much of the team is already away this week - send for review."};

    }
    return {approved: true, note: `${days} day(s), balance available, team covered-approved automatically.`};
}

export interface LeaveSummary {
    balance: { earned: number; casual: number; sick: number };
    requests: Array<{
        id: string;
        type: LeaveType;
        from: Date;
        days: number;
        reason: string;
        status: LeaveRequestDoc["status"];
        decisionNote: string | null;
        autoDecided: boolean;
        createdAt: Date;
    }>;
}

export async function getLeaveSummary(employeeId: string): Promise<LeaveSummary> {
    await connectDB();
    const employee = await Employee.findById(employeeId).select("leaveBalance");
    const requests = await LeaveRequest.find({ employeeId}).sort({ createdAt: -1}).limit(20).lean<LeaveRequestDoc[]>();

    return{
        balance: employee?.leaveBalance ?? { earned: 0, casual: 0, sick: 0 },
        requests: requests.map((r) => ({
            id: r._id.toString(),
            type: r.type,
            from: r.from,
            days: r.days,
            reason: r.reason,
            status: r.status,
            decisionNote: r.decisionNote,
            autoDecided: r.autoDecided,
            createdAt: r.createdAt,

        }) ),
    };
}

export async function submitLeaveRequest(
    employeeId: string,
    input: {type: LeaveType; from: Date; days: number; reason: string }
): Promise<{ status: LeaveRequestDoc["status"]; note: string }> {
    await connectDB();
    const employee = await Employee.findById(employeeId);
    if(!employee) throw new Error("Employee not found");

    const decision = await decide(employee, input.type, input.days);

    const request = await LeaveRequest.create({
        employeeId,
        type: input.type,
        from: input.from,
        days: input.days,
        status: decision.approved ? "approved" : "pending",
        decidedAt: decision.approved ? new Date() : null,
        decisionNote: decision.note,
        autoDecided: decision.approved,
        
    });
    if(decision.approved) {
        employee.leaveBalance[input.type] -= input.days;
        await employee.save();
    }

    return {status: request.status, note: decision.note }
}