import { localized } from "../i18n/legacy/core/focus.spec.text";
import { taskflowModel } from "./fixtures";
import { focusItems, leadSentenceFacts } from "./focus";

describe("Unit tests for focusItems", () => {
  const model = taskflowModel();
  const items = focusItems(model);

  it("planned", () => {
    expect(items.length).toBeGreaterThan(0);
  });

  it("finds open issues in the demo corpus", () => {
    const severities = items.map((item) => item.severity);
    expect(severities).toEqual([...severities].sort((a, b) => a - b));

    expect(model.overdue).toBeGreaterThan(0);
    expect(items[0].severity).toBe(0);
  });

  it("provides a readable reason for each item", () => {
    items.forEach((item) => {
      expect(item.why.length).toBeGreaterThan(3);
      expect(item.title.length).toBeGreaterThan(0);
    });
  });

  it("routes each item to a register section", () => {
    const sections = new Set(["rules", "ops", "code", "promises", "teams", "records", "graph"]);
    items.forEach((item) => expect(sections.has(item.section)).toBe(true));
  });

  it("includes evidence for each item", () => {
    items.forEach((item) => expect(item.body.length).toBeGreaterThan(0));
  });

  it("counts every untested promise", () => {
    const untested = items.filter((item) => item.why === localized.text5).length;
    expect(untested).toBe(model.scnTotal - model.scnProven);
  });

  it("reports alerts without a runbook", () => {
    const withoutRunbook = items.filter((item) => item.why === localized.text7).length;
    expect(withoutRunbook).toBe(model.noRunbook);
  });

  it("identifies promises without state transitions", () => {
    const scenarioItems = items.filter((item) => item.why === localized.text9);
    const zustaende = scenarioItems.map(
      (item) => item.body.find((row) => row.label === localized.text10)?.value,
    );
    expect(zustaende.every((value) => typeof value === "string" && value.length > 0)).toBe(true);
  });

  it("lists records without owners, descriptions or measurements", () => {
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
    const gruende = focusItems(model2).map((item) => item.why);
    expect(gruende).toContain(localized.text12);
    expect(gruende).toContain(localized.text13);
    expect(gruende).toContain(localized.text14);
  });

  it("reports references without records", () => {
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
    expect(item.why).toBe(localized.text16);
    expect(item.title).toBe("inline-edit");
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

  it("provides the lead sentence's figures", () => {
    const facts = leadSentenceFacts(model);
    expect(facts.open).toBe(focusItems(model).length);
    expect(facts.features).toBe(model.features.length);
    expect(facts.untested).toBe(model.scnTotal - model.scnProven);
    expect(facts.coverage).toBeGreaterThanOrEqual(0);
    expect(facts.coverage).toBeLessThanOrEqual(100);
  });

  it("makes no coverage calculation without promises", () => {
    expect(leadSentenceFacts({ ...model, scnTotal: 0, scnProven: 0 }).coverage).toBe(0);
  });
});
