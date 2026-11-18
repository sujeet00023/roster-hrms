import { Schema, model, models, Types, type Document } from "mongoose";


export interface HolidayDoc extends Document {
    date: Date;
    name: string;
    createdBy: Types.ObjectId;
}

const holidaySchema = new Schema<HolidayDoc>(
    {
        date: {type: Date, required: true, unique: true},
        name: {type: String, required: true, trim: true},
        createdBy: {type: Schema.Types.ObjectId, ref: "Employee", required: true },
    },
    {timestamps: true }
);

export const Holiday = models.Holiday || model<HolidayDoc>("Holiday", holidaySchema);
