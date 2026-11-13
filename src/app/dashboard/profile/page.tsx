import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { formatDay } from "@/lib/format";
import { Employee, type EmployeeDoc } from "@/models/Employee";
import { Avatar } from "@/components/Avatar";
import { IconBuilding, IconClock, IconMail, IconTeam, IconUser, IconCalendar } from "@/components/Icons";
import { Panel } from "@/components/Panel";
import { ReactNode } from "react";


function Detail({ icon ,label, value }: {icon: ReactNode , label: string, value: string } ) {
    return (
      <div className="card flex items-center gap-4 p-4 sm:p-5">
      <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-soft text-brand-ink">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-3">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
    )
}

export default async function ProfilePage() {
    const session = await getSession();
    await connectDB();
    const employee = await Employee.findById(session!.employeeId).lean<EmployeeDoc>();
    if(!employee) return null;

    const manager = employee.managerId
     ? await Employee.findById(employee.managerId).select("name title").lean<Pick<EmployeeDoc, "name" | "title" >>()
     : null;

     const joined = new Date(employee.joinedAt);
     const now = new Date();
     const months = (now.getFullYear() - joined.getUTCFullYear()) * 12 + (now.getMonth() - joined.getUTCMonth());
     const tenure = months < 12 ? `${Math.max(months, 0)} month${months === 1 ? "" : "s"}` : `${(months / 12). toFixed(1)} years`;
    
     const icon = "h-5 w-5";

     return(
      <div className="flex flex-col gap-5 sm:gap-6">
      <section className="card overflow-hidden">
        <div className="h-28 sm:h-36" style={{ backgroundImage: "var(--grad)" }} />
        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          <Avatar name={employee.name} size="xl" className="-mt-12 ring-4 ring-surface sm:-mt-14" />
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{employee.name}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {employee.title} · {employee.department}
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Detail icon={<IconMail className={icon} />} label="Work email" value={employee.email} />
        <Detail icon={<IconBuilding className={icon} />} label="Department" value={employee.department} />
        <Detail icon={<IconTeam className={icon} />} label="Reports to" value={manager ? `${manager.name} · ${manager.title}` : "No manager — top of the org"} />
        <Detail icon={<IconCalendar className={icon} />} label="Joined" value={formatDay(joined, { day: "numeric", month: "long", year: "numeric" })} />
        <Detail icon={<IconUser className={icon} />} label="Time at the company" value={tenure} />
        <Detail icon={<IconClock className={icon} />} label="Shift starts" value={employee.shiftStart} />
      </div>
    </div>
     )
    
}

