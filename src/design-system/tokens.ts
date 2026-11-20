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

/** The seven FACET facets of a record, in schema order. */
export const FACETS = [
  "intent",
  "contract",
  "verification",
  "observation",
  "knowledge",
  "lineage",
  "anchors",
] as const;

export type Facet = (typeof FACETS)[number];

/**
 * English plain-text labels — schema jargon stays in the raw source. For the
 * active language use `facetLabel` from `@facet-tools/ui/core`.
 */
export const FACET_LABEL: Record<Facet, string> = {
  intent: "Purpose",
  contract: "Promise",
  verification: "Test coverage",
  observation: "Operations",
  knowledge: "Knowledge",
  lineage: "Origin",
  anchors: "Entry points in code",
};

/** Test levels from `verification.*_tests`. */
export const TEST_KINDS = ["unit", "property", "integration", "e2e"] as const;

export type TestKind = (typeof TEST_KINDS)[number];

/** English test-level labels; `testKindLabel` from `@facet-tools/ui/core` follows the active language. */
export const TEST_KIND_LABEL: Record<string, string> = {
  unit: "Unit",
  property: "Property",
  integration: "Integration",
  e2e: "End-to-end",
};

/** English record-kind words; `recordKindLabel` from `@facet-tools/ui/core` follows the active language. */
export const KIND_WORD: Record<string, string> = {
  feature: "Feature",
  policy: "Policy",
  assumption: "Assumption",
  entity: "Data object",
};

/** English lifecycle words; `lifecycleLabel` from `@facet-tools/ui/core` follows the active language. */
export const LIFECYCLE_LABEL: Record<string, string> = {
  active: "active",
  planned: "planned",
  deprecated: "deprecated",
  draft: "draft",
};

/** Lifecycle colour: active carries ink, planned ochre, deprecated muted. */
export function lifecycleColor(lifecycle: string | undefined): string {
  if (lifecycle === "active") return color.ink;
  if (lifecycle === "planned") return color.plan;
  if (lifecycle === "deprecated") return color.faint;
  return color.dim;
}

/**
 * Heat level of a cell in the defect register: four opacities of the same
 * signal colour, graded against the largest count in the registry.
 *
 * Relative and not absolute, because there is no threshold that holds for two
 * repositories — three fixes are the peak in a registry whose maximum is three
 * and a footnote in one whose maximum is forty. So the scale shows where
 * something stands relative to the rest, and the number in the cell says how
 * many there are: the colour never carries the statement alone.
 *
 * `0` is not a level but the surface beneath. A value nobody has collected is
 * not one either — for that the caller asks `present`.
 */
export function heatSurface(count: number, max: number): string {
  if (count <= 0 || max <= 0) return "transparent";
  const ratio = count / max;
  if (ratio <= 0.25) return color.heat1;
  if (ratio <= 0.5) return color.heat2;
  if (ratio <= 0.75) return color.heat3;
  return color.heat4;
}

/** The four states every FACET component handles. */
export type Status = "ready" | "loading" | "empty" | "error";
