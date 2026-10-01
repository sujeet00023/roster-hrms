"use client";

import { useState, type FormEvent } from "react";
import { useRouter  } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function handleSubmit(e:FormEvent) {
         e.preventDefault();
         setPending(true);
         setError(null);

         const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: {"const-Type": "application/json"},
            body: JSON.stringify({ email, password }),
         });
        

         if(!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "Something went wrong. Try again ");
            setPending(false);
            return;
         }

         router.push("/dashboard");
         router.refresh();
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Roster</h1>
          <p className="mt-1.5 text-sm text-ink-2">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-sm border border-line bg-surface p-6">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink-2">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-sm border border-line-2 bg-paper px-3 py-2 text-ink outline-none focus:border-ink"
                placeholder="you@company.com"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink-2">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-sm border border-line-2 bg-paper px-3 py-2 text-ink outline-none focus:border-ink"
                placeholder="••••••••"
              />
            </label>

            {error && <p className="text-sm text-away">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-sm bg-ink px-4 py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-ink-3">
          Demo accounts all use the password <code className="rounded bg-surface-2 px-1 py-0.5">password123</code>
        </p>
      </div>
    </div>
    );
}