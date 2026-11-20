import type { Glossary } from "./glossary";
import type { Taxonomy, TaxonomyBranch } from "./taxonomy";

import type { YamlValue } from "./yaml";

export type RecordKind = "feature" | "policy" | "assumption" | "entity";

export type Anchor = {
  path: string;
  line: number;
  role: string;
  excerpt?: string;

  proves?: string[];
};

export type OrphanAnchor = {
  path: string;
  line: number;
  id: string;
};

export type ScannedFile = {
  path: string;
  loc: number;
};

export type DriftEntry = {
  id: string;
  path: string;

  changedAt: string;
};

export type RepoScan = {
  scannedAt?: string;
  loc?: number;
  testLoc?: number;
  files?: number;
  testFiles?: number;
  languages?: Record<string, number>;
  anchors?: Record<string, Anchor[]>;
  orphanAnchors?: OrphanAnchor[];

  anchoredFiles?: ScannedFile[];
  unanchoredFiles?: ScannedFile[];
  drift?: DriftEntry[];
  [key: string]: unknown;
};

export type ScenarioStep = {
  keyword: GherkinKeyword | "";

  parent: GherkinKeyword | "";
  text: string;
};

export type GherkinKeyword = "GIVEN" | "WHEN" | "THEN" | "AND" | "BUT";

export type TestRef = {
  kind: string;
  id: string;
  proves: string[];
};

export type Scenario = {
  id: string;
  steps: ScenarioStep[];
  pre: YamlValue;
  post: YamlValue;
  proven: boolean;
  tests: TestRef[];
  backing: ScenarioBacking;

  deviation: ScenarioDeviation | null;

  audience: ScenarioAudience | null;

  implementedBy: Anchor[];

  anchorsAdopted: boolean;
};

export type ScenarioAudience = "product" | "engineering";

export type ScenarioBacking = {
  state: "backed" | "unbacked";
  reason: string;
  unblockedBy: string;
};

export type ScenarioDeviation = {
  reason: string;

  confirmedBy: string;

  trackedAs: string;
};

export type DefectFix = {
  commit: string;
  date: string;
  files: string[];
  subject: string;
  issue: string;
  recordedBy: string;
};

export type Defects = {
  present: boolean;
  fixes: DefectFix[];
  total: number;
  byFile: { path: string; count: number }[];

  lastFix: string;
};

export type KnowledgeSlot = {
  key: string;
  question?: string;
  answer?: string;

  derive?: string[];
};

export type Slo = {
  id?: string;
  target?: string;
  window?: string;
  query?: string;
  query_source?: string;
  [key: string]: unknown;
};

export type Alert = {
  id?: string;
  severity?: string;
  condition?: string;
  runbook?: string;
  [key: string]: unknown;
};

export type ContinuousCheck = {
  id?: string;
  frequency?: string;
  [key: string]: unknown;
};

export type RecordVariant = {
  lifecycle: string;
  notes?: string;
};

export type FeatureFlag = {
  key: string;
  system?: string;
  default?: boolean;
  variants: string[];
  rollout?: string;
  retireBy?: string;
};

export type Dashboard = {
  url: string;
};

export type MetricEmission = {
  name: string;
  kind: string;
  labels: string[];
  description?: string;
};

export type TraceEmission = {
  spanName: string;
  parentSpan?: string;
  attributes: string[];
};

export type LogEvent = {
  event: string;
  level: string;
  attributes: string[];
};

export type ComplianceCheck = {
  id?: string;
  next_due?: string;
  frequency?: string;

  overdue?: boolean;
  [key: string]: unknown;
};

export type Clause = {
  text?: string;
  requirement?: string;
  [key: string]: unknown;
};

export type SchemaField = {
  name?: string;
  type?: string;
  sensitivity?: string;

  constraints?: YamlValue;
  [key: string]: unknown;
};

export type Evidence = {
  id?: string;
  kind?: string;
  at?: string;
  [key: string]: unknown;
};

export type RawRecord = {
  path: string;
  raw: string;
  doc: Record<string, YamlValue>;
};

export type CorpusError = {
  path: string;
  message: string;
  line?: number;
};

export type FacetRecord = {
  path: string;
  raw: string;
  doc: Record<string, YamlValue>;
  id: string;
  kind: RecordKind;
  seg: string[];
  domain: string;
  capability: string;
  label: string;
  lifecycle: string;

  variants: Record<string, RecordVariant> | null;

  activeAnywhere: boolean;
  schemaVersion: string;
  summary: string;
  adrs: string[];
  scenarios: Scenario[];
  tests: TestRef[];
  provenBy: Record<string, TestRef[]>;
  proven: number;
  total: number;
  slos: Slo[];
  alerts: Alert[];
  checks: ContinuousCheck[];
  dashboards: Dashboard[];
  flags: FeatureFlag[];
  metricsEmitted: MetricEmission[];
  tracesEmitted: TraceEmission[];
  logEvents: LogEvent[];
  knowledge: KnowledgeSlot[];
  team: string;
  individual: string;
  createdAt: string;
  supersededBy: string | null;
  dependsOn: string[];
  dependedOnBy: string[];
  relatedPolicies: string[];
  relatedAssumptions: string[];
  relatedEntities: string[];
  changeRef: string;
  clauses: Clause[];
  scope: Record<string, YamlValue> | null;
  complianceChecks: ComplianceCheck[];
  artifacts: string[];
  fields: SchemaField[];
  schemaNo?: YamlValue;
  retention: YamlValue;
  readBy: string[];
  mutatedBy: string[];
  evidence: Evidence[];
  referencedBy: string[];
  criticality: string;
  risk: string;
  anchors: Anchor[];
  defects: Defects;

  present: Record<string, boolean>;

  ageMonths?: number | null;

  stale?: boolean;
};

export type Edge = { from: string; to: string };

export type UndeclaredMention = { from: string; to: string };

export type Domain = { name: string; items: FacetRecord[] };

export type DomainCoverage = {
  name: string;
  total: number;
  proven: number;
  pct: number | null;
  tests: number;
};

export type FieldPath = { path: string; n: number; rendered: boolean };

export type DecisionTarget = { target: string; count: number; recordIds: string[] };

export type ScenarioEntry = Scenario & { rec: FacetRecord };

export type SloEntry = Slo & { rec: FacetRecord };
export type AlertEntry = Alert & { rec: FacetRecord };
export type CheckEntry = ContinuousCheck & { rec: FacetRecord };

export type TeamEntry = { items: FacetRecord[]; contact: string };

export type ErrorCodeMention = { id: string; statement: string };

export type ErrorCodeEntry = {
  code: string;
  band: string;
  records: ErrorCodeMention[];
};

export type ErrorCodeBandGroup = {
  band: string;
  codes: ErrorCodeEntry[];

  nextFree: string | null;
};

export type ErrorCodeRegister = {
  pattern: string;
  entries: ErrorCodeEntry[];
  bands: ErrorCodeBandGroup[];

  collisions: string[];
};

export type VocabValue = {
  value: string;
  count: number;
  recordIds: string[];
};

export type VocabGroup = {
  key: string;
  values: VocabValue[];
  count: number;
  recordIds: string[];

  merged: boolean;
};

export type VocabCoverage = {
  present: VocabGroup[];
  missing: { count: number; recordIds: string[] };
};

export type EnumRawConstraint = { entity: string; field: string; values: string[] };

export type EnumValueSet = { key: string; values: string[]; entities: string[] };

export type EnumRegisterEntry = { field: string; valueSets: EnumValueSet[]; divergent: boolean };

export type EnumRegister = {
  entries: EnumRegisterEntry[];

  fieldCount: number;

  divergentFieldCount: number;
};

export type CalibrationMetric = {
  name: string;
  median: number;
  min: number;
  max: number;
  samples: number;
  below: number;
  above: number;
  band: { low: number; high: number };
};

export type Calibration = {
  registry?: string;
  records: number;
  scenarios: number;
  anchoredFiles: number;
  domains: number;
  capabilities: number;
  hasTaxonomy: boolean;
  metrics: CalibrationMetric[];

  readings: string[];
};

export type AtlasModel = {
  rc: Record<string, YamlValue>;

  glossary: Glossary | null;

  taxonomy: Taxonomy | null;

  taxonomyTree: TaxonomyBranch[];

  calibration: Calibration | null;
  paths: string[];
  recs: FacetRecord[];
  byId: Record<string, FacetRecord>;
  features: FacetRecord[];
  policies: FacetRecord[];
  assumptions: FacetRecord[];
  entities: FacetRecord[];
  domains: Domain[];
  scnTotal: number;
  scnProven: number;
  allScn: ScenarioEntry[];
  testKinds: Record<string, number>;
  domainCov: DomainCoverage[];
  fieldPaths: FieldPath[];
  notRendered: FieldPath[];
  slos: SloEntry[];
  alerts: AlertEntry[];
  checks: CheckEntry[];
  noRunbook: number;
  sources: string[];
  edges: Edge[];
  undeclaredMentions: UndeclaredMention[];
  ghosts: string[];
  depth: Record<string, number>;
  deg: Record<string, { up: number; down: number }>;
  maxDepth: number;

  cyclic: string[];
  overdue: number;
  overdueList: { rec: FacetRecord; check: ComplianceCheck }[];
  stale: number;
  pii: number;
  enc: number;
  clauseCount: number;
  mustCount: number;
  basis: string[];
  lifecycles: Record<string, number>;
  teams: Record<string, TeamEntry>;
  versions: Record<string, number>;
  created: { date: string; id: string }[];
  scan: RepoScan;
  anchorMap: Record<string, Anchor[]>;
  anchorPairs: (Anchor & { id: string })[];
  driftIds: Record<string, DriftEntry[]>;
  unanchored: FacetRecord[];
  noIntent: FacetRecord[];
  knowSlots: number;
  knowAnswered: number;
  noOwner: FacetRecord[];
  superseded: FacetRecord[];
  complete: FacetRecord[];
  noObs: FacetRecord[];

  uncovered: FacetRecord[];

  defectTotal: number;

  defectRecords: FacetRecord[];

  defectsUnproven: FacetRecord[];

  decisionTargets: DecisionTarget[];

  noKnowledge: FacetRecord[];
  errorCodeRegister: ErrorCodeRegister;

  alertSeverities: VocabGroup[];

  sloSourceCoverage: VocabCoverage;

  retentionSpellings: VocabGroup[];

  enumRegister: EnumRegister;

  corpusErrors: CorpusError[];
};

export type RoleKey = "c" | "arch" | "delivery" | "eng" | "qa" | "po" | "gov" | "ops";

export type RoleDef = {
  key: RoleKey;
  tag: string;
  title: string;
  hint: string;
};
