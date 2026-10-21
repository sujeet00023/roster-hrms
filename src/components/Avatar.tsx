const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-24 w-24 text-3xl",
} as const;

function hueFor(name: string): number {
    let h = 0;
    for (let i = 0; i< name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
}

/** Initials on a gradient derived from the name, so the same person always gets the same colour. */
export function Avatar({
    name,
    size = "md",
    className = "",
}: {
    name: string;
    size?: keyof typeof SIZES;
    className?: string;
}) {
    const hue = hueFor(name);
    const initials = name  
     .split(" ")
     .filter(Boolean)
     .map((w) => w[0])
     .join("")
     .slice(0, 2)
     .toUpperCase();
    
     return (
        <span
      aria-hidden="true"
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 72% 58%), hsl(${(hue + 42) % 360} 70% 46%))`,
      }}
      className={`inline-grid flex-none place-items-center rounded-full font-display font-bold text-white ${SIZES[size]} ${className}`}
    >
      {initials}
    </span>
     ); 
}