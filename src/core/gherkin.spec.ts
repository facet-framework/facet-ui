import { createText } from "../facet/i18n/text";
import { GHERKIN_LABEL, parseGherkin, scenarioPreview, tokenizeGherkin } from "./gherkin";
import { gherkinLabel } from "./labels";

describe("Unit tests for parseGherkin", () => {
  it("splits a statement into steps", () => {
    const steps = parseGherkin("Given a list\nWhen something is typed\nThen it is created");
    expect(steps.map((step) => step.keyword)).toEqual(["GIVEN", "WHEN", "THEN"]);
  });

  it("lets And and But inherit their role", () => {
    const steps = parseGherkin("Then it is created\nAnd appears at the top\nBut not twice");
    expect(steps[1].parent).toBe("THEN");
    expect(steps[2].parent).toBe("THEN");
  });

  it("treats * like And", () => {
    const steps = parseGherkin("When something is typed\n* and saved");
    expect(steps[1].keyword).toBe("AND");
  });

  it("appends continuation lines to the previous step", () => {
    const steps = parseGherkin("Given a list\n  with three entries");
    expect(steps).toHaveLength(1);
    expect(steps[0].text).toBe("a list with three entries");
  });

  it("accepts free text without a keyword", () => {
    const steps = parseGherkin("no keyword");
    expect(steps[0].keyword).toBe("");
  });

  it("returns an empty list for an empty statement", () => {
    expect(parseGherkin("")).toEqual([]);
    expect(parseGherkin(undefined)).toEqual([]);
  });

  it("names the roles in English by default and in German under the German text", () => {
    expect(GHERKIN_LABEL.GIVEN).toBe("GIVEN");
    expect(gherkinLabel("THEN")).toBe("THEN");
    const de = createText("de");
    expect(gherkinLabel("GIVEN", de)).toBe("AUSGANGSLAGE");
    expect(gherkinLabel("WHEN", de)).toBe("AKTION");
    expect(gherkinLabel("THEN", de)).toBe("ERGEBNIS");
    expect(gherkinLabel("AND", de)).toBe("UND");
    expect(gherkinLabel("BUT", de)).toBe("ABER");
  });
});

describe("Unit tests for tokenizeGherkin", () => {
  it("recognises quoted values", () => {
    expect(tokenizeGherkin('a list "Groceries" exists')).toContainEqual({
      kind: "quoted",
      text: '"Groceries"',
    });
  });

  it("recognises placeholders", () => {
    expect(tokenizeGherkin("<user> saves")).toContainEqual({
      kind: "placeholder",
      text: "<user>",
    });
  });

  it("recognises snake_case and literals", () => {
    const tokens = tokenizeGherkin("conflict_state is true");
    expect(tokens).toContainEqual({ kind: "identifier", text: "conflict_state" });
    expect(tokens).toContainEqual({ kind: "literal", text: "true" });
  });

  it("recognises numbers with a unit", () => {
    expect(tokenizeGherkin("after 200 ms")).toContainEqual({ kind: "number", text: "200 ms" });
  });

  it("recognises English and German units, since statements are written in the project's language", () => {
    expect(tokenizeGherkin("within 3 days")).toContainEqual({ kind: "number", text: "3 days" });
    // German record content: the unit stays recognisable.
    expect(tokenizeGherkin("binnen 2 Stunden")).toContainEqual({
      kind: "number",
      text: "2 Stunden",
    });
  });

  it("returns prose unchanged", () => {
    expect(tokenizeGherkin("is created")).toEqual([{ kind: "prose", text: "is created" }]);
  });

  it("normalises whitespace", () => {
    expect(tokenizeGherkin("  two   words \n")).toEqual([{ kind: "prose", text: "two words" }]);
  });

  it("copes with empty text", () => {
    expect(tokenizeGherkin("")).toEqual([]);
  });
});

describe("Unit tests for scenarioPreview", () => {
  it("takes the outcome as the preview", () => {
    const steps = parseGherkin("Given a list\nThen it is created");
    expect(scenarioPreview(steps)).toEqual({ label: "THEN", text: "it is created" });
    expect(scenarioPreview(steps, createText("de"))).toEqual({
      label: "ERGEBNIS",
      text: "it is created",
    });
  });

  it("falls back to the last step without a Then", () => {
    const steps = parseGherkin("Given a list\nWhen something is typed");
    expect(scenarioPreview(steps)).toEqual({ label: "PROMISE", text: "something is typed" });
    expect(scenarioPreview(steps, createText("de"))?.label).toBe("ZUSAGE");
  });

  it("returns nothing without steps", () => {
    expect(scenarioPreview([])).toBeNull();
  });
});
