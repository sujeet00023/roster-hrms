"use client";

import {useRouter } from "next/navigation";
import {useState, type FormEvent } from "react";


export function  LeaveRequestForm() {
    const router = useRouter();
    const [type, setType] = useState<"earned" | "casual" | "sick">("casual");
    const [from, setFrom] = useState("");
    const [days, setDays] = useState(1);
    const [reason, setReason ] = useState("");
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
    
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

    return (
         <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-2">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="rounded-sm border border-line-2 bg-paper px-2.5 py-1.5"
          >
            <option value="casual">Casual</option>
            <option value="earned">Earned</option>
            <option value="sick">Sick</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-2">From</span>
          <input
            type="date"
            required
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-sm border border-line-2 bg-paper px-2.5 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-2">Days</span>
          <input
            type="number"
            min={0.5}
            max={30}
            step={0.5}
            required
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-sm border border-line-2 bg-paper px-2.5 py-1.5"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink-2">Reason</span>
        <input
          type="text"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="A short note for whoever reviews this"
          className="rounded-sm border border-line-2 bg-paper px-2.5 py-1.5"
        />
      </label>

      {message && (
        <p className={`text-sm ${message.tone === "good" ? "text-present" : "text-watch"}`}>{message.text}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 self-start rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
    )
}