import { deCore } from "../facet/i18n/catalog/core";
/**
 * Focus list from the loaded corpus: expired deadlines before missing
 * evidence and missing details. Every entry names the affected record or
 * reference, a reason and the related evidence as field values.
 */

import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import { gherkinLabel, recordKindLabel } from "./labels";
import type { AtlasModel, FacetRecord, ScenarioStep } from "./types";

/** 0 = deadline expired, 1 = evidence missing, 2 = detail missing. */
export type FocusSeverity = 0 | 1 | 2;

export type FocusBodyRow = { label: string; value: string };

export type FocusItem = {
  /** Id of the affected record (or of the reference without a record). */
  id: string;
  severity: FocusSeverity;
  /** Register section in which the item stands in full. */
  section: string;
  title: string;
  /** A reason in plain words. */
  why: string;
  meta: string;
  body: FocusBodyRow[];
};

function gherkinLine(step: ScenarioStep, text: FacetText): string {
  const label = step.keyword ? gherkinLabel(step.keyword, text) : "";
  return label ? `${label} · ${step.text}` : step.text;
}

function stateOf(scenario: { pre: unknown; post: unknown }, text: FacetText): string {
  const describe = (value: unknown, word: string) => {
    if (!value || typeof value !== "object") return "";
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length ? `${word}: ${entries.map(([k, v]) => `${k} ${v}`).join(", ")}` : "";
  };
  const lines = [
    describe(scenario.pre, text.t("core.focus.before")),
    describe(scenario.post, text.t("core.focus.after")),
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : text.t("core.focus.noStateChange");
}

/**
 * Builds the focus list. Order: deadlines first — they are the only items
 * with a date that has already passed.
 */
export function focusItems(model: AtlasModel, text: FacetText = ENGLISH_TEXT): FocusItem[] {
  const { t } = text;
  const items: FocusItem[] = [];
  const teamOf = (record: FacetRecord) => record.team || t("core.focus.noTeam");
  const kindOf = (record: FacetRecord) => recordKindLabel(record.kind, text);

  model.overdueList.forEach(({ rec, check }) => {
    const must = rec.clauses.filter((clause) =>
      // Accept German requirement keywords alongside English MUST.
      new RegExp(deCore["core.requirement.bindingPattern"]).test(String(clause.requirement)),
    ).length;
    items.push({
      severity: 0,
      id: rec.id,
      section: "rules",
      title: rec.label,
      why: t("core.focus.overdueWhy", { id: String(check.id), date: String(check.next_due) }),
      meta: teamOf(rec),
      body: [
        { label: t("core.focus.label.review"), value: String(check.id ?? "—") },
        { label: t("core.focus.label.frequency"), value: String(check.frequency ?? "—") },
        { label: t("core.focus.label.last"), value: String(check.last_established ?? "—") },
        {
          label: t("core.focus.label.artifacts"),
          value: rec.artifacts.join("\n") || t("core.focus.none"),
        },
        {
          label: t("core.focus.label.clauses"),
          value: t("core.focus.clauseCount", { count: rec.clauses.length, must }),
        },
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
        why: t("core.focus.staleWhy", { months: String(assumption.ageMonths) }),
        meta: teamOf(assumption),
        body: [
          {
            label: t("core.focus.label.assumption"),
            value: assumption.summary || t("core.focus.noDescription"),
          },
          {
            label: t("core.focus.label.ifWrong"),
            value: assumption.risk || t("core.focus.noRisk"),
          },
          { label: t("core.focus.label.criticality"), value: assumption.criticality || "—" },
          {
            label: t("core.focus.label.usedBy"),
            value: assumption.referencedBy.join("\n") || t("core.focus.noReference"),
          },
          {
            label: t("core.focus.label.evidence"),
            value:
              assumption.evidence
                .map((entry) => [entry.date, entry.kind, entry.note].filter(Boolean).join(" · "))
                .join("\n") || t("core.focus.noEvidence"),
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
        title: String(alert.name ?? alert.id ?? t("core.focus.alert")),
        why: t("core.focus.alertWhy"),
        meta: teamOf(alert.rec),
        body: [
          { label: t("core.focus.label.condition"), value: String(alert.condition ?? "—") },
          { label: t("core.focus.label.severity"), value: String(alert.severity ?? "—") },
          { label: t("core.focus.label.record"), value: alert.rec.id },
          { label: t("core.focus.label.runbook"), value: t("core.focus.runbookMissing") },
        ],
      });
    });

  model.unanchored.forEach((record) => {
    items.push({
      severity: 1,
      id: record.id,
      section: "code",
      title: record.label,
      why: t("core.focus.unanchoredWhy"),
      meta: teamOf(record),
      body: [
        {
          label: t("core.focus.label.description"),
          value: record.summary || t("core.focus.noDescription"),
        },
        {
          label: t("core.focus.label.promises"),
          value: t("core.focus.promisesValue", { total: record.total, proven: record.proven }),
        },
        { label: t("core.focus.label.consequence"), value: t("core.focus.unanchoredConsequence") },
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
        why: t("core.focus.untestedWhy"),
        meta: teamOf(scenario.rec),
        body: [
          { label: t("core.focus.label.record"), value: scenario.rec.id },
          {
            label: t("core.focus.label.promise"),
            value: scenario.steps.map((step) => gherkinLine(step, text)).join("\n"),
          },
          { label: t("core.focus.label.state"), value: stateOf(scenario, text) },
          { label: t("core.focus.label.test"), value: t("core.focus.noTestNamed") },
        ],
      });
    });

  model.noOwner.forEach((record) => {
    items.push({
      severity: 2,
      id: record.id,
      section: "teams",
      title: record.label,
      why: t("core.focus.noOwnerWhy"),
      meta: "—",
      body: [
        { label: t("core.focus.label.type"), value: kindOf(record) },
        {
          label: t("core.focus.label.description"),
          value: record.summary || t("core.focus.noDescription"),
        },
        { label: t("core.focus.label.consequence"), value: t("core.focus.noOwnerConsequence") },
      ],
    });
  });

  model.noIntent.forEach((record) => {
    items.push({
      severity: 2,
      id: record.id,
      section: "records",
      title: record.label,
      why: t("core.focus.noDescription"),
      meta: teamOf(record),
      body: [
        { label: t("core.focus.label.type"), value: kindOf(record) },
        { label: t("core.focus.label.consequence"), value: t("core.focus.noIntentConsequence") },
      ],
    });
  });

  model.noObs.forEach((record) => {
    items.push({
      severity: 2,
      id: record.id,
      section: "ops",
      title: record.label,
      why: t("core.focus.noObsWhy"),
      meta: teamOf(record),
      body: [
        {
          label: t("core.focus.label.description"),
          value: record.summary || t("core.focus.noDescription"),
        },
        { label: t("core.focus.label.consequence"), value: t("core.focus.noObsConsequence") },
      ],
    });
  });

  model.ghosts.forEach((ghost) => {
    items.push({
      severity: 2,
      id: ghost,
      section: "graph",
      title: String(ghost).split("/").pop() ?? ghost,
      why: t("core.focus.ghostWhy"),
      meta: "—",
      body: [
        { label: t("core.focus.label.identifier"), value: ghost },
        { label: t("core.focus.label.consequence"), value: t("core.focus.ghostConsequence") },
      ],
    });
  });

  return items.sort((a, b) => a.severity - b.severity);
}

/** Counts for the lead sentence — every number is a probe into its derivation. */
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
