import { createText } from "../facet/i18n/text";
import {
  agentPlan,
  COMPANION_FOOT,
  COMPANION_INTRO,
  companionAnswer,
  companionRecord,
  companionRoute,
  companionScope,
  companionSuggestions,
  type CompanionRoute,
} from "./companion";
import { taskflowModel } from "./fixtures";

const model = taskflowModel();
const de = createText("de");

describe("Unit tests for companionRoute", () => {
  // The decision which area a question hits used to live in a chain of `if`s
  // in the middle of the answer path. It is readable now because something
  // else needs it too: the search index is asked exactly when `corpus` comes
  // out here.
  it("recognises a record by name", () => {
    expect(companionRoute(model, "What about Quick add?")).toBe("record");
    expect(companionRecord(model, "What about Quick add?")?.id).toBe("tasks/create/quick-add");
  });

  it("maps the counted areas", () => {
    expect(companionRoute(model, "What is overdue?")).toBe("rules");
    expect(companionRoute(model, "How high is the coverage?")).toBe("tests");
    expect(companionRoute(model, "Where should I start?")).toBe("open");
    expect(companionRoute(model, "Who owns this?")).toBe("teams");
    expect(companionRoute(model, "Which personal fields are there?")).toBe("data");
    expect(companionRoute(model, "What is not anchored in the code?")).toBe("code");
    expect(companionRoute(model, "Where is the coupling strongest?")).toBe("graph");
    expect(companionRoute(model, "Which alerts have no runbook?")).toBe("ops");
  });

  // A reader asks in their own language, whatever the surface speaks: the
  // keywords of both dictionaries count.
  it("maps German questions to the same areas", () => {
    expect(companionRoute(model, de.t("core.companion.suggest.overdue"))).toBe("rules");
    expect(companionRoute(model, de.t("core.companion.suggest.coverage"))).toBe("tests");
    expect(companionRoute(model, de.t("core.companion.suggest.start"))).toBe("open");
    expect(companionRoute(model, de.t("core.companion.suggest.who"))).toBe("teams");
    expect(companionRoute(model, de.t("core.companion.route.data").split(",")[0])).toBe("data");
    expect(companionRoute(model, de.t("core.companion.suggest.unanchored"))).toBe("code");
    expect(companionRoute(model, de.t("core.companion.route.graph").split(",")[0])).toBe("graph");
    expect(companionRoute(model, de.t("core.companion.route.ops").split(",")[0])).toBe("ops");
  });

  it("falls back to corpus when the question fits no area", () => {
    expect(companionRoute(model, "What is the naming convention here?")).toBe("corpus");
    expect(companionRoute(model, "Why was it decided this way?")).toBe("corpus");
  });

  // The route determines the answer: were they two separate chains, they
  // could drift apart and the index would be asked although Atlas answers.
  it("determines which answer the planner gives", () => {
    expect(companionAnswer(model, "What about Quick add?").openId).toBe("tasks/create/quick-add");
    expect(companionAnswer(model, "What is overdue?").section).toBe("rules");
    expect(companionAnswer(model, "What is the convention here?").section).toBeNull();
  });

  // Every suggestion the companion offers must itself lead somewhere other
  // than `corpus`, in both languages — otherwise a click answers "I see …".
  it("routes its own suggestions to an area", () => {
    for (const text of [undefined, de]) {
      const suggestions = companionSuggestions(model, null, 0, text);
      expect(suggestions).toHaveLength(4);
      suggestions.forEach((question) =>
        expect([question, companionRoute(model, question)]).not.toEqual([question, "corpus"]),
      );
    }
  });
});

describe("Unit tests for companionAnswer", () => {
  const QUESTIONS: Record<Exclude<CompanionRoute, "record" | "corpus">, string> = {
    rules: "What is overdue?",
    tests: "How high is the test coverage?",
    open: "Where should I start?",
    teams: "Who owns this?",
    data: "Which personal data is there?",
    code: "Which features are not anchored in the code?",
    graph: "What is coupled most strongly?",
    ops: "Which alerts have no runbook?",
  };

  it("answers every area in English without a placeholder left", () => {
    for (const [route, question] of Object.entries(QUESTIONS)) {
      const plan = companionAnswer(model, question);
      expect([route, plan.text.length > 0]).toEqual([route, true]);
      expect(plan.text).not.toMatch(/\{\{/);
      plan.facts.forEach((entry) => expect(entry.label).toMatch(/^[A-Z][A-Z ]+$/));
      expect(plan.text).not.toMatch(/[\u00e4\u00f6\u00fc\u00df]/);
    }
  });

  it("answers every area in German under the German text", () => {
    expect(companionAnswer(model, QUESTIONS.rules, de).facts[0].label).toBe(
      de.t("core.probes.overdue"),
    );
    expect(companionAnswer(model, QUESTIONS.tests, de).text).toMatch(
      de.t("core.companion.tests.share", {
        pct: String(Math.round((model.scnProven / model.scnTotal) * 100)),
        proven: String(model.scnProven),
        total: String(model.scnTotal),
      }),
    );
    expect(companionAnswer(model, QUESTIONS.open, de).text).toContain(
      de.t("core.companion.open.deadlinesFirst"),
    );
    expect(companionAnswer(model, QUESTIONS.teams, de).text).toContain(
      de.plural("core.companion.teams.head", Object.keys(model.teams).length),
    );
    expect(companionAnswer(model, QUESTIONS.data, de).text).toContain(
      de.t("core.companion.data.head", { pii: String(model.pii), enc: String(model.enc) }),
    );
    expect(companionAnswer(model, QUESTIONS.code, de).text).toContain(
      de.t("core.companion.code.head", {
        anchors: String(model.anchorPairs.length),
        features: String(Object.keys(model.anchorMap).length),
      }),
    );
    expect(companionAnswer(model, QUESTIONS.graph, de).text).toContain(
      de.plural("core.companion.graph.head", model.maxDepth, {
        edges: String(model.edges.length),
        count: String(model.maxDepth),
      }),
    );
    expect(companionAnswer(model, QUESTIONS.ops, de).text).toContain(
      de.t("core.companion.ops.head", {
        slos: String(model.slos.length),
        alerts: String(model.alerts.length),
      }),
    );
    expect(companionAnswer(model, "Why?", de).text).toContain(de.t("core.companion.corpus.ask"));
  });

  it("names what is open about a record, in English and German", () => {
    const en = companionAnswer(model, "What about Quick add?");
    expect(en.facts[0].label).toBe("STATE");
    expect(en.follow).toEqual(["Who owns Quick add?", "Which tests are missing for Quick add?"]);
    const german = companionAnswer(
      model,
      de.t("core.companion.suggest.recordOpen", { label: "Quick add" }),
      de,
    );
    expect(german.facts[0].label).toBe(de.t("core.companion.fact.state"));
    expect(german.follow[0]).toBe(de.t("core.companion.follow.owner", { label: "Quick add" }));
  });

  it("says what it sees when no area fits", () => {
    const plan = companionAnswer(model, "What is the convention here?");
    expect(plan.text).toMatch(/^I read the \d+ records under /);
    expect(plan.facts.map((entry) => entry.label)).toEqual([
      "RECORDS",
      "FILES",
      "LINES OF CODE",
      "OPEN",
    ]);
  });

  it("covers the singular and the empty branches", () => {
    const quiet = {
      ...model,
      overdue: 1,
      overdueList: model.overdueList.slice(0, 1),
      stale: 1,
      noOwner: [],
      unanchored: model.features.slice(0, 1),
      ghosts: ["x/y/z"],
      maxDepth: 1,
      noRunbook: 1,
      noObs: model.features.slice(0, 1),
      scan: { ...model.scan, orphanAnchors: [{ id: "a/b/c" }], drift: [{ id: "a/b/c" }] },
    } as unknown as typeof model;
    expect(companionAnswer(quiet, QUESTIONS.rules).text).toMatch(/^One review is overdue:/);
    expect(companionAnswer(quiet, QUESTIONS.rules).text).toMatch(/Plus one assumption/);
    expect(companionAnswer(quiet, QUESTIONS.teams).text).toMatch(/Every record has a team\.$/);
    expect(companionAnswer(quiet, QUESTIONS.code).text).toMatch(/One active feature has no entry/);
    expect(companionAnswer(quiet, QUESTIONS.code).text).toMatch(/one place in the code points/);
    expect(companionAnswer(quiet, QUESTIONS.graph).text).toMatch(/1 level deep\.\nPoints into/);
    expect(companionAnswer(quiet, QUESTIONS.ops).text).toMatch(/One alert has no runbook\./);
    expect(companionAnswer(quiet, QUESTIONS.ops).text).toMatch(/One active feature is not/);

    const none = {
      ...model,
      overdue: 0,
      overdueList: [],
      stale: 0,
      unanchored: [],
      ghosts: [],
      noRunbook: 0,
      noObs: [],
      scan: { ...model.scan, orphanAnchors: [], drift: [], scannedAt: undefined },
    } as unknown as typeof model;
    expect(companionAnswer(none, QUESTIONS.rules).text).toMatch(/^No review is overdue\./);
    expect(companionAnswer(none, QUESTIONS.rules).text).toMatch(/No assumption has gone/);
    expect(companionAnswer(none, QUESTIONS.code).text).toMatch(/Every active feature is anchored/);
    expect(companionAnswer(none, QUESTIONS.graph).text).toMatch(/Every reference resolves\.$/);
    expect(companionAnswer(none, QUESTIONS.ops).text).toMatch(/Every alert has a runbook\.$/);
    expect(companionAnswer(none, "Why?").text).not.toMatch(/as of/);
  });
});

describe("Unit tests for the companion frame", () => {
  it("states intro, footer and scope in English, and in German under the German text", () => {
    expect(COMPANION_INTRO).toMatch(/^Ask me about the loaded records/);
    expect(COMPANION_FOOT).toMatch(/^answers from the records it read/);
    expect(de.t("core.companion.intro")).not.toBe(COMPANION_INTRO);
    expect(companionScope(model, "QUALITY", null)).toMatch(
      /^sees: \d+ records · .*\nRole QUALITY$/,
    );
    expect(companionScope(model, de.t("core.roles.qa.tag"), "a/b/c", de)).toMatch(
      `${de.t("core.companion.scope", { records: de.number(model.recs.length), sources: (Array.isArray(model.rc.sources) ? model.rc.sources.join(", ") : "") || "—", lines: de.number(Number(model.scan.totalLoc) || 0) })}\n${de.t("core.companion.scopeRoleOpen", { role: de.t("core.roles.qa.tag"), id: "a/b/c" })}`,
    );
  });

  it("suggests questions about the open record, and none once something was asked", () => {
    expect(companionSuggestions(model, "tasks/create/quick-add", 0)[0]).toBe(
      "What is open on Quick add?",
    );
    expect(companionSuggestions(model, null, 2)).toEqual([]);
  });
});

describe("Unit tests for agentPlan", () => {
  it("leads from a file that was read into the record if it is one", () => {
    const plan = agentPlan(model, "The answer.", [
      "docs/facets/features/tasks/create/quick-add.yaml",
      "apps/web/src/features/quick-add/parse.ts",
    ]);

    expect(plan.sources[0].recordId).toBe("tasks/create/quick-add");
    expect(plan.sources[1].recordId).toBeNull();
    expect(plan.facts[0]).toEqual({ label: "READ", value: "2 files", meaning: "neutral" });
  });

  // A search in the index opened no file. Counting it under READ would claim
  // files nobody opened.
  it("counts searches separately from files read", () => {
    const plan = agentPlan(
      model,
      "The answer.",
      ["docs/facets/features/tasks/create/quick-add.yaml"],
      ["naming convention for promises"],
    );

    expect(plan.facts.map((entry) => entry.label)).toEqual(["READ", "SEARCHED"]);
    expect(plan.facts[0].value).toBe("1 file");
    expect(plan.facts[1].value).toBe("1 question");
    // The search does not appear among the sources: those list files.
    expect(plan.sources).toHaveLength(1);
  });

  it("does not mention searches at all when none took place", () => {
    const plan = agentPlan(model, "The answer.", ["a.ts"]);
    expect(plan.facts.map((entry) => entry.label)).toEqual(["READ"]);
  });

  it("counts the same file and the same question only once, and speaks German on request", () => {
    const plan = agentPlan(model, "x", ["a.ts", "a.ts"], ["question", "question"], de);
    expect(plan.facts[0]).toMatchObject({
      label: de.t("core.companion.fact.read"),
      value: de.t("core.companion.files.one", { count: "1" }),
    });
    expect(plan.facts[1]).toMatchObject({
      label: de.t("core.companion.fact.searched"),
      value: de.t("core.companion.questions.one", { count: "1" }),
    });
  });
});
