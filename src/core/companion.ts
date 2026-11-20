import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { localized } from "../i18n/legacy/core/companion";

import { focusItems } from "./focus";
import { formatNumber, pct } from "./model";
import type { ProbeMeaning } from "./probes";
import type { AtlasModel, FacetRecord } from "./types";

export type CompanionFact = { label: string; value: string; meaning: ProbeMeaning };

export type CompanionSource = { text: string; recordId: string | null };

export type CompanionPlan = {
  text: string;
  facts: CompanionFact[];

  reads: string[];
  sources: CompanionSource[];

  openId: string | null;

  section: string | null;

  follow: string[];
};

const fact = (label: string, value: string, meaning: ProbeMeaning = "neutral"): CompanionFact => ({
  label,
  value,
  meaning,
});

const from = (record: FacetRecord): CompanionSource => ({
  text: record.path,
  recordId: record.id,
});

export const COMPANION_INTRO = localized.text1;

export const COMPANION_FOOT = localized.text2;

export function companionScope(model: AtlasModel, roleTag: string, openId: string | null): string {
  const sources = asStrings(model.rc.sources);
  const lines = typeof model.scan.totalLoc === "number" ? model.scan.totalLoc : 0;
  return (
    `sieht: ${formatNumber(model.recs.length)} Records · ${sources.join(", ") || "—"} · ${formatNumber(lines)}${labelText.text386}` +
    `${labelText.text387}${roleTag}${openId ? `${localized.text3}${openId}` : ""}`
  );
}

export function companionSuggestions(model: AtlasModel, openId: string | null, asked: number) {
  const open = openId ? model.byId[openId] : null;
  if (open) {
    return [`${localized.text4}${open.label}${localized.text5}`, localized.text6, localized.text7];
  }
  if (asked) return [];
  return [labelText.text388, localized.text8, localized.text9, localized.text10];
}

export type CompanionRoute =
  "record" | "rules" | "tests" | "open" | "teams" | "data" | "code" | "graph" | "ops" | "corpus";

export function companionRecord(model: AtlasModel, question: string): FacetRecord | null {
  const q = question.toLowerCase();
  return (
    model.recs.find(
      (record) =>
        q.includes(record.label.toLowerCase()) ||
        q.includes(record.id.toLowerCase()) ||
        q.includes(String(record.id).split("/").pop()!.replace(/-/g, " ")),
    ) ?? null
  );
}

export function companionRoute(model: AtlasModel, question: string): CompanionRoute {
  const q = question.toLowerCase();
  const has = (...words: string[]) => words.some((word) => q.includes(word));

  if (companionRecord(model, question)) return "record";

  if (has(localized.text11, "deadline", "compliance", localized.text12, "audit")) return "rules";
  if (has("test", labelText.text389, "coverage", labelText.text13, labelText.extra8))
    return "tests";
  if (
    has(
      labelText.text390,
      labelText.text391,
      labelText.text392,
      labelText.text393,
      labelText.extra9,
      labelText.extra10,
    )
  )
    return "open";
  if (has(localized.text13, "team", labelText.text394, "owner", labelText.text395)) return "teams";
  if (
    has(
      labelText.extra11,
      "pii",
      labelText.text297,
      labelText.extra12,
      labelText.text396,
      localized.text14,
    )
  )
    return "data";
  if (
    has(
      "code",
      remainingText.text29,
      labelText.text397,
      labelText.text398,
      "drift",
      labelText.text399,
      labelText.extra13,
    )
  )
    return "code";
  if (has(localized.text15, labelText.text400, labelText.text401, "graph", labelText.text402))
    return "graph";
  if (
    has(remainingText.text30, "slo", labelText.text403, "runbook", labelText.text404, "monitoring")
  )
    return "ops";

  return "corpus";
}

export function companionAnswer(model: AtlasModel, question: string): CompanionPlan {
  switch (companionRoute(model, question)) {
    case "record":
      return aboutRecord(model, companionRecord(model, question)!);
    case "rules":
      return aboutRules(model);
    case "tests":
      return aboutTests(model);
    case "open":
      return aboutOpen(model);
    case "teams":
      return aboutTeams(model);
    case "data":
      return aboutData(model);
    case "code":
      return aboutCode(model);
    case "graph":
      return aboutGraph(model);
    case "ops":
      return aboutOps(model);
    default:
      return aboutCorpus(model);
  }
}

export function agentPlan(
  model: AtlasModel,
  text: string,
  reads: string[],
  searches: string[] = [],
): CompanionPlan {
  const seen = reads.filter((path, index) => path && reads.indexOf(path) === index);
  const byPath = new Map(model.recs.map((record) => [record.path, record.id]));

  const facts = [
    fact("GELESEN", seen.length === 1 ? labelText.text405 : `${seen.length}${localized.text16}`),
  ];

  const found = searches.filter((query, index) => query && searches.indexOf(query) === index);
  if (found.length) {
    facts.push(
      fact(
        "GESUCHT",
        found.length === 1 ? remainingText.text31 : `${found.length}${localized.text17}`,
      ),
    );
  }

  return {
    text,
    facts,
    reads: seen,
    sources: seen.map((path) => ({ text: path, recordId: byPath.get(path) ?? null })),
    openId: null,
    section: null,
    follow: [],
  };
}

function aboutRecord(model: AtlasModel, hit: FacetRecord): CompanionPlan {
  const anchors = model.anchorMap[hit.id] ?? [];
  const facts = [fact(localized.text18, hit.lifecycle), fact("TEAM", hit.team || "—")];
  if (hit.total) {
    facts.push(
      fact(
        localized.text19,
        `${hit.proven}/${hit.total}${localized.text20}`,
        hit.proven === hit.total ? "neutral" : "signal",
      ),
    );
  }
  if (anchors.length) facts.push(fact("CODE", `${anchors.length}${labelText.text406}`));
  if (hit.clauses.length) facts.push(fact(labelText.text361, String(hit.clauses.length)));
  if (hit.fields.length) facts.push(fact(labelText.text407, String(hit.fields.length)));

  const gaps: string[] = [];
  if (hit.total && hit.proven < hit.total) {
    const missing = hit.total - hit.proven;
    gaps.push(missing === 1 ? localized.text21 : `${missing}${localized.text22}`);
  }
  if (hit.lifecycle === "active" && !anchors.length) gaps.push(localized.text23);
  if (!hit.slos.length && !hit.alerts.length && hit.kind === "feature") gaps.push(localized.text24);
  if (model.driftIds[hit.id]?.length) gaps.push(localized.text25);

  return {
    text: `${hit.summary || hit.label}\n\n${
      gaps.length ? `${localized.text26}${gaps.join(", ")}.` : localized.text27
    }`,
    facts,
    reads: [hit.path, ...anchors.map((anchor) => anchor.path)],
    sources: [
      from(hit),
      ...anchors.map((anchor) => ({ text: `${anchor.path}:${anchor.line}`, recordId: null })),
    ],
    openId: hit.id,
    section: null,
    follow: [
      `${localized.text28}${hit.label}${localized.text29}`,
      `${remainingText.text32}${hit.label}?`,
    ],
  };
}

function aboutRules(model: AtlasModel): CompanionPlan {
  const rows = model.overdueList.map(
    ({ rec, check }) => `${rec.label} · ${check.id}${localized.text30}${check.next_due}`,
  );
  const head = model.overdue === 1 ? localized.text31 : `${model.overdue}${localized.text32}`;
  const tail = !model.stale
    ? localized.text33
    : model.stale === 1
      ? localized.text34
      : `${labelText.text408}${model.stale}${localized.text35}`;

  return {
    text: model.overdue
      ? `${head}\n${rows.join("\n")}\n\n${tail}`
      : `${localized.text36}${model.clauseCount}${labelText.text409}${model.mustCount} davon verpflichtend.\n\n${tail}`,
    facts: [
      fact(localized.text37, String(model.overdue), model.overdue ? "deadline" : "neutral"),
      fact(labelText.text361, String(model.clauseCount)),
      fact("VERPFLICHTEND", String(model.mustCount)),
      fact(
        labelText.text410,
        String(model.policies.reduce((sum, policy) => sum + policy.artifacts.length, 0)),
      ),
    ],
    reads: model.policies.map((policy) => policy.path),
    sources: model.policies.map(from),
    openId: null,
    section: "rules",
    follow: [labelText.text411, remainingText.text33],
  };
}

function aboutTests(model: AtlasModel): CompanionPlan {
  const worst = [...model.domainCov].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))[0];
  const testLoc = typeof model.scan.testLoc === "number" ? model.scan.testLoc : 0;
  const totalLoc = typeof model.scan.totalLoc === "number" ? model.scan.totalLoc : 0;

  return {
    text:
      `${pct(model.scnProven, model.scnTotal)}${localized.text38}${model.scnProven}${remainingText.text34}${model.scnTotal}${localized.text39}` +
      `${localized.text40}${worst ? `${worst.name}${localized.text41}${worst.pct} %` : "—"}. ` +
      `${remainingText.text35}${formatNumber(testLoc)}${remainingText.text34}${formatNumber(totalLoc)}${localized.text42}`,
    facts: [
      fact("TEST ZUGEORDNET", `${model.scnProven}/${model.scnTotal}`),
      fact(localized.text43, String(model.scnTotal - model.scnProven), "signal"),
    ],
    reads: model.features.map((feature) => feature.path),
    sources: model.features.map(from),
    openId: null,
    section: "promises",
    follow: [localized.text44, remainingText.text36],
  };
}

function aboutOpen(model: AtlasModel): CompanionPlan {
  const all = focusItems(model);
  const items = all.slice(0, 5);

  return {
    text:
      `${
        all.length === 1
          ? localized.text45
          : `${remainingText.text37}${all.length}${localized.text46}${items.length === 1 ? localized.text47 : `${items.length}${localized.text48}`}:`
      }\n${items.map((item, index) => `${index + 1}. ${item.title} — ${item.why}`).join("\n")}\n\n` +
      localized.text49,
    facts: [
      fact(localized.text50, String(all.length), all.length ? "signal" : "neutral"),
      fact(remainingText.text38, String(model.overdue), model.overdue ? "deadline" : "neutral"),
      fact(localized.text51, String(model.scnTotal - model.scnProven), "signal"),
    ],
    reads: model.paths.slice(0, 6),
    sources: items
      .map((item) => model.byId[item.id])
      .filter(Boolean)
      .map(from),
    openId: null,
    section: null,
    follow: [localized.text52, localized.text53],
  };
}

function aboutTeams(model: AtlasModel): CompanionPlan {
  const names = Object.keys(model.teams);
  return {
    text:
      `${names.length === 1 ? localized.text54 : `${names.length} Teams tragen Records. `}` +
      names
        .map(
          (team) =>
            `${team} (${model.teams[team].items.length}, ${model.teams[team].contact || localized.text55})`,
        )
        .join("\n") +
      (model.noOwner.length
        ? `${localized.text56}${model.noOwner.map((record) => record.label).join(", ")}.`
        : localized.text57),
    facts: [
      fact("TEAMS", String(names.length)),
      fact(
        localized.text58,
        String(model.noOwner.length),
        model.noOwner.length ? "signal" : "neutral",
      ),
    ],
    reads: model.paths.slice(0, 5),
    sources: model.recs.slice(0, 5).map(from),
    openId: null,
    section: "teams",
    follow: [localized.text59],
  };
}

function aboutData(model: AtlasModel): CompanionPlan {
  return {
    text:
      `${model.pii}${localized.text60}${model.enc}${localized.text61}` +
      model.entities
        .map((entity) => `${entity.label} · ${entity.fields.length}${labelText.text412}`)
        .join("\n"),
    facts: [
      fact(labelText.text366, String(model.pii), model.pii ? "deadline" : "neutral"),
      fact(localized.text62, String(model.enc)),
      fact("DATENOBJEKTE", String(model.entities.length)),
    ],
    reads: model.entities.map((entity) => entity.path),
    sources: model.entities.map(from),
    openId: null,
    section: "data",
    follow: [localized.text63],
  };
}

function aboutCode(model: AtlasModel): CompanionPlan {
  const drift = model.scan.drift ?? [];
  const orphans = (model.scan.orphanAnchors ?? []).length;

  return {
    text:
      `${model.anchorPairs.length}${remainingText.text39}${Object.keys(model.anchorMap).length}${remainingText.text40}` +
      (drift.length ? `${localized.text64}${drift.map((entry) => entry.id).join(", ")}.\n` : "") +
      (!model.unanchored.length
        ? localized.text65
        : model.unanchored.length === 1
          ? `${localized.text66}${model.unanchored[0].label}.`
          : `${model.unanchored.length}${localized.text67}${model.unanchored.map((record) => record.label).join(", ")}.`) +
      (!orphans
        ? ""
        : orphans === 1
          ? localized.text68
          : `${remainingText.text41}${orphans}${localized.text69}`),
    facts: [
      fact(labelText.text363, String(model.anchorPairs.length)),
      fact(
        localized.text70,
        String(model.unanchored.length),
        model.unanchored.length ? "signal" : "neutral",
      ),
      fact(localized.text71, String(drift.length), drift.length ? "deadline" : "neutral"),
    ],
    reads: model.anchorPairs.slice(0, 6).map((anchor) => anchor.path),
    sources: model.anchorPairs
      .slice(0, 6)
      .map((anchor) => ({ text: `${anchor.path}:${anchor.line}`, recordId: null })),
    openId: null,
    section: "code",
    follow: [localized.text72],
  };
}

function aboutGraph(model: AtlasModel): CompanionPlan {
  return {
    text:
      `${localized.text73}${model.edges.length}${localized.text74}${model.maxDepth}${model.maxDepth === 1 ? remainingText.text42 : remainingText.text43}` +
      (!model.ghosts.length
        ? localized.text75
        : `${model.ghosts.length === 1 ? localized.text76 : remainingText.text44}${model.ghosts.join(", ")}.`),
    facts: [
      fact("KANTEN", String(model.edges.length)),
      fact("DEPTH", String(model.maxDepth)),
      fact(
        remainingText.text45,
        String(model.ghosts.length),
        model.ghosts.length ? "signal" : "neutral",
      ),
    ],
    reads: model.paths.slice(0, 6),
    sources: model.recs.slice(0, 4).map(from),
    openId: null,
    section: "graph",
    follow: [localized.text77],
  };
}

function aboutOps(model: AtlasModel): CompanionPlan {
  const measured = model.recs.filter((record) => record.slos.length || record.alerts.length);
  return {
    text:
      `${model.slos.length}${localized.text78}${model.alerts.length}${localized.text79}` +
      (!model.noRunbook
        ? localized.text80
        : model.noRunbook === 1
          ? localized.text81
          : `${model.noRunbook}${localized.text82}`) +
      (!model.noObs.length
        ? ""
        : model.noObs.length === 1
          ? `${localized.text83}${model.noObs[0].label}.`
          : `\n${model.noObs.length}${localized.text84}${model.noObs.map((feature) => feature.label).join(", ")}.`),
    facts: [
      fact("SLOS", String(model.slos.length)),
      fact(labelText.text367, String(model.alerts.length)),
      fact(localized.text85, String(model.noRunbook), model.noRunbook ? "signal" : "neutral"),
      fact("MESSQUELLEN", model.sources.join(", ") || "—"),
    ],
    reads: measured.map((record) => record.path),
    sources: measured.map(from),
    openId: null,
    section: "ops",
    follow: [localized.text86],
  };
}

function aboutCorpus(model: AtlasModel): CompanionPlan {
  const records = typeof model.rc.records === "string" ? model.rc.records : "docs/facets";
  const sources = asStrings(model.rc.sources);
  const lines = typeof model.scan.totalLoc === "number" ? model.scan.totalLoc : 0;
  const scannedAt = String(model.scan.scannedAt ?? "").slice(0, 10);

  return {
    text:
      `${localized.text87}${model.recs.length} Records unter ${records}${localized.text88}${sources.join(", ") || "sources"} — ${formatNumber(lines)}${labelText.text359}${scannedAt ? `, Stand ${scannedAt}` : ""}.\n\n` +
      localized.text89,
    facts: [
      fact("RECORDS", String(model.recs.length)),
      fact(localized.text90, String(model.paths.length)),
      fact(labelText.text413, formatNumber(lines)),
      fact(localized.text91, String(focusItems(model).length), "signal"),
    ],
    reads: [".facetrc.yaml", records],
    sources: model.recs.slice(0, 3).map(from),
    openId: null,
    section: null,
    follow: [labelText.text388, localized.text92, localized.text93],
  };
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
