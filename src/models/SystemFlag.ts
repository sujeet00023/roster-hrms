import { Schema, model, models, type Document } from "mongoose";

/**
 * One-off, system-wide markers keyed by name. The `_id` is the name, so inserting
 * the same flag twice fails on the unique _id index - an atomic "only one winner"
 * lock without needing transactions. Used to make first-admin setup run exactly once.
 */
export interface SystemFlagDoc extends Document<string> {
    createdAt: Date;
}

 const systemFlagSchema = new Schema<SystemFlagDoc>(
 {_id: {type: String, required: true } },
 {timestamps: {createdAt: true, updatedAt: false } }
);

export const SystemFlag = models.SystemFlag || model<SystemFlagDoc>("SystemFlag", systemFlagSchema);
