import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Employee, type EmployeeDoc } from "@/models/Employee";
import { AppShell } from "@/components/AppShell";

function initialsOf(name: string): string {
    return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function dashboardLayout({ children}: {children: React.ReactNode}) {
    const session = await getSession();
    if(!session) redirect ("/login");

    await connectDB();
    const employee = await Employee.findById(session.employeeId).lean<EmployeeDoc>();
    if(!employee) redirect("/login");

    return (

        <AppShell name={employee.name} title={employee.title} initials = {initialsOf(employee.name)}>
            {children}
        </AppShell>
    );
    
}