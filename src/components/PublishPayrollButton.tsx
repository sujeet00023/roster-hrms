"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconAlert } from "./Icons";

export function PublishPayrollButton({ month, label, employees }: {month: string; label: string; employees: number }) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function publish() {
        setPending(true);
        setError(null);
        const res = await fetch("/api/payroll/runs", {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({ month }),
        });
        if(!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "Could not publish payroll. Nothing was saved. ");
            setPending(false);
            return;
        }
        router.push("/dashboard/payroll");
        router.refresh();
    }
    if(!confirming) {
        return (
            <button onClick={() => setConfirming(true)} className="btn btn-primary">
        Publish payslips
      </button>
        );
    }

    return (
        <div className="animate-pop card flex flex-col gap-3 p-4 sm:max-w-md">
      <p className="flex items-start gap-2.5 text-sm leading-relaxed">
        <IconAlert className="mt-0.5 h-4 w-4 flex-none text-watch" />
        <span>
          Publish <strong>{employees}</strong> payslip{employees === 1 ? "" : "s"} for <strong>{label}</strong>? Employees will see them immediately, and a month can only be published once.
        </span>
      </p>
      {error && (
        <p role="alert" className="rounded-xl bg-away-soft px-3.5 py-2.5 text-sm text-away">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={publish} disabled={pending} className="btn btn-primary">
          {pending ? "Publishing…" : "Yes, publish"}
        </button>
        <button onClick={() => setConfirming(false)} disabled={pending} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
    );
}