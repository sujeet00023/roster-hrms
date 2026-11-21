import { NextResponse } from "next/server";
import {z} from "zod";
import { getSession } from "@/lib/auth";
import { HolidayError, addHoliday } from "@/lib/holidays";

const bodySchema = z.object({
    date: z.coerce.date(),
    name: z.string().trim().min(2).max(80),
});

export async function POST(req: Request) {

    const session = await getSession();
    if(!session) return NextResponse.json({ error: "Not authenticated" }, {status: 401 });

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if( !parsed.success) {
        return NextResponse.json({ error: "Enter a date and a name for the holiday."}, {status: 400 });
    }

    try {
        const created = await addHoliday(session.employeeId, parsed.data.date, parsed.data.name);
        return NextResponse.json(created, {status: 201 });
    }catch (err) {
        if(err instanceof HolidayError) return NextResponse.json({error: err.message}, {status: err.status });
        return NextResponse.json({ error: "Could not add that holiday."}, {status: 500 });
    }
    
}