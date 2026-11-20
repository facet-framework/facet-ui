import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { localized } from "../i18n/legacy/core/gherkin.spec.text";
import { GHERKIN_LABEL, parseGherkin, scenarioPreview, tokenizeGherkin } from "./gherkin";

describe("Unit tests for parseGherkin", () => {
  it("splits a statement into steps", () => {
    const steps = parseGherkin(localized.text2);
    expect(steps.map((step) => step.keyword)).toEqual(["GIVEN", "WHEN", "THEN"]);
  });

  it("lets And and But inherit the preceding role", () => {
    const steps = parseGherkin(localized.text4);
    expect(steps[1].parent).toBe("THEN");
    expect(steps[2].parent).toBe("THEN");
  });

  it("behandelt * wie And", () => {
    const steps = parseGherkin(localized.text5);
    expect(steps[1].keyword).toBe("AND");
  });

  it("appends continuation lines to the preceding step", () => {
    const steps = parseGherkin(localized.text7);
    expect(steps).toHaveLength(1);
    expect(steps[0].text).toBe(localized.text8);
  });

  it("accepts free text without a keyword", () => {
    const steps = parseGherkin(localized.text10);
    expect(steps[0].keyword).toBe("");
  });

  it("returns an empty list for an empty statement", () => {
    expect(parseGherkin("")).toEqual([]);
    expect(parseGherkin(undefined)).toEqual([]);
  });

  it("recognizes German step roles", () => {
    expect(GHERKIN_LABEL.GIVEN).toBe("AUSGANGSLAGE");
    expect(GHERKIN_LABEL.THEN).toBe(labelText.text331);
  });
});

describe("Unit tests for tokenizeGherkin", () => {
  it("recognizes quoted values", () => {
    expect(tokenizeGherkin(localized.text14)).toContainEqual({
      kind: "quoted",
      text: '"Einkauf"',
    });
  });

  it("recognizes placeholders", () => {
    expect(tokenizeGherkin("<nutzer> speichert")).toContainEqual({
      kind: "placeholder",
      text: "<nutzer>",
    });
  });

  it("recognizes snake_case and literals", () => {
    const tokens = tokenizeGherkin(localized.text17);
    expect(tokens).toContainEqual({ kind: "identifier", text: "conflict_state" });
    expect(tokens).toContainEqual({ kind: "literal", text: "true" });
  });

  it("recognizes numbers with units", () => {
    expect(tokenizeGherkin(remainingText.text61)).toContainEqual({
      kind: "number",
      text: "200 ms",
    });
  });

  it("preserves prose", () => {
    expect(tokenizeGherkin(localized.text20)).toEqual([{ kind: "prose", text: localized.text21 }]);
  });

  it("normalisiert Leerraum", () => {
    expect(tokenizeGherkin(localized.text22)).toEqual([{ kind: "prose", text: localized.text23 }]);
  });

  it("handles empty text", () => {
    expect(tokenizeGherkin("")).toEqual([]);
  });
});

describe("Unit tests for scenarioPreview", () => {
  it("uses the outcome as a preview", () => {
    const steps = parseGherkin(localized.text26);
    expect(scenarioPreview(steps)).toEqual({ label: labelText.text331, text: localized.text27 });
  });

  it("falls back to the final step without Then", () => {
    const steps = parseGherkin(localized.text29);
    expect(scenarioPreview(steps)).toEqual({ label: remainingText.text52, text: localized.text30 });
  });

  it("returns nothing without steps", () => {
    expect(scenarioPreview([])).toBeNull();
  });
});
