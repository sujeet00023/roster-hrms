import type { ReactNode } from "react";

export function Panel({
    title,
    note,
    children,
    className = "",
}: {
    title?: string;
    note?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
    <section className={`rounded-sm border border-line bg-surface ${className}`}>
       {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h3 className="font-display text-base font-semibold">{title}</h3>
          {note && <span className="text-xs text-ink-3">{note}</span>}
        </header>
      )}
      {children}
      </section>
    )
}