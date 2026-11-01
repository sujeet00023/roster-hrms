import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { countPendingApprovals } from "@/lib/approvals";
import { Employee, type EmployeeDoc } from "@/models/Employee";
import { AppShell } from "@/components/AppShell";

    
export default async function dashboardLayout({ children}: {children: React.ReactNode}) {
    const session = await getSession();
    if(!session) redirect ("/login");

    await connectDB();
    const employee = await Employee.findById(session.employeeId).lean<EmployeeDoc>();
    if(!employee || employee.status === "terminated") redirect("/login");
  // Nav visibility only. Holding any grant of a capability means can(actor, cap) with no
  // target is true, so reading the grants we already loaded saves two database round trips.
  // The pages themselves re-check on the server; hiding a link is not access control.
  const holds = (key: string) => employee.capabilities.some((g) => g.key === key);
  const showTeam = holds("team.view");
  const showApprovals = holds("leave.approve");
  const pendingApprovals = showApprovals ? await countPendingApprovals(session.employeeId): 0;
    return (
        <AppShell name={employee.name} title={employee.title} showTeam = {showTeam} showApprovals = {showApprovals} pendingApprovals = {pendingApprovals}>
            {children}
        </AppShell>
    );
    
}