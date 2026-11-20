import { labelText } from "../i18n/legacy/labels";
import { localized } from "../i18n/legacy/core/glossary.spec.text";
import { glossaryTermList, linkTerms, lookupTerm, parseGlossary } from "./glossary";

const CONSIGNEE = localized.text1;

describe("parseGlossary", () => {
  it("reads terms, definitions and renderings", () => {
    const glossary = parseGlossary(CONSIGNEE);
    expect(glossary?.terms.map((t) => t.term)).toEqual(["Consignee", "Bill of Lading"]);
    expect(glossary?.terms[0].definition).toContain(labelText.extra16);
    expect(glossary?.terms[1].renderings).toEqual({ de: labelText.text448 });
    expect(glossary?.schemaVersion).toBe("1.10");
  });

  it("returns null without a file", () => {
    expect(parseGlossary(undefined)).toBeNull();
    expect(parseGlossary("")).toBeNull();
    expect(parseGlossary("   \n")).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(parseGlossary('schema_version: "1.10"\nterms: []\n')).toBeNull();
  });

  it("returns null rather than throwing for invalid YAML", () => {
    expect(parseGlossary('schema_version: "1.10"\nterms: [\n')).toBeNull();
  });

  it("skips incomplete entries without discarding the rest", () => {
    const glossary = parseGlossary(localized.text7);
    expect(glossary?.terms.map((t) => t.term)).toEqual(["Consignee"]);
  });
});

describe("linkTerms", () => {
  const terms = ["Consignee", "Order", "Order Line"];

  it("splits prose into text and terms", () => {
    expect(linkTerms(localized.text9, terms)).toEqual([
      { kind: "text", text: localized.text10 },
      { kind: "term", text: "Consignee", term: "Consignee" },
      { kind: "text", text: localized.text11 },
    ]);
  });

  it("does not link terms within longer words", () => {
    for (const text of [localized.text13, localized.text14]) {
      expect(linkTerms(text, terms)).toEqual([{ kind: "text", text }]);
    }
  });

  it("does not link terms beginning inside a word", () => {
    expect(linkTerms(localized.text16, terms)).toEqual([
      { kind: "text", text: localized.text17 },
      { kind: "term", text: "Order", term: "Order" },
      { kind: "text", text: "." },
    ]);
  });

  it("matches case exactly", () => {
    const text = localized.text19;
    expect(linkTerms(text, terms)).toEqual([{ kind: "text", text }]);
  });

  it("prefers the longer term at the same position", () => {
    expect(linkTerms(localized.text21, terms)).toEqual([
      { kind: "text", text: localized.text22 },
      { kind: "term", text: "Order Line", term: "Order Line" },
      { kind: "text", text: localized.text23 },
    ]);
  });

  it("finds every occurrence", () => {
    const parts = linkTerms(localized.text25, terms);
    expect(parts.filter((p) => p.kind === "term")).toHaveLength(2);
  });

  it("recognizes hyphens and punctuation as word boundaries", () => {
    expect(linkTerms(localized.text27, terms)).toEqual([
      { kind: "term", text: "Order", term: "Order" },
      { kind: "text", text: localized.text28 },
      { kind: "term", text: "Order Line", term: "Order Line" },
      { kind: "text", text: "." },
    ]);
  });

  it("preserves text when there are no terms", () => {
    expect(linkTerms(localized.text30, [])).toEqual([{ kind: "text", text: localized.text31 }]);
    expect(linkTerms("", terms)).toEqual([]);
  });

  it("loses no characters", () => {
    const text = localized.text33;
    const rebuilt = linkTerms(text, terms)
      .map((p) => p.text)
      .join("");
    expect(rebuilt).toBe(text);
  });
});

describe("glossaryTermList and lookupTerm", () => {
  it("lists the longest terms first for matching", () => {
    expect(glossaryTermList(parseGlossary(CONSIGNEE))).toEqual(["Bill of Lading", "Consignee"]);
  });

  it("returns an empty list rather than undefined without a glossary", () => {
    expect(glossaryTermList(null)).toEqual([]);
    expect(lookupTerm(null, "Consignee")).toBeNull();
  });

  it("looks up terms exactly", () => {
    const glossary = parseGlossary(CONSIGNEE);
    expect(lookupTerm(glossary, "Consignee")?.definition).toContain(labelText.extra16);

    expect(lookupTerm(glossary, "consignee")).toBeNull();
  });
});
