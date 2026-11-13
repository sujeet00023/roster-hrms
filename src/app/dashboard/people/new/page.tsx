import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/authorize";
import { connectDB } from "@/lib/db";
import { localDayStart } from "@/lib/time";
import { Employee } from "@/models/Employee";
import { OnboardForm } from "@/components/OnboardForm";
import { PageHeader } from "@/components/PageHeader";

export const metadata = {title: "Add employee" };

export default async function NewEmployeePage() {
    const session = await getSession();
    if(!(await can(session!.employeeId, "employee.onboard", undefined, {silent: true }))) notFound();

    await connectDB();
    const [people, departments] = await Promise.all([
        Employee.find({ status: {$in: ["active", "on_leave" ] } })
        .select("name title")
        .sort({ name : 1})
        .lean<{_id: { toString(): string }; name: string; title: string }[]>(),
        Employee.distinct("department", {status: { $ne: "terminated" } }) as Promise<string[]>,
    ]);

    return (
     <div className="mx-auto flex max-w-3xl flex-col gap-5 sm:gap-6">
      <PageHeader title="Add employee" subtitle="Creates their record and a login with a temporary password you hand over." />
      <OnboardForm
        managers={people.map((p) => ({ id: p._id.toString(), name: p.name, title: p.title }))}
        departments={departments.sort((a, b) => a.localeCompare(b))}
        today={localDayStart().toISOString().slice(0, 10)}
      />
    </div>
    );
    
}