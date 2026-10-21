import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Employee, type EmployeeDoc } from "@/models/Employee";
import { Panel } from "@/components/Panel";


function Row({ label, value }: {label: string, value: string } ) {
    return (
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5 last:border-b-0 sm:px-5">
      <span className="text-sm text-ink-2">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
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

     const tenureMonths = (new Date(). getFullYear() - employee.joinedAt.getFullYear()) * 12 + (new Date().getMonth() - employee.joinedAt.getMonth());

     return(
        <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{employee.name}</h1>
        <p className="mt-1 text-sm text-ink-2">
          {employee.title} · {employee.department}
        </p>
      </div>

      <Panel title="Details">
        <Row label="Email" value={employee.email} />
        <Row label="Department" value={employee.department} />
        <Row
          label="Manager"
          value={manager ? `${manager.name} — ${manager.title}` : "—"}
        />
        <Row
          label="Joined"
          value={employee.joinedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        />
        <Row label="Tenure" value={`${(tenureMonths / 12).toFixed(1)} years`} />
        <Row label="Shift start" value={employee.shiftStart} />
      </Panel>
    </div>
     )
    
}

