/**
 * Wipes and reseeds the database with a small demo org: a CEO, two
 * department heads, a couple of team leads, their reports, one HR
 * generalist, and one IT admin. Everyone's password is "password123" -
 * this is a local demo, not a real deployment.
 *
 * Run with: npm run seed
 */

import "dotenv/config";
import mongoose from "mongoose";
import { Employee } from "@/models/Employee"; 
import { AuditLog } from "@/models/AuditLog";
import { Attendance } from "@/models/Attendance";
import { LeaveRequest } from "@/models/LeaveRequest";
import { hashPassword } from "@/lib/auth";
import { gradePunch } from "@/lib/attendance";
import { ROLE_TEMPLATES, type CapabilityGrant } from "@/types/capabilities";

function mulberry32(seed: number) {
    let a = seed | 0;
    return function(){
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15 ), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t )) ^ t;
        return ((t ^ (t >>> 14 )) >>> 0) / 4294967296;

    };
}

function minsOf(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}
function hhmm(mins: number): string {
    const h = Math.floor(mins / 60 )
    .toString()
    .padStart(2, "0");
    const m = (mins % 60 ).toString().padStart(2, "0");
    return `${h}:${m}`;
}

const MONGODB_URI = process.env.MONGODB_URI;
if(!MONGODB_URI) throw new Error("Set MONGODB_URI in .env.local before sending");

function grantsFor(...templates: (keyof typeof ROLE_TEMPLATES)[]): CapabilityGrant[] {
    return templates.flatMap((t) => ROLE_TEMPLATES[t]);
}

async function main() {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected. Wiping existing demo data...");
    await Employee.deleteMany({});
    await AuditLog.deleteMany({});
    await Attendance.deleteMany({});
    await LeaveRequest.deleteMany({});

    const pw = await hashPassword("password123");
    const on = (date: string) => new Date(date);


    const ceo = await Employee.create({
        name: "Sujeet Khupase",
        email: "sujeetpatil@gmail.com",
        passwordHash: pw,
        title: "Chief Executive Officer",
        department: "Leadership",
        managerId: null,
        joinedAt: on("2026-01-01"),
        ctcAnnual: 45000000,
        capabilities: grantsFor("employee", "hr_generalist"),
    });

    const engHead = await Employee.create({
        name: "Rohan Deshmukh",
        email: "rohan53@gmail.com",
        passwordHash: pw,
        title: "VP Of Engineering",
        department:"Engineering",
        managerId: ceo._id,
        joinedAt: on("2026-01-01"),
        ctcAnnual: 3000000,
        capabilities: grantsFor("employee", "team_lead"),
    });


    const salesHead = await Employee.create({
    name: "Pooja Agarwal",
    email: "poojaagarwal@gmail.com",
    passwordHash: pw,
    title: "VP of Sales",
    department: "Sales",
    managerId: ceo._id,
    joinedAt: on("2021-09-06"),
    ctcAnnual: 2600000,
    capabilities: grantsFor("employee", "team_lead"),
    });

    const hrGeneralist = await Employee.create({
    name: "Lakshmi Subramanian",
    email: "lakshmi@gmail.com",
    passwordHash: pw,
    title: "HR Generalist",
    department: "People",
    managerId: ceo._id,
    joinedAt: on("2023-12-04"),
    ctcAnnual: 1240000,
    capabilities: grantsFor("employee", "hr_generalist"),
    });


    const itAdmin = await Employee.create({
    name: "Kabir Shah",
    email: "kabir@gmail.com",
    passwordHash: pw,
    title: "IT Systems Administrator",
    department: "IT",
    managerId: ceo._id,
    joinedAt: on("2022-05-22"),
    ctcAnnual: 1540000,
    // IT admin deliberately does NOT get hr_generalist grants - system
    // scope, never org scope. This is the separation-of-duties line.
    capabilities: grantsFor("employee", "it_admin"),
  });

  const frontendLead = await Employee.create({
    name: "Ishita Bose",
    email: "ishita@gmail.com",
    passwordHash: pw,
    title: "Frontend Team Lead",
    department: "Engineering",
    managerId: engHead._id,
    joinedAt: on("2022-08-01"),
    ctcAnnual: 1980000,
    capabilities: grantsFor("employee", "team_lead"),
  });

  const backendLead = await Employee.create({
    name: "Aarav Menon",
    email: "aarav@gmail.com",
    passwordHash: pw,
    title: "Backend Team Lead",
    department: "Engineering",
    managerId: engHead._id,
    joinedAt: on("2022-03-14"),
    ctcAnnual: 2050000,
    capabilities: grantsFor("employee", "team_lead"),
  });

  const allEmployees = [ceo, engHead, salesHead, hrGeneralist, itAdmin,frontendLead,backendLead];

  const individualContributors = [
     { name: "Meera Nair", email: "meera.nair@gmail.com", title: "QA Engineer", managerId: backendLead._id, joinedAt: "2024-02-19", ctc: 860000 },
    { name: "Tanvi Rege", email: "tanvi@gmail.com", title: "Backend Engineer", managerId: backendLead._id, joinedAt: "2026-04-06", ctc: 980000 },
    { name: "Farhan Qureshi", email: "farhan@gmail.com", title: "Mobile Engineer", managerId: frontendLead._id, joinedAt: "2022-11-07", ctc: 1450000 },
    { name: "Riya Malhotra", email: "riya@gmail.com", title: "Frontend Engineer", managerId: frontendLead._id, joinedAt: "2026-05-04", ctc: 760000 },
    { name: "Siddharth Rao", email: "siddharth@gmail.com", title: "SDR", managerId: salesHead._id, joinedAt: "2024-01-08", ctc: 640000 },
    { name: "Nikita Joshi", email: "nikita@gmail.com", title: "Account Executive", managerId: salesHead._id, joinedAt: "2023-10-16", ctc: 1160000 },
  ];

  for (const ic of individualContributors){
    const doc = await Employee.create({
        name: ic.name,
        email: ic.email,
        passwordHash: pw,
        title: ic.title,
        department: "Engineering",
        joinedAt: on(ic.joinedAt),
        ctcAnnual: ic.ctc,
        capabilities: grantsFor("employee"),
    });
    allEmployees.push(doc);
  }

  console.log("Generating attendance history...");
  const DAYS = 30;
  const today = new Date();
  today.setUTCHours(0,0,0,0);

        for(const emp of allEmployees) {
            const rnd = mulberry32(emp.email.length * 7919 + emp.name.length * 104729);
            for(let k = DAYS -1; k >=0; k--){
                const date = new Date(today.getTime() - k * 86400000);
                const day = date.getUTCDay();
                if(day === 0 || day === 6) continue;
                if(date < emp.joinedAt) continue;

                const r = rnd();
                if(r < 0.05) continue;

            const drift = Math.round((rnd() - 0.35) * 70);
            const checkInMins = minsOf(emp.shiftStart) + drift;
            const lengthMins = 480 + Math.round(rnd() * 170);
            const checkOutMins = checkInMins + lengthMins;
            const checkInStr = hhmm(Math.max(0, checkInMins));
            const checkOutStr = hhmm(Math.max(0, checkOutMins));

            await Attendance.create({
                employeeId: emp._id,
                date,
                checkIn: checkInStr,
                checkOut: checkOutStr,
                status: gradePunch(emp.shiftStart, checkInStr, checkOutStr),
            });        
    
        }
    }
    // Mark yesterday as an unpaid absence for one employee so the payslip
  // and attendance views have something interesting to show immediately.
    const demoAbsentee = allEmployees.find((e) =>e.email ==="tanvi@gmail.com");
    if(demoAbsentee) {
        const yesterday = new Date(today.getTime() - 86400000);
        await Attendance.findOneAndUpdate(
            {employeeId: demoAbsentee._id, date: yesterday },
            {$set: {checkIn: null, checkOut:null, status: "absent" } },
            {upsert: true }
        );
    }

  // A couple of leave requests so the Leave page has history on first login.
     const ishita = allEmployees.find((e) => e.email === "ishita@gmail.com");
    if(ishita) {
        await LeaveRequest.create({
            employeeId: ishita._id,
            type: "casual",
            from: new Date(today.getTime() + 5 * 86400000 ),
            days: 1,
            reason: "Personal work",
            status: "approved",
            decidedAt: new Date(),
            decisionNote: "1 day(s), balance available, team covered - approved automatically",
            autoDecided: true,
        });
        ishita.leaveBalance.casual -= 1;
        await ishita.save();
    }
    const aarav = allEmployees.find((e) => e.email === "aarav@kitelabs.dev");
    if(aarav) {
        await LeaveRequest.create({
            employeeId: aarav._id,
            type: "earned",
            from: new Date(today.getTime() + 12 * 86400000),
            days: 5,
            reason: "Family trip",
            status: "pending",
            decisionNote: "5 days is over the 2-day auto-approval limit - sent for review.",
            autoDecided: false,

        });
    }

    console.log(`seeded ${await Employee.countDocuments()} employees.`);
    console.log("\nDemo logins(all use password: password123)");
    console.log("CEO     sujeetpatil@gmail.com");
    console.log(" Eng VP rohan53@gmail.com");
    console.log("  Team lead     ishita@gmail.com");
    console.log("  Engineer      tanvi@gmail.com");
    console.log("  HR generalist lakshmi@gmail.com");
    console.log("  IT admin      kabir@gmail.com");

    await mongoose.disconnect();

}

main().catch((err) => {
    console.error(err);
    process.exit(1);
})


