"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { Avatar } from "./Avatar";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import {IconBuilding, IconCalendar ,IconCheck, IconClock,IconHome,IconShield,IconTeam, IconUser,IconWallet } from "./Icons";

export interface NavItem {
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    badge?: number;
}

// Everyone gets the "self" surface. Wider-scope items (team now; org and
// system in later phases) are appended based on the viewer's capabilities
// rather than building a separate shell per role - see README for the scope model.
const SELF_NAV: NavItem[] = [
    {href: "/dashboard", label: "Today", icon: IconHome },
    {href: "/dashboard/attendance", label: "Attendance", icon: IconClock},
    {href: "/dashboard/leave", label: "Leave", icon: IconCalendar},
    {href: "/dashboard/payslip", label: "Payslip", icon: IconWallet},
    {href: "/dashboard/profile", label:"Profile", icon: IconUser},
];

export function AppShell({
    name,
    title,
    showTeam = false,
    showApprovals = false,
    showDirectory = false,
    showAudit = false,
    pendingApprovals = 0,
    children,
}:{
    name: string;
    title: string;
    showTeam?: boolean;
    showApprovals?: boolean;
    showDirectory?: boolean;
    showAudit?: boolean;
    pendingApprovals?: number;
    children: React.ReactNode;

}) {
    const pathname = usePathname();

    const isActive = (href: string) => {
     if(href === "/dashboard" || href === "/dashboard/team") return pathname === href;
     return !! pathname?.startsWith(href);
    };

    const manageNav: NavItem[] = [];
    if(showTeam) manageNav.push( {href: "/dashboard/team", label: "My team", icon: IconTeam });
    if(showApprovals)
      manageNav.push({
     href: "/dashboard/team/approvals",
     label: "Approvals",
     icon: IconCheck,
     badge: pendingApprovals,
      });
      
      if(showAudit) manageNav.push({href: "/dashboard/audit", label: "Audit log", icon: IconShield });
      const mainNav = [...SELF_NAV];

      if(showDirectory) mainNav.splice(mainNav.length - 1, 0, {href: "/dashboard/people", label: "Directory", icon:IconBuilding });
      const allNav = [...mainNav, ...manageNav];
    return (
      <div className="min-h-dvh lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      {/* ---------------------------- Desktop sidebar ---------------------------- */}
      <aside className="hidden overflow-y-auto border-r border-line bg-surface/70 px-4 py-5 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 pb-7 pt-1">
          <Logo />
          <span className="font-display text-xl font-extrabold tracking-tight">Roster</span>
        </Link>

        <nav aria-label="Main" className="flex flex-col gap-1">
          {mainNav.map((item) => (
            <SideLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>

        {manageNav.length > 0 && (
          <nav aria-label="Manage" className="mt-6 flex flex-col gap-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Manage</p>
            {manageNav.map((item) => (
              <SideLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </nav>
        )}

        <div className="card mt-auto p-3">
          <div className="flex items-center gap-3">
            <Avatar name={name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-ink-3">{title}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 border-t border-line pt-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* --------------------------- Mobile / tablet top bar --------------------------- */}
      <header className="sticky top-0 z-30 border-b border-line/60 bg-paper/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-display text-lg font-extrabold tracking-tight">Roster</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LogoutButton />
            <Avatar name={name} size="sm" className="ml-1" />
          </div>
        </div>
      </header>

      <main className="min-w-0 px-4 pb-32 pt-5 sm:px-6 sm:pt-7 lg:px-10 lg:pb-14 lg:pt-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>

      {/* ------------------------ Mobile / tablet floating nav ------------------------ */}
      <nav
        aria-label="Main"
        className="no-scrollbar fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-xl items-center justify-between gap-1 overflow-x-auto rounded-2xl border border-line bg-surface/90 p-1.5 shadow-pop backdrop-blur-xl lg:hidden"
      >
        {allNav.map((item) => (
          <TabLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>
    </div>
    )
}

function SideLink ({item, active} : {item: NavItem; active: boolean }){
  const Icon = item.icon;
   return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active ? "bg-brand-soft font-semibold text-brand-ink" : "font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
      }`}
    >
      <Icon className="h-5 w-5 flex-none" />
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
 return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 ${
        active ? "bg-brand-soft px-3.5 text-brand-ink" : "px-2.5 text-ink-3 hover:text-ink"
      }`}
    >
      <Icon className="h-5 w-5 flex-none" />
      {active && <span className="whitespace-nowrap">{item.label}</span>}
      {item.badge ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
