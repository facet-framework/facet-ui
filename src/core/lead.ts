import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { germanText as germanLabels } from "../i18n/legacy/shared";
import { localized } from "../i18n/legacy/core/lead";

import { focusItems } from "./focus";
import { formatNumber, pct } from "./model";
import type { AtlasModel, RoleKey } from "./types";

export type ProbeKey =
  | "features"
  | "coverage"
  | "open"
  | "overdue"
  | "edges"
  | "anchors"
  | "teams"
  | "know"
  | "ops"
  | "pii";

export type LeadSegment =
  { kind: "text"; text: string } | { kind: "probe"; text: string; probe: ProbeKey };

const t = (text: string): LeadSegment => ({ kind: "text", text });
const n = (value: number | string, probe: ProbeKey): LeadSegment => ({
  kind: "probe",
  text: typeof value === "number" ? formatNumber(value) : value,
  probe,
});

export function leadFor(model: AtlasModel, role: RoleKey | null | undefined): LeadSegment[] {
  const coverage = pct(model.scnProven, model.scnTotal);
  const open = focusItems(model).length;
  const untested = model.scnTotal - model.scnProven;

  switch (role) {
    case "arch":
      return [
        t(localized.text1),
        n(model.edges.length, "edges"),
        t(localized.text2),
        n(model.maxDepth, "edges"),
        t(remainingText.text47),
        n(model.ghosts.length, "edges"),
        t(remainingText.text48),
        n(model.superseded.length, "edges"),
        t(localized.text3),
      ];

    case "delivery":
      return [
        t(germanLabels.text132),
        n(model.features.length, "features"),
        t(localized.text4),
        n(model.complete.length, "coverage"),
        t(localized.text5),
        n(untested, "coverage"),
        t(localized.text6),
        n(Object.keys(model.teams).length, "teams"),
        t(" Teams."),
      ];

    case "eng":
      return [
        t(localized.text7),
        n(model.anchorPairs.length, "anchors"),
        t(germanLabels.text133),
        n(Object.keys(model.anchorMap).length, "anchors"),
        t(" Kernfunktionen. "),
        n(model.unanchored.length, "anchors"),
        t(localized.text8),
        n(untested, "coverage"),
        t(localized.text9),
      ];

    case "qa":
      return [
        n(`${coverage} %`, "coverage"),
        t(localized.text10),
        n(model.scnProven, "coverage"),
        t(germanLabels.text109),
        n(model.scnTotal, "coverage"),
        t(localized.text11),
        n(untested, "coverage"),
        t("."),
      ];

    case "po":
      return [
        n(model.lifecycles.active ?? 0, "features"),
        t(localized.text12),
        n(model.lifecycles.planned ?? 0, "features"),
        t(remainingText.text49),
        n(model.knowAnswered, "know"),
        t(germanLabels.text109),
        n(model.knowSlots, "know"),
        t(localized.text13),
        n(model.slos.length, "ops"),
        t(localized.text14),
      ];

    case "gov":
      return [
        n(model.clauseCount, "overdue"),
        t(labelText.text409),
        n(model.mustCount, "overdue"),
        t(" davon verpflichtend. "),
        n(model.overdue, "overdue"),
        t(localized.text15),
        n(model.pii, "pii"),
        t(localized.text16),
        n(model.stale, "overdue"),
        t(localized.text17),
      ];

    case "ops":
      return [
        n(model.slos.length, "ops"),
        t(localized.text18),
        n(model.alerts.length, "ops"),
        t(localized.text19),
        n(model.noRunbook, "ops"),
        t(localized.text20),
        n(model.noObs.length, "ops"),
        t(localized.text21),
      ];

    default:
      return [
        t(germanLabels.text134),
        n(model.features.length, "features"),
        t(" Kernfunktionen in "),
        n(model.domains.length, "features"),
        t(remainingText.text50),
        n(`${coverage} %`, "coverage"),
        t(localized.text22),
        n(model.overdue, "overdue"),
        t(localized.text23),
        n(open, "open"),
        t(" Punkte warten auf jemanden."),
      ];
  }
}
