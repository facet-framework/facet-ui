import type { IconName } from "../../primitives/Icon";

export type Tone = "ok" | "warn" | "plan" | "bad" | "signal" | "neutral";

export type ViewDef<V extends string> = { value: V; label: string; icon: IconName };

export type ContentKindKey =
  | "promises"
  | "knowledge"
  | "operations"
  | "origin"
  | "taxonomy"
  | "calibration"
  | "tests"
  | "deviations"
  | "drift"
  | "fixed"
  | "anchor"
  | "files"
  | "rules"
  | "glossary";

export type ContentGroup = "Registry" | "Evidence" | "Code" | "Context";

export type ContentKind = {
  key: ContentKindKey;
  label: string;
  group: ContentGroup;
  icon: IconName;
  desc: string;

  count: number | null;
  unit: string;

  finding?: string;
  tone?: Tone;

  share?: number | null;

  spark?: number[];

  views: { id: string; label: string }[];
};

export type PromiseState = "proven" | "open" | "deviation";

export type PromiseItem = {
  key: string;
  recordId: string;
  scenarioId: string;
  text: string;
  state: PromiseState;
  tests: { name: string; kind: string }[];
};

export type PromiseRecord = {
  id: string;
  domain: string;
  cells: { scenarioId: string; state: PromiseState }[];
};

export type KnowledgeRow = {
  id: string;
  domain: string;

  slots: (string | null)[];

  answers?: (string | null)[];
};

export type OpsEntry = {
  key: string;
  recordId: string;
  kind: "SLO" | "Alert" | "Continuous check";
  name: string;
  target: string;
  window?: string;
  source: string;
};

export type TeamProvenance = {
  id: string;
  name: string;
  purpose?: string;
  records: number;
  proven: number;
  domains: { id: string; records: number }[];
  recent: { id: string; date: string }[];
};

export type DayCount = { date: string; count: number; ids?: string[] };

export type TaxCapability = {
  id: string;
  title: string;
  records: number;
  proven: number;
  scenarios: number;
};
export type TaxDomain = {
  id: string;
  title: string;
  purpose: string;
  klass: string;
  team: string;
  capabilities: TaxCapability[];
};

export type CalibrationMetric = {
  key: string;
  label: string;
  unit: string;
  median: number;
  min: number;
  max: number;
  samples: number;
  below: number;
  above: number;
  band: { low: number; high: number };

  values?: number[];
};

export type Outlier = {
  metric: string;
  id: string;
  value: number;
  side: "above" | "below";
  band: string;
};

export type TestKind = "Unit" | "Integration" | "E2E";

export type TestFileRow = {
  path: string;
  kind: TestKind;
  tests: number;
  promises: number;
  records: string[];
};

export type TestRunner = { id: string; cwd: string; command: string; report: string };

export type Deviation = {
  key: string;
  recordId: string;
  scenarioId: string;
  then: string;
  reason: string;
  confirmedBy: string | null;

  since: string | null;
};

export type DriftItem = { recordId: string; path: string; changedAt: string };

export type FixCommit = {
  sha: string;
  date: string;
  subject: string;
  scope: string | null;
  ticket: string | null;
  records: string[];
  domain: string;

  files?: string[] | null;

  recordedBy?: string | null;
};

export type AnchorRole = "primary" | "related" | "config" | "data" | "none";

export type AnchorDir = { path: string; anchors: number; files: number; records: number };

export type AnchorRow = { path: string; line: number; role: AnchorRole; recordId: string };

export type FileNode = {
  path: string;
  name: string;

  anchored: number;

  share: number | null;
  children?: FileNode[];
};

export type FileGap = {
  path: string;

  loc?: number | null;
  dir: string;
  dirAnchoredPct: number;
};

export type RuleItem = {
  id: string;
  title: string;
  statement: string;
  strength: "must" | "should" | "may";
  appliesTo: string[];
  source: string;

  violations: number | null;
};

export type GlossaryTerm = {
  term: string;
  definition: string;
  category: string;
  aliases: string[];
  records: number;
  status: "settled" | "proposed";
};

export type GlossaryTermDetail = GlossaryTerm & {
  recordIds: string[];
  occurrences: { path: string; line: number; excerpt: string }[];
  related: string[];
  history: { date: string; who: string; change: string }[];
  translation?: string;
};

export type TermProposal = {
  term: string;
  definition: string;
  category: string;
  aliases: string;
  records: string[];
};

export type TermProposalErrors = Partial<Record<keyof TermProposal, string>>;

export type SettingsSectionKey =
  "appearance" | "language" | "history" | "ai" | "forge" | "plugins" | "genui";

export type PluginRow = {
  id: string;
  name: string;
  version: string;
  source: "bundled" | "installed" | "development";
  enabled: boolean;
  verification: "ok" | "mismatch" | "missing";
  open: number;
  desc: string;
};

export type GrantItem = {
  key: string;
  group: "Tools" | "Environment" | "Agent tools";
  name: string;

  via: string;
  why: string;
  state: "granted" | "open" | "denied";
  risk?: "writes" | "reads" | "network";
};
