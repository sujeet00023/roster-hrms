import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { getTeamOverview, type TodayStatus } from "@/lib/team";
import { Avatar } from "@/components/Avatar";
import { IconCalendar, IconCheck, IconClock, IconTeam } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPil";
import { TONES, type Tone } from "@/components/tones";

const STRIP_COLOR: Record<string, string> = {
    present: "bg-present",
    late: "bg-watch",
    half_day: "bg-watch",
    absent: "bg-away",
    off: "bg-surface -2",
    none: "bg-surface-2",

};

const DOT: Record<TodayStatus, string> = {
    present: "bg-present",
    half_day: "bg-watch",
    late: "bg-leave",
    absent: "bg-away",
    off: "bg-ink-3",
    not_in: "bg-ink-3",
    leave: "bg-leave"
};

function Count({label, value, tone, icon}: {label:string; value:number; tone:Tone; icon:ReactNode }) {
    return (
        <div className="card flex items-center gap-3 p-4 sm:p-5">
      <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${TONES[tone]}`}>{icon}</span>
      <div>
        <p className="font-display text-2xl font-extrabold leading-none">{value}</p>
        <p className="mt-1 text-xs font-medium text-ink-3">{label}</p>
      </div>
    </div>
    );
}


export default async function TeamPage() {
    const session = await getSession();

    const overview = await getTeamOverview(session!.employeeId);
    if(!overview) notFound();

    const {members, counts } = overview;

    return(
         <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="My team"
        subtitle={`${members.length} ${members.length === 1 ? "person reports" : "people report"} to you, directly or through someone you manage.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Count label="In today" value={counts.in} tone="present" icon={<IconCheck className="h-5 w-5" />} />
        <Count label="Late" value={counts.late} tone="watch" icon={<IconClock className="h-5 w-5" />} />
        <Count label="On leave" value={counts.away} tone="leave" icon={<IconCalendar className="h-5 w-5" />} />
        <Count label="Not in yet" value={counts.notIn} tone="neutral" icon={<IconTeam className="h-5 w-5" />} />
      </div>

      {members.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-2">No one reports to you yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {members.map((m) => (
            <article key={m.id} className="card p-5">
              <div className="flex items-start gap-3.5">
                <span className="relative flex-none">
                  <Avatar name={m.name} size="lg" />
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-[3px] ring-surface ${DOT[m.today]}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{m.name}</p>
                  <p className="truncate text-xs text-ink-3">{m.title}</p>
                </div>
                <StatusPill status={m.today} />
              </div>

              <div className="mt-4" aria-label="Attendance over the last 14 days">
                <div className="flex gap-1">
                  {m.strip.map((d) => (
                    <span key={d.date} title={`${d.date}: ${d.status}`} className={`h-7 flex-1 rounded-md ${STRIP_COLOR[d.status] ?? "bg-surface-2"}`} />
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-ink-3">Last 14 days</p>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-ink-2">
                <span>
                  {m.avgWeeklyHours.toFixed(1)}h / week{m.checkIn ? ` · in at ${m.checkIn}` : ""}
                </span>
                {m.pendingRequests > 0 && (
                  <Link href="/dashboard/team/approvals" className="rounded-full bg-watch-soft px-2.5 py-1 font-semibold text-watch">
                    {m.pendingRequests} pending
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
    )
    
}