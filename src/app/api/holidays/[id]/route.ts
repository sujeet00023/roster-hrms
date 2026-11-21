import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { HolidayError, deleteHoliday } from "@/lib/holidays";
import { error } from "console";

export async function DELETE(_req:Request, ctx: {params: Promise<{id: string }>}) {
    const session = await getSession();
    if(!session) return NextResponse.json({ error: "Not authenticated "}, {status: 401 });

    const {id} = await ctx.params;
    try {
        await deleteHoliday(session.employeeId, id );
        return NextResponse.json({ ok: true });
    }catch(err) {
        if(err instanceof HolidayError) return NextResponse.json({ error: err.message}, {status: err.status });
        return NextResponse.json({ error: "Could not remove that holiday." }, {status: 500 });
    }
    
}