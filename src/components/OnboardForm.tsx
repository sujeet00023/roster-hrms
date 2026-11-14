"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { IconAlert, IconCheck } from "./Icons";

interface ManagerOption {
    id: string;
    name: string;
    title: string;
}

interface Created {
    name: string;
    email: string;
    tempPassword: string;
}

  function Field({ label, children} : {label: string; children: React.ReactNode }) {
        return (
             <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-2">{label}</span>
            {children}
            </label>
        );
    }

export function OnboardForm({
    managers,
    departments,
    today,
}: {
    managers: ManagerOption[];
    departments: string[];
    today: string;
}) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [title, setTitle] = useState("");
    const [department, setDepartment] = useState("");
    const [managerId, setManagerId] = useState("");
    const [shiftStart, setShiftStart] = useState("");
    const [joinedAt, setJoinedAt] = useState("");
    const [ctc, setCtc] = useState("");
    const [template, setTemplate] = useState<"employee" | "team_lead">("employee");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [created, setCreated] = useState<Created | null >(null);
    const [copied, setCopied] = useState(false);


    function reset() {
        setName("");
        setEmail("");
        setTitle("");
        setManagerId("");
        setCtc("");
        setTemplate("employee");
        setError(null);
        setCreated(null);
        setCopied(false);
    }
    
    async function handleSubmit(e:FormEvent) {
        e.preventDefault();
        setPending(true);
        setError(null);

        const res = await fetch("/api/people", {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                email,
                title,
                department,
                managerId: managerId || null,
                shiftStart,
                joinedAt,
                ctcAnnual: Number(ctc),
                template,
            }),
        });
        const data = await res.json().catch(() => ({}));
        setPending(false);

        if(!res.ok) {
            setError(data.error ?? "Could not create that account. ");
            return;

        }
        setCreated({ name: data.name, email: data.email, tempPassword: data.tempPassword });        
    }

    async function copy(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }catch {

        }
        
    }
    if(created) {
        return(
            <div className="card animate-pop p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-present-soft text-present">
          <IconCheck className="h-6 w-6" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight">{created.name} has been added</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
          Give them this temporary password and their email. They&apos;ll be asked to choose their own the first time they sign in.
        </p>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-2 p-4">
            <dt className="text-xs font-medium text-ink-3">Email</dt>
            <dd className="mt-1 break-all text-sm font-semibold">{created.email}</dd>
          </div>
          <div className="rounded-xl bg-surface-2 p-4">
            <dt className="text-xs font-medium text-ink-3">Temporary password</dt>
            <dd className="mt-1 flex items-center justify-between gap-3">
              <code className="select-all font-mono text-base font-bold tracking-wide">{created.tempPassword}</code>
              <button type="button" onClick={() => copy(created.tempPassword)} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                {copied ? "Copied" : "Copy"}
              </button>
            </dd>
          </div>
        </dl>

        <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-watch-soft px-4 py-3 text-sm leading-relaxed text-watch">
          <IconAlert className="mt-0.5 h-4 w-4 flex-none" />
          <span>This is the only time the password is shown. It isn&apos;t stored anywhere readable, so if it&apos;s lost the account needs a new one.</span>
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className="btn btn-primary">
            Add another
          </button>
          <Link href="/dashboard/people" className="btn btn-secondary">
            Back to directory
          </Link>
        </div>
      </div>
        )
    }

    return (
      <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anika Verma" className="input" />
        </Field>
        <Field label="Work email">
          <input type="email" required maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="input" />
        </Field>
        <Field label="Job title">
          <input required minLength={2} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Product Designer" className="input" />
        </Field>
        <Field label="Department">
          <input required minLength={2} maxLength={60} list="departments" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Pick one or type a new one" className="input" />
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
        <Field label="Joining date">
          <input type="date" required value={joinedAt} onChange={(e) => setJoinedAt(e.target.value)} className="input" />
        </Field>
        <Field label="Shift starts at">
          <input type="time" required value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} className="input" />
        </Field>
        <Field label="Annual CTC (₹)">
          <input type="number" required min={0} max={1000000000} step={1} inputMode="numeric" value={ctc} onChange={(e) => setCtc(e.target.value)} placeholder="e.g. 1200000" className="input" />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">Access level</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              { value: "employee", title: "Employee", text: "Their own attendance, leave, payslips and profile." },
              { value: "team_lead", title: "Team lead", text: "Employee access, plus their team's attendance and leave approvals." },
            ] as const
          ).map((o) => (
            <label key={o.value} className="cursor-pointer">
              <input type="radio" name="template" value={o.value} checked={template === o.value} onChange={() => setTemplate(o.value)} className="peer sr-only" />
              <span className="block rounded-xl border border-line-2 p-4 transition peer-checked:border-brand peer-checked:bg-brand-soft peer-focus-visible:ring-2 peer-focus-visible:ring-brand">
                <span className="block text-sm font-semibold">{o.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-2">{o.text}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-3">HR and IT administrator access can&apos;t be granted from this form.</p>
      </fieldset>

      {error && (
        <p role="alert" className="animate-pop rounded-xl bg-away-soft px-4 py-3 text-sm text-away">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Creating account…" : "Create account"}
        </button>
        <Link href="/dashboard/people" className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
    );

  
}