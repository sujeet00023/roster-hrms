import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/authorize";
import { listAudit } from "@/lib/auditlog";
import { APP_TIMEZONE } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";

export const metadata = {title: "Audit log"};

export default async function AuditPage() {
    const session = await getSession();
    const actorId = session!.employeeId;

    if(!(await can(actorId, "audit.view"))) notFound();
    const entries = await listAudit(actorId, 100);
    if(!entries) notFound();

    return(
        <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Audit log"
        subtitle="Who looked at sensitive data and who changed what. Opening this page is recorded too."
      />

      <Panel title="Latest activity" note={`Showing the ${entries.length} most recent`}>
        {entries.length === 0 ? (
          <p className="px-5 pb-6 pt-3 text-sm text-ink-2 sm:px-6">Nothing recorded yet.</p>
        ) : (
          <div className="mt-2 divide-y divide-line">
            {entries.map((e) => (
              <div key={e.id} className="flex items-start gap-3.5 px-5 py-3.5 sm:px-6">
                <Avatar name={e.actor} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold">{e.actor}</span> {e.verb}
                    {e.target && e.target !== e.actor ? (
                      <>
                        {" "}
                        for <span className="font-semibold">{e.target}</span>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {new Date(e.at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: APP_TIMEZONE,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
    );
    
}