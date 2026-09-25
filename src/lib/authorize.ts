import { Types } from "mongoose";
import { connectDB } from "./db";
import { Employee, type EmployeeDoc } from "@/app/models/Employee";
import { AuditLog } from "@/app/models/AuditLog";
import { SENSITIVE_CAPABILITIES, type Capability, type Scope } from "@/app/types/capabilities";

/**
 * Returns every employeeId in actorId's reporting subtree, actorId included.
 * Uses $graphLookup to walk managerId edges in one aggregation instead of
 * N queries - this is the only place that needs to know reporting depth.
 *
 * Acting managers are folded in as if they were the primary manager for
 * the duration of their window, so approvals don't stall just because
 * the regular manager is on leave.
 */
export async function getTeamSubTreeId(actorId: string): Promise<Types.ObjectId[]>{
    await connectDB();

    const now = new Date();

    const actingFor = await Employee.find({
        actingManagerId: new Types.ObjectId(actorId),
        actingManagerUnit: { $gte: now },

    }).select("_id ");

    const rootIds = [new Types.ObjectId(actorId), ...actingFor.map((e) => e._id)];

    const result = await Employee.aggregate([
        { $match: { _id: { $in: rootIds} } },
        {
            $graphLookup: {
                from:"employees",
                startWith: "$_id",
                connectFromField: "_id",
                connectToField: "managerId",
                as: "reports",
            },
        },
        {$project: {ids: { $concatArrays: [["$_id"], "$reports._id" ] } } },
    
    ])
     const all = new Set<string>();
     for (const doc of result ) {
        for(const id of doc.ids as Types.ObjectId[]) all.add(id.toString());

     }
     return Array.from(all).map((id) => new Types.ObjectId(id));
}

interface CanOptions {
    silent?:boolean;
    metadata?: Record<string, unknown>;
}

/**
 * The single permission check for the whole app.
 *
 *   can(actorId, "leave.approve", targetEmployeeId)
 *
 * targetEmployeeId is optional for capabilities that aren't about a
 * specific person (e.g. "payroll.run"). Every call for a capability in
 * SENSITIVE_CAPABILITIES writes an AuditLog row unless silent is set.
 */
export async function can(
    actorId: string,
    capability: Capability,
    targetEmployeeId?: string,
    options: CanOptions = {}
): Promise<boolean> {
    await connectDB();

    const actor = await Employee.findById(actorId).lean<EmployeeDoc>();
    if(!actor || actor.status === "terminated" ) return false;

    const grants = actor.capabilities.filter((g) => g.key === capability);
    if(grants.length === 0) return false;

    let allowed = false;
    let matchedScope: Scope | null = null;

    for (const grant of grants) {
        if(grant.scope == "org" || grant.scope === "system"){
            allowed = true;
            matchedScope = grant.scope;
            break;
        }
        if(grant.scope === "self") {
            if(!targetEmployeeId || targetEmployeeId === actorId ){
                allowed = true;
                matchedScope = "self";
                break;
            }
        }
        if(grant.scope === "team"){
            if(!targetEmployeeId) {
                allowed = true;
                matchedScope = "team";
                break;
            }
            const subtree = await getTeamSubTreeId(actorId);
            if(subtree.some((id) => id.toString() === targetEmployeeId )){
                allowed = true;
                matchedScope = "team";
                break;
            }
        }
    }

    if(allowed && !options.silent && SENSITIVE_CAPABILITIES.has(capability)) {
        await AuditLog.create({
            actorId,
            action: capability,
            targetEmployeeId: targetEmployeeId ?? null,
            scope: matchedScope,
            metadata: options.metadata ?? {},
        });
    }
    return allowed;
}
/** Throws if the check fails - convenient in API routes that should 403 on denial. */
export async function assertCan(
    actorId: string,
    capability: Capability,
    targetEmployeeId?: string,
    options?: CanOptions 
): Promise<void> {
    const ok = await can(actorId, capability, targetEmployeeId, options);
    if(!ok) {
        const err = new Error(`Not authorized: ${capability}`);
        (err as Error & {status?: number }).status = 403;
        throw err;
    }
}


