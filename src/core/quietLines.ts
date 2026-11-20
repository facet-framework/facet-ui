/**
 * Quiet lines — the reassurances Atlas utters when a population stays below
 * its threshold ("No review is overdue.", `core.quiet.noOverdue`).
 *
 * Every line asserts a negation ("no X", "every Y has Z"). A negation that
 * nobody has checked is not a reassurance but a gap that looks like one
 * — most plainly when the underlying population drops to zero
 * through a counting bug, but just as much when it is genuinely and
 * computably zero: a line about "every active record" with zero active
 * records has checked nothing.
 *
 * That is why every line here is bound to two conditions: the count is zero
 * *and* the population it counts over is itself not empty.
 */

import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import type { AtlasModel } from "./types";

export function buildQuietLines(model: AtlasModel, text: FacetText = ENGLISH_TEXT): string[] {
  const { t } = text;
  const lines: string[] = [];

  const checksExist = model.policies.some((p) => p.complianceChecks.length > 0);
  if (checksExist && !model.overdue) {
    lines.push(t("core.quiet.noOverdue"));
  }

  const activeFeaturesExist = model.features.some((f) => f.activeAnywhere);
  if (activeFeaturesExist && !model.unanchored.length) {
    lines.push(t("core.quiet.allAnchored"));
  }

  if (model.recs.length > 0 && !model.noOwner.length) {
    lines.push(t("core.quiet.allOwned"));
  }

  if (model.edges.length > 0 && !model.ghosts.length) {
    lines.push(t("core.quiet.noGhosts"));
  }

  return lines;
}
