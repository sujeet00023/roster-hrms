"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { IconInfo } from "./Icons";
import { Logo } from "./Logo";
import { PasswordField } from "./PasswordFiel";

export function ChangePasswordForm({ forced}: {forced: boolean }) {
    const router = useRouter();
    const [current, setCurrent] = useState("");
    const [next,setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const[error, setError] = useState<string | null >(null);
    const [pending, setPending] = useState(false);

    async function handleSubmit(e:FormEvent) {
        e.preventDefault();
        if(next ! == confirm ) {
            setError("The two new passwords don't match. ");
            return;

        }
        setPending(true);
        setError(null);

        const res = await fetch("/api/auth/change-password",{
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body:JSON.stringify({current, next }),
        });

        if(!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "Something went wrong. Try again.");
            return;
        }

        router.push("/dashboard");
        router.refresh();
        
    }

    return(
        <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 flex items-center gap-3">
          <Logo size={44} />
          <span className="font-display text-2xl font-extrabold tracking-tight">Roster</span>
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            {forced ? "Choose your own password" : "Change your password"}
          </h1>
          {forced && (
            <p className="mt-3 flex items-start gap-2.5 rounded-xl bg-brand-soft px-4 py-3 text-sm leading-relaxed text-brand-ink">
              <IconInfo className="mt-0.5 h-4 w-4 flex-none" />
              <span>Your account was created with a temporary password. Pick one only you know to continue.</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <PasswordField label={forced ? "Temporary password" : "Current password"} value={current} onChange={setCurrent} autoComplete="current-password" />
            <PasswordField label="New password" value={next} onChange={setNext} autoComplete="new-password" placeholder="At least 10 characters" hint="Use something long that you don't use anywhere else." />
            <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />

            {error && (
              <p role="alert" className="animate-pop rounded-xl bg-away-soft px-4 py-3 text-sm text-away">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full py-3">
              {pending ? "Saving…" : "Save password"}
            </button>
            {!forced && (
              <Link href="/dashboard/profile" className="btn btn-ghost w-full">
                Cancel
              </Link>
            )}
          </form>
        </div>
      </div>
    </div>
    )
}