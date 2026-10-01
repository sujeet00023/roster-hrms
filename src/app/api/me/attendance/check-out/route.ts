import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkOut } from "@/lib/attendance";
import { error } from "console";

export async function POST() {
    const session = await getSession();
    if(!session) return NextResponse.json({ error: "Not authenticated"}, {status: 401});

    try {
        const row = await checkOut(session.employeeId);
        return NextResponse.json(row);
    }catch(err) {
        return NextResponse.json(
            {error: err instanceof Error ? err.message: "Could not check out."},
            {status: 400}
        );
    }
}