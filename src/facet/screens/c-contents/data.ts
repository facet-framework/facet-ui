import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/facet/screens/c-contents/data";

import { registry } from "../../fixtures/registry";
import { createText, type FacetText } from "../../i18n/TextProvider";
import { SUMMARY } from "../../fixtures/summary";
import { PEOPLE, rng } from "../../fixtures/generate";
import type { FixtureFeature } from "../../fixtures/types";
import type {
  AnchorDir,
  AnchorRole,
  AnchorRow,
  CalibrationMetric,
  ContentKind,
  DayCount,
  Deviation,
  FileNode,
  FixCommit,
  GlossaryTerm,
  GlossaryTermDetail,
  GrantItem,
  KnowledgeRow,
  OpsEntry,
  Outlier,
  PluginRow,
  PromiseItem,
  PromiseRecord,
  PromiseState,
  RuleItem,
  TaxDomain,
  TeamProvenance,
  TestFileRow,
  TestKind,
} from "./model";

const F: FixtureFeature[] = registry.features.filter((f) => f.type === "feature");
export const NOW = registry.origin.generatedAt;

function scenarioStates(f: FixtureFeature): Map<string, PromiseState> {
  const mapped = (id: string) => f.tests.some((t) => t.proves.includes(id));
  const order = [...f.scenarios].sort((a, b) => Number(mapped(a.id)) - Number(mapped(b.id)));
  const open = new Set(
    order.slice(0, Math.max(0, f.scenarioCount - f.provenCount)).map((s) => s.id),
  );
  return new Map(f.scenarios.map((s) => [s.id, open.has(s.id) ? "open" : "proven"]));
}

const STATES = new Map(F.map((f) => [f.id, scenarioStates(f)]));
const stateOf = (f: FixtureFeature, id: string): PromiseState =>
  STATES.get(f.id)?.get(id) ?? "proven";

export const promiseItems: PromiseItem[] = F.flatMap((f) =>
  f.scenarios.map((s) => ({
    key: `${f.id}#${s.id}`,
    recordId: f.id,
    scenarioId: s.id,
    text: s.text,
    state: stateOf(f, s.id),
    tests: f.tests
      .filter((t) => t.proves.includes(s.id))
      .map((t) => ({ name: t.name, kind: t.kind })),
  })),
);

export const promiseRecords: PromiseRecord[] = F.map((f) => ({
  id: f.id,
  domain: f.domain,
  cells: f.scenarios.map((s) => ({ scenarioId: s.id, state: stateOf(f, s.id) })),
}));

export const promiseTotals = {
  total: SUMMARY.scenarios,
  proven: SUMMARY.proven,
  open: SUMMARY.open,
  deviating: 0,
  records: SUMMARY.features,
  listed: promiseItems.length,
  listedOpen: promiseItems.filter((i) => i.state === "open").length,
  listedProven: promiseItems.filter((i) => i.state === "proven").length,
};

export const openPromises = promiseItems.filter((i) => i.state !== "proven");

export const KNOW_SLOTS = [
  labelText.text202,
  localized.text3,
  labelText.text203,
  germanLabels.text15,
  labelText.text204,
];

export const knowledgeRows: KnowledgeRow[] = F.map((f) => ({
  id: f.id,
  domain: f.domain,
  slots: f.knowledge.map((k) => (k ? k.slice(0, 80) : null)),
}));

export const knowledgeOpenPerSlot = KNOW_SLOTS.map(
  (_, i) => knowledgeRows.filter((r) => r.slots[i] == null).length,
);
export const knowledgeTotals = {
  records: knowledgeRows.length,
  open: knowledgeOpenPerSlot.reduce((a, b) => a + b, 0),
  filled: knowledgeRows.length * 5 - knowledgeOpenPerSlot.reduce((a, b) => a + b, 0),
};

const observed = F.find((f) => f.observed)?.id ?? F[0].id;
export const opsEntries: OpsEntry[] = [
  {
    key: "o1",
    recordId: observed,
    kind: "SLO",
    name: localized.text4,
    target: "p95 ≤ 400 ms",
    window: "28 Tage",
    source: "observation.slo[0]",
  },
  {
    key: "o2",
    recordId: observed,
    kind: "SLO",
    name: "Index aktuell",
    target: "≤ 1 Commit hinter HEAD",
    window: labelText.text205,
    source: "observation.slo[1]",
  },
  {
    key: "o3",
    recordId: observed,
    kind: "Alert",
    name: labelText.text206,
    target: "> 3 in 10 min",
    source: "observation.alerts[0]",
  },
  {
    key: "o4",
    recordId: observed,
    kind: "Continuous check",
    name: localized.text5,
    target: germanLabels.text16,
    source: "observation.checks[0]",
  },
];

export const provenanceTeams: TeamProvenance[] = [
  ...new Set(F.map((f) => f.owner).filter(Boolean)),
].map((o) => {
  const list = F.filter((f) => f.owner === o);
  const doms = [...new Set(list.map((f) => f.domain))];
  return {
    id: o as string,
    name: o === "facet" ? "FACET Kern" : o === "infra" ? labelText.text207 : (o as string),
    purpose: o === "facet" ? localized.text6 : localized.text7,
    records: list.length,
    proven: list.filter((f) => f.scenarioCount > 0 && f.provenCount === f.scenarioCount).length,
    domains: doms
      .map((d) => ({ id: d, records: list.filter((f) => f.domain === d).length }))
      .sort((a, b) => b.records - a.records),
    recent: [...list]
      .filter((f) => f.createdAt)
      .sort((a, b) => (b.createdAt as string).localeCompare(a.createdAt as string))
      .slice(0, 3)
      .map((f) => ({ id: f.id, date: f.createdAt as string })),
  };
});
export const provenanceUnowned = F.filter((f) => !f.owner).length;

const dated = F.filter((f) => f.createdAt);
export const provenanceDays: DayCount[] = [...new Set(dated.map((f) => f.createdAt as string))]
  .sort()
  .map((d) => {
    const ids = dated.filter((f) => f.createdAt === d).map((f) => f.id);
    return { date: d, count: ids.length, ids };
  });
export const provenanceRange = {
  from: provenanceDays[0]?.date ?? "",
  to: provenanceDays.at(-1)?.date ?? "",
};
const MONTHS = [
  "Jan",
  "Feb",
  localized.text8,
  "Apr",
  labelText.text208,
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  labelText.text209,
  "Nov",
  labelText.text210,
];
export const provenanceMonths = [...new Set(provenanceDays.map((d) => d.date.slice(0, 7)))].map(
  (m) => ({
    key: m,
    label: `${MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`,
    count: provenanceDays.filter((d) => d.date.startsWith(m)).reduce((a, d) => a + d.count, 0),
  }),
);
export const provenanceUndated = F.length - dated.length;

export const taxonomy: TaxDomain[] = registry.domains.map((d) => ({
  id: d.id,
  title: d.title,
  purpose: d.purpose,
  klass: d.class,
  team: d.team,
  capabilities: d.capabilities.map((c) => {
    const list = F.filter((f) => f.domain === d.id && f.capability === c.id);
    return {
      id: `${d.id}/${c.id}`,
      title: c.title,
      records: list.length,
      proven: list.filter((f) => f.scenarioCount > 0 && f.provenCount === f.scenarioCount).length,
      scenarios: list.reduce((a, f) => a + f.scenarioCount, 0),
    };
  }),
}));

const LABELS: Record<string, [string, string]> = {
  "scenarios per record": [localized.text9, "Promises"],
  "records per capability": [localized.text11, "Records"],
  "capabilities per domain": [localized.text12, remainingText.text106],
  "records per anchored file": [labelText.text211, "Records"],
};
const capCounts = taxonomy.flatMap((d) => d.capabilities.map((c) => ({ id: c.id, v: c.records })));
const VALUES: Record<string, { id: string; v: number }[]> = {
  "scenarios per record": F.map((f) => ({ id: f.id, v: f.scenarioCount })),
  "records per capability": capCounts,
  "capabilities per domain": taxonomy.map((d) => ({ id: d.id, v: d.capabilities.length })),
};
export const calibration: CalibrationMetric[] = registry.calibration.map((m) => ({
  key: m.name,
  label: LABELS[m.name]?.[0] ?? m.name,
  unit: LABELS[m.name]?.[1] ?? "",
  median: m.median,
  min: m.min,
  max: m.max,
  samples: m.samples,
  below: m.below,
  above: m.above,
  band: m.band,
  values: VALUES[m.name]?.map((x) => x.v),
}));
export const outliers: Outlier[] = registry.calibration.flatMap((m) =>
  (VALUES[m.name] ?? [])
    .filter((x) => x.v > m.band.high || x.v < m.band.low)
    .sort((a, b) => b.v - a.v)
    .map((x) => ({
      metric: m.name,
      id: x.id,
      value: x.v,
      side: x.v > m.band.high ? "above" : ("below" as const),
      band: `${m.band.low}–${m.band.high}`,
    })),
);

const testMap = new Map<string, TestFileRow & { names: Set<string>; proves: Set<string> }>();
F.forEach((f) =>
  f.tests.forEach((t) => {
    const path = t.name.split("::")[0].split(" ")[0];
    const row = testMap.get(path) ?? {
      path,
      kind: t.kind as TestKind,
      tests: 0,
      promises: 0,
      records: [],
      names: new Set(),
      proves: new Set(),
    };
    row.names.add(t.name);
    t.proves.forEach((p) => row.proves.add(`${f.id}#${p}`));
    if (!row.records.includes(f.id)) row.records.push(f.id);
    testMap.set(path, row);
  }),
);
export const testFiles: TestFileRow[] = [...testMap.values()]
  .map(({ names, proves, ...r }) => ({ ...r, tests: names.size, promises: proves.size }))
  .sort((a, b) => b.promises - a.promises);
export const testKinds = (["Unit", "Integration", "E2E"] as TestKind[]).map((k) => {
  const files = testFiles.filter((f) => f.kind === k);
  return {
    kind: k,
    tests: files.reduce((a, f) => a + f.tests, 0),
    files: files.length,
    promises: files.reduce((a, f) => a + f.promises, 0),
  };
});
export const testRunners = registry.runners.map((r) => ({
  id: r.id,
  cwd: r.cwd,
  command: r.command,
  report: r.bericht,
}));

export const deviations: Deviation[] = promiseItems.slice(40, 44).map((p, i) => ({
  key: p.key,
  recordId: p.recordId,
  scenarioId: p.scenarioId,
  then: [localized.text14, localized.text15, localized.text16, localized.text17][i],
  reason: [localized.text18, localized.text19, localized.text20, localized.text21][i],
  confirmedBy: i === 2 ? null : PEOPLE[i].name,
  since: ["2026-09-14", "2026-10-02", "2026-10-21", "2026-11-04"][i],
}));

const fixMap = new Map<string, FixCommit>();
F.forEach((f) =>
  f.log
    .filter((c) => /^fix/.test(c.subject))
    .forEach((c) => {
      const prev = fixMap.get(c.sha);
      if (prev) {
        if (!prev.records.includes(f.id)) prev.records.push(f.id);
        return;
      }
      const m = /^fix(?:\(([^)]+)\))?:\s*(?:(#\d+)\s*—\s*)?(.*)$/.exec(c.subject);
      fixMap.set(c.sha, {
        sha: c.sha,
        date: c.date,
        scope: m?.[1] ?? null,
        ticket: m?.[2] ?? null,
        subject: (m?.[3] ?? c.subject).replace(/\s*\(#\d+\)$/, ""),
        records: [f.id],
        domain: f.domain,
      });
    }),
);
export const fixes: FixCommit[] = [...fixMap.values()].sort((a, b) => b.date.localeCompare(a.date));

export const anchorRows: AnchorRow[] = F.flatMap((f) =>
  f.anchors.map((a) => ({
    path: a.path,
    line: a.line,
    role: (a.role || "none") as AnchorRole,
    recordId: f.id,
  })),
).sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);

const dirKey = (p: string) => {
  const parts = p.split("/");
  return parts.length > 2 ? parts.slice(0, 2).join("/") : parts.length === 2 ? parts[0] : ".";
};
export const anchorDirs: AnchorDir[] = [...new Set(anchorRows.map((a) => dirKey(a.path)))]
  .map((d) => {
    const rows = anchorRows.filter((a) => dirKey(a.path) === d);
    return {
      path: d,
      anchors: rows.length,
      files: new Set(rows.map((r) => r.path)).size,
      records: new Set(rows.map((r) => r.recordId)).size,
    };
  })
  .sort((a, b) => b.anchors - a.anchors);
export const anchorRoles = (["primary", "related", "config", "data", "none"] as AnchorRole[]).map(
  (r) => ({
    role: r,
    count: anchorRows.filter((a) => a.role === r).length,
  }),
);

const anchoredFiles = [...new Set(anchorRows.map((a) => a.path))];
const hotDirPct = new Map(registry.hotspots.map((h) => [h.dir, h.dirAnchoredPct]));
function buildTree(paths: string[], prefix: string, depth: number): FileNode[] {
  const heads = [...new Set(paths.map((p) => p.split("/")[0]))];
  return heads
    .map((h) => {
      const under = paths.filter((p) => p.split("/")[0] === h);
      const full = prefix ? `${prefix}/${h}` : h;
      const rest = under.map((p) => p.split("/").slice(1).join("/")).filter(Boolean);
      const isDir = rest.length > 0;
      const pctv = hotDirPct.get(full);
      return {
        path: full,
        name: h,
        anchored: isDir ? rest.length : 1,
        share: isDir ? (pctv != null ? pctv / 100 : null) : 1,
        children: isDir && depth < 3 ? buildTree(rest, full, depth + 1) : undefined,
      };
    })
    .sort((a, b) => b.anchored - a.anchored);
}
export const fileTree: FileNode[] = buildTree(anchoredFiles, "", 0);
export const fileScan = {
  files: registry.scan.files,
  anchored: registry.scan.verankert,
  unanchored: registry.scan.unverankert,
  loc: registry.scan.loc,
};
export const fileGaps = registry.hotspots.map((h) => ({
  path: h.path,
  loc: h.loc,
  dir: h.dir,
  dirAnchoredPct: h.dirAnchoredPct,
}));

const ids = F.map((f) => f.id);
export const rules: RuleItem[] = [
  {
    id: "policy/registry/every-record-has-a-test",
    title: localized.text24,
    statement: localized.text25,
    strength: "must",
    appliesTo: ids.filter((i) => i.startsWith("registry/")),
    source: "docs/facets/policies/tests.yaml",
    violations: 3,
  },
  {
    id: "policy/authoring/hooks-have-twins",
    title: localized.text26,
    statement: localized.text27,
    strength: "must",
    appliesTo: ids.filter((i) => i.startsWith("authoring/")),
    source: "docs/facets/policies/hooks.yaml",
    violations: 0,
  },
  {
    id: "policy/navigation/testid-not-class",
    title: localized.text28,
    statement: localized.text29,
    strength: "should",
    appliesTo: ids.filter((i) => i.startsWith("navigation/")),
    source: "docs/facets/policies/ui-tests.yaml",
    violations: 7,
  },
  {
    id: "policy/delivery/pinned-checksums",
    title: localized.text30,
    statement: localized.text31,
    strength: "must",
    appliesTo: ids.filter((i) => i.startsWith("delivery/")),
    source: "docs/facets/policies/supply.yaml",
    violations: 0,
  },
  {
    id: "policy/adr/no-net-fetch",
    title: localized.text32,
    statement: localized.text33,
    strength: "must",
    appliesTo: ids.filter((i) => i.startsWith("adr/")),
    source: "docs/facets/policies/plugins.yaml",
    violations: 0,
  },
];

export const glossaryCategories = [
  germanLabels.text17,
  localized.text34,
  localized.text35,
  labelText.text69,
];

const BASE_TERMS: [string, string, string, string?][] = [
  [labelText.text79, localized.text36, localized.text37],
  ["Agent", germanLabels.text17, localized.text38],
  [germanLabels.text18, germanLabels.text17, localized.text39, labelText.text78],
  [labelText.text212, germanLabels.text17, localized.text40],
  [germanLabels.text19, germanLabels.text17, localized.text41],
  ["Atlas", localized.text42, localized.text43],
  ["Area", germanLabels.text17, localized.text45, localized.text46],
  ["Evidence", localized.text47, localized.text48],
  ["Blueprint", labelText.text69, localized.text49],
  ["Commit-Gate", localized.text50, localized.text51],
  ["Continuous check", localized.text52, localized.text53],
  [labelText.text100, germanLabels.text17, localized.text54, "ADR"],
  [labelText.text204, germanLabels.text17, localized.text55],
  [labelText.text98, localized.text56, localized.text57],
  [germanLabels.text20, germanLabels.text17, localized.text58],
  ["Category", germanLabels.text17, localized.text60, localized.text61],
  [labelText.text213, localized.text62, localized.text63],
  [labelText.text76, localized.text64, localized.text65],
  ["Lint", localized.text66, localized.text67],
  [germanLabels.text21, germanLabels.text17, localized.text68, "Feature"],
  ["Plugin", labelText.text69, localized.text69],
  ["Record", germanLabels.text17, localized.text70, localized.text71],
  ["Registry", germanLabels.text17, localized.text72],
  [labelText.text214, localized.text73, localized.text74, "Policy"],
  ["Sidecar", labelText.text69, localized.text75],
  [germanLabels.text22, germanLabels.text17, localized.text76],
  [labelText.text184, germanLabels.text17, localized.text77],
  [germanLabels.text4, localized.text78, localized.text79, "Drift"],
  [remainingText.text16, germanLabels.text17, localized.text80],
  [germanLabels.text23, germanLabels.text17, localized.text81, germanLabels.text22],
];

const COMPOUNDS: [string, string, (b: string) => string][] = [
  [localized.text82, localized.text83, (b) => `${localized.text84}${b}${localized.text85}`],
  ["list", localized.text86, (b) => `${localized.text87}${b}“ in Atlas.`],
  [localized.text88, localized.text89, (b) => `${localized.text90}${b}“ gemessen wurden.`],
  ["schema", localized.text91, (b) => `${localized.text92}${b}“ validiert.`],
  ["history", germanLabels.text17, (b) => `${localized.text93}${b}${localized.text94}`],
  [labelText.text215, localized.text95, (b) => `${localized.text96}${b}${localized.text97}`],
  ["export", labelText.text69, (b) => `${localized.text98}${b}${localized.text99}`],
  [labelText.text216, labelText.text69, (b) => `${localized.text100}${b}${localized.text101}`],
  [labelText.text217, localized.text102, (b) => `${localized.text103}${b}${localized.text104}`],
  [germanLabels.text24, localized.text105, (b) => `${localized.text106}${b}${localized.text107}`],
];

export function makeTerms(n: number, seed = 23): GlossaryTerm[] {
  const r = rng(seed);
  const out: GlossaryTerm[] = [];
  for (let i = 0; i < n; i++) {
    const [b, cat, def, alias] = BASE_TERMS[i % BASE_TERMS.length];
    const round = Math.floor(i / BASE_TERMS.length);
    const compound = round > 0 ? COMPOUNDS[(round - 1 + i) % COMPOUNDS.length] : null;
    out.push({
      term: compound ? `${b}-${compound[0][0].toUpperCase()}${compound[0].slice(1)}` : b,
      definition: compound ? compound[2](b) : def,
      category: compound ? compound[1] : cat,
      aliases: !compound && alias ? [alias] : [],
      records: compound ? Math.floor(r() * 18) : 3 + Math.floor(r() * 60),
      status: r() < 0.9 ? "settled" : "proposed",
    });
  }
  return out.sort((a, b) => a.term.localeCompare(b.term, "de"));
}

export const glossary300: GlossaryTerm[] = makeTerms(300);
export const glossary40: GlossaryTerm[] = makeTerms(40);
export const lettersOf = (terms: GlossaryTerm[]) =>
  [...new Set(terms.map((t) => t.term[0].toUpperCase()))].map((l) => ({
    letter: l,
    count: terms.filter((t) => t.term[0].toUpperCase() === l).length,
  }));

export const termDetail: GlossaryTermDetail = {
  ...(glossary40.find((t) => t.term === germanLabels.text4) ?? glossary40[0]),
  term: germanLabels.text4,
  definition: localized.text108,
  status: "settled",
  aliases: ["Drift"],
  translation: "drift",
  recordIds: [...new Set(registry.drift.map((d) => d.id))].slice(0, 6),
  records: new Set(registry.drift.map((d) => d.id)).size,
  occurrences: registry.drift.slice(0, 3).map((d, i) => ({
    path: d.path,
    line: 12 + i * 31,
    excerpt: [localized.text109, localized.text110, localized.text111][i],
  })),
  related: [germanLabels.text18, "Record", germanLabels.text21],
  history: [
    { date: "2026-10-12", who: "Mira Albers", change: localized.text112 },
    { date: "2026-08-03", who: "Jonas Kettler", change: germanLabels.text25 },
    { date: "2026-07-26", who: "Jonas Kettler", change: "proposed" },
  ],
};

export const plugins: PluginRow[] = [
  {
    id: "adr",
    name: "Decisions",
    version: "2.9.0",
    source: "bundled",
    enabled: true,
    verification: "ok",
    open: 0,
    desc: remainingText.text107,
  },
  {
    id: "bpmn",
    name: germanLabels.text26,
    version: "0.8.1",
    source: "installed",
    enabled: true,
    verification: "ok",
    open: 2,
    desc: localized.text114,
  },
  {
    id: "jira-sync",
    name: remainingText.text108,
    version: "0.3.0",
    source: "development",
    enabled: false,
    verification: "missing",
    open: 3,
    desc: localized.text116,
  },
];

export const grantItems: GrantItem[] = [
  {
    key: "g1",
    group: "Tools",
    name: "repo.state",
    via: "Host",
    why: localized.text117,
    state: "granted",
    risk: "reads",
  },
  {
    key: "g2",
    group: "Tools",
    name: "repo.branch",
    via: "Host",
    why: localized.text120,
    state: "granted",
    risk: "writes",
  },
  {
    key: "g3",
    group: "Tools",
    name: "repo.commit",
    via: "Host",
    why: localized.text122,
    state: "open",
    risk: "writes",
  },
  {
    key: "g4",
    group: "Tools",
    name: "bpmn.parse",
    via: "Sidecar bpmn (sha256 3f9c…)",
    why: localized.text124,
    state: "granted",
    risk: "reads",
  },
  {
    key: "g5",
    group: "Environment",
    name: "BPMN_MAX_SHAPES",
    via: "Sidecar bpmn",
    why: localized.text127,
    state: "granted",
  },
  {
    key: "g6",
    group: "Agent tools",
    name: "bpmn.elements",
    via: "Sidecar bpmn",
    why: germanLabels.text27,
    state: "open",
    risk: "reads",
  },
];

const spark = (seed: number, n = 12) => {
  const r = rng(seed);
  return Array.from({ length: n }, () => Math.round(r() * 10));
};

export const contentKindsFor = (t: FacetText["t"]): ContentKind[] => [
  {
    key: "promises",
    label: t("c.hub.k.promises.label"),
    group: "Registry",
    icon: "promise",
    desc: t("c.hub.k.promises.desc"),
    count: promiseTotals.total,
    unit: t("c.hub.k.promises.unit"),
    finding: t("c.hub.k.promises.finding", { count: promiseTotals.open }),
    tone: "warn",
    share: promiseTotals.proven / promiseTotals.total,
    views: [
      { id: "list", label: t("c.hub.k.promises.view.list") },
      { id: "mosaic", label: t("c.hub.k.promises.view.mosaic") },
      { id: "openFirst", label: t("c.hub.k.promises.view.openFirst") },
    ],
  },
  {
    key: "knowledge",
    label: t("c.hub.k.knowledge.label"),
    group: "Registry",
    icon: "knowledge",
    desc: t("c.hub.k.knowledge.desc"),
    count: knowledgeTotals.open,
    unit: t("c.hub.k.knowledge.unit"),
    finding: t("c.hub.k.knowledge.finding", {
      percent: Math.round(
        (knowledgeTotals.filled / (knowledgeTotals.filled + knowledgeTotals.open)) * 100,
      ),
    }),
    tone: "warn",
    share: knowledgeTotals.filled / (knowledgeTotals.filled + knowledgeTotals.open),
    views: [
      { id: "matrix", label: t("c.hub.k.knowledge.view.matrix") },
      { id: "openQuestions", label: t("c.hub.k.knowledge.view.openQuestions") },
    ],
  },
  {
    key: "operations",
    label: t("c.hub.k.operations.label"),
    group: "Registry",
    icon: "ops",
    desc: t("c.hub.k.operations.desc"),
    count: F.filter((f) => f.observed).length,
    unit: t("c.hub.k.operations.unit"),
    finding: t("c.hub.k.operations.finding"),
    views: [{ id: "list", label: t("c.hub.k.operations.view.list") }],
  },
  {
    key: "origin",
    label: t("c.hub.k.provenance.label"),
    group: "Registry",
    icon: "team",
    desc: t("c.hub.k.provenance.desc"),
    count: provenanceTeams.length,
    unit: t("c.hub.k.provenance.unit"),
    finding: provenanceUnowned
      ? t("c.hub.k.provenance.finding", { count: provenanceUnowned })
      : undefined,
    tone: provenanceUnowned ? "warn" : undefined,
    spark: provenanceMonths.map((m) => m.count),
    views: [
      { id: "team", label: t("c.hub.k.provenance.view.team") },
      { id: "calendar", label: t("c.hub.k.provenance.view.calendar") },
    ],
  },
  {
    key: "taxonomy",
    label: t("c.hub.k.taxonomy.label"),
    group: "Registry",
    icon: "taxonomy",
    desc: t("c.hub.k.taxonomy.desc"),
    count: taxonomy.length,
    unit: t("c.hub.k.taxonomy.unit", {
      caps: taxonomy.reduce((a, d) => a + d.capabilities.length, 0),
    }),
    views: [
      { id: "tree", label: t("c.hub.k.taxonomy.view.tree") },
      { id: "sun", label: t("c.hub.k.taxonomy.view.sun") },
    ],
  },
  {
    key: "calibration",
    label: t("c.hub.k.calibration.label"),
    group: "Registry",
    icon: "calibrate",
    desc: t("c.hub.k.calibration.desc"),
    count: calibration.length,
    unit: t("c.hub.k.calibration.unit"),
    finding: t("c.hub.k.calibration.finding", { count: outliers.length }),
    tone: "warn",
    views: [
      { id: "bands", label: t("c.hub.k.calibration.view.bands") },
      { id: "outliers", label: t("c.hub.k.calibration.view.outliers") },
    ],
  },
  {
    key: "tests",
    label: t("c.hub.k.tests.label"),
    group: "Evidence",
    icon: "test",
    desc: t("c.hub.k.tests.desc"),
    count: testKinds.reduce((a, k) => a + k.tests, 0),
    unit: t("c.hub.k.tests.unit"),
    finding: t("c.hub.k.tests.finding", { count: testFiles.length }),
    spark: spark(3),
    views: [
      { id: "pyramid", label: t("c.hub.k.tests.view.pyramid") },
      { id: "tree", label: t("c.hub.k.tests.view.tree") },
      { id: "table", label: t("c.hub.k.tests.view.table") },
    ],
  },
  {
    key: "deviations",
    label: t("c.hub.k.deviations.label"),
    group: "Evidence",
    icon: "error",
    desc: t("c.hub.k.deviations.desc"),
    count: 0,
    unit: t("c.hub.k.deviations.unit"),
    finding: t("c.hub.k.deviations.finding"),
    tone: "ok",
    views: [{ id: "list", label: t("c.hub.k.deviations.view.list") }],
  },
  {
    key: "drift",
    label: t("c.hub.k.drift.label"),
    group: "Evidence",
    icon: "drift",
    desc: t("c.hub.k.drift.desc"),
    count: registry.drift.length,
    unit: t("c.hub.k.drift.unit"),
    finding: t("c.hub.k.drift.finding", {
      count: new Set(registry.drift.map((d) => d.id)).size,
    }),
    tone: "warn",
    views: [
      { id: "byRecord", label: t("c.hub.k.drift.view.byRecord") },
      { id: "timeline", label: t("c.hub.k.drift.view.timeline") },
    ],
  },
  {
    key: "fixed",
    label: t("c.hub.k.fixed.label"),
    group: "Evidence",
    icon: "fixed",
    desc: t("c.hub.k.fixed.desc"),
    count: fixes.length,
    unit: t("c.hub.k.fixed.unit"),
    spark: spark(9),
    views: [
      { id: "timeline", label: t("c.hub.k.fixed.view.timeline") },
      { id: "area", label: t("c.hub.k.fixed.view.area") },
    ],
  },
  {
    key: "anchor",
    label: t("c.hub.k.anchors.label"),
    group: "Code",
    icon: "anchor",
    desc: t("c.hub.k.anchors.desc"),
    count: anchorRows.length,
    unit: t("c.hub.k.anchors.unit"),
    finding: t("c.hub.k.anchors.finding", { count: anchorDirs.length }),
    views: [
      { id: "treemap", label: t("c.hub.k.anchors.view.treemap") },
      { id: "table", label: t("c.hub.k.anchors.view.table") },
    ],
  },
  {
    key: "files",
    label: t("c.hub.k.files.label"),
    group: "Code",
    icon: "file",
    desc: t("c.hub.k.files.desc"),
    count: fileScan.files,
    unit: t("c.hub.k.files.unit"),
    finding: t("c.hub.k.files.finding", {
      percent: Math.round((fileScan.anchored / fileScan.files) * 100),
    }),
    tone: "warn",
    share: fileScan.anchored / fileScan.files,
    views: [
      { id: "tree", label: t("c.hub.k.files.view.tree") },
      { id: "gaps", label: t("c.hub.k.files.view.gaps") },
    ],
  },
  {
    key: "rules",
    label: t("c.hub.k.rules.label"),
    group: "Context",
    icon: "rule",
    desc: t("c.hub.k.rules.desc"),
    count: 0,
    unit: t("c.hub.k.rules.unit"),
    finding: t("c.hub.k.rules.finding"),
    views: [{ id: "list", label: t("c.hub.k.rules.view.list") }],
  },
  {
    key: "glossary",
    label: t("c.hub.k.glossary.label"),
    group: "Context",
    icon: "book",
    desc: t("c.hub.k.glossary.desc"),
    count: null,
    unit: t("c.hub.k.glossary.unit"),
    finding: t("c.hub.k.glossary.finding"),
    views: [{ id: "az", label: t("c.hub.k.glossary.view.az") }],
  },
];

export const hubHeadlineFor = (t: FacetText["t"]) => ({
  records: F.length,
  open: promiseTotals.open + knowledgeTotals.open + registry.drift.length,
  sentence: t("c.hub.sentence", { kinds: contentKindsFor(t).length, records: F.length }),
});

const german = createText("de").t;
export const contentKinds = contentKindsFor(german);
export const hubHeadline = hubHeadlineFor(german);
