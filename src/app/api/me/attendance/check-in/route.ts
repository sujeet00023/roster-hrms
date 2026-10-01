import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkIn } from "@/lib/attendance";

export async function POST() {
    const session = await getSession();
    if(!session) return NextResponse.json({error: "NOt authenticated"}, {status: 401 });

    try{
        const now = await checkIn(session.employeeId);
        return NextResponse.json(now);

    }catch (err) {
        return NextResponse.json(
            {error:err instanceof Error ? err.message :  "Could not check in" },
            {status : 400 }
        );
    }
    
}
