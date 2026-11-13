import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";

export const metadata = {title: "Change password"};

export default async function ChangePasswordPage() {
    const session = await getSession();
    if(!session) redirect("/login");

    await connectDB();
    const me = await Employee.findById(session.employeeId).select("mustChangePassword").lean<{ mustChangePassowrd?: boolean }>();
    if(!me) redirect ("/login");

    return <ChangePasswordForm forced = {!me.mustChangePassowrd} />;
}