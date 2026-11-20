import { deCore } from "../facet/i18n/catalog/core";
/** Build registry-wide summaries, indexes, and diagnostics from normalized records. */

import type { Glossary } from "./glossary";
import { taxonomyTree } from "./taxonomy";
import type { Taxonomy } from "./taxonomy";
import type {
  Calibration,
  AtlasModel,
  ComplianceCheck,
  CorpusError,
  DecisionTarget,
  Domain,
  DriftEntry,
  Edge,
  EnumRawConstraint,
  EnumRegister,
  EnumRegisterEntry,
  EnumValueSet,
  ErrorCodeBandGroup,
  ErrorCodeEntry,
  ErrorCodeMention,
  ErrorCodeRegister,
  FacetRecord,
  FieldPath,
  RawRecord,
  RepoScan,
  TeamEntry,
  UndeclaredMention,
  VocabCoverage,
  VocabGroup,
  VocabValue,
} from "./types";
import type { YamlValue } from "./yaml";
import { shapeRecord } from "./model-record";
import { asArray, asRecord, asString } from "./model-values";

export { anyAnchorProves, recordKindOf, shapeDefects, shapeRecord } from "./model-record";
export { humanize } from "./model-values";

const MONTH_MS = 2_592_000_000;

export function pct(part: number, total: number): number {
  return total ? Math.round((part / total) * 100) : 0;
}

/** A number grouped for the active locale; English is the default. */
export function formatNumber(n: number, locale = "en"): string {
  return new Intl.NumberFormat(locale).format(n);
}

/** Field paths Atlas displays. An entry ending in `.` counts as a prefix. */
export const RENDERED_PATHS: readonly string[] = [
  "id",
  "schema_version",
  "lifecycle",
  "statement",
  "criticality",
  "last_reviewed_at",
  "risk_if_false",
  "intent.summary",
  "intent.decision_records[]",
  "intent.regulatory_basis[]",
  "contract.scenarios[].id",
  "contract.scenarios[].statement",
  "contract.scenarios[].pre_state.",
  "contract.scenarios[].post_state.",
  "contract.scenarios[].backing.state",
  "contract.scenarios[].backing.reason",
  "contract.scenarios[].backing.unblocked_by",
  "contract.scenarios[].deviation.reason",
  "contract.scenarios[].deviation.confirmed_by",
  "contract.scenarios[].deviation.tracked_as",
  "contract.scenarios[].audience",
  "contract.clauses[].id",
  "contract.clauses[].requirement",
  "canonical_schema.version",
  "canonical_schema.fields[].name",
  "canonical_schema.fields[].type",
  "canonical_schema.fields[].constraints",
  "canonical_schema.fields[].references",
  "canonical_schema.fields[].sensitivity",
  "retention.duration",
  "retention.policy",
  "read_by[]",
  "mutated_by[]",
  "referenced_by[]",
  "evidence[].date",
  "evidence[].kind",
  "evidence[].note",
  "verification.*_tests[].id",
  "verification.*_tests[].proves[]",
  "verification.compliance_checks[].id",
  "verification.compliance_checks[].last_established",
  "verification.compliance_checks[].frequency",
  "verification.compliance_checks[].next_due",
  "verification.audit_artifacts[]",
  "observation.slos[].name",
  "observation.slos[].target",
  "observation.slos[].window",
  "observation.slos[].query",
  "observation.slos[].query_source",
  "observation.alerts[].name",
  "observation.alerts[].condition",
  "observation.alerts[].severity",
  "observation.alerts[].runbook",
  "observation.continuous_checks[].id",
  "observation.continuous_checks[].frequency",
  "knowledge.*.question",
  "knowledge.*.answer",
  "knowledge.*.derive_from[]",
  "scope.domains[]",
  "scope.features[]",
  "lineage.owner.team",
  "lineage.owner.individual",
  "lineage.created_at",
  "lineage.superseded_by",
  "lineage.depends_on[]",
  "lineage.depended_on_by[]",
  "lineage.related_policies[]",
  "lineage.related_assumptions[]",
  "lineage.related_data_entities[]",
  "lineage.change_history_ref",
  "variants.*.lifecycle",
  "variants.*.notes",
  "flags[].key",
  "flags[].system",
  "flags[].rollout",
  "observation.dashboards[].url",
  "observability.metrics_emitted[].name",
  "observability.traces_emitted[].span_name",
  "observability.log_events[].event",
];

export function isRenderedPath(path: string): boolean {
  if (RENDERED_PATHS.includes(path)) return true;
  return RENDERED_PATHS.some((r) => r.endsWith(".") && path.startsWith(r));
}

/** Collects every field path that occurs, with its frequency — the basis of the completeness view. */
export function collectPaths(
  node: YamlValue | undefined,
  prefix: string,
  out: Record<string, number>,
): void {
  if (node == null) return;
  if (Array.isArray(node)) {
    node.forEach((x) => collectPaths(x, `${prefix}[]`, out));
    return;
  }
  if (typeof node !== "object") {
    out[prefix] = (out[prefix] || 0) + 1;
    return;
  }
  Object.keys(node).forEach((k) => {
    let seg = k;
    if (prefix === "knowledge") seg = "*";
    else if (prefix === "variants") seg = "*";
    else if (prefix === "verification" && /_tests$/.test(k)) seg = "*_tests";
    collectPaths(node[k], prefix ? `${prefix}.${seg}` : seg, out);
  });
}

const SEVERITY_RANK: Record<string, number> = { critical: 0, warning: 1, info: 2 };

/** An edge pair, regardless of direction — for the "already declared" check. */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Lower-cased, trimmed — the basis of the near-duplicate comparison. */
function normalizeVocab(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Whether two (already normalised) raw values are a near-duplicate: the
 * shorter is a prefix of the longer — `warn` in `warning`. This only inspects
 * the characters that are there anyway; there is no table of known pairs and
 * no distance estimate that would guess anything. An empty value (an alert
 * without a severity) never counts as a duplicate of a set value — "missing"
 * and "written short" are two different findings.
 */
function isNearDuplicate(a: string, b: string): boolean {
  if (!a || !b || a === b) return false;
  return a.startsWith(b) || b.startsWith(a);
}

/**
 * Builds vocabulary groups from raw-value/record pairs: one entry per raw value
 * (frequency + affected records), near-duplicates visually merged into one
 * group through a prefix union-find — also across a chain
 * (`warn` → `warnin` → `warning`). Within a group and between groups the most
 * frequent raw value comes first, the same rule as everywhere else in the
 * model.
 */
function buildVocabulary(entries: { value: string; recordId: string }[]): VocabGroup[] {
  const byValue = new Map<string, { count: number; recordIds: Set<string> }>();
  entries.forEach(({ value, recordId }) => {
    const bucket = byValue.get(value) ?? { count: 0, recordIds: new Set<string>() };
    bucket.count += 1;
    bucket.recordIds.add(recordId);
    byValue.set(value, bucket);
  });

  const values: VocabValue[] = Array.from(byValue.entries())
    .map(([value, bucket]) => ({
      value,
      count: bucket.count,
      recordIds: Array.from(bucket.recordIds).sort(),
    }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  const parent = new Map<string, string>();
  values.forEach((v) => parent.set(v.value, v.value));
  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      if (isNearDuplicate(normalizeVocab(values[i].value), normalizeVocab(values[j].value))) {
        union(values[i].value, values[j].value);
      }
    }
  }

  const grouped = new Map<string, VocabValue[]>();
  values.forEach((v) => {
    const root = find(v.value);
    const bucket = grouped.get(root) ?? [];
    bucket.push(v);
    grouped.set(root, bucket);
  });

  return Array.from(grouped.values())
    .map((groupValues): VocabGroup => {
      const sorted = [...groupValues].sort(
        (a, b) => b.count - a.count || a.value.localeCompare(b.value),
      );
      const recordIds = Array.from(new Set(sorted.flatMap((v) => v.recordIds))).sort();
      return {
        key: normalizeVocab(sorted[0].value),
        values: sorted,
        count: sorted.reduce((sum, v) => sum + v.count, 0),
        recordIds,
        merged: sorted.length > 1,
      };
    })
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/**
 * Recognises one of the four prefixes with which
 * `canonical_schema.fields[].constraints` describes a controlled value set in a
 * real corpus: `enum:`, `values:`, `csv:`, `variant:`. The recognition matches
 * the independently implemented parser in FACET Core.
 */
const ENUM_PREFIX = /^(enum|values|csv|variant)\s*:\s*(.*)$/i;

/**
 * Normalises a `constraints` line to a list of values when it is enum-shaped —
 * otherwise `null`. Four notations are recognised: `enum: a|b|c`,
 * `values:a|b|c`, `values:[a,b,c]`, `csv:`/`variant:` prefix variants
 * (comma-separated). Tolerant rather than strict: the goal is to find real
 * divergences in an untidy corpus, not to reject every free text that does not
 * fit exactly — but without one of the four prefixes even a value containing a
 * comma or pipe is no finding, otherwise e.g. `UTC, optional` would wrongly be
 * read as an enum.
 */
export function parseEnumConstraint(text: string): string[] | null {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return null;
  const match = trimmed.match(ENUM_PREFIX);
  if (!match) return null;

  let body = match[2].trim();
  if (body.startsWith("[") && body.endsWith("]")) {
    body = body.slice(1, -1).trim();
  }
  if (!body) return null;

  const separator = body.includes("|") ? "|" : ",";
  const values = body
    .split(separator)
    .map((v) =>
      v
        .trim()
        .replace(/^["']|["']$/g, "")
        .trim(),
    )
    .filter(Boolean);
  return values.length ? values : null;
}

/**
 * Collects every enum-shaped `constraints` line across all data objects —
 * the raw list, before it is aggregated by field name.
 * A field can carry several free-text constraints (Array<string> per the
 * schema, in older sets also a single string); the first one that turns out
 * to be enum-shaped counts.
 */
export function collectEnumConstraints(entities: FacetRecord[]): EnumRawConstraint[] {
  const out: EnumRawConstraint[] = [];
  entities.forEach((entity) => {
    entity.fields.forEach((field) => {
      const name = field.name == null ? "" : String(field.name);
      if (!name) return;
      const raw = field.constraints;
      const texts: string[] = Array.isArray(raw)
        ? raw.map((v) => String(v))
        : raw == null || raw === ""
          ? []
          : [String(raw)];
      for (const text of texts) {
        const values = parseEnumConstraint(text);
        if (values) {
          out.push({ entity: entity.id, field: name, values });
          break;
        }
      }
    });
  });
  return out;
}

/** Order-independent key of a value set — order is not a divergence. */
function enumValueSetKey(values: string[]): string {
  return Array.from(new Set(values)).sort().join("|");
}

/**
 * Builds the ENUM register: one or more value sets per field name. More than
 * one value set under the same field name is the divergence the register is
 * meant to make visible.
 */
export function buildEnumRegister(entities: FacetRecord[]): EnumRegister {
  const raw = collectEnumConstraints(entities);
  const byField = new Map<string, Map<string, EnumValueSet>>();

  raw.forEach(({ entity, field, values }) => {
    const setsForField = byField.get(field) ?? new Map<string, EnumValueSet>();
    byField.set(field, setsForField);
    const setKey = `${field}::${enumValueSetKey(values)}`;
    const existing = setsForField.get(setKey);
    if (existing) {
      if (!existing.entities.includes(entity)) existing.entities.push(entity);
    } else {
      setsForField.set(setKey, { key: setKey, values, entities: [entity] });
    }
  });

  const entries: EnumRegisterEntry[] = Array.from(byField.entries())
    .map(([field, sets]) => {
      const valueSets = Array.from(sets.values());
      return { field, valueSets, divergent: valueSets.length > 1 };
    })
    .sort((a, b) => a.field.localeCompare(b.field));

  return {
    entries,
    fieldCount: entries.length,
    divergentFieldCount: entries.filter((entry) => entry.divergent).length,
  };
}

/** Builds the complete model from all raw files. */
export function buildModel(
  rc: Record<string, YamlValue>,
  paths: string[],
  raws: RawRecord[],
  scan: RepoScan = {},
  corpusErrors: CorpusError[] = [],
  taxonomy: Taxonomy | null = null,
  calibration: Calibration | null = null,
  glossary: Glossary | null = null,
): AtlasModel {
  const recs = raws.map((r) => shapeRecord(r, scan));
  const byId: Record<string, FacetRecord> = {};
  recs.forEach((r) => (byId[r.id] = r));

  const features = recs.filter((r) => r.kind === "feature");
  const policies = recs.filter((r) => r.kind === "policy");
  const assumptions = recs.filter((r) => r.kind === "assumption");
  const entities = recs.filter((r) => r.kind === "entity");

  const domains: Domain[] = [];
  const dmap: Record<string, Domain> = {};
  features.forEach((f) => {
    if (!dmap[f.domain]) {
      dmap[f.domain] = { name: f.domain, items: [] };
      domains.push(dmap[f.domain]);
    }
    dmap[f.domain].items.push(f);
  });

  let scnTotal = 0;
  let scnProven = 0;
  const allScn = [];
  for (const f of features) {
    for (const s of f.scenarios) {
      scnTotal++;
      if (s.proven) scnProven++;
      allScn.push({ ...s, rec: f });
    }
  }

  const testKinds: Record<string, number> = {};
  features.forEach((f) =>
    f.tests.forEach((t) => (testKinds[t.kind] = (testKinds[t.kind] || 0) + 1)),
  );

  const domainCov = domains.map((d) => {
    const total = d.items.reduce((n, f) => n + f.total, 0);
    const proven = d.items.reduce((n, f) => n + f.proven, 0);
    return {
      name: d.name,
      total,
      proven,
      pct: total ? Math.round((proven / total) * 100) : null,
      tests: d.items.reduce((n, f) => n + f.tests.length, 0),
    };
  });

  const usage: Record<string, number> = {};
  raws.forEach((r) => collectPaths(r.doc, "", usage));
  const fieldPaths: FieldPath[] = Object.keys(usage)
    .sort()
    .map((p) => ({ path: p, n: usage[p], rendered: isRenderedPath(p) }));
  const notRendered = fieldPaths.filter((p) => !p.rendered);

  const slos = recs.flatMap((r) => r.slos.map((s) => ({ ...s, rec: r })));
  const alerts = recs.flatMap((r) => r.alerts.map((a) => ({ ...a, rec: r })));
  const checks = recs.flatMap((r) => r.checks.map((c) => ({ ...c, rec: r })));
  alerts.sort((a, b) => {
    const ra = SEVERITY_RANK[String(a.severity)] ?? 3;
    const rb = SEVERITY_RANK[String(b.severity)] ?? 3;
    return ra - rb;
  });

  const edges: Edge[] = [];
  const seen: Record<string, true> = {};
  const ghosts: Record<string, true> = {};
  const addEdge = (from: string, to: string) => {
    if (!from || !to || from === to) return;
    const k = `${from}>${to}`;
    if (seen[k]) return;
    seen[k] = true;
    if (!byId[from]) ghosts[from] = true;
    if (!byId[to]) ghosts[to] = true;
    edges.push({ from, to });
  };
  recs.forEach((r) => {
    r.dependsOn.forEach((d) => addEdge(d, r.id));
    r.dependedOnBy.forEach((d) => addEdge(r.id, d));
  });

  // Consistency check: ids that appear in a record's free text
  // (`intent.summary`, the Gherkin steps of its scenarios) but are declared
  // neither as `depends_on` nor as `depended_on_by`. A mentioned id without a
  // declared relation is either a forgotten declaration or a chance hit — both
  // are a finding, not an error to be silently corrected. The direction of the
  // mention says nothing about the direction of the dependency, so a pair
  // counts as declared as soon as any edge exists between the two, in
  // whichever direction.
  const declaredPairs = new Set<string>();
  edges.forEach((edge) => declaredPairs.add(pairKey(edge.from, edge.to)));
  const undeclaredMentions: UndeclaredMention[] = [];
  const knownIds = recs.map((r) => r.id);
  recs.forEach((record) => {
    const text = [
      record.summary,
      ...record.scenarios.flatMap((s) => s.steps.map((step) => step.text)),
    ]
      .join("\n")
      .trim();
    if (!text) return;
    knownIds.forEach((otherId) => {
      if (otherId === record.id) return;
      if (!text.includes(otherId)) return;
      if (declaredPairs.has(pairKey(record.id, otherId))) return;
      undeclaredMentions.push({ from: record.id, to: otherId });
    });
  });

  const ids = recs.map((r) => r.id).concat(Object.keys(ghosts));
  const depth: Record<string, number> = {};
  const deg: Record<string, { up: number; down: number }> = {};
  const outgoing: Record<string, string[]> = {};
  ids.forEach((i) => {
    depth[i] = 0;
    deg[i] = { up: 0, down: 0 };
    outgoing[i] = [];
  });
  edges.forEach((e) => {
    deg[e.to].up++;
    deg[e.from].down++;
    outgoing[e.from].push(e.to);
  });

  // Kahn instead of fixed-point relaxation: a node leaves the queue only once
  // every incoming edge has been processed, so exactly once — and every edge is
  // relaxed exactly once. A cycle leaves at least one incoming edge open on
  // each of its nodes, so none of them ever reaches in-degree 0. The old loop
  // failed to recognise exactly that: it kept running until `ids.length`
  // passes were reached, and the depth of the cycle nodes grew to a four-digit
  // value instead of the actually longest chain.
  const remaining: Record<string, number> = {};
  ids.forEach((i) => (remaining[i] = deg[i].up));
  const queue = ids.filter((i) => remaining[i] === 0);
  const resolved = new Set<string>();
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const id = queue[cursor];
    resolved.add(id);
    outgoing[id].forEach((next) => {
      if (depth[next] < depth[id] + 1) depth[next] = depth[id] + 1;
      remaining[next] -= 1;
      if (remaining[next] === 0) queue.push(next);
    });
  }

  // Whatever remains sits on a cycle or behind one — a declared or
  // self-contradicting dependency that never leads back to an origin. Instead
  // of guessing which of the cycle nodes comes "first", they all get the same
  // layer, directly behind everything that could be resolved: bounded,
  // deterministic, and visible as a group instead of as a graph that grows
  // beyond the screen.
  const cyclic = ids.filter((i) => !resolved.has(i));
  if (cyclic.length) {
    const resolvedMax = ids.reduce((mx, i) => (resolved.has(i) ? Math.max(mx, depth[i]) : mx), -1);
    cyclic.forEach((i) => (depth[i] = resolvedMax + 1));
  }

  const maxDepth = ids.reduce((mx, i) => Math.max(mx, depth[i]), 0);

  const today = new Date(scan.scannedAt ?? Date.now());

  let overdue = 0;
  const overdueList: { rec: FacetRecord; check: ComplianceCheck }[] = [];
  policies.forEach((p) =>
    p.complianceChecks.forEach((c) => {
      c.overdue = c.next_due ? new Date(String(c.next_due)) < today : false;
      if (c.overdue) {
        overdue++;
        overdueList.push({ rec: p, check: c });
      }
    }),
  );

  let stale = 0;
  assumptions.forEach((a) => {
    const reviewed = a.doc.last_reviewed_at ? new Date(String(a.doc.last_reviewed_at)) : null;
    a.ageMonths = reviewed ? Math.round((today.getTime() - reviewed.getTime()) / MONTH_MS) : null;
    a.stale = a.ageMonths != null && a.ageMonths > 12;
    if (a.stale) stale++;
  });

  let pii = 0;
  let enc = 0;
  entities.forEach((e) =>
    e.fields.forEach((f) => {
      if (f.sensitivity === "pii") pii++;
      if (f.sensitivity === "encrypted") enc++;
    }),
  );

  let clauseCount = 0;
  let mustCount = 0;
  policies.forEach((p) =>
    p.clauses.forEach((c) => {
      clauseCount++;
      // Accept German requirement keywords alongside English MUST.
      if (new RegExp(deCore["core.requirement.bindingPattern"]).test(String(c.requirement)))
        mustCount++;
    }),
  );

  const basis: Record<string, true> = {};
  policies.forEach((p) => {
    const intent = asRecord(p.doc.intent);
    asArray<string>(intent.regulatory_basis).forEach((b) => {
      basis[
        String(b)
          .split(/\s+(Art|§)|\s+\d/)[0]
          .trim()
      ] = true;
    });
  });

  const lifecycles: Record<string, number> = {};
  const teams: Record<string, TeamEntry> = {};
  const versions: Record<string, number> = {};
  const created: { date: string; id: string }[] = [];
  recs.forEach((r) => {
    lifecycles[r.lifecycle] = (lifecycles[r.lifecycle] || 0) + 1;
    if (r.team) {
      teams[r.team] = teams[r.team] || { items: [], contact: r.individual };
      teams[r.team].items.push(r);
    }
    versions[r.schemaVersion] = (versions[r.schemaVersion] || 0) + 1;
    if (r.createdAt) created.push({ date: r.createdAt, id: r.id });
  });
  created.sort((a, b) => (a.date < b.date ? 1 : -1));

  const noRunbook = alerts.filter((a) => !a.runbook).length;
  const sources: Record<string, true> = {};
  slos.forEach((s) => {
    if (s.query_source) sources[String(s.query_source)] = true;
  });

  // Vocabulary register: three recurring, project-defined vocabularies outside
  // `canonical_schema` that its ENUM check does not capture — `warn`/`warning`
  // is the same finding, only invisible because it is not counted there.
  const alertSeverities = buildVocabulary(
    alerts.map((a) => ({ value: asString(a.severity), recordId: a.rec.id })),
  );

  const sloSourceEntries = slos.map((s) => ({
    value: asString(s.query_source),
    recordId: s.rec.id,
  }));
  const sloMissingEntries = sloSourceEntries.filter((e) => e.value === "");
  const sloSourceCoverage: VocabCoverage = {
    present: buildVocabulary(sloSourceEntries.filter((e) => e.value !== "")),
    missing: {
      count: sloMissingEntries.length,
      recordIds: Array.from(new Set(sloMissingEntries.map((e) => e.recordId))).sort(),
    },
  };

  const retentionSpellings = buildVocabulary(
    entities
      .map((e) => ({ value: asString(asRecord(e.retention).duration), recordId: e.id }))
      .filter((entry) => entry.value !== ""),
  );

  const anchorMap = scan.anchors ?? {};
  const anchorPairs = Object.keys(anchorMap).flatMap((id) =>
    anchorMap[id].map((a) => ({ ...a, id })),
  );
  // A record can live in several files, and then several of them can have
  // moved. The earlier version kept the last one and kept quiet about the
  // rest — a number smaller than the truth.
  const driftIds: Record<string, DriftEntry[]> = {};
  (scan.drift ?? []).forEach((d) => (driftIds[d.id] = [...(driftIds[d.id] ?? []), d]));

  // `activeAnywhere` instead of `f.lifecycle === "active"` — a variants
  // record (FACET 1.4) has no top-level `lifecycle` by schema construction,
  // so the scalar comparison silently excluded every variants record from
  // each of these three signals.
  const unanchored = features.filter((f) => f.activeAnywhere && !(anchorMap[f.id] ?? []).length);
  const noIntent = recs.filter((r) => !r.summary);
  const knowSlots = features.reduce((n, f) => n + f.knowledge.length, 0);
  const knowAnswered = features.reduce((n, f) => n + f.knowledge.filter((s) => s.answer).length, 0);

  // `intent.decision_records` bundled into its distinct targets: the same
  // population (`features`) that the decision-references count in the
  // knowledge probe counts over (`probeOf`), so the sum of the rows here
  // equals exactly the number shown there.
  const decisionTargetEntries = new Map<string, { count: number; recordIds: string[] }>();
  features.forEach((f) => {
    f.adrs.forEach((target) => {
      const entry = decisionTargetEntries.get(target) ?? { count: 0, recordIds: [] };
      entry.count += 1;
      entry.recordIds.push(f.id);
      decisionTargetEntries.set(target, entry);
    });
  });
  const decisionTargets: DecisionTarget[] = Array.from(decisionTargetEntries.entries())
    .map(([target, entry]) => ({ target, count: entry.count, recordIds: entry.recordIds }))
    .sort((a, b) => b.count - a.count || a.target.localeCompare(b.target));

  const noKnowledge = features.filter((f) => f.activeAnywhere && !f.present.knowledge);
  const noOwner = recs.filter((r) => !r.team);
  const superseded = recs.filter((r) => r.supersededBy);
  const complete = features.filter(
    (f) =>
      f.total > 0 && f.proven === f.total && (anchorMap[f.id] ?? []).length > 0 && f.activeAnywhere,
  );
  const noObs = features.filter((f) => f.activeAnywhere && !f.slos.length && !f.alerts.length);

  // A policy covers a core feature directly (via `scope.features` or
  // `lineage.related_policies`) or via its domain. Both count; whoever counted
  // only the direct mention would report every feature governed domain-wide as
  // ungoverned.
  const uncovered = features.filter((f) => !policies.some((p) => coverage(p, f)));

  const defectRecords = recs.filter((r) => r.defects.present);
  const defectTotal = defectRecords.reduce((n, r) => n + r.defects.total, 0);
  // The open point is not the frequency — that on its own is no defect, and a
  // heavily used, well-tested feature stands at the top there. Open is where
  // something was fixed and not a single promise is proven: defects land where
  // no test stands.
  const defectsUnproven = defectRecords.filter((r) => r.defects.total > 0 && r.proven === 0);
  const errorCodeRegister = buildErrorCodeRegister(recs);
  const enumRegister = buildEnumRegister(entities);

  return {
    glossary,
    taxonomy,
    taxonomyTree: taxonomyTree(
      taxonomy,
      features.map((f) => f.id),
    ),
    calibration,
    rc,
    paths,
    recs,
    byId,
    features,
    policies,
    assumptions,
    entities,
    domains,
    scnTotal,
    scnProven,
    allScn,
    testKinds,
    domainCov,
    fieldPaths,
    notRendered,
    slos,
    alerts,
    checks,
    noRunbook,
    sources: Object.keys(sources),
    edges,
    undeclaredMentions,
    ghosts: Object.keys(ghosts),
    depth,
    deg,
    maxDepth,
    cyclic,
    overdue,
    overdueList,
    stale,
    pii,
    enc,
    clauseCount,
    mustCount,
    basis: Object.keys(basis),
    lifecycles,
    teams,
    versions,
    created,
    scan,
    anchorMap,
    anchorPairs,
    driftIds,
    unanchored,
    noIntent,
    knowSlots,
    knowAnswered,
    noKnowledge,
    noOwner,
    superseded,
    complete,
    noObs,
    uncovered,
    defectTotal,
    defectRecords,
    defectsUnproven,
    decisionTargets,
    errorCodeRegister,
    alertSeverities,
    sloSourceCoverage,
    retentionSpellings,
    enumRegister,
    corpusErrors,
  };
}

/**
 * Default pattern for error codes in the records' free text. The extractor
 * also accepts a configured pattern. Grouping by leading digit is done by
 * `errorCodeBand`, independently of the search.
 */
export const DEFAULT_ERROR_CODE_PATTERN = /E\d{4}/g;

/** `E1234` → `E1xxx` — the band is the leading digit, the rest masked. */
export function errorCodeBand(code: string): string {
  const m = code.match(/^(\D*)(\d)(\d*)$/);
  if (!m) return code;
  const [, prefix, digit, rest] = m;
  return `${prefix}${digit}${"x".repeat(rest.length)}`;
}

/**
 * The three places error codes are found: the summary, the Gherkin sentences
 * of every scenario (joined step by step, as in the consistency check above),
 * and the answer of the knowledge slot `common_pitfalls` — not any knowledge
 * slot whatsoever.
 */
function errorCodeTextFields(record: FacetRecord): string[] {
  const fields: string[] = [];
  if (record.summary) fields.push(record.summary);
  record.scenarios.forEach((scenario) => {
    const text = scenario.steps
      .map((step) => step.text)
      .join(" ")
      .trim();
    if (text) fields.push(text);
  });
  record.knowledge.forEach((slot) => {
    if (slot.key === "common_pitfalls" && slot.answer) fields.push(slot.answer);
  });
  return fields;
}

/**
 * Searches `pattern` in the free-text fields of every record. Repeated mentions
 * of the same code in the same record count only once — the first place found
 * supplies the sentence shown in the table. `records` with more than one entry
 * is a possible collision: more than one feature id claims the same code.
 */
export function extractErrorCodes(
  recs: FacetRecord[],
  pattern: RegExp = DEFAULT_ERROR_CODE_PATTERN,
): ErrorCodeEntry[] {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  const byCode = new Map<string, Map<string, string>>();

  recs.forEach((record) => {
    errorCodeTextFields(record).forEach((text) => {
      re.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = re.exec(text))) {
        const code = match[0];
        if (!byCode.has(code)) byCode.set(code, new Map());
        const perRecord = byCode.get(code)!;
        if (!perRecord.has(record.id)) perRecord.set(record.id, text.trim());
        // A zero-width match (a pattern that consumes no characters) would
        // leave `exec` stuck at the same position — an endless loop.
        if (match.index === re.lastIndex) re.lastIndex += 1;
      }
    });
  });

  return [...byCode.entries()]
    .map(([code, perRecord]) => {
      const records: ErrorCodeMention[] = [...perRecord.entries()]
        .map(([id, statement]) => ({ id, statement }))
        .sort((a, b) => a.id.localeCompare(b.id));
      return { code, band: errorCodeBand(code), records };
    })
    .sort((a, b) =>
      a.band === b.band ? a.code.localeCompare(b.code) : a.band.localeCompare(b.band),
    );
}

/**
 * The smallest free number of a band. The shape (prefix, digit width) comes
 * from a code that was actually found, not from the band label itself — that
 * carries a literal `x` for every masked position, and in a digit evaluation
 * it would only be a source of errors.
 */
function nextFreeInBand(codes: string[]): string | null {
  if (!codes.length) return null;
  const sample = codes[0].match(/^(\D*)(\d+)$/);
  if (!sample) return null;
  const [, prefix, digits] = sample;
  const width = digits.length;
  const restWidth = width - 1;
  const base = Number(digits[0]) * 10 ** restWidth;
  const max = base + 10 ** restWidth - 1;
  const used = new Set(codes.map((code) => Number(code.slice(prefix.length))));
  for (let n = base; n <= max; n += 1) {
    if (!used.has(n)) return `${prefix}${String(n).padStart(width, "0")}`;
  }
  return null;
}

/** Builds the grouped register from the records — the basis of `model.errorCodeRegister`. */
export function buildErrorCodeRegister(
  recs: FacetRecord[],
  pattern: RegExp = DEFAULT_ERROR_CODE_PATTERN,
): ErrorCodeRegister {
  const entries = extractErrorCodes(recs, pattern);

  const byBand = new Map<string, ErrorCodeEntry[]>();
  entries.forEach((entry) => {
    const list = byBand.get(entry.band) ?? [];
    list.push(entry);
    byBand.set(entry.band, list);
  });

  const bands: ErrorCodeBandGroup[] = [...byBand.entries()]
    .map(([band, codes]) => ({
      band,
      codes,
      nextFree: nextFreeInBand(codes.map((entry) => entry.code)),
    }))
    .sort((a, b) => a.band.localeCompare(b.band));

  return {
    pattern: pattern.source,
    entries,
    bands,
    collisions: entries.filter((entry) => entry.records.length > 1).map((entry) => entry.code),
  };
}

/** How a policy covers a core feature — `null` means: not at all. */
export function coverage(policy: FacetRecord, feature: FacetRecord): "direct" | "area" | null {
  const scope = asRecord(policy.scope);
  if (asArray<string>(scope.features).map(String).includes(feature.id)) return "direct";
  if (feature.relatedPolicies.includes(policy.id)) return "direct";
  if (asArray<string>(scope.domains).map(String).includes(feature.domain)) return "area";
  return null;
}
