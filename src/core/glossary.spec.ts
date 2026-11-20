import { glossaryTermList, linkTerms, lookupTerm, parseGlossary } from "./glossary";

const CONSIGNEE = `schema_version: "1.10"
terms:
  - term: Consignee
    definition: |
      The party named in the transport document who receives the goods at
      the destination — not necessarily the buyer.
  - term: Bill of Lading
    definition: |
      The document the carrier issues for the goods taken over.
    renderings:
      de: Konnossement
`;

describe("parseGlossary", () => {
  it("reads terms, definitions and renderings", () => {
    const glossary = parseGlossary(CONSIGNEE);
    expect(glossary?.terms.map((t) => t.term)).toEqual(["Consignee", "Bill of Lading"]);
    expect(glossary?.terms[0].definition).toContain("transport document");
    expect(glossary?.terms[1].renderings).toEqual({ de: "Konnossement" });
    expect(glossary?.schemaVersion).toBe("1.10");
  });

  // "Not declared" and "declared, but empty" are opposite statements. A view
  // that confuses them claims something about a project without the file that
  // nobody said — the same rule as for the taxonomy.
  it("returns null when there is no file", () => {
    expect(parseGlossary(undefined)).toBeNull();
    expect(parseGlossary("")).toBeNull();
    expect(parseGlossary("   \n")).toBeNull();
  });

  it("returns null when the list is empty", () => {
    expect(parseGlossary('schema_version: "1.10"\nterms: []\n')).toBeNull();
  });

  // The linter is the place that makes a broken glossary loud. A reader that
  // fails to start because of a file a project does not even have to have has
  // lost every other view along with it.
  it("returns null instead of throwing when the YAML is broken", () => {
    expect(parseGlossary('schema_version: "1.10"\nterms: [\n')).toBeNull();
  });

  // An entry without a term or without a definition is nothing to the reader:
  // the first has no text to link, the second nothing to show.
  it("skips incomplete entries instead of discarding the rest", () => {
    const glossary = parseGlossary(`schema_version: "1.10"
terms:
  - term: Consignee
    definition: |
      Die benannte Partei.
  - term: ""
    definition: |
      Without a term.
  - term: Carrier
`);
    expect(glossary?.terms.map((t) => t.term)).toEqual(["Consignee"]);
  });
});

describe("linkTerms", () => {
  const terms = ["Consignee", "Order", "Order Line"];

  it("splits prose into text and terms", () => {
    expect(linkTerms("The Consignee is notified.", terms)).toEqual([
      { kind: "text", text: "The " },
      { kind: "term", text: "Consignee", term: "Consignee" },
      { kind: "text", text: " is notified." },
    ]);
  });

  // Whole word or not at all. A substring would link half of every sentence,
  // and no setting rescues that.
  it("links no term inside a longer word", () => {
    for (const text of ["Reordering is no Ordering.", "The Consigneelist."]) {
      expect(linkTerms(text, terms)).toEqual([{ kind: "text", text }]);
    }
  });

  // The boundary must hold at the *start* too, not only at the end: "ReOrder"
  // carries the term capitalised inside it and ends cleanly, and without the
  // check on the character before it the second half of the word would match.
  it("links no term that starts in the middle of a word", () => {
    expect(linkTerms("A ReOrder is no Order.", terms)).toEqual([
      { kind: "text", text: "A ReOrder is no " },
      { kind: "term", text: "Order", term: "Order" },
      { kind: "text", text: "." },
    ]);
  });

  it("matches case exactly", () => {
    const text = "The consignee stands in lower case.";
    expect(linkTerms(text, terms)).toEqual([{ kind: "text", text }]);
  });

  // Where two terms start at the same position, the longer one wins: whoever
  // declared "Order Line" means "Order Line" at that position.
  it("takes the longer term where two start at the same position", () => {
    expect(linkTerms("The Order Line is changed.", terms)).toEqual([
      { kind: "text", text: "The " },
      { kind: "term", text: "Order Line", term: "Order Line" },
      { kind: "text", text: " is changed." },
    ]);
  });

  it("finds every occurrence, not only the first", () => {
    const parts = linkTerms("Consignee and Consignee.", terms);
    expect(parts.filter((p) => p.kind === "term")).toHaveLength(2);
  });

  it("treats hyphens and punctuation as word boundaries", () => {
    expect(linkTerms("Order-Line, not Order Line.", terms)).toEqual([
      { kind: "term", text: "Order", term: "Order" },
      { kind: "text", text: "-Line, not " },
      { kind: "term", text: "Order Line", term: "Order Line" },
      { kind: "text", text: "." },
    ]);
  });

  // Without a glossary the prose stays the prose. A project without the file
  // has not failed to define something.
  it("returns the text unchanged when there are no terms", () => {
    expect(linkTerms("A sentence.", [])).toEqual([{ kind: "text", text: "A sentence." }]);
    expect(linkTerms("", terms)).toEqual([]);
  });

  it("loses no character", () => {
    const text = "Consignee, Order Line and Order at the end: Consignee";
    const rebuilt = linkTerms(text, terms)
      .map((p) => p.text)
      .join("");
    expect(rebuilt).toBe(text);
  });
});

describe("glossaryTermList and lookupTerm", () => {
  it("lists the terms longest first, so linking tries them in that order", () => {
    expect(glossaryTermList(parseGlossary(CONSIGNEE))).toEqual(["Bill of Lading", "Consignee"]);
  });

  it("is empty rather than undefined when the glossary is missing", () => {
    expect(glossaryTermList(null)).toEqual([]);
    expect(lookupTerm(null, "Consignee")).toBeNull();
  });

  it("looks up a term exactly", () => {
    const glossary = parseGlossary(CONSIGNEE);
    expect(lookupTerm(glossary, "Consignee")?.definition).toContain("transport document");
    // Case is part of the identifier, not cosmetics.
    expect(lookupTerm(glossary, "consignee")).toBeNull();
  });
});
