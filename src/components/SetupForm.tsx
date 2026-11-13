"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { IconArrowRight, IconMail, IconUser } from "./Icons";
import { PasswordField } from "./PasswordFiel";
import { Logo } from "./Logo";

export function SetupForm() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    
    async function handleSubmit(e:FormEvent) {
        e.preventDefault();
        if(password !== confirm) {
            setError("The two passwords don't match.");
            return;
        }
        setPending(true);
        setError(null);

        const res = await fetch("/api/setup", {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        if(!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "Something went wrong. Try again.");
            setPending(false);
            return;
        }

        router.push("/dashboard");
        router.refresh();
    }
    return (
        <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 flex items-center gap-3">
          <Logo size={44} />
          <span className="font-display text-2xl font-extrabold tracking-tight">Roster</span>
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Set up your workspace</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
            Create the first administrator. This screen only works once — after this, new accounts are added from inside the app.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-2">Your name</span>
              <div className="relative">
                <IconUser className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3" />
                <input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="input !pl-11" />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-2">Work email</span>
              <div className="relative">
                <IconMail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3" />
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input !pl-11" />
              </div>
            </label>

            <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" placeholder="At least 10 characters" hint="Use something long that you don't use anywhere else." />
            <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" placeholder="Type it again" />

            {error && (
              <p role="alert" className="animate-pop rounded-xl bg-away-soft px-4 py-3 text-sm text-away">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full py-3">
              {pending ? "Creating…" : "Create administrator"}
              {!pending && <IconArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
    )
}