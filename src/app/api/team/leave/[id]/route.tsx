import { NextResponse } from "next/server";
import {z} from "zod"
import { getSession } from "@/lib/auth";
import { ApprovalError, decideLeaveRequest } from "@/lib/approvals";

const bodySchema = z.object({
    decision: z.enum(["approved", "rejected"]),
    note: z.string(). trim().max(300). optional(),
});

export async function POST(req: Request, ctx: {params: Promise<{ id: string }>}) {
    const session = await getSession();

    if(!session) return NextResponse.json({ error: "Not authenticated" }, {status: 401 });

    const parsed = bodySchema.safeParse(await req.json(). catch(() => null));

    if(!parsed.success) {

    return NextResponse.json({ error: "Choose approve or reject."}, {status: 400});
    
}

    const {id} = await ctx.params;

    try {
        const result = await decideLeaveRequest(
            session.employeeId,
            id,
            parsed.data.decision,
            parsed.data.note
        );
        return NextResponse.json(result);
    } catch (err) {
        if(err instanceof ApprovalError) {
            return NextResponse.json({error: err.message }, {status: err.status });
        }
        return NextResponse.json({ error: "Could not record that decision." }, {status: 500})
    }
}