/**
 * The derivation behind a number in the lead sentence.
 *
 * A number in a sentence is a claim. Whoever clicks it gets the calculation:
 * which items it consists of, and next to it in prose, which records are
 * meant. None of it is rounded or estimated — everything comes from the
 * model.
 */

import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import { testKindLabel } from "./labels";
import { pct } from "./model";
import type { AtlasModel } from "./types";
import type { ProbeKey } from "./lead";

/**
 * The tone of a row. Deliberately not the design system's colour palette: the
 * data layer says what is the case, and the surface decides what that looks
 * like.
 */
export type ProbeMeaning = "neutral" | "signal" | "due";

export type ProbeRow = {
  label: string;
  value: string;
  /** `signal` means: something is missing here. `due` means: a deadline has passed. */
  meaning: ProbeMeaning;
  /** Register section opened on click, containing the full list counted by this row. */
  sectionKey?: string;
};

export type ProbeView = {
  head: string;
  rows: ProbeRow[];
  /** Evidence line by line — empty when there is nothing to list. */
  note: string[];
};

/** `signal` as soon as the number is above zero — otherwise neutral. */
const gap = (count: number): ProbeMeaning => (count > 0 ? "signal" : "neutral");
const due = (count: number): ProbeMeaning => (count > 0 ? "due" : "neutral");

const KINDS = ["unit", "property", "integration", "e2e"];

export function probeOf(
  model: AtlasModel,
  key: ProbeKey,
  text: FacetText = ENGLISH_TEXT,
): ProbeView {
  const { t, number } = text;
  const row = (
    label: string,
    value: string | number,
    meaning: ProbeMeaning = "neutral",
    sectionKey?: string,
  ): ProbeRow => ({
    label,
    value: typeof value === "number" ? number(value) : value,
    meaning,
    sectionKey,
  });

  switch (key) {
    case "coverage": {
      const testLoc = typeof model.scan.testLoc === "number" ? model.scan.testLoc : 0;
      const totalLoc = typeof model.scan.totalLoc === "number" ? model.scan.totalLoc : 0;
      const testFiles = typeof model.scan.testFiles === "number" ? model.scan.testFiles : 0;
      return {
        head: t("core.probes.head.coverage"),
        rows: [
          row(t("core.probes.testMapped"), `${number(model.scnProven)}/${number(model.scnTotal)}`),
          row(
            t("core.probes.noTest"),
            model.scnTotal - model.scnProven,
            gap(model.scnTotal - model.scnProven),
          ),
          ...KINDS.filter((kind) => model.testKinds[kind]).map((kind) =>
            row(testKindLabel(kind, text).toLocaleUpperCase(text.locale), model.testKinds[kind]),
          ),
        ],
        // Line coverage is not connected. The test-code share says something
        // else and is therefore named differently.
        note:
          testLoc && totalLoc
            ? [
                t("core.probes.testCodeShare", {
                  pct: pct(testLoc, totalLoc),
                  test: number(testLoc),
                  total: number(totalLoc),
                }),
                t("core.probes.testFiles", { count: number(testFiles) }),
              ]
            : [],
      };
    }

    case "features":
      return {
        head: t("core.probes.head.features"),
        rows: [
          row(t("core.probes.features"), model.features.length),
          row(t("core.probes.policies"), model.policies.length),
          row(t("core.probes.assumptions"), model.assumptions.length),
          row(t("core.probes.entities"), model.entities.length),
          row(t("core.probes.areas"), model.domains.length),
        ],
        note: model.domainCov.map((domain) =>
          t("core.probes.domainCoverage", {
            name: domain.name,
            proven: String(domain.proven),
            total: String(domain.total),
          }),
        ),
      };

    case "open":
      return {
        head: t("core.probes.head.open"),
        rows: [
          row(t("core.probes.overdue"), model.overdue, due(model.overdue)),
          row(t("core.probes.staleAssumptions"), model.stale, due(model.stale)),
          row(
            t("core.probes.promisesWithoutTest"),
            model.scnTotal - model.scnProven,
            gap(model.scnTotal - model.scnProven),
          ),
          row(t("core.probes.noRunbook"), model.noRunbook, gap(model.noRunbook)),
          row(t("core.probes.noEntryPoint"), model.unanchored.length, gap(model.unanchored.length)),
          row(t("core.probes.noOwner"), model.noOwner.length, gap(model.noOwner.length)),
          row(t("core.probes.noDescription"), model.noIntent.length, gap(model.noIntent.length)),
          row(t("core.probes.noPolicy"), model.uncovered.length, gap(model.uncovered.length)),
          row(t("core.probes.noMeasurement"), model.noObs.length, gap(model.noObs.length)),
          row(t("core.probes.ghosts"), model.ghosts.length, gap(model.ghosts.length)),
        ],
        note: [t("core.probes.openNote")],
      };

    case "overdue":
      return {
        head: t("core.probes.head.overdue"),
        rows: [
          row(t("core.probes.overdue"), model.overdue, due(model.overdue)),
          row(t("core.probes.reviews"), model.checks.length),
          row(t("core.probes.clauses"), model.clauseCount),
          row(t("core.probes.mandatory"), model.mustCount),
        ],
        note: model.overdueList.length
          ? model.overdueList.map(({ rec, check }) =>
              t("core.probes.dueLine", {
                label: rec.label,
                id: String(check.id),
                date: String(check.next_due),
              }),
            )
          : [t("core.probes.noDeadlinePassed")],
      };

    case "edges":
      return {
        head: t("core.probes.head.edges"),
        rows: [
          row(t("core.probes.edges"), model.edges.length),
          row(t("core.probes.depth"), model.maxDepth),
          row(t("core.probes.openReferences"), model.ghosts.length, gap(model.ghosts.length)),
          row(t("core.probes.superseded"), model.superseded.length),
        ],
        note: model.ghosts.length ? model.ghosts : [t("core.probes.allResolved")],
      };

    case "anchors": {
      const drift = model.scan.drift ?? [];
      return {
        head: t("core.probes.head.anchors"),
        rows: [
          row(t("core.probes.entryPoints"), model.anchorPairs.length),
          row(t("core.probes.features"), Object.keys(model.anchorMap).length),
          row(
            t("core.probes.withoutEntryPoint"),
            model.unanchored.length,
            gap(model.unanchored.length),
          ),
          row(t("core.probes.moved"), drift.length, due(drift.length)),
        ],
        note: drift.map((entry) => t("core.probes.movedLine", { id: entry.id })),
      };
    }

    case "pii":
      return {
        head: t("core.probes.head.pii"),
        rows: [
          row(t("core.probes.personal"), model.pii, due(model.pii)),
          row(t("core.probes.encrypted"), model.enc),
          row(t("core.probes.entities"), model.entities.length),
        ],
        note: model.entities.map((entity) =>
          t("core.probes.entityLine", {
            label: entity.label,
            fields: entity.fields.length,
            retention: retentionOf(entity.retention, text),
          }),
        ),
      };

    case "ops":
      return {
        head: t("core.probes.head.ops"),
        rows: [
          row("SLOS", model.slos.length),
          row(t("core.probes.alerts"), model.alerts.length),
          row(t("core.probes.noRunbook"), model.noRunbook, gap(model.noRunbook)),
          row(t("core.probes.runningReviews"), model.checks.length),
        ],
        note: model.sources.length ? [model.sources.join(", ")] : [t("core.probes.noSource")],
      };

    case "know": {
      const openQuestions = model.features.filter((feature) =>
        feature.knowledge.some((slot) => !slot.answer),
      );
      return {
        head: t("core.probes.head.know"),
        rows: [
          row(
            t("core.probes.answered"),
            `${number(model.knowAnswered)}/${number(model.knowSlots)}`,
          ),
          row(t("core.probes.noDescription"), model.noIntent.length, gap(model.noIntent.length)),
          row(
            t("core.probes.decisionRefs"),
            model.decisionTargets.reduce((sum, entry) => sum + entry.count, 0),
            "neutral",
            "decisions",
          ),
        ],
        note: openQuestions.length
          ? openQuestions.map((feature) => t("core.probes.openLine", { label: feature.label }))
          : [t("core.probes.allAnswered")],
      };
    }

    case "teams":
      return {
        head: t("core.probes.head.teams"),
        rows: [
          row("TEAMS", Object.keys(model.teams).length),
          row(t("core.probes.noOwner"), model.noOwner.length, gap(model.noOwner.length)),
        ],
        note: Object.keys(model.teams).map(
          (team) => `${team} · ${model.teams[team].contact || t("core.probes.noContact")}`,
        ),
      };
  }
}

/** Retention period of a data object, if one is stated. */
function retentionOf(retention: unknown, text: FacetText): string {
  if (retention && typeof retention === "object" && !Array.isArray(retention)) {
    const duration = (retention as Record<string, unknown>).duration;
    if (typeof duration === "string" && duration) return duration;
  }
  return text.t("core.probes.noRetention");
}
