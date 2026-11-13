"use client";

import { useState } from "react";
import { IconEye, IconEyeOff, IconLock } from "./Icons";

export function PasswordField({
    label,
    value,
    onChange,
    autoComplete,
    placeholder,
    hint,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    autoComplete: "current-password" | "new-password";
    placeholder?: string
    hint?: string;

}) {
    const [show, setShow] = useState(false);
    return (
        <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-2">{label}</span>
      <div className="relative">
        <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3" />
        <input
          type={show ? "text" : "password"}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input !px-11"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
        >
          {show ? <IconEyeOff className="h-[18px] w-[18px]" /> : <IconEye className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {hint && <span className="text-xs text-ink-3">{hint}</span>}
    </label>
    )
}