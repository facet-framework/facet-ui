/**
 * The companion — the question in prose, answered from the corpus that was
 * read.
 *
 * What lives here is a planner: it answers from what Atlas has counted anyway
 * — how many records there are, which ones have no anchor, what is overdue.
 * It is the floor everything else falls back to.
 *
 * Above it lie two paths that can do more. `agent.ts` sends the question to
 * Claude Code in the repo, which really opens the files; `rag.ts` searches the
 * vector index that `facet rag index` built. Which path is used when is decided
 * by `companionRoute` further down: the index is asked when the planner could
 * otherwise only say what it sees.
 *
 * What all three share is the limit of the tool: an advisor who speculates
 * about a repository it has not read is worse than none. Every answer
 * therefore names what it has read.
 */

import { de } from "../facet/i18n/de";
import { en, type TextKey } from "../facet/i18n/en";
import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import { focusItems } from "./focus";
import { pct } from "./model";
import type { ProbeMeaning } from "./probes";
import type { AtlasModel, FacetRecord } from "./types";

/** A key figure below the answer. */
export type CompanionFact = { label: string; value: string; meaning: ProbeMeaning };

/** A location that was read. `recordId` means: from here a jump leads into the detail view. */
export type CompanionSource = { text: string; recordId: string | null };

export type CompanionPlan = {
  /** The answer in prose, with line breaks. */
  text: string;
  facts: CompanionFact[];
  /** What the companion reads — step by step, while it answers. */
  reads: string[];
  sources: CompanionSource[];
  /** The record the answer refers to. */
  openId: string | null;
  /** Register section in which the answer continues. */
  section: string | null;
  /** Obvious follow-up questions. */
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

/**
 * The opening sentence without a question — what the companion sees and what
 * it can do. English; `text.t("core.companion.intro")` gives it in the active
 * language.
 */
export const COMPANION_INTRO: string = en["core.companion.intro"];

/**
 * The footer below the input field. It says what is behind it and covers all
 * three cases: Atlas answers from what it has counted; with an index also from
 * the wording of the records; with Claude Code in the repo also from the code.
 * Each of the three is an honest account, and the difference shows in the
 * sources anyway. English; `text.t("core.companion.foot")` gives it in the
 * active language.
 */
export const COMPANION_FOOT: string = en["core.companion.foot"];

/** The companion's header line: scope and role. */
export function companionScope(
  model: AtlasModel,
  roleTag: string,
  openId: string | null,
  text: FacetText = ENGLISH_TEXT,
): string {
  const sources = asStrings(model.rc.sources);
  const lines = typeof model.scan.totalLoc === "number" ? model.scan.totalLoc : 0;
  const { number } = text;
  return (
    text.t("core.companion.scope", {
      records: number(model.recs.length),
      sources: sources.join(", ") || "—",
      lines: number(lines),
    }) +
    "\n" +
    (openId
      ? text.t("core.companion.scopeRoleOpen", { role: roleTag, id: openId })
      : text.t("core.companion.scopeRole", { role: roleTag }))
  );
}

/** Suggestions while nothing has been asked yet — or matching the open record. */
export function companionSuggestions(
  model: AtlasModel,
  openId: string | null,
  asked: number,
  text: FacetText = ENGLISH_TEXT,
) {
  const { t } = text;
  const open = openId ? model.byId[openId] : null;
  if (open) {
    return [
      t("core.companion.suggest.recordOpen", { label: open.label }),
      t("core.companion.suggest.where"),
      t("core.companion.suggest.who"),
    ];
  }
  if (asked) return [];
  return [
    t("core.companion.suggest.start"),
    t("core.companion.suggest.overdue"),
    t("core.companion.suggest.coverage"),
    t("core.companion.suggest.unanchored"),
  ];
}

/**
 * The area in which a question is answered.
 *
 * `corpus` means: none. Neither a record by name nor one of the counted areas
 * — Atlas then says what it sees instead of guessing. That is exactly the case
 * the search index exists for, and that is why the decision is a function of
 * its own and not a chain of `if`s in the answer path: what Atlas can answer
 * itself and what it cannot must be readable from the outside.
 */
export type CompanionRoute =
  "record" | "rules" | "tests" | "open" | "teams" | "data" | "code" | "graph" | "ops" | "corpus";

/** The record a question names — or none. */
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

type KeywordRoute = Exclude<CompanionRoute, "record" | "corpus">;

/** The keyword areas in the order they are tried. */
const ROUTE_ORDER: readonly KeywordRoute[] = [
  "rules",
  "tests",
  "open",
  "teams",
  "data",
  "code",
  "graph",
  "ops",
];

/**
 * The keywords of an area, from both dictionaries: a reader asks in their own
 * language whatever language the surface speaks, so a German question finds
 * its area in an English Atlas and the other way round. The entries are word
 * stems separated by commas; a trailing space is part of the stem ("who ").
 */
function routeWords(route: KeywordRoute): string[] {
  const key = `core.companion.route.${route}` as TextKey;
  return [...en[key].split(","), ...de[key].split(",")].filter(Boolean);
}

/**
 * Decides what the question is about.
 *
 * First a record is searched for in the wording — whoever names a name means
 * it. After that, keywords decide the area. If both find nothing, it is
 * `corpus`.
 */
export function companionRoute(model: AtlasModel, question: string): CompanionRoute {
  const q = question.toLowerCase();
  if (companionRecord(model, question)) return "record";
  return (
    ROUTE_ORDER.find((route) => routeWords(route).some((word) => q.includes(word))) ?? "corpus"
  );
}

/**
 * Plans the answer to a question from what Atlas has counted.
 */
export function companionAnswer(
  model: AtlasModel,
  question: string,
  text: FacetText = ENGLISH_TEXT,
): CompanionPlan {
  switch (companionRoute(model, question)) {
    case "record":
      return aboutRecord(model, companionRecord(model, question)!, text);
    case "rules":
      return aboutRules(model, text);
    case "tests":
      return aboutTests(model, text);
    case "open":
      return aboutOpen(model, text);
    case "teams":
      return aboutTeams(model, text);
    case "data":
      return aboutData(model, text);
    case "code":
      return aboutCode(model, text);
    case "graph":
      return aboutGraph(model, text);
    case "ops":
      return aboutOps(model, text);
    default:
      return aboutCorpus(model, text);
  }
}

/**
 * The agent's answer in the shape the companion renders.
 *
 * The difference to everything above: these sources are files that were
 * really opened, not paths derived from the model. Where one of them is a
 * record, the jump leads into the detail view as usual.
 */
export function agentPlan(
  model: AtlasModel,
  answer: string,
  reads: string[],
  searches: string[] = [],
  text: FacetText = ENGLISH_TEXT,
): CompanionPlan {
  const seen = reads.filter((path, index) => path && reads.indexOf(path) === index);
  const byPath = new Map(model.recs.map((record) => [record.path, record.id]));

  const facts = [
    fact(text.t("core.companion.fact.read"), text.plural("core.companion.files", seen.length)),
  ];
  // A search in the index is not a read and is counted separately. Counting it
  // under READ (`core.companion.fact.read`) would claim files nobody opened —
  // and the agent really opens the found ones afterwards, so both numbers
  // hold side by side.
  const found = searches.filter((query, index) => query && searches.indexOf(query) === index);
  if (found.length) {
    facts.push(
      fact(
        text.t("core.companion.fact.searched"),
        text.plural("core.companion.questions", found.length),
      ),
    );
  }

  return {
    text: answer,
    facts,
    reads: seen,
    sources: seen.map((path) => ({ text: path, recordId: byPath.get(path) ?? null })),
    openId: null,
    section: null,
    follow: [],
  };
}

/** A record by name: what it is, and what is open about it. */
function aboutRecord(model: AtlasModel, hit: FacetRecord, text: FacetText): CompanionPlan {
  const { t, plural } = text;
  const anchors = model.anchorMap[hit.id] ?? [];
  const facts = [
    fact(t("core.companion.fact.state"), hit.lifecycle),
    fact(t("core.companion.fact.team"), hit.team || "—"),
  ];
  if (hit.total) {
    facts.push(
      fact(
        t("core.companion.fact.promises"),
        t("core.companion.provenOf", { proven: String(hit.proven), total: String(hit.total) }),
        hit.proven === hit.total ? "neutral" : "signal",
      ),
    );
  }
  if (anchors.length)
    facts.push(
      fact(t("core.companion.fact.code"), plural("core.companion.entryPoints", anchors.length)),
    );
  if (hit.clauses.length) facts.push(fact(t("core.probes.clauses"), String(hit.clauses.length)));
  if (hit.fields.length)
    facts.push(fact(t("core.companion.fact.fields"), String(hit.fields.length)));

  const gaps: string[] = [];
  if (hit.total && hit.proven < hit.total) {
    gaps.push(plural("core.companion.gap.untested", hit.total - hit.proven));
  }
  if (hit.lifecycle === "active" && !anchors.length) gaps.push(t("core.companion.gap.unanchored"));
  if (!hit.slos.length && !hit.alerts.length && hit.kind === "feature")
    gaps.push(t("core.companion.gap.unmeasured"));
  if (model.driftIds[hit.id]?.length) gaps.push(t("core.companion.gap.drift"));

  return {
    text: `${hit.summary || hit.label}\n\n${
      gaps.length
        ? t("core.companion.record.open", { gaps: gaps.join(", ") })
        : t("core.companion.record.nothingOpen")
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
      t("core.companion.follow.owner", { label: hit.label }),
      t("core.companion.follow.missingTests", { label: hit.label }),
    ],
  };
}

function aboutRules(model: AtlasModel, text: FacetText): CompanionPlan {
  const { t, plural } = text;
  const rows = model.overdueList.map(({ rec, check }) =>
    t("core.probes.dueLine", {
      label: rec.label,
      id: String(check.id),
      date: String(check.next_due),
    }),
  );
  const head = plural("core.companion.rules.overdue", model.overdue, {
    count: String(model.overdue),
  });
  const tail = !model.stale
    ? t("core.companion.rules.noStale")
    : plural("core.companion.rules.stale", model.stale, { count: String(model.stale) });

  return {
    text: model.overdue
      ? `${head}\n${rows.join("\n")}\n\n${tail}`
      : `${t("core.companion.rules.noneOverdue", {
          clauses: String(model.clauseCount),
          must: String(model.mustCount),
        })}\n\n${tail}`,
    facts: [
      fact(t("core.probes.overdue"), String(model.overdue), model.overdue ? "due" : "neutral"),
      fact(t("core.probes.clauses"), String(model.clauseCount)),
      fact(t("core.probes.mandatory"), String(model.mustCount)),
      fact(
        t("core.companion.fact.artifacts"),
        String(model.policies.reduce((sum, policy) => sum + policy.artifacts.length, 0)),
      ),
    ],
    reads: model.policies.map((policy) => policy.path),
    sources: model.policies.map(from),
    openId: null,
    section: "rules",
    follow: [t("core.companion.follow.artifacts"), t("core.companion.follow.noPolicy")],
  };
}

function aboutTests(model: AtlasModel, text: FacetText): CompanionPlan {
  const { t, number } = text;
  const worst = [...model.domainCov].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))[0];
  const testLoc = typeof model.scan.testLoc === "number" ? model.scan.testLoc : 0;
  const totalLoc = typeof model.scan.totalLoc === "number" ? model.scan.totalLoc : 0;

  return {
    text:
      t("core.companion.tests.share", {
        pct: String(pct(model.scnProven, model.scnTotal)),
        proven: String(model.scnProven),
        total: String(model.scnTotal),
      }) +
      "\n\n" +
      t("core.companion.tests.weakest", {
        area: worst
          ? t("core.companion.tests.area", { name: worst.name, pct: String(worst.pct) })
          : "—",
      }) +
      " " +
      t("core.companion.tests.lines", {
        test: number(testLoc),
        total: number(totalLoc),
      }),
    facts: [
      fact(t("core.probes.testMapped"), `${model.scnProven}/${model.scnTotal}`),
      fact(t("core.probes.noTest"), String(model.scnTotal - model.scnProven), "signal"),
    ],
    reads: model.features.map((feature) => feature.path),
    sources: model.features.map(from),
    openId: null,
    section: "promises",
    follow: [t("core.companion.follow.untested"), t("core.companion.follow.e2e")],
  };
}

function aboutOpen(model: AtlasModel, text: FacetText): CompanionPlan {
  const { t, plural } = text;
  const all = focusItems(model, text);
  const items = all.slice(0, 5);

  return {
    text:
      `${
        all.length === 1
          ? t("core.companion.open.single")
          : plural("core.companion.open.many", items.length, {
              total: String(all.length),
              count: String(items.length),
            })
      }\n${items.map((item, index) => `${index + 1}. ${item.title} — ${item.why}`).join("\n")}\n\n` +
      t("core.companion.open.deadlinesFirst"),
    facts: [
      fact(t("core.companion.fact.open"), String(all.length), all.length ? "signal" : "neutral"),
      fact(t("core.probes.head.overdue"), String(model.overdue), model.overdue ? "due" : "neutral"),
      fact(t("core.probes.noTest"), String(model.scnTotal - model.scnProven), "signal"),
    ],
    reads: model.paths.slice(0, 6),
    sources: items
      .map((item) => model.byId[item.id])
      .filter(Boolean)
      .map(from),
    openId: null,
    section: null,
    follow: [t("core.companion.suggest.overdue"), t("core.companion.follow.reach")],
  };
}

function aboutTeams(model: AtlasModel, text: FacetText): CompanionPlan {
  const { t, plural } = text;
  const names = Object.keys(model.teams);
  return {
    text:
      plural("core.companion.teams.head", names.length, { count: String(names.length) }) +
      names
        .map(
          (team) =>
            `${team} (${model.teams[team].items.length}, ${model.teams[team].contact || t("core.probes.noContact")})`,
        )
        .join("\n") +
      "\n\n" +
      (model.noOwner.length
        ? t("core.companion.teams.noOwner", {
            list: model.noOwner.map((record) => record.label).join(", "),
          })
        : t("core.quiet.allOwned")),
    facts: [
      fact(t("core.companion.fact.teams"), String(names.length)),
      fact(
        t("core.companion.fact.noTeam"),
        String(model.noOwner.length),
        model.noOwner.length ? "signal" : "neutral",
      ),
    ],
    reads: model.paths.slice(0, 5),
    sources: model.recs.slice(0, 5).map(from),
    openId: null,
    section: "teams",
    follow: [t("core.companion.follow.teamMostOpen")],
  };
}

function aboutData(model: AtlasModel, text: FacetText): CompanionPlan {
  const { t } = text;
  return {
    text:
      t("core.companion.data.head", { pii: String(model.pii), enc: String(model.enc) }) +
      "\n" +
      model.entities
        .map((entity) =>
          t("core.companion.data.entity", {
            label: entity.label,
            count: String(entity.fields.length),
          }),
        )
        .join("\n"),
    facts: [
      fact(t("core.probes.personal"), String(model.pii), model.pii ? "due" : "neutral"),
      fact(t("core.probes.encrypted"), String(model.enc)),
      fact(t("core.probes.entities"), String(model.entities.length)),
    ],
    reads: model.entities.map((entity) => entity.path),
    sources: model.entities.map(from),
    openId: null,
    section: "data",
    follow: [t("core.companion.follow.piiPolicies")],
  };
}

function aboutCode(model: AtlasModel, text: FacetText): CompanionPlan {
  const { t, plural } = text;
  const drift = model.scan.drift ?? [];
  const orphans = (model.scan.orphanAnchors ?? []).length;

  return {
    text:
      t("core.companion.code.head", {
        anchors: String(model.anchorPairs.length),
        features: String(Object.keys(model.anchorMap).length),
      }) +
      "\n" +
      (drift.length
        ? t("core.companion.code.changed", { ids: drift.map((entry) => entry.id).join(", ") }) +
          "\n"
        : "") +
      (!model.unanchored.length
        ? t("core.companion.code.allAnchored")
        : plural("core.companion.code.unanchored", model.unanchored.length, {
            count: String(model.unanchored.length),
            labels: model.unanchored.map((record) => record.label).join(", "),
          })) +
      (!orphans
        ? ""
        : "\n" + plural("core.companion.code.orphans", orphans, { count: String(orphans) })),
    facts: [
      fact(t("core.probes.entryPoints"), String(model.anchorPairs.length)),
      fact(
        t("core.probes.withoutEntryPoint"),
        String(model.unanchored.length),
        model.unanchored.length ? "signal" : "neutral",
      ),
      fact(
        t("core.companion.fact.changed"),
        String(drift.length),
        drift.length ? "due" : "neutral",
      ),
    ],
    reads: model.anchorPairs.slice(0, 6).map((anchor) => anchor.path),
    sources: model.anchorPairs
      .slice(0, 6)
      .map((anchor) => ({ text: `${anchor.path}:${anchor.line}`, recordId: null })),
    openId: null,
    section: "code",
    follow: [t("core.companion.follow.unanchored")],
  };
}

function aboutGraph(model: AtlasModel, text: FacetText): CompanionPlan {
  const { t, plural } = text;
  return {
    text:
      plural("core.companion.graph.head", model.maxDepth, {
        edges: String(model.edges.length),
        count: String(model.maxDepth),
      }) +
      "\n" +
      (!model.ghosts.length
        ? t("core.companion.graph.allResolve")
        : plural("core.companion.graph.ghosts", model.ghosts.length, {
            list: model.ghosts.join(", "),
          })),
    facts: [
      fact(t("core.probes.edges"), String(model.edges.length)),
      fact(t("core.probes.depth"), String(model.maxDepth)),
      fact(
        t("core.probes.openReferences"),
        String(model.ghosts.length),
        model.ghosts.length ? "signal" : "neutral",
      ),
    ],
    reads: model.paths.slice(0, 6),
    sources: model.recs.slice(0, 4).map(from),
    openId: null,
    section: "graph",
    follow: [t("core.companion.follow.coupled")],
  };
}

function aboutOps(model: AtlasModel, text: FacetText): CompanionPlan {
  const { t, plural } = text;
  const measured = model.recs.filter((record) => record.slos.length || record.alerts.length);
  return {
    text:
      t("core.companion.ops.head", {
        slos: String(model.slos.length),
        alerts: String(model.alerts.length),
      }) +
      "\n" +
      (!model.noRunbook
        ? t("core.companion.ops.allRunbooks")
        : plural("core.companion.ops.noRunbook", model.noRunbook, {
            count: String(model.noRunbook),
          })) +
      (!model.noObs.length
        ? ""
        : "\n" +
          plural("core.companion.ops.unmeasured", model.noObs.length, {
            count: String(model.noObs.length),
            labels: model.noObs.map((feature) => feature.label).join(", "),
          })),
    facts: [
      fact("SLOS", String(model.slos.length)),
      fact(t("core.probes.alerts"), String(model.alerts.length)),
      fact(
        t("core.probes.noRunbook"),
        String(model.noRunbook),
        model.noRunbook ? "signal" : "neutral",
      ),
      fact(t("core.companion.fact.sources"), model.sources.join(", ") || "—"),
    ],
    reads: measured.map((record) => record.path),
    sources: measured.map(from),
    openId: null,
    section: "ops",
    follow: [t("core.companion.follow.noRunbook")],
  };
}

/** No question recognised: say what you see instead of guessing. */
function aboutCorpus(model: AtlasModel, text: FacetText): CompanionPlan {
  const { t, number } = text;
  const records = typeof model.rc.records === "string" ? model.rc.records : "docs/facets";
  const sources = asStrings(model.rc.sources);
  const lines = typeof model.scan.totalLoc === "number" ? model.scan.totalLoc : 0;
  const scannedAt = String(model.scan.scannedAt ?? "").slice(0, 10);

  return {
    text:
      t("core.companion.corpus.reads", {
        count: String(model.recs.length),
        records,
        sources: sources.join(", ") || "sources",
        lines: number(lines),
        asOf: scannedAt ? t("core.companion.corpus.asOf", { date: scannedAt }) : "",
      }) +
      "\n\n" +
      t("core.companion.corpus.ask"),
    facts: [
      fact("RECORDS", String(model.recs.length)),
      fact(t("core.companion.fact.files"), String(model.paths.length)),
      fact(t("core.companion.fact.lines"), number(lines)),
      fact(t("core.companion.fact.open"), String(focusItems(model, text).length), "signal"),
    ],
    reads: [".facetrc.yaml", records],
    sources: model.recs.slice(0, 3).map(from),
    openId: null,
    section: null,
    follow: [
      t("core.companion.suggest.start"),
      t("core.companion.suggest.overdue"),
      t("core.companion.suggest.coverage"),
    ],
  };
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
