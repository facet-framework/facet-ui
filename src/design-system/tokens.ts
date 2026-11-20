// @facet: foundations/styling/design-tokens
// @facet-role: primary
/**
 * Typed access to the CSS variables from `tokens.css` (FACET design language).
 * Components reference these constants exclusively — no colour literals in TSX.
 */

export const color = {
  paper: "var(--paper)",
  surface: "var(--surface)",
  tint: "var(--tint)",
  tint2: "var(--tint-2)",
  line: "var(--line)",
  line2: "var(--line-2)",
  ink: "var(--ink)",
  soft: "var(--soft)",
  dim: "var(--dim)",
  faint: "var(--faint)",
  signal: "var(--signal)",
  signalSoft: "var(--sig-soft)",
  signalMid: "var(--sig-mid)",
  due: "var(--due)",
  dueSoft: "var(--due-soft)",
  ok: "var(--ok)",
  okSoft: "var(--ok-soft)",
  plan: "var(--plan)",
  scrim: "var(--scrim)",
  heat1: "var(--heat-1)",
  heat2: "var(--heat-2)",
  heat3: "var(--heat-3)",
  heat4: "var(--heat-4)",
} as const;

export const font = {
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
} as const;

export const fontSize = {
  micro: "var(--text-micro)",
  caption: "var(--text-caption)",
  label: "var(--text-label)",
  meta: "var(--text-meta)",
  body: "var(--text-body)",
  base: "var(--text-base)",
  lead: "var(--text-lead)",
  title: "var(--text-title)",
  display: "var(--text-display)",
  hero: "var(--text-hero)",
} as const;

export const space = {
  s1: "var(--space-1)",
  s2: "var(--space-2)",
  s3: "var(--space-3)",
  s4: "var(--space-4)",
  s5: "var(--space-5)",
  s6: "var(--space-6)",
  s7: "var(--space-7)",
} as const;

export const motion = {
  ease: "var(--motion-ease)",
  reveal: "var(--motion-reveal)",
  fade: "var(--motion-fade)",
  open: "var(--motion-open)",
  hit: "var(--motion-hit)",
} as const;

/**
 * The four meaning colours. They never stand alone — rank, weight or position
 * carry the same statement a second time.
 */
export type Meaning = "neutral" | "signal" | "ok" | "plan" | "due";

export const MEANING_COLOR: Record<Meaning, string> = {
  neutral: color.ink,
  signal: color.signal,
  ok: color.ok,
  plan: color.plan,
  due: color.due,
};

export const MEANING_SURFACE: Record<Meaning, string> = {
  neutral: color.tint,
  signal: color.signalSoft,
  ok: color.okSoft,
  plan: color.tint,
  due: color.dueSoft,
};

export type Status = "ready" | "loading" | "empty" | "error";
