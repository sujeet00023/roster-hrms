import { boolean } from "zod";
import { IconPlane } from "./Icons";
import { StatusPill } from "./StatusPil";
import { TONES, type Tone } from "./tones";
import type { LeaveSummary } from "@/lib/leave";
import { formatDay } from "@/lib/format";

const TYPE_TONE: Record<string, Tone> = {earned: "leave", casual: "brand", sick: "away"};

export function LeaveRow({r, detailed = false }: {r: LeaveSummary["requests"][number]; detailed?:boolean }){
return (
    <div className="flex items-start gap-3.5 px-5 py-4 sm:px-6">
      <span className={`mt-0.5 grid h-10 w-10 flex-none place-items-center rounded-xl ${TONES[TYPE_TONE[r.type] ?? "neutral"]}`}>
        <IconPlane className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-semibold capitalize">
            {r.type} leave · {r.days} day{r.days > 1 ? "s" : ""}
          </p>
          <StatusPill status={r.status} />
        </div>
        <p className="mt-0.5 text-sm text-ink-2">
          From {formatDay(r.from, { weekday: "short", day: "numeric", month: "short" })}
          {detailed ? ` · ${r.reason}` : ""}
        </p>
        {r.decisionNote && <p className="mt-1 text-xs leading-relaxed text-ink-3">{r.decisionNote}</p>}
      </div>
    </div>
) 
}