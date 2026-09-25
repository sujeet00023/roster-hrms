import { Schema, model, models, Types, type Document  } from "mongoose";
import type { Capability, Scope } from "../types/capabilities";

export type EmploymentStatus = "active" | "on_leave" | "offboarding" | "terminated"; 

export interface CapabilityGrantDoc {
    key: Capability;
    scope: Scope;
    grantedAt: Date;
    grantedBy: Types.ObjectId | null;
}

export interface EmployeeDoc extends Document {
    name: string;
    email: string;
    passwordHash: string;
    title: string;
    department: string;

    // Reporting graph. managerId is the primary line used for the default
  // "team" scope walk. dottedLineManagerIds lets someone additionally
  // report to, say, a project lead without changing their primary chain.
  // actingManagerId temporarily redirects team-scope approvals (e.g.
  // while the primary manager is on leave) without editing managerId.
  managerId: Types.ObjectId | null;
  dottedLineManagerIds: Types.ObjectId[];
  actingManagerId: Types.ObjectId | null;
  actingManagerUnit: Date | null;

  capabilities: CapabilityGrantDoc[];

  shiftStart: string; // "HH:MM", used by the attendance rule engine
  joinedAt: Date;
  status: EmploymentStatus;
  lastWorkingDay: Date | null; // set once offboarding starts
  ctcAnnual: number //stored only where payroll capability reaches - see README

  createdAt: Date;
  updatedAt: Date;
}

const capabilityGrantSchema = new Schema<CapabilityGrantDoc>(
    {
       key: { type:String , required: true},
       scope: {type: String, required: true, enum: [ "self", "team", "org", "system",] },
       grantedAt: {type: Date, default: () => new Date() },
       grantedBy: {type: Schema.Types.ObjectId, ref: "Employee", default: null },
     
    },
    {_id: false }
);

const employeeSchema = new Schema<EmployeeDoc>(
{
    name: {type: String, reuired: true, trim: true },
    email: {type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: {type: String, required: true },
    department: {type: String, required: true },

    managerId: {type: Schema.Types.ObjectId, ref: "Employee", default: null },
    dottedLineManagerIds: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
    actingManagerId: {type: Schema.Types.ObjectId, ref: "Employee", default: null},
    actingManagerUnit: {type: Date, default: null },

    capabilities: {type: [capabilityGrantSchema ], default: [] },
    shiftStart: {type: String, default:"09:30"},
    joinedAt: {type: Date, required: true },
    status: {
        type:String,
        enum: ["active", "on_leave", "offboarding", "terminated"],
        default: "active",
    },
    lastWorkingDay: {type: Date, default: null },
    ctcAnnual: {type: Number, required: true },
},
{timestamps: true }
);

employeeSchema.index({managerId: 1 });
employeeSchema.index({department: 1 });

employeeSchema.set("toJSON", {
    transform(_doc, ret) {
        const {passwordHash: _passwordHash, ...reset } = ret as unknown as Record<string, unknown >;
        return resizeTo;
    },
})

export const Employee = models.Employee || model<EmployeeDoc>("Employee", employeeSchema);
  


