import { remainingText } from "../i18n/legacy/remaining";
import { germanText as germanLabels } from "../i18n/legacy/shared";
import { localized } from "../i18n/legacy/design-system/tokens";

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
  deadline: "var(--deadline)",
  deadlineSoft: "var(--deadline-soft)",
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

export type Meaning = "neutral" | "signal" | "ok" | "plan" | "deadline";

export const MEANING_COLOR: Record<Meaning, string> = {
  neutral: color.ink,
  signal: color.signal,
  ok: color.ok,
  plan: color.plan,
  deadline: color.deadline,
};

export const MEANING_SURFACE: Record<Meaning, string> = {
  neutral: color.tint,
  signal: color.signalSoft,
  ok: color.okSoft,
  plan: color.tint,
  deadline: color.deadlineSoft,
};

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

export const FACET_LABEL: Record<Facet, string> = {
  intent: remainingText.text13,
  contract: germanLabels.text23,
  verification: remainingText.text14,
  observation: remainingText.text15,
  knowledge: remainingText.text16,
  lineage: remainingText.text17,
  anchors: germanLabels.text112,
};

export const TEST_KINDS = ["unit", "property", "integration", "e2e"] as const;

export type TestKind = (typeof TEST_KINDS)[number];

export const TEST_KIND_LABEL: Record<string, string> = {
  unit: remainingText.text18,
  property: remainingText.text19,
  integration: "Integration",
  e2e: germanLabels.text113,
};

export const KIND_WORD: Record<string, string> = {
  feature: remainingText.text20,
  policy: remainingText.text21,
  assumption: germanLabels.text19,
  entity: remainingText.text22,
};

export const LIFECYCLE_LABEL: Record<string, string> = {
  active: remainingText.text7,
  planned: remainingText.text23,
  deprecated: localized.text1,
  draft: remainingText.text24,
};

export function lifecycleColor(lifecycle: string | undefined): string {
  if (lifecycle === "active") return color.ink;
  if (lifecycle === "planned") return color.plan;
  if (lifecycle === "deprecated") return color.faint;
  return color.dim;
}

export function heatSurface(count: number, max: number): string {
  if (count <= 0 || max <= 0) return "transparent";
  const ratio = count / max;
  if (ratio <= 0.25) return color.heat1;
  if (ratio <= 0.5) return color.heat2;
  if (ratio <= 0.75) return color.heat3;
  return color.heat4;
}

export type Status = "ready" | "loading" | "empty" | "error";
