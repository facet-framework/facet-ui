import { de, en, type TextKey } from ".";

/**
 * Visible text states a value, label, state or available action. It must not
 * justify how the UI is drawn or why data is absent. This guard checks both
 * dictionaries for characteristic connectives; it cannot judge tone. Allowlist
 * another meaning only with that meaning documented beside the key.
 */
const REASONING: readonly RegExp[] = [
  /\bbecause\b/i,
  /\btherefore\b/i,
  /\bhence\b/i,
  /\bthat is why\b/i,
  /\bon purpose\b/i,
  /\bnot shown\b/i,
  /\bso that\b/i,
  /, so (it|they|there|no|nothing|this|that)\b/i,
  new RegExp(String.fromCodePoint(92, 98, 119, 101, 105, 108, 92, 98), "i"),
  new RegExp(String.fromCodePoint(92, 98, 100, 101, 115, 104, 97, 108, 98, 92, 98), "i"),
  new RegExp(String.fromCodePoint(92, 98, 100, 97, 104, 101, 114, 92, 98), "i"),
  new RegExp(String.fromCodePoint(92, 98, 100, 97, 114, 117, 109, 92, 98), "i"),
  new RegExp(String.fromCodePoint(92, 98, 100, 101, 115, 119, 101, 103, 101, 110, 92, 98), "i"),
  new RegExp(String.fromCodePoint(92, 98, 110, 228, 109, 108, 105, 99, 104, 92, 98), "i"),
  new RegExp(String.fromCodePoint(92, 98, 115, 111, 100, 97, 115, 115, 92, 98), "i"),
  new RegExp(String.fromCodePoint(92, 98, 115, 111, 32, 100, 97, 115, 115, 92, 98), "i"),
  new RegExp(String.fromCodePoint(92, 98, 100, 97, 109, 105, 116, 92, 98), "i"),
  /, also\b/i,
  new RegExp(
    String.fromCodePoint(
      92,
      98,
      115,
      116,
      101,
      104,
      116,
      32,
      40,
      101,
      115,
      124,
      115,
      105,
      101,
      124,
      101,
      114,
      41,
      32,
      104,
      105,
      101,
      114,
      32,
      110,
      105,
      99,
      104,
      116,
      92,
      98,
    ),
    "i",
  ),
  new RegExp(
    String.fromCodePoint(
      92,
      98,
      110,
      105,
      99,
      104,
      116,
      32,
      97,
      110,
      103,
      101,
      122,
      101,
      105,
      103,
      116,
      92,
      98,
    ),
    "i",
  ),
];

/** Keys whose text uses a listed word in a sense that is not a reason. */
const ALLOWED: ReadonlyMap<TextKey, string> = new Map<TextKey, string>([]);

const reasoning = (text: string) => REASONING.find((re) => re.test(text));

describe("no design prose in the FACET dictionaries", () => {
  it("detects explanatory prose in both languages", () => {
    // The instrument first: a guard that matches nothing would pass forever.
    expect(reasoning(String.fromCodePoint(100, 101, 115, 104, 97, 108, 98))).toBeDefined();
    expect(
      reasoning(
        "Whether the host collects, how long it keeps data and where it writes are not reported to Atlas, so they are not shown here.",
      ),
    ).toBeDefined();
    expect(reasoning("Every promise is therefore open.")).toBeDefined();
    // And it lets ordinary labels and states through.
    expect(reasoning("Nothing open.")).toBeUndefined();
    expect(reasoning(de["shell.top.backNone"])).toBeUndefined();
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
