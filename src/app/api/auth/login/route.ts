import {NextResponse} from "next/server";
import {email, z} from "zod";
import {connectDB} from "@/lib/db";
import { Employee } from "@/app/models/Employee";
import {verifyPassword, createSession} from "@/lib/auth";

const loginSchema = z.object({
    email:z.string().email(),
    password:z.string().min(1),

});

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if(!parsed.success) {
        return NextResponse.json({ error: "Enter a valid email and password..."}, {status:400});
    }

    await connectDB();
    const employee = await Employee.findOne({ email:parsed.data.email.toLowerCase() });

    const invalid = () =>
        NextResponse.json({ error: "That email and password don't match."}, {status:401});
    
    if (!employee) return invalid();
    if(employee.status === "terminated") return invalid();

    const ok = await verifyPassword(parsed.data.password, employee.passwordHash);
    if(!ok) return invalid();

    await createSession(employee.id);

    return NextResponse.json({
        id: employee.id,
        name: employee.name,
        email: employee.email,
    });

}