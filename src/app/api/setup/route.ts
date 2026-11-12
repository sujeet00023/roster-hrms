import { NextResponse } from "next/server";
import {z} from "zod";
import { createSession } from "@/lib/auth"; 
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { SetupError, createFirstAdmin } from "@/lib/setup";

const bodySchema = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(120),
    Password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
});

export async function POST(req:Request) {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if(!parsed.success) {
        return NextResponse.json(
            {error: `Enter your name, a valid email, and a password of at least ${MIN_PASSWORD_LENGTH} characters.`},
            {status: 400 }
        );
    }
    

    try {
        const id = await createFirstAdmin(parsed.data);
        await createSession(id);
        return NextResponse.json({ok: true });

    }catch (err) {
        if(err instanceof SetupError) return NextResponse.json({error: err.message}, {status: err.status });
        return NextResponse.json({error: "Setup failed. Check the database connection and try again."}, {status: 500 }) ;
    }
}