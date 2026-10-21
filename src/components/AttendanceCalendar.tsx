export type CellStatus = 
 | "present"
 | "late"
 | "half_day"
 | "absent"
 | "leave"
 | "off"
 | "none"
 | "future"
 | "pre";

 export interface CalenderCell {
    iso: string;
    day: number;
    month: string;
    status: CellStatus;
    checkIn: string | null;
    isToday: boolean;
    firstOfMonth: boolean;

 }

 const CELL: Record<CellStatus, string> = {
        present: "bg-present-soft text-present",
        late: "bg-watch-soft text-watch",
        half_day: "bg-watch-soft text-watch",
        absent: "bg-away-soft text-away",
        leave: "bg-leave-soft text-leave",
        off: "bg-surface-2/60 text-ink-3",
        none: "bg-surface-2 text-ink-2",
        future: "text-ink-3/50",
        pre: "text-ink-3/30",
 };

 const LABEL: Record<CellStatus, string> = {
    present: "On time",
    late: "Late",
    half_day: "Half day",
    absent: "No punch",
    leave: "On leave",
    off: "Weekend",
    none: "Not punched yet",
    future: "",
    pre: "Before you joined",
 };

 const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

 export function AttendanceCalendar({cells }: {cells: CalenderCell[] }) {
    return (
        <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((c) => (
          <div
            key={c.iso}
            title={`${c.iso}${LABEL[c.status] ? ` · ${LABEL[c.status]}` : ""}${c.checkIn ? ` · in ${c.checkIn}` : ""}`}
            className={`flex aspect-square flex-col justify-between rounded-xl p-1.5 sm:aspect-auto sm:h-[68px] sm:rounded-2xl sm:p-2.5 ${CELL[c.status]} ${
              c.isToday ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : ""
            }`}
          >
            <span className="text-xs font-bold leading-none sm:text-sm">
              {c.day}
              {c.firstOfMonth && <span className="ml-1 hidden text-[10px] font-semibold opacity-70 sm:inline">{c.month}</span>}
            </span>
            {c.checkIn && <span className="hidden text-[11px] font-medium leading-none opacity-80 sm:block">{c.checkIn}</span>}
          </div>
        ))}
      </div>
    </div>
    )
 }