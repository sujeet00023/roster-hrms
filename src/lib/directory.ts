import { connectDB } from "./db";
import { resolveScope } from "./authorize";
import { Employee, type EmployeeDoc, type EmploymentStatus } from "@/models/Employee";

export interface DirectoryRow {
    id: string;
    name: string;
    title: string;
    department: string;
    email: string;
    managerName: string | null;
    status: EmploymentStatus;
    joinedAt: Date;
}

export interface Directory {
    rows: DirectoryRow[];
    total: number;
    departments: string[];
  /** True when the viewer holds org-wide people access and may see employment status. */
    seesStatus: boolean;
}

export function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const LIMIT = 200;

export async function listDirectory(
    actorId: string,
    filters: {q?: string; dept?: string}
): Promise<Directory | null > {
    await connectDB();

    const scope = await resolveScope(actorId, "directory.view");
    if(!scope.scope) return null;

    const base: Record<string, unknown> = {status: {$ne: "terminated"} };
    if(scope.ids !== "all") base._id = {$in: scope.ids };
    
    const query: Record<string, unknown> = {...base };
    const q = filters.q?.trim().slice(0,80);

    if(q) {
        const rx = new RegExp(escapeRegExp(q), "i");
        query.$or = [{ name: rx }, {title: rx}, {email: rx }];
    }
        if(filters.dept) query.department = filters.dept;

        const [people, total, departments, profileScope] = await Promise.all([
            Employee.find(query).sort({name: 1 }).limit(LIMIT).lean<EmployeeDoc[]>(),
            Employee.countDocuments(query),
            Employee.distinct("department", base) as Promise<string[]>,
            resolveScope(actorId, "profile.view"),
        ]);

        const managerIds = [...new Set(people.map((p) => p.managerId?.toString()).filter(Boolean))] as string[];
        const managers = managerIds.length
        ? await Employee.find({ _id: {$in: managerIds }}).select("name").lean<Pick<EmployeeDoc, "id" | "name" 
        >[]>()
        : [];
        const managerName = new Map(managers.map((m) => [m._id.toString(), m.name]));

        return {
            rows:  people.map((p) => ({
                id: p._id.toString(),
                name: p.name,
                title: p.title,
                department: p.department,
                email: p.email,
                managerName: p.managerId ? (managerName.get(p.managerId.toString()) ?? null) : null,
                status: p.status,
                joinedAt: p.joinedAt,

            })),
            total,
            departments: departments.sort((a, b) => a.localeCompare(b)),
            seesStatus: profileScope.scope === "org",

    };
}