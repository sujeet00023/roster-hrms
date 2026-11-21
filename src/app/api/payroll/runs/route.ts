import { NextResponse } from "next/server";
import {z} from "zod";
import { getSession } from "@/lib/auth";
import { PayrollError, publishRun } from "@/lib/payrollRun";
import { error } from "console";

const bodySchema = z.object({ month: z.string().regex(/^\d{4}-(0[1-9] | 1[0-2])$/)});

export async function POST(req: Request ) {
    const session = await getSession();
    if(!session) return NextResponse.json({error: "Not authenticated"}, {status: 401 });

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if(!parsed.success) return NextResponse.json({ error: "Choose a valid month."}, {status: 400 });

    try {
        const result = await publishRun(session.employeeId, parsed.data.month);
        return NextResponse.json(result, {status: 201 });    
    }catch (err) {
        if(err instanceof PayrollError) return NextResponse.json({ error: err.message }, {status: err.status });
        return NextResponse.json({ error: "Could not publish payroll.Nothing was saved "}, {status: 500 });
        
    }
    
}