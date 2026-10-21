/** One place that maps a meaning to its colours, so every card, pill and icon tile agrees. */
export const TONES = {
  present: "bg-present-soft text-present",
  watch: "bg-watch-soft text-watch",
  away: "bg-away-soft text-away",
  leave: "bg-leave-soft text-leave",
  brand: "bg-brand-soft text-brand-ink",
  neutral: "bg-surface-2 text-ink-2",
} as const;

export type Tone = keyof typeof TONES;

/** CSS variable holding each tone's solid colour (used by SVG rings and bars). */
export const TONE_VAR: Record<Tone, string> = {
  present: "var(--present)",
  watch: "var(--watch)",
  away: "var(--away)",
  leave: "var(--leave)",
  brand: "var(--brand)",
  neutral: "var(--ink-3)",
};
