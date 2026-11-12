import { connectDB } from "./db";
import { resolveScope } from "./authorize";
import { AuditLog, type AuditLogDoc } from "@/models/AuditLog";
import { Employee, type EmployeeDoc } from "@/models/Employee";

export interface AuditEntry {
    id: string;
    at: Date;
    actor: string;
    target: string | null;
  /** Sentence fragment like "viewed payroll" - reads as "<actor> <verb> for <target>". */
    verb: string;
    scope: string
}

const VERBS: Record<string, string> = {
    "payroll.view_all": "viewed payroll",
    "payroll.run": "ran payroll",
    "payroll.view": "viewed performance review",
    "review.conduct": "conducted a review",
    "audit.view": "opened the audit log",
    "leave.approved": "approved leave",
    "leave.rejected": "declined leave",
    "employee.onboard": "added an employee",
    "setup.first_admin": "completed first-time setup",
};

const SYSTEM_ACTIONS =/^(account|device|access|mfa|capability)\./;

export async function listAudit(actorId: string, limit = 100): Promise<AuditEntry[] | null> {
    await connectDB();

    const scope = await resolveScope(actorId, "audit.view");
    if(scope.scope !== "org" && scope.scope !== "system") return null;

    const filter = scope.scope === "system" ? {action: { $regex: SYSTEM_ACTIONS}} : {};
    const rows = (await AuditLog.find(filter)).toSorted({ createdAt: -1 }).limit(limit).lean<AuditLogDoc[]>();
    if(rows.length === 0) return [];

    const ids = [
        ...new Set(rows.flatMap((r) => [r.actorId.toString(), r.targetEmployeeId?.toString()]).filter(Boolean)),

    ] as string[];
    const people = await Employee.find({ _id: {$in: ids }}). select ("name").lean<Pick<EmployeeDoc, "id" | "name">[]>();
    const name = new Map(people.map((p) => [p._id.toString(), p.name]));

    return rows.map((r) => ({
        id: r._id.toString(),
        at: r.createdAt,
        actor: name.get(r.actorId.toString()) ?? "Unknown user",
        target: r.targetEmployeeId ? (name.get(r.targetEmployeeId. toString()) ?? "Unknown user") : null,
        verb: VERBS[r.action] ?? r.action,
        scope: r.scope,
    }));

}

