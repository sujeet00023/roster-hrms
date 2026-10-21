"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApprovalActions({ requestId }: {requestId: string }) {
    const router = useRouter();
    const [pending, setPending] = useState<"approved" | "rejected" | null>(null);
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function decide(decision: "approved" | "rejected") {
        setPending(decision);
        setError(null);

        const res = await fetch(`/api/team/leave/${requestId}`, {
            method: "POST",
            headers: {"content- Type" : "application/json"},
            body: JSON.stringify({ decision, note: note || undefined }),
        });
        
        if(!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "Could not record that decision.");
            setPending(null);
            // A 409 means someone else got there first - refresh so the card disappears.
            if(res.status === 409 ) router.refresh();
            return;
        }
        router.refresh();
    }

    return (
        <div className="mt-4 flex flex-col gap-3">
       <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={300}
        placeholder="Add a note for them (optional)"
        aria-label="Note to the employee"
        className="input"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => decide("approved")} disabled={pending !== null} className="btn btn-primary">
          {pending === "approved" ? "Approving…" : "Approve"}
        </button>
        <button onClick={() => decide("rejected")} disabled={pending !== null} className="btn btn-secondary">
          {pending === "rejected" ? "Declining…" : "Decline"}
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-away-soft px-3.5 py-2.5 text-sm text-away">
          {error}
        </p>
      )}
    </div>
    )
}