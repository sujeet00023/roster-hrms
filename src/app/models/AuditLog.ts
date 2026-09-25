import {Schema, model, models, Types, type Document } from "mongoose";

export interface AuditLogDoc extends Document {
    actorId: Types.ObjectId;
    action: string;
    targetEmployeeId: Types.ObjectId | null;
    scope: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDoc>(
    {
        actorId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
        action: {type: String, required: true },
        targetEmployeeId: {type:Schema.Types.ObjectId, ref: "Employee", default: null },
        scope: {type: String, required: true },
        metadata: {type: Schema.Types.Mixed, default: {} },

    },
    {timestamps: {createdAt: true, updatedAt: false } }
);

auditLogSchema.index({actorId:1, createdAt: -1 });
auditLogSchema.index({targetEmployeeId: 1, createdAt: -1 });

export const AuditLog = models.AuditLog || model<AuditLogDoc>("AuditLog", auditLogSchema );
