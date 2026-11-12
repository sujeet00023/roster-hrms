import { NextResponse } from "next/server";
import {z} from "zod";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { Employee } from "@/models/Employee";

const bodySchema = z.object({
    current: z.string().min(1).max(MAX_PASSWORD_LENGTH),
    next: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
});


export async function POST(req: Request) {
    const session = await getSession();
    if(!session) return NextResponse.json({ error: "Not authenticated" }, {status: 401 });

    const parsed = bodySchema.safeParse(await req.json(). catch(() => null ));
    if(!parsed.success) {
        return NextResponse.json(
            {error: `Your new password needs at least ${MAX_PASSWORD_LENGTH} characters.` },
            {status: 400}
        );
    }
    const {current, next} = parsed.data;

    if(current === next ) {
        return NextResponse.json({ error: "Choose a password different from your current one."}, {status: 400 });

    }
    await connectDB();
    const employee = await Employee.findById(session.employeeId);
    if(!employee || employee.status === "terminated") {
        return NextResponse.json({ error: "Not authenticated" }, {status:401 });

    }

    if(!(await verifyPassword(current, employee.passwordHash ))) {
        return NextResponse.json({ error: "Your current password isn't right"}, {status: 400 });

    }

    employee.passwordHash = await hashPassword(next);
    employee.mustChangePassword = false;
    await employee.save();

    return NextResponse.json({ ok: true });
}