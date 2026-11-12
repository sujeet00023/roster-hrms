import { connectDB } from "./db";
import { hashPassword } from "./auth";
import { Employee } from "@/models/Employee";
import { SystemFlag } from "@/models/SystemFlag";
import { AuditLog } from "@/models/AuditLog";
import { ROLE_TEMPLATES } from "@/types/capabilities";

const FLAG = "initial-setup";

export class SetupError extends Error {
    constructor (
        message: string,
        public status: number
    ) {
        super(message);
    }
}

export async function isSetupNeeded(): Promise<boolean> {
    await connectDB();
    if((await Employee.countDocuments({})) > 0) return false;
    return !(await SystemFlag.exists({_id: FLAG }));
}

/**
 * Creates the very first HR administrator, once. The unique-_id flag insert is the
 * lock: if two people submit at the same moment, exactly one insert succeeds.
 */
export async function createFirstAdmin(input: {name: string; email: string; password: string}) : Promise<string> {
   await connectDB();

   if((await Employee.countDocuments({})) > 0) {
    throw new SetupError("Setup has already been completed.", 403);
   }

   try {
    await SystemFlag.create({ _id: FLAG });
   }catch (err) {
    if((err as {code?: number}). code === 11000) throw new SetupError("Setup has already been completed.", 403);
    throw err;
   }

   try {
    const now = new Date();
    const admin = await Employee.create({
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        title: "HR Administrator",
        department: "People",
        managerId: null,
        joinedAt: now,
        ctcAnnual: 0,
        capabilities: [...ROLE_TEMPLATES.employee, ...ROLE_TEMPLATES.hr_generalist].map((g) =>({
            ...g,
            grantedAt: now,
            grantedBy: null,
        })),
    });
    await AuditLog.create({ actorId: admin._id, action: "setup.first_admin", scope: "system", metadata: {} });
    return admin.id;
   }catch(err) {
    // Release the lock so a failed attempt (e.g. a database hiccup) can be retried.
    await SystemFlag.deleteOne({ _id: FLAG });
    throw err;
   }
}
