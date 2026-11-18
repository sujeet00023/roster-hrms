"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { IconAlert, IconPlus } from "./Icons";

export interface HolidayItem {
    id: string;
    name: string;
    /** Pre-formatted on the server so the date never shifts with the browser's timezone. */
    label: string;
    past: boolean;
}

export function HolidayManager({ holidays }: {holidays: HolidayItem[] }) {
    const router = useRouter();
    const [date, setDate] = useState("");
    const [name, setName] = useState("");
    const[pending, setPending] = useState(false);
    const[removing, setRemoving] = useState<string | null>(null);
    const[confirming, setConfirming] = useState<string | null>(null);
    const[error, setError] = useState<string | null>(null);

    async function add(e: FormEvent) {
        e.preventDefault();
        setPending(true);
        setError(null);
        const res = await fetch("/api/holidays", {
            method: "POST",
            headers: {"Content-Type": "application/json" }, 
        });
        const data = await res.json().catch(() => ({}));
        setPending(false);
        if(!res.ok) {
            setError(data.error ?? "Could not add that holiday.");
            return;
        }
        setName("");
        setDate("");
        router.refresh();
    }

    async function remove(id:string) {
        setRemoving(id);
        setError(null);
        const res = await fetch(`/api/holidays/${id}`, {method: "DELETE"});
        setConfirming(null);
        if(!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "Could not remove that holiday.");
            return;
        }
        router.refresh();
        
    }
    return (
         <div className="flex flex-col gap-5 sm:gap-6">
      <form onSubmit={add} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5">
        <label className="flex flex-col gap-1.5 sm:w-48">
          <span className="text-sm font-medium text-ink-2">Date</span>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-2">Holiday name</span>
          <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali" className="input" />
        </label>
        <button type="submit" disabled={pending} className="btn btn-primary sm:flex-none">
          <IconPlus className="h-4 w-4" />
          {pending ? "Adding…" : "Add holiday"}
        </button>
      </form>

      {error && (
        <p role="alert" className="animate-pop flex items-start gap-2.5 rounded-xl bg-away-soft px-4 py-3 text-sm text-away">
          <IconAlert className="mt-0.5 h-4 w-4 flex-none" />
          {error}
        </p>
      )}

      <section className="card overflow-hidden">
        {holidays.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-2">No holidays yet. Add your first one above.</p>
        ) : (
          <div className="divide-y divide-line">
            {holidays.map((h) => (
              <div key={h.id} className={`flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6 ${h.past ? "opacity-60" : ""}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{h.name}</p>
                  <p className="text-xs text-ink-3">{h.label}</p>
                </div>
                {confirming === h.id ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => remove(h.id)} disabled={removing === h.id} className="btn btn-secondary !px-3 !py-1.5 text-xs !text-away">
                      {removing === h.id ? "Removing…" : "Yes, remove"}
                    </button>
                    <button onClick={() => setConfirming(null)} className="btn btn-ghost !px-3 !py-1.5 text-xs">
                      Keep
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirming(h.id)} className="btn btn-ghost !px-3 !py-1.5 text-xs">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
    );
}