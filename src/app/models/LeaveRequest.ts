import {Schema, model, models, Types, type Document } from "mongoose";

export type LeaveType = "earned" | "casual" | "sick";
export type leaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequestDoc extends Document {
    employeeId: Types.ObjectId;
    type: LeaveType;
    from: Date;
    days: number;
    reason: string;
    status: leaveStatus;
    decidedBy: Types.ObjectId | null;
    decidedAt: Date | null;
    decisionNote: string | null;
    autoDecided: boolean;
    createdAt: Date;
}

const leaveRequestSchema = new Schema<LeaveRequestDoc>(
    {
        employeeId: {type: Schema.Types.ObjectId, ref: "Employee", required: true},
        type: {type: String, enum: ["earned", "casual", "sick"], required: true},
        from: { type: Date, required: true },
        days: {type: Number, required: true, min:0.5},
        reason: {type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "cancelled"],
            default: "pending",
    },
        decidedBy: {type: Schema.Types.ObjectId, ref: "Employee", default: null},
        decidedAt: {type: Date, default: null},
        decisionNote: {type: String, default: null },
        autoDecided: {type: Boolean, default: false },
    },
    {timestamps: {createdAt: true, updatedAt: false } }
);

leaveRequestSchema.index({ employeeId:1, createdAt: -1 } );

export const LeaveRequest = models.LeaveRequest || model<LeaveRequestDoc>("LeaveRequest", leaveRequestSchema);