import { Types } from "mongoose";
import { connectDB } from "./db";
import { assertCan } from "./authorize";
import { Holiday, HolidayDoc } from "@/models/Holiday";
import { AuditLog } from "@/models/AuditLog";

export class HolidayError extends Error {
    constructor(
        message: string,
        public status: number
    ) {
        super(message);
    }
}

export interface HolidayRow {
    id: string;
    date: Date;
    name: string;
}

export async function listHolidays(from: Date, to?: Date): Promise<HolidayRow[]> {
    await connectDB();
    const filter = to ? {date: {$gte: from, $lt: to } } : {date: {$gte: from } };
    const rows = await Holiday.find(filter).sort({ date: 1 }).limit(200).lean<HolidayDoc[]>();
    return rows.map((h) => ({id: h._id.toString(), date: h.date, name: h.name }));
}

async function requirePolicyEdit(actorId: string) {
    try {
        await assertCan(actorId, "policy.edit");
    }catch {
        throw new HolidayError("You don't have permission to manage holidays. ", 403 );
    }
    
}

export async function addHoliday(actorId: string, date: Date, name: string): Promise<HolidayRow> {
    await connectDB();
    await requirePolicyEdit(actorId);

    const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dow = day.getUTCDay();
    if(dow === 0 || dow === 6) {
        throw new HolidayError("That date is a weekend, which is already a day off.", 400);

    }

    try {
        const created = await Holiday.create({ date: day, name, createdBy: new Types.ObjectId(actorId) });
        await AuditLog.create({
            actorId,
            action: "holiday.add",
            scope: "org",
            metadate: {date: day.toISOString().slice(0, 10), name },

        });
        return { id: created.id, date: created.date, name: created.name };
    }catch (err) {
        if ((err as {code?: number }).code === 11000) throw new HolidayError("There's already a holiday on that date", 409);
        throw err;
    }
}

export async function deleteHoliday(actorId: string, id: string): Promise<void> {
    await connectDB();
    await requirePolicyEdit(actorId);
    if(!Types. ObjectId.isValid(id)) throw new HolidayError("Holiday not found.", 404);

    const removed = await Holiday.findByIdAndDelete(id).lean<HolidayDoc>();
    if(!removed) throw new HolidayError("Holiday not found.", 404);

    await AuditLog.create({
        actorId,
        action: "holiday.delete",
        scope: "org",
        metadata: {date: removed.date.toISOString().slice(0, 10), name: removed.name },
    });
}

