/** Normalize a single parsed record; registry-wide aggregation stays in model.ts. */

import { parseGherkin } from "./gherkin";
import { asArray, asRecord, asString, humanize } from "./model-values";
import type {
  Alert,
  Anchor,
  Clause,
  ComplianceCheck,
  ContinuousCheck,
  Dashboard,
  DefectFix,
  Defects,
  Evidence,
  FacetRecord,
  FeatureFlag,
  KnowledgeSlot,
  LogEvent,
  MetricEmission,
  RawRecord,
  RecordKind,
  RecordVariant,
  RepoScan,
  SchemaField,
  Scenario,
  ScenarioAudience,
  ScenarioDeviation,
  Slo,
  TestRef,
  TraceEmission,
} from "./types";
import type { YamlValue } from "./yaml";

/** An existing deviation remains visible even when its metadata is incomplete. */
function shapeDeviation(value: YamlValue | undefined): ScenarioDeviation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const doc = value as Record<string, YamlValue>;
  return {
    reason: asString(doc.reason),
    confirmedBy: asString(doc.confirmed_by),
    trackedAs: asString(doc.tracked_as),
  };
}

/** Only schema-defined audiences become model values; absence or an unknown value is null. */
function shapeAudience(value: YamlValue | undefined): ScenarioAudience | null {
  return value === "product" || value === "engineering" ? value : null;
}

/** Whether any source anchor declares scenario coverage anywhere in this registry. */
export function anyAnchorProves(scan: RepoScan | undefined): boolean {
  return Object.values(scan?.anchors ?? {}).some((list) =>
    list.some((a) => Array.isArray(a.proves) && a.proves.length > 0),
  );
}

export function recordKindOf(id: string): RecordKind {
  if (id.startsWith("policy/")) return "policy";
  if (id.startsWith("assumption/")) return "assumption";
  if (id.startsWith("data/")) return "entity";
  return "feature";
}

/** Normalize recorded fixes while preserving the distinction between an absent register and an empty one. */
export function shapeDefects(value: YamlValue | undefined): Defects {
  const empty: Defects = { present: false, fixes: [], total: 0, byFile: [], lastFix: "" };
  if (value == null || typeof value !== "object" || Array.isArray(value)) return empty;

  const block = asRecord(value);
  const fixes: DefectFix[] = asArray<Record<string, YamlValue>>(block.fixes)
    .map((f) => ({
      commit: asString(f.commit),
      date: asString(f.date),
      files: asArray<string>(f.files).map(String),
      subject: asString(f.subject),
      issue: asString(f.issue),
      recordedBy: asString(f.recorded_by),
    }))
    .filter((f) => f.commit !== "");

  // Newest fixes first; the commit orders fixes with the same date deterministically.
  fixes.sort((a, b) =>
    a.date === b.date ? a.commit.localeCompare(b.commit) : b.date.localeCompare(a.date),
  );

  const counts: Record<string, number> = {};
  fixes.forEach((f) => f.files.forEach((p) => (counts[p] = (counts[p] || 0) + 1)));
  const byFile = Object.keys(counts)
    .map((path) => ({ path, count: counts[path] }))
    .sort((a, b) => (a.count === b.count ? a.path.localeCompare(b.path) : b.count - a.count));

  return {
    present: true,
    fixes,
    total: fixes.length,
    byFile,
    lastFix: fixes.length > 0 ? fixes[0].date : "",
  };
}

/** Normalize one record and associate its declared tests and source anchors with its scenarios. */
export function shapeRecord(raw: RawRecord, scan: RepoScan | undefined): FacetRecord {
  const doc = raw.doc ?? {};
  const id = asString(doc.id) || raw.path;
  const kind = recordKindOf(id);
  const seg = id.split("/");

  const verification = asRecord(doc.verification);
  const tests: TestRef[] = [];
  Object.keys(verification).forEach((key) => {
    const m = key.match(/^(.+)_tests$/);
    if (!m || !Array.isArray(verification[key])) return;
    asArray<Record<string, YamlValue>>(verification[key]).forEach((t) => {
      tests.push({
        kind: m[1],
        id: asString(t.id),
        proves: asArray<string>(t.proves).map(String),
      });
    });
  });

  const provenBy: Record<string, TestRef[]> = {};
  tests.forEach((t) =>
    t.proves.forEach((s) => {
      (provenBy[s] = provenBy[s] || []).push(t);
    }),
  );

  const anchors: Anchor[] = scan?.anchors?.[id] ?? [];
  const anchorsAdopted = anyAnchorProves(scan);
  const implementedByOf: Record<string, Anchor[]> = {};
  anchors.forEach((a) => {
    (a.proves ?? []).forEach((sid) => {
      (implementedByOf[sid] = implementedByOf[sid] || []).push(a);
    });
  });

  const contract = asRecord(doc.contract);
  const scenarios: Scenario[] = asArray<Record<string, YamlValue>>(contract.scenarios).map((s) => {
    const sid = asString(s.id);
    const backingDoc = asRecord(s.backing);
    return {
      id: sid,
      steps: parseGherkin(asString(s.statement)),
      pre: s.pre_state ?? null,
      post: s.post_state ?? null,
      // A declared test association, not the outcome of a test execution.
      proven: (provenBy[sid] || []).length > 0,
      tests: provenBy[sid] || [],
      backing: {
        state: asString(backingDoc.state) === "unbacked" ? "unbacked" : "backed",
        reason: asString(backingDoc.reason),
        unblockedBy: asString(backingDoc.unblocked_by),
      },
      deviation: shapeDeviation(s.deviation),
      audience: shapeAudience(s.audience),
      implementedBy: implementedByOf[sid] || [],
      anchorsAdopted,
    };
  });

  const defects = shapeDefects(doc.defects);

  const obs = asRecord(doc.observation);
  const knowledgeDoc = asRecord(doc.knowledge);
  const lineage = asRecord(doc.lineage);
  const canonical = asRecord(doc.canonical_schema);
  const intent = asRecord(doc.intent);
  const owner = asRecord(lineage.owner);

  // FACET 1.4 `variants` — per-target lifecycle for a feature that exists on
  // more than one independently deployable target. The schema's top-level
  // `oneOf` forbids a record from carrying both `variants` and a top-level
  // `lifecycle`, so a variants record has no scalar lifecycle to read — the
  // field above stays "—" for it, honestly, instead of a fabricated aggregate.
  const variantsDoc = asRecord(doc.variants);
  const variantKeys = Object.keys(variantsDoc);
  const variants: Record<string, RecordVariant> | null = variantKeys.length
    ? Object.fromEntries(
        variantKeys.map((key) => {
          const v = asRecord(variantsDoc[key]);
          return [
            key,
            {
              lifecycle: asString(v.lifecycle),
              notes: v.notes == null ? undefined : asString(v.notes),
            },
          ];
        }),
      )
    : null;
  // Derived predicate only — mirrors Go's Record.ActiveAnywhere(). Never
  // surfaced as a raw field value (see RENDERED_PATHS): it decides which
  // records a filter counts, it does not describe what the record declares.
  const activeAnywhere = variants
    ? Object.values(variants).some((v) => v.lifecycle === "active")
    : asString(doc.lifecycle) === "active";

  // FACET 1.4 `flags` — feature flags gating exposure. Orthogonal to
  // lifecycle: a feature can be fully built and visible to nobody.
  const flags: FeatureFlag[] = asArray<Record<string, YamlValue>>(doc.flags).map((f) => ({
    key: asString(f.key),
    system: f.system == null ? undefined : asString(f.system),
    default: typeof f.default === "boolean" ? f.default : undefined,
    variants: asArray<string>(f.variants).map(String),
    rollout: f.rollout == null ? undefined : asString(f.rollout),
    retireBy: f.retire_by == null ? undefined : asString(f.retire_by),
  }));

  const dashboards: Dashboard[] = asArray<Record<string, YamlValue>>(obs.dashboards)
    .map((d) => ({ url: asString(d.url) }))
    .filter((d) => d.url);

  // FACET 1.6 `observability` — developer-facing emission contract. Distinct
  // from `observation` above, which is operator-facing (SLOs, alerts).
  const observabilityDoc = asRecord(doc.observability);
  const metricsEmitted: MetricEmission[] = asArray<Record<string, YamlValue>>(
    observabilityDoc.metrics_emitted,
  ).map((m) => ({
    name: asString(m.name),
    kind: asString(m.kind),
    labels: asArray<string>(m.labels).map(String),
    description: m.description == null ? undefined : asString(m.description),
  }));
  const tracesEmitted: TraceEmission[] = asArray<Record<string, YamlValue>>(
    observabilityDoc.traces_emitted,
  ).map((t) => ({
    spanName: asString(t.span_name),
    parentSpan: t.parent_span == null ? undefined : asString(t.parent_span),
    attributes: asArray<string>(t.attributes).map(String),
  }));
  const logEvents: LogEvent[] = asArray<Record<string, YamlValue>>(observabilityDoc.log_events).map(
    (l) => ({
      event: asString(l.event),
      level: asString(l.level),
      attributes: asArray<string>(l.attributes).map(String),
    }),
  );

  const knowledge: KnowledgeSlot[] = Object.keys(knowledgeDoc).map((k) => {
    const slot = asRecord(knowledgeDoc[k]);
    return {
      key: k,
      question: slot.question == null ? undefined : String(slot.question),
      answer: slot.answer == null ? undefined : String(slot.answer),
      // Keep each declared derivation source as a separate value.
      derive: slot.derive_from == null ? undefined : asArray<string>(slot.derive_from).map(String),
    };
  });

  const fields = asArray<SchemaField>(canonical.fields);

  return {
    path: raw.path,
    raw: raw.raw,
    doc,
    id,
    kind,
    seg,
    domain: seg[0],
    capability: seg[1] ?? "",
    label: humanize(seg[seg.length - 1]),
    lifecycle: asString(doc.lifecycle) || "—",
    variants,
    activeAnywhere,
    schemaVersion: asString(doc.schema_version) || "—",
    summary: (asString(intent.summary) || asString(doc.statement)).trim(),
    adrs: asArray<string>(intent.decision_records).map(String),
    scenarios,
    tests,
    provenBy,
    proven: scenarios.filter((s) => s.proven).length,
    total: scenarios.length,
    slos: asArray<Slo>(obs.slos),
    alerts: asArray<Alert>(obs.alerts),
    checks: asArray<ContinuousCheck>(obs.continuous_checks),
    dashboards,
    flags,
    metricsEmitted,
    tracesEmitted,
    logEvents,
    knowledge,
    team: asString(owner.team),
    individual: asString(owner.individual),
    createdAt: asString(lineage.created_at) || asString(doc.created_at),
    supersededBy: lineage.superseded_by ? String(lineage.superseded_by) : null,
    dependsOn: asArray<string>(lineage.depends_on).map(String),
    dependedOnBy: asArray<string>(lineage.depended_on_by).map(String),
    relatedPolicies: asArray<string>(lineage.related_policies).map(String),
    relatedAssumptions: asArray<string>(lineage.related_assumptions).map(String),
    relatedEntities: asArray<string>(lineage.related_data_entities).map(String),
    changeRef: asString(lineage.change_history_ref),
    clauses: asArray<Clause>(contract.clauses),
    scope: doc.scope ? asRecord(doc.scope) : null,
    complianceChecks: asArray<ComplianceCheck>(verification.compliance_checks),
    artifacts: asArray<string>(verification.audit_artifacts).map(String),
    fields,
    schemaNo: canonical.version,
    retention: doc.retention ?? null,
    readBy: asArray<string>(doc.read_by).map(String),
    mutatedBy: asArray<string>(doc.mutated_by).map(String),
    evidence: asArray<Evidence>(doc.evidence),
    referencedBy: asArray<string>(doc.referenced_by).map(String),
    criticality: asString(doc.criticality),
    risk: asString(doc.risk_if_false).trim(),
    anchors,
    defects,
    present: {
      intent: Boolean(doc.intent),
      contract: Boolean(doc.contract) || Boolean(doc.statement) || fields.length > 0,
      verification: Boolean(doc.verification) || asArray(doc.evidence).length > 0,
      observation: Boolean(doc.observation),
      knowledge: Boolean(doc.knowledge),
      lineage: Boolean(doc.lineage),
      anchors: anchors.length > 0,
    },
  };
}
