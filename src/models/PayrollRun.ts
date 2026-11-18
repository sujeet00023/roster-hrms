import { Schema, model, models, Types, type Document } from "mongoose";

export interface PayrollRunDoc extends Document {
    month: string;
    employeeCount: number;
    totalGross: number;
    totalNet: number;
    totalUnpaidDays: number;
    createdBy: Types.ObjectId;
    publishedAt: Date;

}

const payrollRunSchema = new Schema<PayrollRunDoc>(
    {
        month: {type: String, required: true, unique: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
        employeeCount: {type: Number, required: true },
        totalGross: {type: Number, required: true },
        totalNet: {type: Number, required: true },
        totalUnpaidDays: {type: Number, required: true },
        createdBy: {type: Schema.Types.ObjectId, ref: "Employee", required: true },
        publishedAt: {type: Date, default: () => new Date() }, 
    },
    {timestamps: true }
);

export const PayrollRun = models.PayrollRun || model<PayrollRunDoc>("PayrollRun", payrollRunSchema);