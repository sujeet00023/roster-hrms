import {redirect} from "next/navigation";
import { SetupForm } from "@/components/SetupForm";
import { isSetupNeeded } from "@/lib/setup";

export const metadata = {title: "Set up" };

export const dynamic = "force-dynamic";

export default async function SetupPage() {
    if(!(await isSetupNeeded())) redirect("/login");
    return<SetupForm />;
    
}