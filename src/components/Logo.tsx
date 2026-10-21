export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, backgroundImage: "var(--grad)", boxShadow: "0 8px 18px -8px rgb(91 91 240 / 0.7)" }}
      className="inline-grid flex-none place-items-center rounded-xl font-display text-lg font-extrabold text-white"
    >
      R
    </span>
  );
}