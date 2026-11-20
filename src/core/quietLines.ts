import { localized } from "../i18n/legacy/core/quietLines";

import type { AtlasModel } from "./types";

export function buildQuietLines(model: AtlasModel): string[] {
  const lines: string[] = [];

  const checksExist = model.policies.some((p) => p.complianceChecks.length > 0);
  if (checksExist && !model.overdue) {
    lines.push(localized.text1);
  }

  const activeFeaturesExist = model.features.some((f) => f.activeAnywhere);
  if (activeFeaturesExist && !model.unanchored.length) {
    lines.push(localized.text2);
  }

  if (model.recs.length > 0 && !model.noOwner.length) {
    lines.push(localized.text3);
  }

  if (model.edges.length > 0 && !model.ghosts.length) {
    lines.push(localized.text4);
  }

  return lines;
}
