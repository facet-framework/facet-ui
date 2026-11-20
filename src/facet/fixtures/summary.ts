import { registry } from "./registry";

const features = registry.features.filter((f) => f.type === "feature");
const scenarios = registry.features.reduce((a, f) => a + f.scenarioCount, 0);
const proven = registry.features.reduce((a, f) => a + f.provenCount, 0);

export const SUMMARY = {
  records: registry.features.length,

  features: features.length,

  activeFeatures: features.filter((f) => f.lifecycle === "active").length,
  scenarios,
  proven,
  open: scenarios - proven,

  provenPct: Math.round((proven / scenarios) * 100),

  driftFiles: registry.drift.length,

  driftRecords: new Set(registry.drift.map((d) => d.id)).size,
  domains: registry.domains.length,
  knowledgeOpen: registry.features.reduce((a, f) => a + f.knowledgeOpen, 0),
} as const;

export const TOP_STATS = {
  features: SUMMARY.activeFeatures,
  provenPct: SUMMARY.provenPct,
  drift: SUMMARY.driftRecords,
};
