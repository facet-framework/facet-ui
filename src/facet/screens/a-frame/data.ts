import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/facet/screens/a-frame/data";

import { registry } from "../../fixtures/registry";
import { makeFeatures, rng, TEAMS } from "../../fixtures/generate";
import type { HistoryEntry, TopBarStats } from "../../shell/Shell";
import { TOP_STATS } from "../../fixtures/summary";
import type {
  AdrView,
  CalibrationView,
  CommitView,
  DomainView,
  DriftView,
  FeatureView,
  OverviewModel,
  OwnerView,
  TrendPoint,
} from "./model";

const CALIBRATION_LABEL: Record<string, string> = {
  "scenarios per record": labelText.text254,
  "records per capability": localized.text1,
  "capabilities per domain": localized.text2,
  "records per anchored file": labelText.text211,
};

export const DOMAINS: DomainView[] = registry.domains.map((d) => ({
  id: d.id,
  title: d.title,
  purpose: d.purpose,
  cls: d.class,
  team: d.team,
  capabilities: d.capabilities.map((c) => ({
    id: c.id,
    title: c.title,
    purpose: c.purpose,
    cls: c.class,
  })),
}));

export const FEATURES: FeatureView[] = registry.features.map((f) => ({
  id: f.id,
  slug: f.slug,
  domain: f.domain,
  capability: f.capability,
  summary: f.summary,
  type: f.type === "assumption" ? "assumption" : "feature",
  lifecycle: f.lifecycle as FeatureView["lifecycle"],
  owner: f.owner,
  createdAt: f.createdAt,
  scenarios: f.scenarioCount,
  proven: f.provenCount,
  anchors: f.anchorCount,
  tests: f.tests.length,
  drift: registry.drift.filter((d) => d.id === f.id).length,
  knowledgeOpen: f.knowledgeOpen,
  knowledgeSlots: f.knowledge.map((k) => k !== ""),
  mosaic: Array.from({ length: f.scenarioCount }, (_, i) => i < f.provenCount),
  changedAt: f.log[0]?.date,
}));

export const DRIFT: DriftView[] = registry.drift.map((d) => ({
  path: d.path,
  record: d.id,
  changedAt: d.changedAt.slice(0, 10),
}));

export const CALIBRATION: CalibrationView[] = registry.calibration.map((c) => ({
  key: c.name,
  label: CALIBRATION_LABEL[c.name] ?? c.name,
  median: c.median,
  low: c.band.low,
  high: c.band.high,
  min: c.min,
  max: c.max,
  samples: c.samples,
  below: c.below,
  above: c.above,
}));

export const ADRS: AdrView[] = registry.adrs.map((a) => ({
  file: a.file,
  title: a.title,
  status: a.status,
  date: a.date,
  refs: a.refs,
}));

export const RECENT: CommitView[] = registry.features
  .flatMap((f) => f.log.map((c) => ({ ...c, record: f.id })))
  .sort((a, b) => b.date.localeCompare(a.date))
  .filter((c, i, all) => all.findIndex((o) => o.sha === c.sha) === i)
  .slice(0, 40);

export const DOMAIN_LINKS: { from: string; to: string; count: number; examples: string[] }[] =
  (() => {
    const byId = new Map(registry.features.map((f) => [f.id, f]));
    const acc = new Map<string, { from: string; to: string; count: number; examples: string[] }>();
    for (const f of registry.features) {
      for (const dep of f.dependsOn) {
        const t = byId.get(dep);
        if (!t || t.domain === f.domain) continue;
        const k = `${f.domain}>${t.domain}`;
        const e = acc.get(k) ?? { from: f.domain, to: t.domain, count: 0, examples: [] };
        e.count += 1;
        if (e.examples.length < 3) e.examples.push(`${f.id} → ${dep}`);
        acc.set(k, e);
      }
    }
    return [...acc.values()].sort((a, b) => b.count - a.count);
  })();

function testMix() {
  let unit = 0;
  let integration = 0;
  let e2e = 0;
  for (const f of registry.features)
    for (const t of f.tests) {
      if (t.kind === "Unit") unit += 1;
      else if (t.kind === "Integration") integration += 1;
      else e2e += 1;
    }
  return { unit, integration, e2e };
}

function trend(features: FeatureView[]): TrendPoint[] {
  const dated = features
    .filter((f) => f.createdAt)
    .sort((a, b) => a.createdAt!.localeCompare(b.createdAt!));
  const out: TrendPoint[] = [];
  let s = 0;
  let p = 0;
  let week = "";
  for (const f of dated) {
    const d = new Date(f.createdAt + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    const w = d.toISOString().slice(0, 10);
    s += f.scenarios;
    p += f.proven;
    if (w !== week) {
      out.push({ date: w, scenarios: s, proven: p });
      week = w;
    } else {
      out[out.length - 1] = { date: w, scenarios: s, proven: p };
    }
  }
  return out;
}

function owners(features: FeatureView[]): OwnerView[] {
  const m = new Map<string, OwnerView>();
  for (const f of features) {
    if (!f.owner) continue;
    const o = m.get(f.owner) ?? { team: f.owner, records: 0, scenarios: 0, proven: 0 };
    o.records += 1;
    o.scenarios += f.scenarios;
    o.proven += f.proven;
    m.set(f.owner, o);
  }
  return [...m.values()].sort((a, b) => b.records - a.records);
}

export function overviewModel(features: FeatureView[] = FEATURES): OverviewModel {
  const domains = DOMAINS.map((d) => {
    const fs = features.filter((f) => f.domain === d.id);
    return {
      ...d,
      features: fs.length,
      scenarios: fs.reduce((a, f) => a + f.scenarios, 0),
      proven: fs.reduce((a, f) => a + f.proven, 0),
      drift: DRIFT.filter((x) => x.record.startsWith(d.id + "/")).length,
      knowledgeOpen: fs.reduce((a, f) => a + f.knowledgeOpen, 0),
    };
  });
  return {
    project: {
      name: "core",
      branch: registry.origin.branch,
      commit: registry.origin.commit.slice(0, 8),
      generatedAt: registry.origin.generatedAt.slice(0, 16).replace("T", " "),
      version: registry.origin.facetVersion,
    },
    totals: {
      records: features.length,
      features: features.filter((f) => f.type === "feature").length,
      assumptions: features.filter((f) => f.type === "assumption").length,
      domains: DOMAINS.length,
      capabilities: DOMAINS.reduce((a, d) => a + d.capabilities.length, 0),
      scenarios: features.reduce((a, f) => a + f.scenarios, 0),
      proven: features.reduce((a, f) => a + f.proven, 0),
      anchors: features.reduce((a, f) => a + f.anchors, 0),
      files: registry.scan.files,
      anchoredFiles: registry.scan.verankert,
      loc: registry.scan.loc,
    },
    domains,
    features,
    drift: DRIFT,
    calibration: CALIBRATION,
    tests: testMix(),
    trend: trend(features),
    recent: RECENT,
    adrs: ADRS,
    owners: owners(features),
    unowned: features.filter((f) => !f.owner).length,
    tools: [
      {
        name: "feature_find",
        purpose: localized.text3,
        calls: null,
      },
      { name: "feature_get", purpose: localized.text4, calls: null },
      { name: "anchor_resolve", purpose: localized.text5, calls: null },
      { name: "registry_validate", purpose: localized.text6, calls: null },
      { name: "rag_query", purpose: localized.text7, calls: null },
      { name: "glossary_get", purpose: localized.text8, calls: null },
    ],
    ...roleSurfaces(features),
  };
}

function roleSurfaces(features: FeatureView[]): Partial<OverviewModel> {
  const drifted = new Set(DRIFT.map((d) => d.record));
  const byId = new Map(features.map((f) => [f.id, f]));
  const open = [...drifted]
    .map((id) => byId.get(id))
    .filter((f): f is FeatureView => !!f && f.proven < f.scenarios);
  const first = features.find((f) => f.scenarios > 0) ?? features[0];
  return {
    driftUnproven: open.flatMap((f) =>
      Array.from({ length: f.scenarios - f.proven }, (_, i) => ({
        record: f.id,
        scenario: `${f.slug}-${i + 1}`,
        then: `${f.summary.split(".")[0]} (${i + 1})`,
      })),
    ),
    deviations: first
      ? [
          {
            record: first.id,
            scenario: `${first.slug}-known-defect`,
            then: localized.text9,
            reason: localized.text10,
          },
        ]
      : [],
    fixes: features.slice(0, 2).map((f, i) => ({
      record: f.id,
      subject: `fix: ${f.slug}${localized.text11}`,
      date: `2026-10-0${i + 1}`,
    })),
    reach: features.slice(0, 4).map((f, i) => ({ record: f.id, team: f.owner, dependents: 4 - i })),
    faq: features.slice(0, 3).map((f) => ({
      record: f.id,
      slot: "prerequisite_knowledge",
      question: `${labelText.text260}${f.slug}${remainingText.text120}`,
      answer: f.summary,
    })),
    endpoints: [
      { method: "GET", path: "/api/corpus", purpose: germanLabels.text98 },
      { method: "GET", path: "/api/rag", purpose: localized.text12 },
    ],
  };
}

export function allProven(m: OverviewModel): OverviewModel {
  const features = m.features.map((f) => ({
    ...f,
    proven: f.scenarios,
    drift: 0,
    knowledgeOpen: 0,
    tests: Math.max(1, f.tests),
    owner: f.owner ?? "core",
    lifecycle: f.lifecycle === "planned" ? ("active" as const) : f.lifecycle,
    mosaic: f.mosaic?.map(() => true),
  }));
  return {
    ...m,
    features,
    owners: owners(features),
    unowned: 0,
    calibration: m.calibration.map((c) => ({ ...c, below: 0, above: 0 })),
    totals: { ...m.totals, proven: m.totals.scenarios },
    domains: m.domains.map((d) => ({ ...d, proven: d.scenarios, drift: 0, knowledgeOpen: 0 })),
    drift: [],
    trend: m.trend.map((t) => ({ ...t, proven: t.scenarios })),
  };
}

export function noDrift(m: OverviewModel): OverviewModel {
  return {
    ...m,
    drift: [],
    features: m.features.map((f) => ({ ...f, drift: 0 })),
    domains: m.domains.map((d) => ({ ...d, drift: 0 })),
  };
}

export function manyDrift(m: OverviewModel, n = 140): OverviewModel {
  const r = rng(29);
  const dirs = [
    "packages/task",
    "internal/ui",
    "packages/answer",
    "apps/sidebar-presence/src/v2",
    "scripts",
    "cmd/facet",
    "official-plugins/adr/src",
  ];
  const exts = [".go", ".ts", ".tsx", ".sh"];
  const drift: DriftView[] = Array.from({ length: n }, (_, i) => {
    const f = m.features[Math.floor(r() * m.features.length)];
    const day = 1 + Math.floor(r() * 12);
    return {
      path: `${dirs[i % dirs.length]}/${f.slug}${i % 3 ? "_" + (i % 7) : ""}${exts[i % exts.length]}`,
      record: f.id,
      changedAt: `2026-11-${String(day).padStart(2, "0")}`,
    };
  });
  return { ...m, drift: drift.sort((a, b) => b.changedAt.localeCompare(a.changedAt)) };
}

export function noTests(m: OverviewModel): OverviewModel {
  return {
    ...m,
    tests: { unit: 0, integration: 0, e2e: 0 },
    totals: { ...m.totals, proven: 0 },
    features: m.features.map((f) => ({
      ...f,
      proven: 0,
      tests: 0,
      mosaic: f.mosaic?.map(() => false),
    })),
    domains: m.domains.map((d) => ({ ...d, proven: 0 })),
    trend: m.trend.map((t) => ({ ...t, proven: 0 })),
  };
}

export function allFilled(m: OverviewModel): OverviewModel {
  return {
    ...m,
    features: m.features.map((f) => ({
      ...f,
      knowledgeOpen: 0,
      knowledgeSlots: f.knowledgeSlots?.map(() => true),
    })),
    domains: m.domains.map((d) => ({ ...d, knowledgeOpen: 0 })),
  };
}

export function oneTeam(m: OverviewModel): OverviewModel {
  const features = m.features.map((f) => ({ ...f, owner: "core" }));
  return { ...m, features, owners: owners(features), unowned: 0 };
}

export function emptyRegistry(m: OverviewModel): OverviewModel {
  return {
    ...m,
    totals: {
      ...m.totals,
      records: 0,
      features: 0,
      assumptions: 0,
      scenarios: 0,
      proven: 0,
      anchors: 0,
      anchoredFiles: 0,
    },
    domains: [],
    features: [],
    drift: [],
    tests: null,
    trend: [],
    recent: [],
    adrs: [],
    owners: [],
    unowned: 0,
  };
}

const PLACE_KINDS: HistoryEntry["kind"][] = [
  "dossier",
  "dossier",
  "area",
  "overview",
  "plugin",
  "content",
  "situation",
];

export function manyPlaces(n = 64): HistoryEntry[] {
  const r = rng(41);
  return Array.from({ length: n }, (_, i) => {
    const f = FEATURES[Math.floor(r() * FEATURES.length)];
    const kind = PLACE_KINDS[i % PLACE_KINDS.length];
    const minutes = 14 * 60 + 8 - i * 3;
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    const label =
      kind === "dossier"
        ? f.slug
        : kind === "area"
          ? `${localized.text13}${f.domain}`
          : kind === "overview"
            ? `${localized.text14}${f.capability}`
            : kind === "plugin"
              ? ["Notifications", labelText.text65, germanLabels.text26][i % 3]
              : kind === "content"
                ? [localized.text15, germanLabels.text4, germanLabels.text18, "Tests"][i % 4]
                : germanLabels.text7;
    return {
      key: `p${i}`,
      time,
      label,
      kind,
      sub:
        kind === "dossier"
          ? `${f.domain}/${f.capability}`
          : kind === "situation"
            ? [labelText.text68, labelText.text49, "Agent"][i % 3]
            : undefined,
      current: i === 0,
    };
  });
}

export function generatedFeatures(n: number): FeatureView[] {
  return makeFeatures(n).map((g) => ({
    id: g.id,
    slug: g.id.split("/")[2],
    domain: g.domain,
    capability: g.capability,
    summary: g.title,
    type: "feature",
    lifecycle: g.lifecycle,
    owner: g.owner,
    createdAt: g.changedAt,
    scenarios: g.scenarios,
    proven: g.proven,
    anchors: g.anchors,
    tests: g.proven,
    drift: g.drift,
    knowledgeOpen: g.knowledgeOpen,
  }));
}

export const TEAM_NAMES: Record<string, string> = Object.fromEntries([
  ...TEAMS.map((t) => [t.id, t.name] as const),
  ["infra", labelText.text207],
]);

export type DomainLink = { domain: string; title: string; count: number; examples: string[] };

export function domainLinks(id: string): { incoming: DomainLink[]; outgoing: DomainLink[] } {
  const title = (d: string) => DOMAINS.find((x) => x.id === d)?.title ?? d;
  return {
    incoming: DOMAIN_LINKS.filter((l) => l.to === id).map((l) => ({
      domain: l.from,
      title: title(l.from),
      count: l.count,
      examples: l.examples,
    })),
    outgoing: DOMAIN_LINKS.filter((l) => l.from === id).map((l) => ({
      domain: l.to,
      title: title(l.to),
      count: l.count,
      examples: l.examples,
    })),
  };
}

export function domainAdrs(id: string): AdrView[] {
  return ADRS.filter((a) => a.refs.some((r) => r.startsWith(id + "/")));
}

export function domainCommits(id: string): CommitView[] {
  return RECENT.filter((c) => c.record.startsWith(id + "/"));
}

export type AnchorFileView = { path: string; anchors: number; records: number; roles: string[] };

export function capabilityFiles(domain: string, capability: string): AnchorFileView[] {
  const m = new Map<string, { anchors: number; records: Set<string>; roles: Set<string> }>();
  for (const f of registry.features) {
    if (f.domain !== domain || f.capability !== capability) continue;
    for (const a of f.anchors) {
      const e = m.get(a.path) ?? {
        anchors: 0,
        records: new Set<string>(),
        roles: new Set<string>(),
      };
      e.anchors += 1;
      e.records.add(f.id);
      e.roles.add(a.role);
      m.set(a.path, e);
    }
  }
  return [...m.entries()]
    .map(([path, e]) => ({
      path,
      anchors: e.anchors,
      records: e.records.size,
      roles: [...e.roles],
    }))
    .sort((a, b) => b.records - a.records || a.path.localeCompare(b.path));
}

export function capabilityTests(domain: string, capability: string) {
  const out = { unit: 0, integration: 0, e2e: 0 };
  for (const f of registry.features) {
    if (f.domain !== domain || f.capability !== capability) continue;
    for (const t of f.tests) {
      if (t.kind === "Unit") out.unit += 1;
      else if (t.kind === "Integration") out.integration += 1;
      else out.e2e += 1;
    }
  }
  return out;
}

export function domainData(id: string) {
  const domain = DOMAINS.find((d) => d.id === id)!;
  return {
    domain,
    domains: DOMAINS,
    features: FEATURES.filter((f) => f.domain === id),
    links: domainLinks(id),
    drift: DRIFT.filter((d) => d.record.startsWith(id + "/")),
    adrs: domainAdrs(id),
    recent: domainCommits(id),
    teamName: TEAM_NAMES[domain.team] ?? domain.team,
  };
}

export function capabilityData(domainId: string, capabilityId: string) {
  const domain = DOMAINS.find((d) => d.id === domainId)!;
  const capability = domain.capabilities.find((c) => c.id === capabilityId)!;
  return {
    domain,
    domains: DOMAINS,
    capability,
    features: FEATURES.filter((f) => f.domain === domainId && f.capability === capabilityId),
    files: capabilityFiles(domainId, capabilityId),
    tests: capabilityTests(domainId, capabilityId),
    drift: DRIFT.filter((d) => d.record.startsWith(`${domainId}/${capabilityId}/`)),
    teamName: TEAM_NAMES[domain.team] ?? domain.team,
  };
}

export const CREATION_DATES: string[] = [
  ...new Set(FEATURES.map((f) => f.createdAt).filter((d): d is string => !!d)),
].sort();

export const reader = (key: string) => ({ role: key });

export const UNMEASURED: TopBarStats = { features: null, provenPct: null, drift: null };

export function statsFor(m: OverviewModel): TopBarStats {
  if (m.totals.records === 0) return UNMEASURED;
  if (m.features === FEATURES && m.drift === DRIFT) return TOP_STATS;
  return {
    features: m.features.filter((f) => f.type === "feature" && f.lifecycle === "active").length,
    provenPct: m.totals.scenarios ? Math.round((m.totals.proven / m.totals.scenarios) * 100) : null,
    drift: new Set(m.drift.map((d) => d.record)).size,
  };
}
