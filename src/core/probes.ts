import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { germanText as germanLabels } from "../i18n/legacy/shared";
import { localized } from "../i18n/legacy/core/probes";

import { formatNumber, pct } from "./model";
import type { AtlasModel } from "./types";
import type { ProbeKey } from "./lead";

export type ProbeMeaning = "neutral" | "signal" | "deadline";

export type ProbeRow = {
  label: string;
  value: string;

  meaning: ProbeMeaning;

  sectionKey?: string;
};

export type ProbeView = {
  head: string;
  rows: ProbeRow[];

  note: string[];
};

const row = (
  label: string,
  value: string | number,
  meaning: ProbeMeaning = "neutral",
  sectionKey?: string,
): ProbeRow => ({
  label,
  value: typeof value === "number" ? formatNumber(value) : value,
  meaning,
  sectionKey,
});

const gap = (count: number): ProbeMeaning => (count > 0 ? "signal" : "neutral");
const due = (count: number): ProbeMeaning => (count > 0 ? "deadline" : "neutral");

const KIND_LABEL: Record<string, string> = {
  unit: remainingText.text62,
  property: remainingText.text63,
  integration: "INTEGRATION",
  e2e: germanLabels.text121,
};
const KINDS = ["unit", "property", "integration", "e2e"];

export function probeOf(model: AtlasModel, key: ProbeKey): ProbeView {
  switch (key) {
    case "coverage": {
      const testLoc = typeof model.scan.testLoc === "number" ? model.scan.testLoc : 0;
      const totalLoc = typeof model.scan.totalLoc === "number" ? model.scan.totalLoc : 0;
      const testFiles = typeof model.scan.testFiles === "number" ? model.scan.testFiles : 0;
      return {
        head: "TESTZUORDNUNGEN",
        rows: [
          row(
            "TEST ZUGEORDNET",
            `${formatNumber(model.scnProven)}/${formatNumber(model.scnTotal)}`,
          ),
          row(
            localized.text1,
            model.scnTotal - model.scnProven,
            gap(model.scnTotal - model.scnProven),
          ),
          ...KINDS.filter((kind) => model.testKinds[kind]).map((kind) =>
            row(KIND_LABEL[kind], model.testKinds[kind]),
          ),
        ],

        note:
          testLoc && totalLoc
            ? [
                `${labelText.text358}${pct(testLoc, totalLoc)} % · ${formatNumber(testLoc)}${germanLabels.text109}${formatNumber(totalLoc)}${labelText.text359}`,
                `${formatNumber(testFiles)}${localized.text2}`,
              ]
            : [],
      };
    }

    case "features":
      return {
        head: "BESTAND",
        rows: [
          row("KERNFUNKTIONEN", model.features.length),
          row("REGELWERKE", model.policies.length),
          row(labelText.text360, model.assumptions.length),
          row("DATENOBJEKTE", model.entities.length),
          row(germanLabels.text122, model.domains.length),
        ],
        note: model.domainCov.map(
          (domain) => `${domain.name} · ${domain.proven}/${domain.total}${localized.text3}`,
        ),
      };

    case "open":
      return {
        head: "OFFENE PUNKTE",
        rows: [
          row(localized.text4, model.overdue, due(model.overdue)),
          row(localized.text5, model.stale, due(model.stale)),
          row(
            localized.text6,
            model.scnTotal - model.scnProven,
            gap(model.scnTotal - model.scnProven),
          ),
          row(localized.text7, model.noRunbook, gap(model.noRunbook)),
          row(localized.text8, model.unanchored.length, gap(model.unanchored.length)),
          row(localized.text9, model.noOwner.length, gap(model.noOwner.length)),
          row(localized.text10, model.noIntent.length, gap(model.noIntent.length)),
          row(localized.text11, model.uncovered.length, gap(model.uncovered.length)),
          row(localized.text12, model.noObs.length, gap(model.noObs.length)),
          row(localized.text13, model.ghosts.length, gap(model.ghosts.length)),
        ],
        note: [localized.text14],
      };

    case "overdue":
      return {
        head: remainingText.text38,
        rows: [
          row(localized.text15, model.overdue, due(model.overdue)),
          row(localized.text16, model.checks.length),
          row(labelText.text361, model.clauseCount),
          row("VERPFLICHTEND", model.mustCount),
        ],
        note: model.overdueList.length
          ? model.overdueList.map(
              ({ rec, check }) => `${rec.label} · ${check.id}${localized.text17}${check.next_due}`,
            )
          : [localized.text18],
      };

    case "edges":
      return {
        head: labelText.text362,
        rows: [
          row("KANTEN", model.edges.length),
          row("DEPTH", model.maxDepth),
          row(remainingText.text45, model.ghosts.length, gap(model.ghosts.length)),
          row(localized.text19, model.superseded.length),
        ],
        note: model.ghosts.length ? model.ghosts : [localized.text20],
      };

    case "anchors": {
      const drift = model.scan.drift ?? [];
      return {
        head: germanLabels.text123,
        rows: [
          row(labelText.text363, model.anchorPairs.length),
          row("KERNFUNKTIONEN", Object.keys(model.anchorMap).length),
          row(localized.text21, model.unanchored.length, gap(model.unanchored.length)),
          row(labelText.text364, drift.length, due(drift.length)),
        ],
        note: drift.map((entry) => `${labelText.text365}${entry.id}`),
      };
    }

    case "pii":
      return {
        head: labelText.extra7,
        rows: [
          row(labelText.text366, model.pii, due(model.pii)),
          row(localized.text22, model.enc),
          row("DATENOBJEKTE", model.entities.length),
        ],
        note: model.entities.map(
          (entity) =>
            `${entity.label} · ${entity.fields.length}${labelText.text301}${retentionOf(entity.retention)}`,
        ),
      };

    case "ops":
      return {
        head: remainingText.text58,
        rows: [
          row("SLOS", model.slos.length),
          row(labelText.text367, model.alerts.length),
          row(localized.text23, model.noRunbook, gap(model.noRunbook)),
          row(localized.text24, model.checks.length),
        ],
        note: model.sources.length ? [model.sources.join(", ")] : [localized.text25],
      };

    case "know": {
      const openQuestions = model.features.filter((feature) =>
        feature.knowledge.some((slot) => !slot.answer),
      );
      return {
        head: remainingText.text64,
        rows: [
          row(
            "BEANTWORTET",
            `${formatNumber(model.knowAnswered)}/${formatNumber(model.knowSlots)}`,
          ),
          row(localized.text26, model.noIntent.length, gap(model.noIntent.length)),
          row(
            "ENTSCHEIDUNGSVERWEISE",
            model.decisionTargets.reduce((sum, entry) => sum + entry.count, 0),
            "neutral",
            "decisions",
          ),
        ],
        note: openQuestions.length
          ? openQuestions.map((feature) => `${feature.label}${localized.text27}`)
          : [localized.text28],
      };
    }

    case "teams":
      return {
        head: localized.text29,
        rows: [
          row("TEAMS", Object.keys(model.teams).length),
          row(localized.text30, model.noOwner.length, gap(model.noOwner.length)),
        ],
        note: Object.keys(model.teams).map(
          (team) => `${team} · ${model.teams[team].contact || localized.text31}`,
        ),
      };
  }
}

function retentionOf(retention: unknown): string {
  if (retention && typeof retention === "object" && !Array.isArray(retention)) {
    const duration = (retention as Record<string, unknown>).duration;
    if (typeof duration === "string" && duration) return duration;
  }
  return localized.text32;
}
