const STYLES: Record<string, string> = {
    present: "bg-present-soft text-present",
    late: "bg-watch-soft text-watch",
    half_day: "bg-watch-soft text-watch",
    absent: "bg-away-soft text-away",
    leave: "bg-leave-soft text-leave",
    off: "bg-surface-2 text-ink-3",
    pending: "bg-watch-soft text-watch",
    approved: "bg-present-soft text-present",
    rejected: "bg-away-soft text-away",
    cancelled: "bg-surface-2 text-ink-3",
};

const LABELS: Record <string, string> ={
    present: "On time",
  late: "Late",
  half_day: "Half day",
  absent: "No punch",
  leave: "Leave",
  off: "Off",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
}

export function StatusPill({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-surface-2 text-ink-3";
  const label = LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}
    