"use client";

import { IconAlert } from "@/components/Icons"; 

export default function DashboardError({ reset }: {error: Error; reset: () => void }) {
    return (
        <div className="card mx-auto mt-10 flex max-w-md flex-col items-center gap-3 p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-away-soft text-away">
        <IconAlert className="h-6 w-6" />
      </span>
      <h1 className="font-display text-xl font-bold">Something went wrong</h1>
      <p className="text-sm leading-relaxed text-ink-2">
        We couldn&apos;t load this page. It&apos;s usually a brief hiccup reaching the database — trying again normally fixes it.
      </p>
      <button onClick={reset} className="btn btn-primary mt-1">
        Try again
      </button>
    </div>
    );
}