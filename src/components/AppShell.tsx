"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

export interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}


const SELF_NAV: NavItem[] = [
    {href: "/dashboard", label: "Today", icon: <IconToday /> },
    {href: "/dashboard/attendance", label: "Attendance", icon: <IconClock />},
    {href: "/dashboard/leave", label: "Leave", icon: <IconCalendar />},
    {href: "/dashboard/payslip", label: "Payslip", icon: <IconWallet />},
    {href: "/dashboard/profile", label:"Profile", icon: <IconUser />},
];

export function AppShell({
    name,
    title,
    initials,
    children,
}:{
    name: string;
    title: string;
    initials: string;
    children: React.ReactNode;

}) {
    const pathname = usePathname();
    const isActive = (href: string) => (href === "/dashboard" ? pathname === href: pathname?.startsWith(href));
    
    return (
        <div className="min-h-screen md:grid md:grid-cols-[216px_1fr]">
      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:flex-col md:gap-1 md:border-r md:border-line md:bg-surface md:py-5 md:sticky md:top-0 md:h-screen">
        <div className="px-5 pb-4">
          <span className="font-display text-xl font-extrabold tracking-tight">Roster</span>
        </div>
        {SELF_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 border-l-2 px-5 py-2 text-sm ${
              isActive(item.href)
                ? "border-present bg-surface-2 font-semibold text-ink"
                : "border-transparent text-ink-2 hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <span className="h-4 w-4">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <div className="mt-auto flex items-center gap-2.5 border-t border-line px-5 pt-4">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line bg-surface-2 text-xs font-semibold text-ink-2">
            {initials}
          </span>
          <div className="min-w-0 text-xs text-ink-2">
            <div className="truncate font-medium text-ink">{name}</div>
            <div className="truncate">{title}</div>
          </div>
        </div>
        <div className="px-5 pt-3">
          <LogoutButton />
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
        <span className="font-display text-lg font-extrabold tracking-tight">Roster</span>
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-surface-2 text-xs font-semibold text-ink-2">
            {initials}
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="px-4 pb-24 pt-5 sm:px-6 md:px-8 md:pb-10 md:pt-7">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-surface md:hidden">
        {SELF_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
              isActive(item.href) ? "text-present" : "text-ink-3"
            }`}
          >
            <span className="h-5 w-5">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
    )
}

function IconToday(){
    return (
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <rect x="3.5" y="4.5" width="17" height="16" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" strokeLinecap="round" />
    </svg>
    );
}

function IconClock() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    );
}

function IconCalendar(){
    return (
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <rect x="3.5" y="4.5" width="17" height="16" rx="1.5" />
      <path d="M3.5 9.5h17" strokeLinecap="round" />
      <path d="M7 13h3M7 16.5h3M14 13h3M14 16.5h3" strokeLinecap="round" />
    </svg>
    );
}

function IconWallet() {
    return(
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <rect x="3.5" y="6" width="17" height="13" rx="1.5" />
      <path d="M3.5 10h17" />
      <circle cx="16.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
    </svg>
    );
}

function IconUser() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.5 20c1.4-4 4.2-6 7.5-6s6.1 2 7.5 6" strokeLinecap="round" />
    </svg>
    );
}