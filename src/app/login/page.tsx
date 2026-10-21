"use client";

import { useState, type FormEvent } from "react";
import { useRouter  } from "next/navigation";
import { IconArrowRight, IconBolt, IconCalendar, IconEye, IconEyeOff,IconLock, IconMail, IconShield} from "@/components/Icons";
import { Logo } from "@/components/Logo";

const FEATURES = [
  { icon: IconBolt, title: "Leave that approves itself", text: "Short, well-covered requests clear in seconds. You only see the onces that need a human."},
  { icon: IconCalendar, title: "Attendance without the spreadsheet", text: "Check in with one tap and see your month at a glance."},
  {icon: IconShield, title: "Private by design", text: "You see your own record. Managers see their team. Nobody sees more than their role needs."},

]

// Shown only in development, so a production build never advertises shared passwords.
const DEMO_ACCOUNTS = [
  { label: "Employee", email: "tanvi@kitelabs.dev" },
  { label: "Team lead", email: "ishita@kitelabs.dev" },
  { label: "HR", email: "lakshmi@kitelabs.dev" },
  { label: "IT admin", email: "kabir@kitelabs.dev" },
];


const SHOW_DEMO = process.env.NODE_ENV !== "production";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
   
  

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
     <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ------------------------------ Brand panel ------------------------------ */}
      <section
        className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"
        style={{ backgroundImage: "var(--grad)" }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-[28rem] w-[28rem] rounded-full bg-black/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 font-display text-lg font-extrabold backdrop-blur">R</span>
          <span className="font-display text-2xl font-extrabold tracking-tight">Roster</span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight">
            Your whole workday, in one calm place.
          </h1>
          <ul className="mt-10 flex flex-col gap-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-white/15 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-base font-bold">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/80">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/70">Attendance · Leave · Payslips · Teams</p>
      </section>

      {/* ------------------------------- Sign-in form ------------------------------ */}
      <section className="flex min-h-dvh flex-col justify-center px-5 py-10 sm:px-10 lg:min-h-0">
        <div className="mx-auto w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={42} />
            <span className="font-display text-2xl font-extrabold tracking-tight">Roster</span>
          </div>

          <h2 className="font-display text-3xl font-extrabold tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-ink-2">Sign in to your workspace to continue.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-2">Work email</span>
              <div className="relative">
                <IconMail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input !pl-11"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-2">Password</span>
              <div className="relative">
                <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input !px-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
                >
                  {showPassword ? <IconEyeOff className="h-[18px] w-[18px]" /> : <IconEye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </label>

            {error && (
              <p role="alert" className="animate-pop rounded-xl bg-away-soft px-4 py-3 text-sm text-away">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full py-3">
              {pending ? "Signing in…" : "Sign in"}
              {!pending && <IconArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {SHOW_DEMO && (
            <div className="mt-8 rounded-2xl border border-dashed border-line-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">Demo accounts</p>
              <p className="mt-1 text-xs text-ink-3">
                Tap to fill the form — password is <code className="rounded bg-surface-2 px-1.5 py-0.5 text-ink-2">password123</code>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => {
                      setEmail(a.email);
                      setPassword("password123");
                      setError(null);
                    }}
                    className="rounded-full border border-line-2 bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 transition hover:border-brand hover:text-brand-ink"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
    );
}