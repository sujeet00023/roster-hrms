"use client";

import {useRouter } from "next/navigation";
import {useState, type FormEvent } from "react";
import { IconAlert, IconCheck, IconClock, IconMinus, IconPlus } from "./Icons";

const TYPES = [
  {value: "casual", label: "Casual"},
  {value: "earned", label: "Earned"},
  {value: "sick", label: "Sick"},
]

type LeaveType = (typeof TYPES)[number]["value"];


export function  LeaveRequestForm() {
    const router = useRouter();
    const [type, setType] = useState<LeaveType>("casual");
    const [from, setFrom] = useState("");
    const [days, setDays] = useState(1);
    const [reason, setReason ] = useState("");
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<{ tone: "good" | "wait" | "bad"; text: string } | null>(null);
    
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setPending(true);
        setMessage(null);

        const res = await fetch("/api/me/leave", {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({ type, from, days, reason }),
        });
        const data = await res.json().catch(() => ({}));

        if(!res.ok) {
            setMessage({ tone: "bad", text: data.error ?? "Could not submit that request."});
            setPending(false);
            return;
        }

        setMessage({
            tone: data.status === "approved" ? "good" : "bad",
            text: data.note,
        });
        setReason("");
        setPending(false);
        router.refresh();
    }

const step = (delta: number) => setDays((d) => Math.min(30, Math.max(0.5, d + delta ))); 

    return (
       <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 sm:p-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">Type of leave</legend>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-surface-2 p-1">
          {TYPES.map((t) => (
            <label key={t.value} className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value={t.value}
                checked={type === t.value}
                onChange={() => setType(t.value)}
                className="peer sr-only"
              />
              <span className="block rounded-lg py-2 text-center text-sm font-semibold text-ink-2 transition peer-checked:bg-surface peer-checked:text-brand-ink peer-checked:shadow-card peer-focus-visible:ring-2 peer-focus-visible:ring-brand">
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-2">Starting</span>
          <input type="date" required value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        </label>

        <div className="flex flex-col gap-1.5">
          <span id="days-label" className="text-sm font-medium text-ink-2">
            Number of days
          </span>
          <div className="flex items-center gap-2" role="group" aria-labelledby="days-label">
            <button type="button" onClick={() => step(-0.5)} aria-label="Fewer days" className="btn btn-secondary h-[42px] w-[42px] !p-0">
              <IconMinus className="h-4 w-4" />
            </button>
            <div className="grid h-[42px] flex-1 place-items-center rounded-xl border border-line-2 bg-surface font-display text-lg font-bold">
              {days}
            </div>
            <button type="button" onClick={() => step(0.5)} aria-label="More days" className="btn btn-secondary h-[42px] w-[42px] !p-0">
              <IconPlus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-2">Reason</span>
        <input
          type="text"
          required
          minLength={3}
          maxLength={300}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="A short note for whoever reviews this"
          className="input"
        />
      </label>

      {message && (
        <div
          role="status"
          className={`animate-pop flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${
            message.tone === "good"
              ? "bg-present-soft text-present"
              : message.tone === "wait"
                ? "bg-watch-soft text-watch"
                : "bg-away-soft text-away"
          }`}
        >
          {message.tone === "good" ? <IconCheck className="mt-0.5 h-4 w-4 flex-none" /> : <IconAlert className="mt-0.5 h-4 w-4 flex-none" />}
          <span>{message.text}</span>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary self-start">
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
    )
}