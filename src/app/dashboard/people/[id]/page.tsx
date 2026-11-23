import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getEditContext } from "@/lib/employees";
import { formatDay } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { EditEmployeeForm } from "@/components/EditEmployeeForm";

export const metadata = {title: "Edit employee" };

export default async function EditEmployeePage({params}: {params: Promise<{id: string }>}) {
    const session =await getSession();
    const {id} = await params;

    const ctx = await getEditContext(session!.employeeId, id );
    if(!ctx) notFound();
    const e = ctx.employee;

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-5 sm:gap-6">
      <div className="flex items-center gap-4">
        <Avatar name={e.name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{e.name}</h1>
          <p className="truncate text-sm text-ink-2">
            {e.email} · joined {formatDay(e.joinedAt, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <EditEmployeeForm
        id={e.id}
        initial={{ title: e.title, department: e.department, managerId: e.managerId ?? "", shiftStart: e.shiftStart, ctcAnnual: e.ctcAnnual }}
        managers={ctx.managers}
        departments={ctx.departments}
      />
    </div>
    )
    
}