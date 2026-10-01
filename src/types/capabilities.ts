/**
 * The permission model in one file.
 *
 * Nobody in this system has a "role" that hardcodes what they can see.
 * Every person holds a set of (capability, scope) pairs. A capability is
 * an action ("leave.approve"). A scope is how far that action reaches:
 *
 *   self   - only the holder's own record
 *   team   - the holder, plus everyone below them in the reporting graph
 *   org    - every employee's people data (HR's home scope)
 *   system - accounts, devices, integrations, audit logs (IT admin's home
 *            scope) - deliberately excludes salary, leave reasons, and
 *            performance notes, which live under "org"
 *
 * A "dashboard" is just: the self surface, plus whichever additional
 * blocks the holder's capabilities unlock. There is no separate app per
 * role - see /docs/PHASES.md and the architecture note in README.md.
 */

export const SCOPES = ["self", "team", "org", "system"] as const;
export type Scope = (typeof SCOPES)[number];

/**
 * Every capability the system currently understands. Add to this list
 * deliberately - each one is a real decision about what a human is
 * allowed to see or do, and every grant is logged (see AuditLog).
 */

export const CAPABILITIES = [
  // People data - lives under "org" scope, never "system"
  "profile.view",
  "profile.edit",
  "team.view",
  "directory.view",

  // Attendance
  "attendance.view",
  "attendance.mark",

  // Leave
  "leave.request",
  "leave.approve",
  "leave.view_balance",

  // Payroll
  "payroll.view_own",
  "payroll.run",
  "payroll.view_all",

  // Performance & reviews
  "review.view",
  "review.conduct",

  // HR administration
  "employee.onboard",
  "employee.offboard",
  "policy.edit",
  "audit.view",

  // IT admin - system scope only, never sees salary/leave-reason/review data
  "account.provision",
  "account.deactivate",
  "device.assign",
  "access.revoke",
  "mfa.reset",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/** A single grant held by an employee. */
export interface CapabilityGrant {
    key: Capability;
    scope: Scope;
}



/**
 * Reusable bundles so granting access is "make them a Team Lead", not
 * forty individual checkboxes. Assigning a template copies its grants
 * onto the employee at assignment time (see scripts/seed.ts) - it is a
 * starting point, not a live link, so an individual grant can always be
 * added or revoked afterwards without disturbing the template.
 */
export const ROLE_TEMPLATES: Record<string, CapabilityGrant []>={
    employee: [
        {key: "profile.view", scope: "self" },
        {key: "profile.edit", scope: "self"},
        {key: "attendance.view", scope: "self"},
        {key: "leave.request", scope:"self"},
        {key: "leave.view_balance", scope:"self"},
        {key: "payroll.view_own", scope:"self"},
        {key:"review.view", scope:"self"},
        {key:"directory.view", scope:"org"},
    ],
    team_lead: [
        {key: "team.view", scope:"team" },
        {key: "attendance.view", scope: "team"},
        {key: "leave.approve", scope:"team"},
        {key:"review.conduct", scope:"team"},
    ],

    hr_generalist: [
        {key: "profile.view", scope: "org"},
        {key: "profile.edit", scope: "org"},
        { key: "team.view", scope: "org" },
        { key: "attendance.view", scope: "org" },
        { key: "leave.approve", scope: "org" },
        { key: "leave.view_balance", scope: "org" },
        { key: "payroll.run", scope: "org" },
        { key: "payroll.view_all", scope: "org" },
        { key: "review.view", scope: "org" },
        { key: "employee.onboard", scope: "org" },
        { key: "employee.offboard", scope: "org" },
        { key: "policy.edit", scope: "org" },
        { key: "audit.view", scope: "org" },
    ],
     it_admin: [
    { key: "account.provision", scope: "system" },
    { key: "account.deactivate", scope: "system" },
    { key: "device.assign", scope: "system" },
    { key: "access.revoke", scope: "system" },
    { key: "mfa.reset", scope: "system" },
    { key: "audit.view", scope: "system" },
  ],
};

/** Capabilities that touch data sensitive enough to always audit-log a read. */
export const SENSITIVE_CAPABILITIES: ReadonlySet<Capability> = new Set([
    "payroll.view_all",
    "payroll.run",
    "review.view",
    "review.conduct",
    "leave.view_balance",
    "audit.view",
]);

