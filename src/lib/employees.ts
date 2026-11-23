import { Types } from "mongoose";
import { connectDB } from "./db";
import { resolveScope } from "./authorize";
import { Employee, type EmployeeDoc } from "@/models/Employee";
import { AuditLog } from "@/models/AuditLog";


export class EmployeeError extends Error {
    constructor (
        message: string,
        public status: number
    ) {
        super (message);
    }
}

/**
 * Editing other people's records needs ORG scope, checked explicitly. Every employee holds
 * profile.edit at *self* scope (to update their own details), so a plain can() check would
 * wrongly let anyone edit their own title or salary through this path.
 */
export async function canEditPeople(actorId: string): Promise<boolean> {
    return (await resolveScope(actorId, "profile.edit")).scope === "org";
    
}

export function descendantIds(
    rootId: string,
    pairs: ReadonlyArray<{id: string; managerId: string | null }>
): Set<string> {
    const childrenOf = new Map<string, string[]>();
    for (const p of pairs) {
        if(!p.managerId) continue;
        const list = childrenOf.get(p.managerId) ?? [];
        list.push(p.id);
        childrenOf.set(p.managerId, list);
    }
     
    const seen = new Set<string>();
    const queue = [rootId];
    while(queue.length) {
        const cur = queue.pop()!;
        for (const child of childrenOf.get(cur) ?? []) {
            if(!seen.has(child)) {
                seen.add(child);
                queue.push(child);
            }
        }
    }
    seen.delete(rootId);
    return seen;
}

async function reportingPairs() {
  const all = await Employee.find({}).select("managerId").lean<Pick<EmployeeDoc, "_id" | "managerId">[]>();
  return all.map((e) => ({ id: e._id.toString(), managerId: e.managerId ? e.managerId.toString() : null }));    
}

export interface EditContext {
    employee: {
        id: string;
        name: string;
        email: string;
        title: string;
        department: string;
        managerId: string | null;
        shiftStart: string;
        ctcAnnual: number;
        joinedAt: Date;
        status: EmployeeDoc["status"];
    };
    /** People who may become this person's manager: not themselves, nobody who reports to them, nobody who has left. */
    managers: Array<{id: string; name: string; title: string }>;
    departments: string[];
}

export async function getEditContext(actorId: string, targetId: string): Promise<EditContext | null > {
    await connectDB();
    if(!(await canEditPeople(actorId)) || Types.ObjectId.isValid(targetId)) return null;
    
    const target = await Employee.findById(targetId).lean<EmployeeDoc>();
    if(!target || target.status === "terminated") return null;

    const pairs = await reportingPairs();
    const blocked = descendantIds(targetId, pairs);
    blocked.add(targetId);

    const [candidates, departments] = await Promise.all([
        Employee.find({ status: { $in: ["active", "on_leave"] } })
        .select("name title")
        .sort({ name: 1})
        .lean<Pick<EmployeeDoc, "_id" | "name" | "title" >[]>(),
        Employee.distinct("department", { status: {$ne: "terminated" } }) as Promise<string[]>,
    ]);

    return {
        employee: {
            id: target._id.toString(),
            name: target.name,
            email: target.email,
            title: target.title,
            department: target.department,
            managerId: target.managerId ? target.managerId.toString() : null,
            shiftStart: target.shiftStart,
            ctcAnnual: target.ctcAnnual,
            joinedAt: target.joinedAt,
            status: target.status,

        
        },
        managers: candidates
        .filter((c) => !blocked.has(c._id.toString()))
        .map((c) => ({ id: c._id.toString(), name: c.name, title: c.title })),
        departments: departments.sort((a, b) => a.localeCompare(b)),

    };
    
}

export interface EmployeePatch {
    title: string;
    department: string;
    managerId: string | null;
    shiftStart: string;
    ctcAnnual: number;

}

export async function updateEmployee(
    actorId: string,
    targetId: string,
    patch: EmployeePatch
): Promise<{ changed: string[] }> {
    await connectDB();

    if(!(await canEditPeople(actorId))) throw new EmployeeError("You don't have permission to edit employees.", 403);
    if(!Types.ObjectId.isValid(targetId)) throw new EmployeeError("Employee not found", 404);

    const target = await Employee.findById(targetId);
    if(!target) throw new EmployeeError("Employee not found", 404);
    if(target.status === "terminated") throw new EmployeeError("This person has left, so their record can't be edited.", 409);
    if(targetId === actorId && target.ctcAnnual ! == patch.ctcAnnual) {
        const payrollAdmins = await Employee.countDocuments({
        status: { $ne: "terminated" },
        capabilities: {$elemMatch: {Key: "payroll.run", scope: "org" } },

        });
        if(payrollAdmins > 1) {
        throw new EmployeeError("You can't change your own salary. Ask another HR administrator to do it.", 403);
        }
    }
    let newManager: Types.ObjectId | null = null;
    if(patch.managerId) {
     if(!Types.ObjectId.isValid(patch.managerId)) throw new EmployeeError("Choose a manager from the list.", 400);
     if(patch.managerId === targetId) throw new EmployeeError("Someone can't be their own manager.", 400);
    const manager = await Employee.findOne({_id: patch.managerId, status: { $in: ["active", "on_leave"] }}).select("_id");
    if(!manager) throw new EmployeeError("Choose a manager who is currently active.", 400);
    newManager = manager._id;
    }

const changed: string[] = [];
if(target.title !== patch.title) changed.push("title");
if(target.department !== patch.department) changed.push("department");
if((target.managerId?.toString() ?? null) !== (newManager?.toString() ?? null)) changed.push("manager");
if(target.shiftStart !== patch.shiftStart) changed.push("shift");
if(target.ctcAnnual !== patch.ctcAnnual) changed.push("salary");
if(changed.length === 0) return {changed };

target.title = patch.title;
target.department = patch.department;
target.shiftStart = patch.shiftStart;
target.ctcAnnual = patch.ctcAnnual;
await target.save();

await AuditLog.create({
    actorId,
    action: "employee.update",
    targetEmployeeId: target._id,
    scope: "org",
    metadata: {fields: changed },

});

return {changed};

}

