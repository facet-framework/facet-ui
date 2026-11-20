import type { TextKey } from "../facet/i18n/en";
import type { TextParams } from "../facet/i18n/text";
import type { Glossary } from "./glossary";
import type { Taxonomy, TaxonomyBranch } from "./taxonomy";
/**
 * Types of the FACET corpus.
 *
 * Two origins are kept strictly apart:
 * - **Record** — everything from the YAML files (schema).
 * - **Scan** — host material from the repository scan (anchors, line counts, drift).
 *   Numbers from the scan are marked with a dotted underline in the UI.
 */

import type { YamlValue } from "./yaml";

export type RecordKind = "feature" | "policy" | "assumption" | "entity";

export type Anchor = {
  path: string;
  line: number;
  role: string;
  excerpt?: string;
  /**
   * Promises this anchor fulfils (`@facet-proves:` tag in the source,
   * the counterpart of `verification.*_tests[].proves`). When the field is
   * missing, the scan did not capture this relation for this anchor — no
   * statement about the code itself, only about what the scan does not (yet) see.
   */
  proves?: string[];
};

export type OrphanAnchor = {
  path: string;
  line: number;
  id: string;
};

/**
 * A source file as the scan read it, with its own line count.
 * `path` follows the same convention as `Anchor.path`/`OrphanAnchor.path` —
 * relative to the registry root. `loc` counts the lines of this file.
 */
export type ScannedFile = {
  path: string;
  loc: number;
};

/**
 * Anchored source that changed without its record following along
 * (FACET 12.1). Not a finding but a signal: most changes preserve the
 * behaviour, and whoever reports every touched file as a defect trains their
 * readers to look away.
 *
 * The file is the reference, not the line. A line number that shifts because
 * of an extra import says nothing; a body rewritten in place says everything,
 * and only the second is worth a look.
 */
export type DriftEntry = {
  id: string;
  path: string;
  /** Modification time of the file. The change lives in the working tree, so there is no commit that dates it. */
  changedAt: string;
};

/** Host material: result of the repository scan, not part of the FACET schema. */
export type RepoScan = {
  scannedAt?: string;
  loc?: number;
  testLoc?: number;
  files?: number;
  testFiles?: number;
  languages?: Record<string, number>;
  anchors?: Record<string, Anchor[]>;
  orphanAnchors?: OrphanAnchor[];
  /**
   * Every file the scan read, on exactly one side of the cut — anchored (at
   * least one anchor of this registry) or not. If the field is missing
   * entirely, the host delivered no file list. An empty list, by contrast,
   * reports that no files lie on this side.
   */
  anchoredFiles?: ScannedFile[];
  unanchoredFiles?: ScannedFile[];
  drift?: DriftEntry[];
  [key: string]: unknown;
};

/** A parsed Gherkin step of a promise. */
export type ScenarioStep = {
  /** GIVEN · WHEN · THEN · AND · BUT — empty for free text without a keyword. */
  keyword: GherkinKeyword | "";
  /** For AND/BUT, the keyword whose colour is inherited. */
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
  /**
   * Does the record declare this behaviour a defect (FACET §3.2.2, `deviation`)?
   * `null` means: nobody has done so — not that somebody vouches for it.
   */
  deviation: ScenarioDeviation | null;
  /**
   * Which readership the `statement` is written for (`audience`).
   *
   * `null` means **nobody has classified this sentence** — it does not mean
   * `product`. The field deliberately has no default: in the corpus that
   * prompted it, the technically worded sentence is the norm, so a default
   * would claim, in roughly a thousand places, a readership nobody vouches for.
   */
  audience: ScenarioAudience | null;
  /** Anchors whose `proves` names this promise — the implementation, mirrored to the proof. */
  implementedBy: Anchor[];
  /**
   * Does any anchor in the whole scan carry a `proves` field? If it is missing
   * everywhere, the registry has not adopted `@facet-proves:` yet — an empty
   * `implementedBy` then means "not declared", not "not implemented".
   * A registry-wide fact, carried on every scenario so the display does not
   * have to fetch it separately.
   */
  anchorsAdopted: boolean;
};

/**
 * The two readerships FACET §3.2 names — the sentence is readable for someone
 * who does not read the code, or it is not.
 *
 * A closed list, and that is the point: if every registry could invent its own
 * third readership, the same filter would mean something different in every
 * registry. A value outside these two is a schema error that `facet lint`
 * reports.
 */
export type ScenarioAudience = "product" | "engineering";

/**
 * Whether the data this scenario reads exists (FACET 1.6, `backing`).
 * Per the schema a missing block counts as `backed` — `reason`/`unblockedBy`
 * then stay empty instead of the field itself being omitted.
 */
export type ScenarioBacking = {
  state: "backed" | "unbacked";
  reason: string;
  unblockedBy: string;
};

/**
 * The declaration that this behaviour is a defect (FACET §3.2.2,
 * `deviation`) — the code demonstrably shows it, and nobody wants it that way.
 *
 * There is **no field for the intended behaviour** here, and that is the point:
 * §3.2.2 forbids one. A presumed intent standing next to an observed one is,
 * for every reader and every tool, indistinguishable from a promise — and a
 * guess that becomes a promise merely by sitting next to one is exactly the
 * error the field is meant to prevent. Where the defect is tracked is in
 * `trackedAs`, and it points *out of* the record.
 */
export type ScenarioDeviation = {
  /** Why the observed behaviour is considered unintended. */
  reason: string;
  /** `code-review | test | runtime` — empty means: nobody wrote it down. */
  confirmedBy: string;
  /** Ticket or `planned` record — empty means: named nowhere. */
  trackedAs: string;
};

/**
 * A fix commit from the defect register (FACET 1.7, `defects.fixes`).
 * It carries its own evidence: commit, date and the anchored files it touched.
 * An attribution produced by a heuristic over commit messages is occasionally
 * wrong — a bare number could be neither checked nor corrected, only doubted.
 */
export type DefectFix = {
  commit: string;
  date: string;
  files: string[];
  subject: string;
  issue: string;
  recordedBy: string;
};

/**
 * The defect register of a record.
 *
 * `present` is the distinction that matters: a record without the block says
 * "nobody looked here", not "nothing ever broke here". Showing both as 0 would
 * be a stronger statement than the data supports.
 *
 * `total` and `byFile` are computed. The record holds no sum — a stored sum
 * would be free to contradict the entries it comes from, and it would be the
 * number somebody acts on.
 */
export type Defects = {
  present: boolean;
  fixes: DefectFix[];
  total: number;
  byFile: { path: string; count: number }[];
  /** Date of the most recent entry; empty as long as there is none. */
  lastFix: string;
};

export type KnowledgeSlot = {
  key: string;
  question?: string;
  answer?: string;
  /** `knowledge.*.derive_from` — a list (e.g. `[anchors, tests]`), not a single value. */
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

/**
 * Per-variant state (FACET 1.4, `variants`). Present only on a record that
 * exists on more than one independently deployable target — a record with
 * `variants` never carries a top-level `lifecycle` (the schema's top-level
 * `oneOf` forbids both), so this is the only place such a record's lifecycle
 * lives.
 */
export type RecordVariant = {
  lifecycle: string;
  notes?: string;
};

/** A feature flag gating exposure (FACET 1.4, `flags`). Orthogonal to lifecycle. */
export type FeatureFlag = {
  key: string;
  system?: string;
  default?: boolean;
  variants: string[];
  rollout?: string;
  retireBy?: string;
};

/** A dashboard link (FACET `observation.dashboards[]`). */
export type Dashboard = {
  url: string;
};

/** A metric this feature emits (FACET 1.6, `observability.metrics_emitted[]`). */
export type MetricEmission = {
  name: string;
  kind: string;
  labels: string[];
  description?: string;
};

/** A trace span this feature emits (FACET 1.6, `observability.traces_emitted[]`). */
export type TraceEmission = {
  spanName: string;
  parentSpan?: string;
  attributes: string[];
};

/** A structured log event this feature emits (FACET 1.6, `observability.log_events[]`). */
export type LogEvent = {
  event: string;
  level: string;
  attributes: string[];
};

export type ComplianceCheck = {
  id?: string;
  next_due?: string;
  frequency?: string;
  /** Computed: the due date lies before the scan date. */
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
  /** Free text, in at least four notations — see `parseEnumConstraint`. */
  constraints?: YamlValue;
  [key: string]: unknown;
};

export type Evidence = {
  id?: string;
  kind?: string;
  at?: string;
  [key: string]: unknown;
};

/** Raw file as read from the repository. */
export type RawRecord = {
  path: string;
  raw: string;
  doc: Record<string, YamlValue>;
};

/**
 * A record whose YAML could not be read. `loadCorpus` skips it instead of
 * aborting the whole corpus — a single broken record must not block Atlas for
 * the entire set. The validation tab shows exactly this list.
 */
export type CorpusError = {
  path: string;
  /** English; `corpusErrorText` renders `key` with `params` in another language. */
  message: string;
  line?: number;
  /** Catalog key of the message, when it came from FACET's own texts. */
  key?: TextKey;
  params?: TextParams;
};

/** A record, prepared for display. */
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
  /**
   * Per-variant lifecycle (FACET 1.4), or `null` when this record has no
   * `variants` block. `lifecycle` above stays `"—"` for such a record — the
   * raw field view must not fabricate an aggregate the schema forbids.
   */
  variants: Record<string, RecordVariant> | null;
  /**
   * Derived predicate, never a declared field: true when this record (or any
   * of its variants) is active anywhere. Mirrors `Record.ActiveAnywhere()` in
   * the FACET linter. Used by filters only — it must not be shown as if it
   * were a value the record itself declares.
   */
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
  /** Which of the seven facets are filled in the record. */
  present: Record<string, boolean>;
  /** Assumptions only: age of the evidence in months. */
  ageMonths?: number | null;
  /** Assumptions only: evidence older than 12 months. */
  stale?: boolean;
};

export type Edge = { from: string; to: string };

/**
 * An id that appears in a record's free text (`intent.summary`, its scenario
 * steps) but is declared neither as `depends_on` nor as `depended_on_by` — in
 * neither direction.
 */
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

/**
 * A distinct target from `intent.decision_records` across the whole set — how
 * often it is named and by which records. Whether the target actually
 * resolves is not something this type says.
 */
export type DecisionTarget = { target: string; count: number; recordIds: string[] };

export type ScenarioEntry = Scenario & { rec: FacetRecord };

export type SloEntry = Slo & { rec: FacetRecord };
export type AlertEntry = Alert & { rec: FacetRecord };
export type CheckEntry = ContinuousCheck & { rec: FacetRecord };

export type TeamEntry = { items: FacetRecord[]; contact: string };

/** A place of mention: which record names the code, in the text of which field. */
export type ErrorCodeMention = { id: string; statement: string };

/**
 * An error code as it occurs in the corpus's free text.
 * `records` with more than one entry is a possible collision — more than one
 * feature id claims the same code.
 */
export type ErrorCodeEntry = {
  code: string;
  band: string;
  records: ErrorCodeMention[];
};

/** A band with its assigned codes and the smallest free number. */
export type ErrorCodeBandGroup = {
  band: string;
  codes: ErrorCodeEntry[];
  /** `null` when the band is full or its shape reveals no gap. */
  nextFree: string | null;
};

/**
 * The error-code register: grouped by band, with visible gaps.
 * `pattern` is the pattern that was searched for — default `E\d{4}`.
 * Grouping by leading digit is independent of the search pattern.
 */
export type ErrorCodeRegister = {
  pattern: string;
  entries: ErrorCodeEntry[];
  bands: ErrorCodeBandGroup[];
  /** Codes named by more than one record — possible collision. */
  collisions: string[];
};

/**
 * A raw value of a project-defined vocabulary (not `canonical_schema`, whose
 * divergences the ENUM check already captures) — written as in the record,
 * with its frequency and the records it occurs in.
 */
export type VocabValue = {
  /** As written in the record — empty means: no value set. */
  value: string;
  count: number;
  recordIds: string[];
};

/**
 * A group of raw values whose lower-cased forms contain one another as a
 * prefix (`warn` in `warning`) — a heuristic that only inspects the characters
 * that are there anyway, instead of maintaining a table of known pairs or
 * guessing.
 */
export type VocabGroup = {
  /** Most frequent raw value of the group, lower-cased — only a key, not a replacement value. */
  key: string;
  values: VocabValue[];
  count: number;
  recordIds: string[];
  /** More than one raw value in the group — near-duplicates, not a single value. */
  merged: boolean;
};

/** Vocabulary with a clear with/without-value distinction, such as `query_source`. */
export type VocabCoverage = {
  present: VocabGroup[];
  missing: { count: number; recordIds: string[] };
};

/**
 * An enum-shaped `constraints` line of a data field, normalised — see
 * `parseEnumConstraint`. Not yet aggregated by field name.
 */
export type EnumRawConstraint = { entity: string; field: string; values: string[] };

/**
 * A value set as at least one data object declares it for a field.
 * `key` is order-independent — two entities with the same values in a
 * different order end up in the same value set.
 */
export type EnumValueSet = { key: string; values: string[]; entities: string[] };

/**
 * A field name across all data objects. More than one value set means: the
 * same field name carries contradictory controlled values — a divergence no
 * tool reports so far.
 */
export type EnumRegisterEntry = { field: string; valueSets: EnumValueSet[]; divergent: boolean };

/** The ENUM register: all enum-shaped `constraints`, grouped by field name. */
export type EnumRegister = {
  entries: EnumRegisterEntry[];
  /** Number of distinct field names with at least one enum-shaped value set. */
  fieldCount: number;
  /** Number of field names with more than one value set — one divergence per field. */
  divergentFieldCount: number;
};

/** A measurement from `facet calibrate` (FACET §11.4). */
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

/**
 * The shape of the registry as the engine computes it.
 *
 * It comes ready-made from `facet calibrate` instead of being recomputed here:
 * the bands are normative (FACET §11.4), and a second implementation of them
 * would be a second set of numbers somebody would have to reconcile.
 */
export type Calibration = {
  registry?: string;
  records: number;
  scenarios: number;
  anchoredFiles: number;
  domains: number;
  capabilities: number;
  hasTaxonomy: boolean;
  metrics: CalibrationMetric[];
  /** The diagnosis — names the level, not the number. */
  readings: string[];
};

/** The complete model computed from the corpus — the data basis of every view. */
export type AtlasModel = {
  rc: Record<string, YamlValue>;
  /**
   * The declared domain vocabulary (FACET §4.5), or `null` when the project
   * has none. `null` means "not declared" — the prose is then rendered as
   * before, not as prose in which nothing was found.
   */
  glossary: Glossary | null;
  /** The declared decomposition, or `null` when the project has none. */
  taxonomy: Taxonomy | null;
  /** Taxonomy interlinked with the existing ids — both directions. */
  taxonomyTree: TaxonomyBranch[];
  /** The shape of the registry, when the engine supplied it. */
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
  /** Nodes that never reach an in-degree of 0 — on a cycle or behind one. */
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
  /** Core features no policy covers — neither directly nor via their domain. */
  uncovered: FacetRecord[];
  /** Fixes across the whole set — the sum over all registers. */
  defectTotal: number;
  /** Records that keep a register at all. */
  defectRecords: FacetRecord[];
  /**
   * Records in which something was fixed and for which not a single promise
   * is proven. That is the open point of the heatmap: defects land where no
   * test stands — not the frequency as such, which on its own is no defect.
   */
  defectsUnproven: FacetRecord[];
  /** The distinct targets from `intent.decision_records`, descending by frequency. */
  decisionTargets: DecisionTarget[];
  /** Active core features with no `knowledge` block at all — the gap behind the knowledge tab. */
  noKnowledge: FacetRecord[];
  errorCodeRegister: ErrorCodeRegister;
  /** `observation.alerts[].severity` across all records — value → frequency → records. */
  alertSeverities: VocabGroup[];
  /** `observation.slos[].query_source` across all records — with/without source. */
  sloSourceCoverage: VocabCoverage;
  /** `retention.duration` across all data entities — raw value → records. */
  retentionSpellings: VocabGroup[];
  /** Enum-shaped `constraints` across all data objects, grouped by field name. */
  enumRegister: EnumRegister;
  /**
   * Records whose YAML could not be read — skipped, not contained in
   * `recs`/`byId`. Empty means: nothing was skipped, not that nobody looked.
   */
  corpusErrors: CorpusError[];
};

/** The eight roles from the role gate. They only orient the start page. */
export type RoleKey = "c" | "arch" | "delivery" | "eng" | "qa" | "po" | "gov" | "ops";

export type RoleDef = {
  key: RoleKey;
  tag: string;
  title: string;
  hint: string;
};
