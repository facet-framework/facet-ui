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
    expect(companionRoute(model, "Was ist überfällig?")).toBe("rules");
    expect(companionRoute(model, "Wie hoch ist die Abdeckung?")).toBe("tests");
    expect(companionRoute(model, "Womit sollte ich anfangen?")).toBe("open");
    expect(companionRoute(model, "Wer ist zuständig?")).toBe("teams");
    expect(companionRoute(model, "Welche personenbezogenen Felder gibt es?")).toBe("data");
    expect(companionRoute(model, "Was ist nicht im Code verankert?")).toBe("code");
    expect(companionRoute(model, "Wo ist die Kopplung am stärksten?")).toBe("graph");
    expect(companionRoute(model, "Welche Alarme haben kein Runbook?")).toBe("ops");
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
      expect(plan.text).not.toMatch(/[äöüß]/);
    }
  });

  it("answers every area in German under the German text", () => {
    expect(companionAnswer(model, QUESTIONS.rules, de).facts[0].label).toBe("ÜBERFÄLLIG");
    expect(companionAnswer(model, QUESTIONS.tests, de).text).toMatch(
      /% des zugesagten Verhaltens hat eine Testzuordnung/,
    );
    expect(companionAnswer(model, QUESTIONS.open, de).text).toMatch(/^Nach Dringlichkeit sortiert/);
    expect(companionAnswer(model, QUESTIONS.teams, de).text).toMatch(/Teams? tr(a|ä)g/);
    expect(companionAnswer(model, QUESTIONS.data, de).text).toMatch(/als personenbezogen/);
    expect(companionAnswer(model, QUESTIONS.code, de).text).toMatch(/Einstiege verweisen aus/);
    expect(companionAnswer(model, QUESTIONS.graph, de).text).toMatch(/^Der Bestand hängt über/);
    expect(companionAnswer(model, QUESTIONS.ops, de).text).toMatch(/SLOs und .* Alarme/);
    expect(companionAnswer(model, "Warum?", de).text).toMatch(/^Ich lese die /);
  });

  it("names what is open about a record, in English and German", () => {
    const en = companionAnswer(model, "What about Quick add?");
    expect(en.facts[0].label).toBe("STATE");
    expect(en.follow).toEqual(["Who owns Quick add?", "Which tests are missing for Quick add?"]);
    const german = companionAnswer(model, "Was ist mit Quick add?", de);
    expect(german.facts[0].label).toBe("ZUSTAND");
    expect(german.follow[0]).toBe("Wer ist für Quick add zuständig?");
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
    expect(de.t("core.companion.intro")).toMatch(/^Frag mich nach den geladenen Records/);
    expect(companionScope(model, "QUALITY", null)).toMatch(
      /^sees: \d+ records · .*\nRole QUALITY$/,
    );
    expect(companionScope(model, "QUALITÄT", "a/b/c", de)).toMatch(
      /^sieht: \d+ Records · .*\nRolle QUALITÄT · offen a\/b\/c$/,
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
    expect(plan.facts[0]).toMatchObject({ label: "GELESEN", value: "1 Datei" });
    expect(plan.facts[1]).toMatchObject({ label: "GESUCHT", value: "1 Frage" });
  });
});
