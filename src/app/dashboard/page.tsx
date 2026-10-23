import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getTodayAttendance, getAverageWeeklyHours } from "@/lib/attendance";
import { getLeaveSummary } from "@/lib/leave";
import { APP_TIMEZONE, localParts } from "@/lib/time";
import { Employee } from "@/models/Employee";
import { Clock } from "@/components/Clock";
import { IconArrowRight, IconCalendar, IconClock, IconSparkle } from "@/components/Icons";
import { LeaveRow } from "@/components/LeaveRow";
import { Panel } from "@/components/Panel";
import { ProgressRing } from "@/components/ProgressRing";
import { Stat } from "@/components/stat";
import { StatusPill } from "@/components/StatusPil";
import { CheckInOut } from "@/components/CheckInOut";
import Link from "next/link";

// Rings fill against a 12-day yardstick. It's a visual scale, not a policy limit.
const RING_SCALE = 12;
const WEEKLY_TARGET_HOURS = 40;

function greetingFor(hour: number ): string {
  if(hour < 12 ) return "Good Morning";
  if(hour < 17 ) return "Good Afternoon";
  return "Good evening"
}


export default async function TodayPage() {
    const session =await getSession();
    const employeeId = session!.employeeId;

    await connectDB();
    const [me, today, hours, leave] = await Promise.all([
        Employee.findById(employeeId).select("name shiftStart").lean<{name: string; shiftStart: string}>(),
        getTodayAttendance(employeeId),
        getAverageWeeklyHours(employeeId), 
        getLeaveSummary(employeeId),
    ]);

    const firstName = me?.name.split(" ")[0] ?? "there";
    const now = new Date();
    const greeting = greetingFor(localParts(now). hour);
    const dateLabel = now.toLocaleDateString("en-In", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: APP_TIMEZONE,
    })

    const subline = !today?.checkIn
      ?`your shift starts at ${me?.shiftStart ?? "09:30"}. Tap check in when you're ready.`
      : !today.checkOut
        ? "You're checked in. Have a great day."
        : "You're all done for today. Rest well.";


    const pending = leave.requests.filter((r) => r.status === "pending").length
    const pendingRequests = leave.requests.filter((r) => r.status === "pending");
    const totalBalance = leave.balance.earned + leave.balance.casual + leave.balance.sick;
    const weeklyPct = Math.min(100, Math.round((hours / WEEKLY_TARGET_HOURS) * 100 )) ;
   
    return(
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* ------------------------------- Hero ------------------------------- */}
      <section
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-pop sm:p-8"
        style={{ backgroundImage: "var(--grad)" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/80">{dateLabel}</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {greeting}, {firstName}
            </h1>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-white/85">{subline}</p>
          </div>

          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-md md:w-72 md:flex-none">
            <div className="mb-3 flex items-baseline justify-between">
              <Clock timeZone={APP_TIMEZONE} />
              <span className="text-xs font-medium text-white/70">Local time</span>
            </div>
            <CheckInOut checkIn={today?.checkIn ?? null} checkOut={today?.checkOut ?? null} />
          </div>
        </div>
      </section>

      {/* ------------------------------ Stat cards ------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Today" tone={today ? (today.status === "present" ? "present" : "watch") : "neutral"} icon={<IconClock className="h-[18px] w-[18px]" />} value={<StatusPill status={today?.status ?? "not_in"} />} hint={today?.checkIn ? `In at ${today.checkIn}` : "No punch yet"} />

        <Stat label="Weekly hours" tone="brand" icon={<IconSparkle className="h-[18px] w-[18px]" />} value={<>{hours.toFixed(1)}<span className="ml-1 text-base font-bold text-ink-3">h</span></>} hint={`${weeklyPct}% of a ${WEEKLY_TARGET_HOURS}h week`}>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full" style={{ width: `${weeklyPct}%`, backgroundImage: "var(--grad)" }} />
          </div>
        </Stat>

        <Stat label="Leave available" tone="leave" icon={<IconCalendar className="h-[18px] w-[18px]" />} value={<>{totalBalance}<span className="ml-1 text-base font-bold text-ink-3">days</span></>} hint={pending > 0 ? `${pending} request${pending > 1 ? "s" : ""} awaiting review` : "Nothing waiting on review"} />
      </div>

      {/* ------------------------------ Leave rings ------------------------------ */}
      <Panel
        title="Leave balance"
        note="Days you can still take"
        //@ts-ignore
        action={
          <Link href="/dashboard/leave" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-ink hover:underline">
            Request leave <IconArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        <div className="grid grid-cols-3 gap-2 px-5 pb-6 pt-4 sm:px-6">
          {(
            [
              { label: "Earned", value: leave.balance.earned, tone: "leave" },
              { label: "Casual", value: leave.balance.casual, tone: "brand" },
              { label: "Sick", value: leave.balance.sick, tone: "away" },
            ] as const
          ).map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-2.5">
              <ProgressRing value={b.value} max={RING_SCALE} tone={b.tone} size={88} stroke={9}>
                <span className="font-display text-2xl font-extrabold">{b.value}</span>
              </ProgressRing>
              <span className="text-sm font-medium text-ink-2">{b.label}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* ---------------------------- Recent requests ---------------------------- */}
      <Panel
        title="Recent leave requests"
        note={pending > 0 ? `${pending} pending` : undefined}
        //@ts-ignore
        action={
          leave.requests.length > 0 ? (
            <Link href="/dashboard/leave" className="text-sm font-semibold text-brand-ink hover:underline">
              View all
            </Link>
          ) : undefined
        }
      >
        {leave.requests.length === 0 ? (
          <p className="px-5 pb-6 pt-3 text-sm text-ink-2 sm:px-6">You haven&apos;t requested any leave yet. Your requests will show up here.</p>
        ) : (
          <div className="mt-2 divide-y divide-line">
            {leave.requests.slice(0, 4).map((r) => (
              <LeaveRow key={r.id} r={r} />
            ))}
          </div>
        )}
      </Panel>
    </div>
    );
}