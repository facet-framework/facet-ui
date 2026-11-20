import { de, en, type TextKey } from ".";

const REASONING: readonly RegExp[] = [
  /\bbecause\b/i,
  /\btherefore\b/i,
  /\bhence\b/i,
  /\bthat is why\b/i,
  /\bon purpose\b/i,
  /\bnot shown\b/i,
  /\bso that\b/i,
  /, so (it|they|there|no|nothing|this|that)\b/i,
  /\bweil\b/i,
  /\bdeshalb\b/i,
  /\bdaher\b/i,
  /\bdarum\b/i,
  /\bdeswegen\b/i,
  /\bnämlich\b/i,
  /\bsodass\b/i,
  /\bso dass\b/i,
  /\bdamit\b/i,
  /, also\b/i,
  /\bsteht (es|sie|er) hier nicht\b/i,
  /\bnicht angezeigt\b/i,
];

const ALLOWED: ReadonlyMap<TextKey, string> = new Map<TextKey, string>([
  ["b.knowledge.discoverability.question", "„damit“ = with it: „Wo beginnt man damit im Produkt?“"],
]);

const reasoning = (text: string) => REASONING.find((re) => re.test(text));

describe("no design prose in the FACET design system dictionaries", () => {
  it("catches explanatory prose in both languages", () => {
    expect(
      reasoning(
        "Ob der Host sammelt, wie lange er aufbewahrt und wohin er schreibt, meldet er Atlas nicht — deshalb steht es hier nicht.",
      ),
    ).toBeDefined();
    expect(
      reasoning(
        "Whether the host collects, how long it keeps data and where it writes are not reported to Atlas, so they are not shown here.",
      ),
    ).toBeDefined();
    expect(reasoning("Every promise is therefore open.")).toBeDefined();

    expect(reasoning("Nothing open.")).toBeUndefined();
    expect(reasoning("Noch kein früherer Ort.")).toBeUndefined();
    expect(reasoning("Install and grant in the terminal.")).toBeUndefined();
  });

  it("has no English text that gives a reason", () => {
    const hits = Object.entries(en)
      .filter(([key, text]) => !ALLOWED.has(key as TextKey) && reasoning(text))
      .map(([key, text]) => `${key}: ${text}`);
    expect(hits).toEqual([]);
  });

  it("has no German text that gives a reason", () => {
    const hits = Object.entries(de)
      .filter(([key, text]) => !ALLOWED.has(key as TextKey) && reasoning(text))
      .map(([key, text]) => `${key}: ${text}`);
    expect(hits).toEqual([]);
  });

  it("allows only keys that exist and still use the word", () => {
    for (const key of ALLOWED.keys()) {
      expect(reasoning(en[key]) ?? reasoning(de[key])).toBeDefined();
    }
  });
});
