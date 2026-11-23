import { Schema, model, models, Types, type Document } from "mongoose";
import { required } from "zod/mini";

/**
 * A published payslip. Every figure is stored as calculated on the day of the run, so
 * later edits to someone's salary or attendance never silently rewrite what was paid.
 * Name, title and department are snapshotted for the same reason.
 */
export interface PayslipRecordDoc extends Document {
    runId: Types.ObjectId;
    month: string;
    employeeId: Types.ObjectId;
    name: string;
    title: string;
    department: string;
    weekdaysInMonth: number;
    preJoinDays: number;
    unpaidDays: number;
    gross: number;
    lopDeduction: number;
    joiningDeduction: number;
    earnedGross: number;
    basic: number;
    providentFund: number;
    professionalTax: number;
    tds: number;
    net: number;
    
}

const num = { type: Number, required: true };

const payslipRecordSchema = new Schema<PayslipRecordDoc>(
    {
        runId: { type: Schema.Types.ObjectId, ref: "PayrollRun", required: true },
        month: { type: String, required: true },
        employeeId: {type: Schema.Types.ObjectId, ref: "Employee", required: true },
        name: {type: String, required: true },
        title: {type: String, required: true },
        department: {type: String, required: true },
        weekdaysInMonth: num,
        preJoinDays: num,
        unpaidDays: num,
        gross: num,
        lopDeduction: num,
        joiningDeduction: num,
        earnedGross: num,
        basic: num,
        providentFund: num,
        professionalTax: num,
        tds: num,
        net: num,
    },
    { timestamps: true }
);

payslipRecordSchema.index({month: 1, employeeId: 1}, {unique: true });
payslipRecordSchema.index({ employeeId: 1, month: -1 });

export const PayslipRecord = 
  models.PayslipRecord || model<PayslipRecordDoc>("PayslipRecord", payslipRecordSchema);