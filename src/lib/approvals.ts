import { Types } from "mongoose";
import { connectDB } from "./db";
import { assertCan, resolveScope } from "./authorize";
import { Employee, type EmployeeDoc } from "@/models/Employee";
import { LeaveRequest, type LeaveRequestDoc, type LeaveType } from "@/models/LeaveRequest";
import { AuditLog } from "@/models/AuditLog";

export interface PendingApproval {
 
    id: string;
    employee: {id: string; name: string; title: string; department: string };
    type: LeaveType;
    from: Date;
    days: number;
    reason: string;
  /** What the auto-approval rule said when it deferred this request. */
    deferredBecause: string | null;
    balanceForType: number;
    submittedAt: Date;
}

async function pendingFilter(actorId: string) {
 const resolved = await resolveScope(actorId, "leave.approve");
 if(!resolved.scope) return null;

 if(resolved.ids === "all") {
    return {status: "pending", employeeId: {$ne: new Types.ObjectId(actorId) } };

 }
 return {status: "pending", employeeId: {$in: resolved.ids } };

}

export async function countPendingApprovals(actorId:string): Promise<number> {
    await connectDB();
    const filter = await pendingFilter(actorId);
    if(!filter) return 0;
    return LeaveRequest.countDocuments(filter);
    
}

export async function listPendingApprovals(actorId: string): Promise<PendingApproval[]> {
    await connectDB();
    const filter = await pendingFilter(actorId);
    if(!filter) return [];

    const requests = await LeaveRequest.find(filter)
    .sort({ from: 1})
    .limit(100)
    .lean<LeaveRequestDoc[]>();
 if(requests.length === 0) return [];


 const people = await Employee.find({ _id: {$in: requests.map((r) => r.employeeId ) } })
 .select("name title department leaveBalance")
 .lean<EmployeeDoc[]>();
 const byId = new Map(people.map((p) => [p._id.toString(), p]));

 return requests.flatMap((r) => {
    const person = byId.get(r.employeeId.toString());
    if(!person) return [];
    return [
        {
            id: r._id.toString(),
            employee: {
                id: person._id.toString(),
                name: person.name,
                title: person.title,
                department: person.department,
            },
            type: r.type,
            from: r.from,
            days: r.days,
            reason:r.reason,
            deferredBecause: r.decisionNote,
            balanceForType: person.leaveBalance[r.type],
            submittedAt: r.createdAt,
        },

    ];
 });
    
}


export class ApprovalError extends Error {
    constructor(
        message: string,
        public status: number
    ) {
        super(message);
    }
}

/**
 * Approve or reject a pending request.
 *
 * Order matters here: authorize against the *request's owner* (so a team
 * lead can only decide for their own subtree), block self-approval, then
 * flip the status with a filter on status:"pending" so two approvers
 * clicking at once can't both win or double-deduct the balance.
 */
export async function decideLeaveRequest(
    actorId: string,
    requestId: string,
    decision: "approved" | "rejected",
    note?: string
): Promise<{status: "approved" | "rejected" }> {
    await connectDB();

    if(!Types.ObjectId.isValid(requestId)) throw new ApprovalError("Request not found", 404 );
    const request = await LeaveRequest.findById(requestId).lean<LeaveRequestDoc>();
    if(!request) throw new ApprovalError("Request not found.", 404);

    const ownerId = request.employeeId.toString();
    if(ownerId === actorId) {
      throw new ApprovalError("You can't decide your own leave request.", 403);
    }

    try {
      await assertCan(actorId, "leave.approve", ownerId);
    }catch{
        throw new ApprovalError("You don't have authority over this person's leave", 403);
    }

    if(request.status !== "pending") {
        throw new ApprovalError(`this request was already ${request.status}.`, 409);
    }

    if(decision === "approved"){
        // Deduct first, guarded on sufficient balance, so a failed deduction
    // leaves the request untouched.
    const deducted = await Employee.updateOne(
        { _id: request.employeeId, [`leaveBalance.${request.type}`]: {$gte: request.days } },
        {$inc: {[`leaveBalance.${request.type}`]: -request.days } }
    );
    if(deducted.modifiedCount === 0) {
        throw new ApprovalError(
            `Not enough ${request.type} leave left to approve ${request.days} day(s).`,
            409
        );
    }
}

const cleanNote = note?.trim() || null;
const updated = await LeaveRequest.findOneAndUpdate(
    {_id: request._id, status: "pending" },
    {
        $set : {
            status: decision,
            decidedBy: new Types.ObjectId(actorId),
            decidedAt: new Date(),
            decisionNote: cleanNote ?? (decision === "approved" ? "Approved by your manager. ": "Declined by your manager."),
            autoDecided: false,
        },
    },
    {new: true}
);

if(!updated) {
    if(decision === "approved") {
        await Employee.updateOne(
            {_id: request.employeeId },
            {$inc: {[`leaveBalance.${request.type}`]: request.days } }
        );
    }    
        throw new ApprovalError("This request qas just decided by someone else.", 409);

}

    await AuditLog.create({
        actorId,
        action: `leave.${decision}`,
        targetEmployeeId: request.employeeId,
        scope: "decision",
        metadata: {requestId, type: request.type, days: request.days, note: cleanNote },

    });
    return{status: decision};
}
