import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { submitLeaveRequest } from "@/lib/leave";

const bodySchema = z.object({
    type: z.enum(["earned", "casual", "sick"]),
    from: z.coerce.date(),
    days: z.number().min(0.5).max(30),
    reason: z.string(). trim().min(3).max(300),
});

export async function POST(req: Request) {
    
    const session = await getSession();
    if(!session) return NextResponse.json({ error: "Not authenticated"}, {status: 401 });

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if(!parsed.success) {
        return NextResponse.json({ error: "Check the leave request details and try again"}, {status:400});
    }

    try{
        const result = await submitLeaveRequest(session.employeeId, parsed.data);
        return NextResponse.json(result);
    }catch(err){
        return NextResponse.json(
            {error: err instanceof Error ? err.message: "Could not submit that request."},
            {status: 400 }
        );
    }
}