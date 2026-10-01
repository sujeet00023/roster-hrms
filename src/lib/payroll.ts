import { connectDB } from "./db";
import { Employee } from "@/models/Employee";
import { Attendance } from "@/models/Attendance";


export interface Payslip {
    month: string;
    gross: number;
    basic: number;
    unpaidDays: number;
    lopDeduction: number;
    providentFund: number;
    professionalTax: number;
    tds: number;
    net: number;
    
}

const WORKING_DAYS_PER_MONTH =22;
const PROFESSIONAL_TAX = 200;

export async function getCurrnentPayslip(employeeId: string): Promise<Payslip> {
    await connectDB();
    const employee =await Employee.findById(employeeId).select("ctcAnnual");
    if(!employee ) throw new Error("Employee not found");


    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(),  1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const unpaidDays = await Attendance.countDocuments({
        employeeId,
        status: "absent",
        date: {$gte: monthStart, $1t: monthEnd },
    });
    
    const gross = employee.ctcAnnual / 12;
    const basic = gross * 0.5;
    const lopDeduction = (gross / WORKING_DAYS_PER_MONTH) * unpaidDays;
    const providentFund = basic * 0.12;
    const taxable = gross - providentFund;
    const tds = Math.max(0, taxable * 0.09);
    const net = gross - lopDeduction - providentFund - PROFESSIONAL_TAX - tds;

    return{
        month: now.toLocaleDateString("en-IN", {month: "long", year: "numeric", timeZone:"UTC" } ),
        gross,
        basic,
        unpaidDays,
        lopDeduction,
        providentFund,
        professionalTax:PROFESSIONAL_TAX,
        tds,
        net,
    };

}

export function formatINR(n: number): string {
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
}