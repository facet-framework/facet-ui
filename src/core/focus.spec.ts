import { createText } from "../facet/i18n/text";
import { taskflowModel } from "./fixtures";
import { focusItems, leadSentenceFacts } from "./focus";

describe("Unit tests for focusItems", () => {
  const model = taskflowModel();
  const items = focusItems(model);

  it("finds open items in the demo corpus", () => {
    expect(items.length).toBeGreaterThan(0);
  });

  it("puts deadlines first", () => {
    const severities = items.map((item) => item.severity);
    expect(severities).toEqual([...severities].sort((a, b) => a - b));
    // The demo corpus has an expired deadline. The condition that used to be
    // here made the assertion worthless: without a deadline the test would
    // have checked nothing and passed anyway.
    expect(model.overdue).toBeGreaterThan(0);
    expect(items[0].severity).toBe(0);
  });

  it("names a plain-text reason for every item", () => {
    items.forEach((item) => {
      expect(item.why.length).toBeGreaterThan(3);
      expect(item.title.length).toBeGreaterThan(0);
    });
  });

  it("leads every item into a register section", () => {
    const sections = new Set(["rules", "ops", "code", "promises", "teams", "records", "graph"]);
    items.forEach((item) => expect(sections.has(item.section)).toBe(true));
  });

  it("brings its evidence along with every item", () => {
    items.forEach((item) => expect(item.body.length).toBeGreaterThan(0));
  });

  it("counts untested promises completely", () => {
    const untested = items.filter((item) => item.why === "Promise without a test").length;
    expect(untested).toBe(model.scnTotal - model.scnProven);
  });

  it("reports alerts without a runbook", () => {
    const withoutRunbook = items.filter((item) => item.why === "Alert without a runbook").length;
    expect(withoutRunbook).toBe(model.noRunbook);
  });

  it("names promises without a state change as such", () => {
    const scenarioItems = items.filter((item) => item.why === "Promise without a test");
    const states = scenarioItems.map(
      (item) => item.body.find((row) => row.label === "State")?.value,
    );
    expect(states.every((value) => typeof value === "string" && value.length > 0)).toBe(true);
  });

  it("lists records without ownership, without a description and without measurement", () => {
    const model2 = {
      ...model,
      overdueList: [],
      assumptions: [],
      alerts: [],
      unanchored: [],
      allScn: [],
      ghosts: [],
      noOwner: [model.recs[0]],
      noIntent: [model.recs[1]],
      noObs: [model.features[0]],
    };
    const reasons = focusItems(model2).map((item) => item.why);
    expect(reasons).toContain("no owner");
    expect(reasons).toContain("no description");
    expect(reasons).toContain("active, but nothing is measured");
    const german = focusItems(model2, createText("de")).map((item) => item.why);
    expect(german).toContain("ohne Zuständigkeit");
    expect(german).toContain("ohne Beschreibung");
    expect(german).toContain("aktiv, aber nichts wird gemessen");
  });

  it("reports references without a record", () => {
    const model2 = {
      ...model,
      overdueList: [],
      assumptions: [],
      alerts: [],
      unanchored: [],
      allScn: [],
      noOwner: [],
      noIntent: [],
      noObs: [],
      ghosts: ["tasks/edit/inline-edit"],
    };
    const [item] = focusItems(model2);
    expect(item.why).toBe("Reference without a record");
    expect(item.title).toBe("inline-edit");
  });

  it("speaks German labels and roles under the German text", () => {
    const german = focusItems(model, createText("de"));
    const untested = german.find((item) => item.why === "Zusage ohne Test");
    expect(untested?.body.map((row) => row.label)).toEqual(["Record", "Zusage", "Zustand", "Test"]);
    const promise = items.find((item) => item.why === "Promise without a test");
    expect(promise?.body.find((row) => row.label === "Promise")?.value).toMatch(
      /^(GIVEN|WHEN|THEN|AND|BUT) · /m,
    );
    expect(untested?.body.find((row) => row.label === "Zusage")?.value).toMatch(/AUSGANGSLAGE · /);
  });

  it("stays empty for an empty model", () => {
    const empty = focusItems({
      ...model,
      overdueList: [],
      assumptions: [],
      alerts: [],
      unanchored: [],
      allScn: [],
      noOwner: [],
      noIntent: [],
      noObs: [],
      ghosts: [],
    });
    expect(empty).toEqual([]);
  });
});

describe("Unit tests for leadSentenceFacts", () => {
  const model = taskflowModel();

  it("returns the numbers of the lead sentence", () => {
    const facts = leadSentenceFacts(model);
    expect(facts.open).toBe(focusItems(model).length);
    expect(facts.features).toBe(model.features.length);
    expect(facts.untested).toBe(model.scnTotal - model.scnProven);
    expect(facts.coverage).toBeGreaterThanOrEqual(0);
    expect(facts.coverage).toBeLessThanOrEqual(100);
  });

  it("computes no coverage without promises", () => {
    expect(leadSentenceFacts({ ...model, scnTotal: 0, scnProven: 0 }).coverage).toBe(0);
  });
});
