"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconAlert, IconCheck } from "./Icons";
import { FormEvent, useState } from "react";

export function EditEmployeeForm({
    id,
    initial,
    managers,
    departments,
}: {
    id: string;
    initial: {title: string; department: string; managerId: string; shiftStart: string; ctcAnnual: number };
    managers: Array<{id: string; name: string; title: string }>;
    departments: string[];
}) {
    const router = useRouter();
    const[title, setTitle] = useState(initial.title);
    const[department, setDepartment] = useState(initial.department);
    const[managerId, setManagerId] = useState(initial.managerId);
    const[shiftStart, setShiftStart] = useState(initial.shiftStart);
    const[ctc, setCtc] = useState(String(initial.ctcAnnual ));
    const[pending, setPending] = useState(false);
    const[error, setError] = useState<string | null>(null);
    const[saved, setSaved] = useState<string[] | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setPending(true);
        setSaved(null);

        const res = await fetch(`/api/people/${id}`, {
            method: "PATCH",
            headers: {"Content-Type" : "application/json" },
            body: JSON.stringify({ title, department, managerId: managerId || null, shiftStart, ctcAnnual: Number(ctc) }),

        });
        const data = await res.json().catch(() => ({}));
        setPending(false);

        if (!res.ok) {
            setError(data.error ?? "Could not save those changes.");
            return;
        }
        setSaved(data.changed ?? []);
        router.refresh();
    }

    const salaryChanged = Number(ctc) !== initial.ctcAnnual;

    return(
        <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Job title">
          <input required minLength={2} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </Field>
        <Field label="Department">
          <input required minLength={2} maxLength={60} list="departments" value={department} onChange={(e) => setDepartment(e.target.value)} className="input" />
          <datalist id="departments">
            {departments.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>
        <Field label="Reports to">
          <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="input">
            <option value="">No manager (top of the org)</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Shift starts at">
          <input type="time" required value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} className="input" />
        </Field>
        <Field label="Annual CTC (₹)">
          <input type="number" required min={0} max={1000000000} step={1} inputMode="numeric" value={ctc} onChange={(e) => setCtc(e.target.value)} className="input" />
        </Field>
      </div>

      {salaryChanged && (
        <p className="flex items-start gap-2.5 rounded-xl bg-watch-soft px-4 py-3 text-sm leading-relaxed text-watch">
          <IconAlert className="mt-0.5 h-4 w-4 flex-none" />
          <span>Salary changes apply to payroll runs you publish from now on. Payslips already published keep the figures they were paid with.</span>
        </p>
      )}

      {error && (
        <p role="alert" className="animate-pop rounded-xl bg-away-soft px-4 py-3 text-sm text-away">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="animate-pop flex items-start gap-2.5 rounded-xl bg-present-soft px-4 py-3 text-sm text-present">
          <IconCheck className="mt-0.5 h-4 w-4 flex-none" />
          {saved.length === 0 ? "Nothing changed." : `Saved — updated ${saved.join(", ")}.`}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link href="/dashboard/people" className="btn btn-ghost">
          Back to directory
        </Link>
      </div>
    </form>
    );
}

function Field({label, children }: {label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-2">{label}</span>
      {children}
    </label>
    );
}