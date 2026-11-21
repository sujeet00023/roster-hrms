import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/authorize";
import { formatDay } from "@/lib/format";
import { listHolidays } from "@/lib/holidays";
import { localDayStart } from "@/lib/time";
import { HolidayManager } from "@/components/HolidayManager";
import { PageHeader } from "@/components/PageHeader";

export const metadata = {title: "Holidays" };

export default async function HolidaysPage() {
    const session = await getSession();

    if(!(await can(session!.employeeId, "policy.edit", undefined, {silent: true}))) notFound();

    const today = localDayStart();
    const yearAgo = new Date(today.getTime() - 365 * 86400000);
    const holidays = await listHolidays(yearAgo);

    return(
         <div className="mx-auto flex max-w-3xl flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Holidays"
        subtitle="Company holidays are paid days off. They never count as unpaid, and they show on everyone's calendar."
      />
      <HolidayManager
        holidays={holidays.map((h) => ({
          id: h.id,
          name: h.name,
          label: formatDay(h.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
          past: new Date(h.date).getTime() < today.getTime(),
        }))}
      />
    </div>
    )
    
}