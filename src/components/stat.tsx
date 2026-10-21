import type {ReactNode } from "react";
import  {TONES, type Tone} from "@/components/tones";

export function Stat ({
    label,
    value,
    hint,
    tone = "brand",
    icon,
    children,

}:{
    label: string,
    value: ReactNode,
    hint?: string,
    tone?: Tone;
    icon: ReactNode;
    children?: ReactNode;
}) {
    return (
         <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-2">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${TONES[tone]}`}>{icon}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold tracking-tight">{value}</div>
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
      {children}
    </div>
    )
}