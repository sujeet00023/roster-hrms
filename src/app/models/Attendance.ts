import {Schema, model, models, Types, type Document } from "mongoose"
import { Employee } from "./Employee";

export type AttendanceStatus = "present" | "late" | "half_day" | "absent" | "leave" | "off";

export interface AttendanceDoc extends Document {
    employeeId: Types.ObjectId;
    date:Date; // stored at midnight UTC for the calendar day it represents
    checkIn: string | null; // "HH:MM", null if no punch
    checkOut: string | null;
    status: AttendanceStatus;
}

const attendanceSchema = new Schema<AttendanceDoc>(
  {
    employeeId: {type: Schema.Types.ObjectId, ref: "Employee", required: true },
    date: {type:Date, required: true }, // stored at midnight UTC for the calendar day it represents
    checkIn: {type:String, default:null },
    checkOut: {type: String, default: null },
    status: {
        type: String,
        enum: ["present", "late", "half_day", "absent", "leave", "off"],
        required: true,
    },

  },
  {timestamps: true }
);

attendanceSchema.index({ employeeId:1, date: 1 }, {unique: true});

export const Attendance = models.Attendance || model<AttendanceDoc>("Attendance", attendanceSchema);

