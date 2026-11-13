import { Types } from "mongoose";
import { connectDB } from "./db";
import { assertCan } from "./authorize";
import { hashPassword } from "./auth";
import { generateTempPassword } from "./password";
import { Employee } from "@/models/Employee";
import { AuditLog } from "@/models/AuditLog";
import { ROLE_TEMPLATES, type CapabilityGrant } from "@/types/capabilities";

/**
 * Templates HR may hand out when creating an account. hr_generalist and it_admin are
 * deliberately absent: they widen who can see everyone's people data or reach system
 * controls, so granting them must not be something one HR user can do alone.
 */
export const ONBOARDABLE_TEMPLATES = ["employee", "team_lead"] as const;
export type OnboardTemplate = (typeof ONBOARDABLE_TEMPLATES)[number];

export class OnboardError extends Error {
    constructor(
        message: string,
        public status: number
    ) {
        super(message);
    }
}

export interface OnboardInput {
    name : string;
    email: string;
    title: string;
    department: string;
    managerId: string | null;
    shiftStart: string;
    joinedAt: Date;
    ctcAnnual: number;
    template:OnboardTemplate;

}

export interface OnboardResult {
    id: string;
    name: string;
    email: string;
  /** Shown to the person creating the account exactly once; only its hash is stored. */
    tempPassword: string;
}

export async function onboardEmployee(actorId: string, input: OnboardInput): Promise<OnboardResult> {

    await connectDB();

    try {
        await assertCan(actorId, "employee.onboard");
    }catch {
        throw new OnboardError("You don't have permission to add employees.", 403);
    }

    let managerObjectId: Types.ObjectId | null = null;
    if(input.managerId) {
        const manager = Types.ObjectId.isValid(input.managerId)
        ? await Employee.findOne({ _id: input.managerId, status: {$in: ["active", "on_leave"] } }).select("_id")
        : null;
        if(!manager) throw new OnboardError("Choose a manager from the list.", 400);
        managerObjectId = manager._id;
    }

    const actorObjectId = new Types.ObjectId(actorId);
    const now = new Date();
    const templates: Array<keyof typeof ROLE_TEMPLATES> = input.template === "team_lead" ? ["employee", "team_lead"] : ["employee"];
    const capabilities = templates
     .flatMap((t) => ROLE_TEMPLATES[t])
     .map((g: CapabilityGrant) => ({ ...g, grantedAt: now, grantedBy:actorObjectId }));

     const tempPassword  = generateTempPassword();
     const passwordHash = await hashPassword(tempPassword);

     let created;
     try {
        created = await Employee.create({
            name: input.name,
            email: input.email,
            passwordHash,
            mustChangePassword: true,
            title: input.title,
            department: input.department,
            managerId: managerObjectId,
            shiftStart: input.shiftStart,
            joinedAt: input.joinedAt,
            ctcAnnual: input.ctcAnnual,
            capabilities,
        });

     }catch(err) {
        if((err as {code?: number }).code === 11000) {
            throw new OnboardError("Someone with that email already exists.", 409);
        }
        throw err;
     }

     await AuditLog.create({
        actorId: actorObjectId,
        action: "employee.onboard",
        targetEmployeeId: created._id,
        scope: "org",
        metadata: { template: input.template, department: input.department },

     });
     return {id: created.id, name: created.name, email: created.email, tempPassword};
}