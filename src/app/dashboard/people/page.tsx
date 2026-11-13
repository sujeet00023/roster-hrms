import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/authorize";
import { listDirectory } from "@/lib/directory";
import { formatDay } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { IconMail, IconPlus } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPil";


export const metadata = {title: "Directory" };

export default async function DirectoryPage({
    searchParams,
}: {
    searchParams: Promise<{q?: string; dept?: string }>;
}) {
    const session = await getSession();
    const actorId = session!.employeeId;
    const {q = "", dept = "" } = await searchParams;

    const [directory, canOnboard] = await Promise.all([
        listDirectory(actorId, {q, dept }),
        can(actorId, "employee.onboard", undefined, {silent: true }),
    ]);
    if(!directory) notFound();

    const filtered = Boolean(q || dept);

    return (
        <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Directory"
        subtitle={`${directory.total} ${directory.total === 1 ? "person" : "people"}${filtered ? " match your filters" : " across the company"}.`}
        action={
          canOnboard ? (
            <Link href="/dashboard/people/new" className="btn btn-primary">
              <IconPlus className="h-4 w-4" />
              Add employee
            </Link>
          ) : undefined
        }
      />

      <form method="get" className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
        <input type="search" name="q" defaultValue={q} placeholder="Search by name, role or email" aria-label="Search the directory" className="input sm:flex-1" />
        <select name="dept" defaultValue={dept} aria-label="Filter by department" className="input sm:w-56">
          <option value="">All departments</option>
          {directory.departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary flex-1 sm:flex-none">
            Search
          </button>
          {filtered && (
            <Link href="/dashboard/people" className="btn btn-secondary flex-1 sm:flex-none">
              Clear
            </Link>
          )}
        </div>
      </form>

      {directory.rows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-2">No one matches that. Try a different name or clear the filters.</div>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {directory.rows.map((p) => (
            <article key={p.id} className="card flex items-start gap-3.5 p-4 sm:p-5">
              <Avatar name={p.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="truncate text-[15px] font-semibold">{p.name}</p>
                  {directory.seesStatus && p.status !== "active" && <StatusPill status={p.status} />}
                </div>
                <p className="truncate text-sm text-ink-2">{p.title}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand-ink">{p.department}</span>
                  {p.managerName && <span>Reports to {p.managerName}</span>}
                  {directory.seesStatus && <span>Joined {formatDay(p.joinedAt, { month: "short", year: "numeric" })}</span>}
                </p>
                <a href={`mailto:${p.email}`} className="mt-2 inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-brand-ink">
                  <IconMail className="h-3.5 w-3.5 flex-none" />
                  <span className="truncate">{p.email}</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
    )

}