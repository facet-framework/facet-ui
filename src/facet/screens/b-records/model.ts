import type { Tone } from "../../primitives/controls";
import type { TextKey } from "../../i18n/en";
import type { FacetText } from "../../i18n/TextProvider";

export type Lifecycle = "active" | "planned" | "deprecated";
export type RecordKind = "feature" | "assumption";

export type RecordRow = {
  id: string;
  slug: string;
  domain: string;
  capability: string;
  kind: RecordKind;
  lifecycle: Lifecycle;
  owner: string | null;
  summary: string;
  scenarios: number;
  proven: number;
  anchors: number;
  drift: number;
  knowledgeOpen: number;
  changedAt: string | null;
};

export type Text = FacetText["t"];

export function share(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

export const pctText = (p: number | null, t: Text) =>
  p == null ? "—" : t("b.common.percent", { value: p });

export const LIFECYCLE: Record<Lifecycle, { label: TextKey; tone: Tone }> = {
  active: { label: "b.lifecycle.active", tone: "ok" },
  planned: { label: "b.lifecycle.planned", tone: "plan" },
  deprecated: { label: "b.lifecycle.deprecated", tone: "warn" },
};

export const KIND_LABEL: Record<RecordKind, TextKey> = {
  feature: "b.kind.feature",
  assumption: "b.kind.assumption",
};

export const ROLE_LABEL: Record<string, TextKey> = {
  primary: "b.role.primary",
  related: "b.role.related",
  config: "b.role.config",
  data: "b.role.data",
  "": "b.role.none",
};

export const roleLabel = (role: string, t: Text) => {
  const key = ROLE_LABEL[role];
  return key ? t(key) : role;
};

export type KnowledgeKey =
  "prerequisite_knowledge" | "discoverability" | "success_signal" | "not_for" | "common_pitfalls";

export const KNOWLEDGE_SLOTS: { key: KnowledgeKey; label: TextKey; question: TextKey }[] = (
  [
    "prerequisite_knowledge",
    "discoverability",
    "success_signal",
    "not_for",
    "common_pitfalls",
  ] as const
).map((key) => ({
  key,
  label: `b.knowledge.${key}.label` as const,
  question: `b.knowledge.${key}.question` as const,
}));

export type StepKeyword = "given" | "when" | "then" | "and";
export type GwtStep = { kw: StepKeyword; text: string };

export const STEP_LABEL: Record<StepKeyword, TextKey> = {
  given: "b.step.given",
  when: "b.step.when",
  then: "b.step.then",
  and: "b.step.and",
};

const KW = /^(given|when|then|and|but)\b\s*/i;

export function parseSteps(text: string): GwtStep[] {
  const flat = text
    .replace(/\s*\n\s*(?=(given|when|then|and|but)\b)/gi, "\u0000")
    .replace(/\s*\n\s*/g, " ")
    .replace(/,\s+(?=(when|then)\b)/gi, "\u0000");
  const steps: GwtStep[] = [];
  for (const part of flat.split("\u0000")) {
    const m = KW.exec(part);
    const body = part.replace(KW, "").trim();
    if (!body) continue;
    if (m) {
      const k = m[1].toLowerCase();
      steps.push({ kw: k === "but" ? "and" : (k as StepKeyword), text: body });
    } else if (steps.length) {
      steps[steps.length - 1].text += ` ${body}`;
    } else {
      steps.push({ kw: "given", text: body });
    }
  }
  return steps;
}

export const words = (slug: string) => slug.replace(/[-_]+/g, " ");

export function dateText(iso: string | null, t: Text): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return t("b.common.date", { y, m, d });
}

export const TAG = ["@", "facet"].join("");
