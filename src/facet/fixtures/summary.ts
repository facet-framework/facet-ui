/**
 * The one set of headline figures every story shows, computed from the
 * snapshot — so the top bar, the overview page and every list agree.
 */
import { registry } from "./registry";

const features = registry.features.filter((f) => f.type === "feature");
const scenarios = registry.features.reduce((a, f) => a + f.scenarioCount, 0);
const proven = registry.features.reduce((a, f) => a + f.provenCount, 0);

export const SUMMARY = {
  /** All records, including assumptions. */
  records: registry.features.length,
  /** Feature records of any lifecycle. */
  features: features.length,
  /** Feature records with lifecycle `active` — what the top bar calls Features. */
  activeFeatures: features.filter((f) => f.lifecycle === "active").length,
  scenarios,
  proven,
  open: scenarios - proven,
  /** Whole percent, as the top bar shows it. */
  provenPct: Math.round((proven / scenarios) * 100),
  /** Files that moved under a record since the baseline. */
  driftFiles: registry.drift.length,
  /** Records with at least one moved file — what the top bar calls Drift. */
  driftRecords: new Set(registry.drift.map((d) => d.id)).size,
  domains: registry.domains.length,
  knowledgeOpen: registry.features.reduce((a, f) => a + f.knowledgeOpen, 0),
} as const;

/** Top bar figures in the shape `Screen` and `TopBar` take. */
export const TOP_STATS = {
  features: SUMMARY.activeFeatures,
  provenPct: SUMMARY.provenPct,
  drift: SUMMARY.driftRecords,
};
