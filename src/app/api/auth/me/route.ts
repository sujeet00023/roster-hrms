import  {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {connectDB}  from "@/lib/db";
import { Employee } from "@/app/models/Employee";

export async function GET() {
    const session = await getSession();
    if(!session) return NextResponse.json({ error: "Not authenticated"}, {status:401});
    
    await connectDB();
    const employee = await Employee.findById(session.employeeId).select("-passwordHash");
    if (!employee) return NextResponse.json({error: "Not authenticated" }, {status:401 });

    return NextResponse.json(employee);
    
}

