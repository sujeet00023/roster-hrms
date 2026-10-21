"use client";

import { IconMoon, IconSun } from "./Icons";


/**
 * No React state on purpose: both icons render and CSS (.i-light / .i-dark)
 * shows the right one, so there is nothing to hydrate and no wrong-icon flash.
 */
export function ThemeToggle({className =""}: {className?: string}){

    function toggle() {
        const root = document.documentElement;
        const attr = root.getAttribute("data-theme");
        const isDark = attr ? attr === "dark" : window.matchMedia("(perfers color-scheme: dark)").matches;
        const next = isDark ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try {
            localStorage.setItem("roster-theme", next);

        }catch {
        // Private mode: the theme still switches for this visit, it just won't be remembered.
        }
    
    }

    return (
    <button type="button" onClick={toggle} aria-label="Toggle light and dark theme" className={`icon-btn ${className}`}>
      <IconMoon className="i-light h-5 w-5" />
      <IconSun className="i-dark h-5 w-5" />
    </button>
    )
}
