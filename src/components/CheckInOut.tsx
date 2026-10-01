"use client";

import { set } from "mongoose";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CheckInOut({
    checkIn,
    checkOut,
}:{
    checkIn: string | null;
    checkOut: string | null;
}){
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const[error, setError] = useState<string | null>();

    async function punch(kind:"check-in" | "check-out") {
        setPending(true);
        setError(null);
        const res = await fetch(`/api/me/attendance/${kind}`, {method: "POST" });
        if(!res.ok) {
            const data = await res.json().catch(() =>({}));
            setError(data.error ?? "Something went wrong.");
            setPending(false);
            return;
        }
        router.refresh();
        setPending(false);
        
    }

    if(!checkIn){
        return (
             <div>
        <button
          onClick={() => punch("check-in")}
          disabled={pending}
          className="rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {pending ? "Checking in…" : "Check in"}
        </button>
        {error && <p className="mt-2 text-xs text-away">{error}</p>}
      </div>
        )
    }

    if(!checkOut){
        return(
            <div>
        <p className="text-sm text-ink-2">
          Checked in at <span className="font-medium text-ink">{checkIn}</span>
        </p>
        <button
          onClick={() => punch("check-out")}
          disabled={pending}
          className="mt-2 rounded-sm border border-line-2 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {pending ? "Checking out…" : "Check out"}
        </button>
        {error && <p className="mt-2 text-xs text-away">{error}</p>}
      </div>
        )
    }

    return(
        <p className="text-sm text-ink-2">
      {checkIn} – {checkOut} logged for today.
    </p>
    )
}