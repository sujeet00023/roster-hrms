import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
    return(
         <div className="grid min-h-dvh place-items-center px-4">
      <div className="card flex w-full max-w-md flex-col items-center gap-3 p-10 text-center">
        <Logo size={44} />
        <p className="mt-2 font-display text-6xl font-extrabold tracking-tight text-brand-ink">404</p>
        <h1 className="font-display text-xl font-bold">There&apos;s nothing here</h1>
        <p className="text-sm leading-relaxed text-ink-2">
          The page doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
        <Link href="/dashboard" className="btn btn-primary mt-2">
          Back to your dashboard
        </Link>
      </div>
    </div>
    )
}