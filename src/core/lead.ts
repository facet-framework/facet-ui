/**
 * The lead sentence — the one statement the overview opens with.
 *
 * There are eight of them, one per role. That is the entire effect of
 * choosing a role: it takes nothing away and unlocks nothing, it decides which
 * four or five numbers stand first. An operations person does not want to
 * read how many domains there are, and management does not want to read how
 * many alerts have no runbook.
 *
 * Every number in the sentence is a probe: it leads into the calculation it
 * comes from (see `probeOf`).
 */

import type { TextKey } from "../facet/i18n/en";
import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import { focusItems } from "./focus";
import { pct } from "./model";
import type { AtlasModel, RoleKey } from "./types";

/** The calculations a number of the lead sentence leads into. */
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

type Slot = { value: number | string; probe: ProbeKey };

/**
 * Splits the sentence at its `{{slots}}`: the words around them become text
 * segments, every slot a probe. Word order is the dictionary's, so a language
 * may put the numbers wherever its grammar wants them.
 */
function segments(
  template: string,
  slots: Record<string, Slot>,
  number: FacetText["number"],
): LeadSegment[] {
  const out: LeadSegment[] = [];
  let last = 0;
  for (const match of template.matchAll(/\{\{(\w+)\}\}/g)) {
    if (match.index > last) out.push({ kind: "text", text: template.slice(last, match.index) });
    const slot = slots[match[1]];
    out.push(
      slot
        ? {
            kind: "probe",
            text: typeof slot.value === "number" ? number(slot.value) : slot.value,
            probe: slot.probe,
          }
        : { kind: "text", text: match[0] },
    );
    last = match.index + match[0].length;
  }
  if (last < template.length) out.push({ kind: "text", text: template.slice(last) });
  return out;
}

/** The lead sentence for a role. Without a choice, the management one applies. */
export function leadFor(
  model: AtlasModel,
  role: RoleKey | null | undefined,
  text: FacetText = ENGLISH_TEXT,
): LeadSegment[] {
  const coverage = text.t("shell.percent", { value: pct(model.scnProven, model.scnTotal) });
  const open = focusItems(model, text).length;
  const untested = model.scnTotal - model.scnProven;
  const say = (key: TextKey, slots: Record<string, Slot>) =>
    segments(text.t(key), slots, text.number);

  switch (role) {
    case "arch":
      return say("core.lead.arch", {
        edges: { value: model.edges.length, probe: "edges" },
        depth: { value: model.maxDepth, probe: "edges" },
        ghosts: { value: model.ghosts.length, probe: "edges" },
        superseded: { value: model.superseded.length, probe: "edges" },
      });

    case "delivery":
      return say("core.lead.delivery", {
        features: { value: model.features.length, probe: "features" },
        complete: { value: model.complete.length, probe: "coverage" },
        untested: { value: untested, probe: "coverage" },
        teams: { value: Object.keys(model.teams).length, probe: "teams" },
      });

    case "eng":
      return say("core.lead.eng", {
        anchors: { value: model.anchorPairs.length, probe: "anchors" },
        anchored: { value: Object.keys(model.anchorMap).length, probe: "anchors" },
        unanchored: { value: model.unanchored.length, probe: "anchors" },
        untested: { value: untested, probe: "coverage" },
      });

    case "qa":
      return say("core.lead.qa", {
        coverage: { value: coverage, probe: "coverage" },
        proven: { value: model.scnProven, probe: "coverage" },
        total: { value: model.scnTotal, probe: "coverage" },
        untested: { value: untested, probe: "coverage" },
      });

    case "po":
      return say("core.lead.po", {
        live: { value: model.lifecycles.active ?? 0, probe: "features" },
        planned: { value: model.lifecycles.planned ?? 0, probe: "features" },
        answered: { value: model.knowAnswered, probe: "know" },
        slots: { value: model.knowSlots, probe: "know" },
        slos: { value: model.slos.length, probe: "ops" },
      });

    case "gov":
      return say("core.lead.gov", {
        clauses: { value: model.clauseCount, probe: "overdue" },
        must: { value: model.mustCount, probe: "overdue" },
        overdue: { value: model.overdue, probe: "overdue" },
        pii: { value: model.pii, probe: "pii" },
        stale: { value: model.stale, probe: "overdue" },
      });

    case "ops":
      return say("core.lead.ops", {
        slos: { value: model.slos.length, probe: "ops" },
        alerts: { value: model.alerts.length, probe: "ops" },
        noRunbook: { value: model.noRunbook, probe: "ops" },
        noObs: { value: model.noObs.length, probe: "ops" },
      });

    default:
      return say("core.lead.default", {
        features: { value: model.features.length, probe: "features" },
        domains: { value: model.domains.length, probe: "features" },
        coverage: { value: coverage, probe: "coverage" },
        overdue: { value: model.overdue, probe: "overdue" },
        open: { value: open, probe: "open" },
      });
  }
}
