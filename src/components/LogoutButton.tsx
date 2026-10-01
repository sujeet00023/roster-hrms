"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ className = ""}: {className?: string} ) {
    const router = useRouter();
    const [ pending, setPending] = useState(false);

    async function handleLogout() {
        setPending(true);
        await fetch("/api/auth/logout", {method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <button
        onClick = {handleLogout}
        disabled = {pending}
      className={`text-sm text-ink-2 hover:text-ink disabled:opacity-50 ${className}`}
    >
        {pending ? "Signing out..." : "Sign out"}
    </button>
    )
}