
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ONBOARDABLE_TEMPLATES, OnboardError, onboardEmployee } from "@/lib/onboarding";


const bodySchema = z.object({
    name: z.string().trim().min(2).max(80),

    email: z.string().trim().toLowerCase().email().max(120),

    title: z.string().trim().min(2).max(80),

    department: z.string().trim().min(2).max(60),

    managerId: z
        .string()
        .trim()
        .nullable()
    .transform((v) => (v ? v: null )),
     shiftStart: z.string().regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Use HH:MM, e.g. 09:30"
    ),
    ctcAnnual: z.number().int().min(0).max(1_000_000_000),

    template: z.enum(ONBOARDABLE_TEMPLATES),
});

export async function POST(req: Request) {
    const session = await getSession();
    if(!session) return NextResponse.json({ error: "Not authenticated " }, {status: 401 });

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if(!parsed.success) {
        const first = parsed.error.issues[0];
        const field = first?.path.join(".") || "form";
        return NextResponse.json({ error: `Check the ${field} field and try again.`}, {status: 400 } );
    }

    try {
        const result = await onboardEmployee(session.employeeId, {
            ...parsed.data,
            joinedAt: new Date(),
        });

        return NextResponse.json(result, { status: 201 });

    } catch (err) {
        if (err instanceof OnboardError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.status }
            );
        }

        console.error("Onboarding error:", err);

        return NextResponse.json(
            { error: "Could not create that account." },
            { status: 500 }
        );
    }
}
