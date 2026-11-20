import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { germanText as germanLabels } from "../i18n/legacy/shared";
import { localized } from "../i18n/legacy/core/focus";

import { GHERKIN_LABEL } from "./gherkin";
import type { AtlasModel, FacetRecord, ScenarioStep } from "./types";

export type FocusSeverity = 0 | 1 | 2;

export type FocusBodyRow = { label: string; value: string };

export type FocusItem = {
  id: string;
  severity: FocusSeverity;

  section: string;
  title: string;

  why: string;
  meta: string;
  body: FocusBodyRow[];
};

const KIND_WORD: Record<string, string> = {
  feature: remainingText.text20,
  policy: remainingText.text21,
  assumption: germanLabels.text19,
  entity: remainingText.text22,
};

function gherkinLine(step: ScenarioStep): string {
  const label = step.keyword ? GHERKIN_LABEL[step.keyword] : "";
  return label ? `${label} · ${step.text}` : step.text;
}

function teamOf(record: FacetRecord): string {
  return record.team || localized.text1;
}

function stateOf(scenario: { pre: unknown; post: unknown }): string {
  const describe = (value: unknown, word: string) => {
    if (!value || typeof value !== "object") return "";
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length ? `${word}: ${entries.map(([k, v]) => `${k} ${v}`).join(", ")}` : "";
  };
  const lines = [
    describe(scenario.pre, labelText.text279),
    describe(scenario.post, labelText.text280),
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : localized.text2;
}

export function focusItems(model: AtlasModel): FocusItem[] {
  const items: FocusItem[] = [];

  model.overdueList.forEach(({ rec, check }) => {
    const must = rec.clauses.filter((clause) =>
      localized.text3.test(String(clause.requirement)),
    ).length;
    items.push({
      severity: 0,
      id: rec.id,
      section: "rules",
      title: rec.label,
      why: `${localized.text4}${check.id} war am ${check.next_due}${localized.text5}`,
      meta: teamOf(rec),
      body: [
        { label: localized.text6, value: String(check.id ?? "—") },
        { label: labelText.text293, value: String(check.frequency ?? "—") },
        { label: labelText.text417, value: String(check.last_established ?? "—") },
        { label: labelText.text418, value: rec.artifacts.join("\n") || localized.text7 },
        { label: labelText.text419, value: `${rec.clauses.length} · davon verpflichtend ${must}` },
      ],
    });
  });

  model.assumptions
    .filter((assumption) => assumption.stale)
    .forEach((assumption) => {
      items.push({
        severity: 0,
        id: assumption.id,
        section: "rules",
        title: assumption.label,
        why: `${labelText.text332}${assumption.ageMonths}${localized.text8}`,
        meta: teamOf(assumption),
        body: [
          { label: germanLabels.text19, value: assumption.summary || localized.text9 },
          { label: localized.text10, value: assumption.risk || localized.text11 },
          { label: localized.text12, value: assumption.criticality || "—" },
          {
            label: germanLabels.text135,
            value: assumption.referencedBy.join("\n") || localized.text13,
          },
          {
            label: remainingText.text51,
            value:
              assumption.evidence
                .map((entry) => [entry.date, entry.kind, entry.note].filter(Boolean).join(" · "))
                .join("\n") || localized.text14,
          },
        ],
      });
    });

  model.alerts
    .filter((alert) => !alert.runbook)
    .forEach((alert) => {
      items.push({
        severity: 1,
        id: alert.rec.id,
        section: "ops",
        title: String(alert.name ?? alert.id ?? labelText.text285),
        why: localized.text15,
        meta: teamOf(alert.rec),
        body: [
          { label: labelText.text420, value: String(alert.condition ?? "—") },
          { label: labelText.text421, value: String(alert.severity ?? "—") },
          { label: "Record", value: alert.rec.id },
          {
            label: labelText.text295,
            value: localized.text16,
          },
        ],
      });
    });

  model.unanchored.forEach((record) => {
    items.push({
      severity: 1,
      id: record.id,
      section: "code",
      title: record.label,
      why: localized.text17,
      meta: teamOf(record),
      body: [
        { label: labelText.text422, value: record.summary || localized.text18 },
        { label: localized.text19, value: `${record.total}${localized.text20}${record.proven}` },
        {
          label: labelText.text423,
          value: localized.text21,
        },
      ],
    });
  });

  model.allScn
    .filter((scenario) => !scenario.proven)
    .forEach((scenario) => {
      items.push({
        severity: 1,
        id: scenario.rec.id,
        section: "promises",
        title: scenario.id,
        why: localized.text22,
        meta: teamOf(scenario.rec),
        body: [
          { label: "Record", value: scenario.rec.id },
          { label: germanLabels.text23, value: scenario.steps.map(gherkinLine).join("\n") },
          { label: localized.text23, value: stateOf(scenario) },
          { label: "Test", value: "keiner benannt" },
        ],
      });
    });

  model.noOwner.forEach((record) => {
    items.push({
      severity: 2,
      id: record.id,
      section: "teams",
      title: record.label,
      why: localized.text24,
      meta: "—",
      body: [
        { label: labelText.text424, value: KIND_WORD[record.kind] ?? record.kind },
        { label: labelText.text422, value: record.summary || localized.text25 },
        { label: labelText.text423, value: localized.text26 },
      ],
    });
  });

  model.noIntent.forEach((record) => {
    items.push({
      severity: 2,
      id: record.id,
      section: "records",
      title: record.label,
      why: localized.text27,
      meta: teamOf(record),
      body: [
        { label: labelText.text424, value: KIND_WORD[record.kind] ?? record.kind },
        {
          label: labelText.text423,
          value: localized.text28,
        },
      ],
    });
  });

  model.noObs.forEach((record) => {
    items.push({
      severity: 2,
      id: record.id,
      section: "ops",
      title: record.label,
      why: localized.text29,
      meta: teamOf(record),
      body: [
        { label: labelText.text422, value: record.summary || localized.text30 },
        {
          label: labelText.text423,
          value: localized.text31,
        },
      ],
    });
  });

  model.ghosts.forEach((ghost) => {
    items.push({
      severity: 2,
      id: ghost,
      section: "graph",
      title: String(ghost).split("/").pop() ?? ghost,
      why: localized.text32,
      meta: "—",
      body: [
        { label: labelText.text425, value: ghost },
        {
          label: labelText.text423,
          value: localized.text33,
        },
      ],
    });
  });

  return items.sort((a, b) => a.severity - b.severity);
}

export type LeadSentenceFacts = {
  open: number;
  overdue: number;
  untested: number;
  unanchored: number;
  features: number;
  domains: number;
  coverage: number;
};

export function leadSentenceFacts(model: AtlasModel): LeadSentenceFacts {
  return {
    open: focusItems(model).length,
    overdue: model.overdue,
    untested: model.scnTotal - model.scnProven,
    unanchored: model.unanchored.length,
    features: model.features.length,
    domains: model.domains.length,
    coverage: model.scnTotal ? Math.round((model.scnProven / model.scnTotal) * 100) : 0,
  };
}
