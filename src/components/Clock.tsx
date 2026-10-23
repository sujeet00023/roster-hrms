"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void ) {
    const id = setInterval(onTick, 1000);
    return () => clearInterval(id);
}

const now  = () => Math.floor(Date.now() / 1000);
// Server snapshot is 0, so first paint is a stable placeholder and hydration never mismatches.
const serverNow = () => 0;

export function Clock({ timeZone }: {timeZone: string } ) {
    const secs = useSyncExternalStore(subscribe, now, serverNow);

    if(secs === 0) {
        return <span className="font-display text-4xl font-extrabold tracking-tight opacity-60">--:--</span>;
    }

    const d = new Date(secs * 1000);
    const hm = d.toLocaleDateString("en-IN", {hour: "2-digit", minute: "2-digit", hour12: false, timeZone });
    const s = d.toLocaleTimeString("en-IN", {second: "2-digit", timeZone } ).padStart(2, "0");

    return (
        <span className="font-display text-4xl font-extrabold tracking-tight" aria-label={`${hm} and ${s} seconds`}>
      {hm}
      <span className="ml-1 text-xl font-bold opacity-60">{s}</span>
    </span>
    )
}