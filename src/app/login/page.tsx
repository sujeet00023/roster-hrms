import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { isSetupNeeded } from "@/lib/setup";

export const metadata = {title: "Sign-in" };

// Depends on live database state, so it must render per request, never at build time.
export const dynamic = "force-dynamic";

export default async function LoginPage() {

   // A brand-new database has nobody to sign in as, so send the first visitor to setup.
  let needsSetup = false;
  try{
    needsSetup = await isSetupNeeded();
  }catch {
   // Database unreachable: still show the form so the real error appears on submit.
  }

  if(needsSetup) redirect("/setup");

  return <LoginForm></LoginForm>
}