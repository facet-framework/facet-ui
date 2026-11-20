import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { localized } from "../i18n/legacy/core/companion.spec.text";
import { agentPlan, companionAnswer, companionRecord, companionRoute } from "./companion";
import { taskflowModel } from "./fixtures";

const model = taskflowModel();

describe("Unit tests for companionRoute", () => {
  it("recognizes a record by name", () => {
    expect(companionRoute(model, localized.text2)).toBe("record");
    expect(companionRecord(model, localized.text3)?.id).toBe("tasks/create/quick-add");
  });

  it("routes questions to the counted areas", () => {
    expect(companionRoute(model, localized.text5)).toBe("rules");
    expect(companionRoute(model, localized.text6)).toBe("tests");
    expect(companionRoute(model, labelText.text388)).toBe("open");
    expect(companionRoute(model, localized.text7)).toBe("teams");
    expect(companionRoute(model, localized.text8)).toBe("data");
    expect(companionRoute(model, localized.text9)).toBe("code");
    expect(companionRoute(model, localized.text10)).toBe("graph");
    expect(companionRoute(model, localized.text11)).toBe("ops");
  });

  it("falls back to corpus when no area matches", () => {
    expect(companionRoute(model, localized.text13)).toBe("corpus");
    expect(companionRoute(model, localized.text14)).toBe("corpus");
  });

  it("selects the planner's answer", () => {
    expect(companionAnswer(model, localized.text16).openId).toBe("tasks/create/quick-add");
    expect(companionAnswer(model, localized.text17).section).toBe("rules");
    expect(companionAnswer(model, localized.text18).section).toBeNull();
  });
});

describe("Unit tests for agentPlan", () => {
  it("opens a record from a read file when it is a record", () => {
    const plan = agentPlan(model, localized.text20, [
      "docs/facets/features/tasks/create/quick-add.yaml",
      "apps/web/src/features/quick-add/parse.ts",
    ]);

    expect(plan.sources[0].recordId).toBe("tasks/create/quick-add");
    expect(plan.sources[1].recordId).toBeNull();
    expect(plan.facts[0]).toEqual({
      label: "GELESEN",
      value: localized.text21,
      meaning: "neutral",
    });
  });

  it("counts searches separately from read files", () => {
    const plan = agentPlan(
      model,
      localized.text23,
      ["docs/facets/features/tasks/create/quick-add.yaml"],
      [localized.text24],
    );

    expect(plan.facts.map((entry) => entry.label)).toEqual(["GELESEN", "GESUCHT"]);
    expect(plan.facts[0].value).toBe(labelText.text405);
    expect(plan.facts[1].value).toBe(remainingText.text31);

    expect(plan.sources).toHaveLength(1);
  });

  it("omits search counts when no search ran", () => {
    const plan = agentPlan(model, localized.text26, ["a.ts"]);
    expect(plan.facts.map((entry) => entry.label)).toEqual(["GELESEN"]);
  });

  it("counts each file and question only once", () => {
    const plan = agentPlan(model, "x", ["a.ts", "a.ts"], ["question", "question"]);
    expect(plan.facts[0].value).toBe(labelText.text405);
    expect(plan.facts[1].value).toBe(remainingText.text31);
  });
});
