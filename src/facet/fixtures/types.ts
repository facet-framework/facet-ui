export type FixtureScenario = { id: string; text: string };
export type FixtureTest = { kind: string; name: string; proves: string[] };
export type FixtureAnchor = { path: string; line: number; role: string };
export type FixtureCommit = { date: string; sha: string; subject: string };

export type FixtureFeature = {
  id: string;
  type: string;
  domain: string;
  capability: string;
  slug: string;
  summary: string;
  lifecycle: string;
  owner: string | null;
  createdAt: string | null;
  scenarioCount: number;
  provenCount: number;
  scenarios: FixtureScenario[];
  tests: FixtureTest[];
  anchors: FixtureAnchor[];
  anchorCount: number;
  dependsOn: string[];
  variants: string[];
  driftFiles: string[];

  knowledge: string[];
  knowledgeOpen: number;
  observed: boolean;
  log: FixtureCommit[];
  logCount: number;
  tickets: string[];
};

export type FixtureCapability = { id: string; title: string; purpose: string; class: string };
export type FixtureDomain = {
  id: string;
  title: string;
  purpose: string;
  class: string;
  team: string;
  capabilities: FixtureCapability[];
};

export type FixtureAdr = {
  file: string;
  title: string;
  status: string;
  date: string;
  refs: string[];
  text: string;
};

export type FixtureMetric = {
  name: string;
  median: number;
  min: number;
  max: number;
  samples: number;
  below: number;
  above: number;
  band: { low: number; high: number };
};

export type FixtureBpmn = {
  file: string;
  name: string;

  shapes: [string, string, number, number, number, number][];

  edges: [string, string, [number, number][]][];
};

export type FixtureRegistry = {
  origin: {
    generatedAt: string;
    commit: string;
    branch: string;
    remote: string;
    facetVersion: string;
  };
  domains: FixtureDomain[];
  features: FixtureFeature[];
  adrs: FixtureAdr[];
  drift: { id: string; path: string; changedAt: string }[];
  scan: {
    loc: number;
    files: number;
    verankert: number;
    unverankert: number;
    waisen: unknown[];
    lastChanged: number;
  };
  calibration: FixtureMetric[];
  hotspots: { path: string; loc: number; dir: string; dirAnchoredPct: number }[];
  runners: { id: string; cwd: string; command: string; bericht: string }[];
  bpmn: FixtureBpmn[];
};
