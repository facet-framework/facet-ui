export type Tone = "ok" | "warn" | "plan" | "bad";

export type FeatureView = {
  id: string;
  slug: string;
  domain: string;
  capability: string;
  summary: string;
  type: "feature" | "assumption";
  lifecycle: "active" | "planned" | "deprecated";
  owner: string | null;
  createdAt: string | null;
  scenarios: number;
  proven: number;
  anchors: number;
  tests: number;
  drift: number;
  knowledgeOpen: number;

  knowledgeSlots?: boolean[];

  mosaic?: boolean[];
  changedAt?: string;
};

export type CapabilityView = {
  id: string;
  title: string;
  purpose: string;
  cls: string;
};

export type DomainView = {
  id: string;
  title: string;
  purpose: string;
  cls: string;
  team: string;
  capabilities: CapabilityView[];
};

export type DriftView = { path: string; record: string; changedAt: string };

export type CalibrationView = {
  key: string;
  label: string;
  median: number;
  low: number;
  high: number;
  min: number;
  max: number;
  samples: number;
  below: number;
  above: number;
};

export type TestMix = { unit: number; integration: number; e2e: number };

export type TrendPoint = { date: string; scenarios: number; proven: number };

export type CommitView = { date: string; sha: string; subject: string; record: string };

export type AdrView = { file: string; title: string; status: string; date: string; refs: string[] };

export type OwnerView = { team: string; records: number; scenarios: number; proven: number };

export type ToolView = { name: string; purpose: string; calls: number | null };

export type OpenScenarioView = { record: string; scenario: string; then: string };

export type DeviationView = { record: string; scenario: string; then: string; reason: string };

export type FixView = { record: string; subject: string; date: string };

export type ReachView = { record: string; team: string | null; dependents: number };

export type FaqView = { record: string; slot: string; question: string; answer: string };

export type EndpointView = { method: string; path: string; purpose: string };

export type OverviewModel = {
  project: { name: string; branch: string; commit: string; generatedAt: string; version: string };
  totals: {
    records: number;
    features: number;
    assumptions: number;
    domains: number;
    capabilities: number;
    scenarios: number;
    proven: number;
    anchors: number;

    files: number | null;
    anchoredFiles: number;

    loc: number | null;
  };
  domains: (DomainView & {
    features: number;
    scenarios: number;
    proven: number;
    drift: number;
    knowledgeOpen: number;
  })[];
  features: FeatureView[];
  drift: DriftView[];

  driftMeasured?: boolean;
  calibration: CalibrationView[];

  tests: TestMix | null;
  trend: TrendPoint[];

  recent: CommitView[] | null;
  adrs: AdrView[];
  owners: OwnerView[];
  unowned: number;
  tools: ToolView[];

  driftUnproven?: OpenScenarioView[];

  deviations?: DeviationView[];

  fixes?: FixView[] | null;

  reach?: ReachView[];

  faq?: FaqView[];

  endpoints?: EndpointView[];
};
