import { createText } from "../facet/i18n/text";
import { thrown } from "../../test/thrown";
import { parseYaml, YamlError, yamlErrorText } from "./yaml";

const germanText = createText("de");

describe("Unit tests for parseYaml", () => {
  it("reads nested block maps", () => {
    expect(parseYaml("intent:\n  summary: Creates a task\n")).toEqual({
      intent: { summary: "Creates a task" },
    });
  });

  it("reads sequences of scalars", () => {
    expect(parseYaml("decision_records:\n  - ADR-007\n  - ADR-019\n")).toEqual({
      decision_records: ["ADR-007", "ADR-019"],
    });
  });

  it("reads `- key: value` as a map in the list entry", () => {
    expect(parseYaml("scenarios:\n  - id: task-added\n    proven: true\n")).toEqual({
      scenarios: [{ id: "task-added", proven: true }],
    });
  });

  it("reads block scalars with | and keeps line breaks", () => {
    expect(parseYaml("statement: |\n  Given a list\n  When typing\n")).toEqual({
      statement: "Given a list\nWhen typing\n",
    });
  });

  it("cuts off the trailing newline with |-", () => {
    expect(parseYaml("text: |-\n  one line\n")).toEqual({ text: "one line" });
  });

  it("folds block scalars with >", () => {
    expect(parseYaml("text: >\n  one\n  line\n")).toEqual({ text: "one line\n" });
  });

  it("recognises numbers, booleans and null", () => {
    expect(parseYaml("a: 42\nb: 1.5\nc: true\nd: false\ne: null\nf: ~\n")).toEqual({
      a: 42,
      b: 1.5,
      c: true,
      d: false,
      e: null,
      f: null,
    });
  });

  it("reads flow collections", () => {
    expect(parseYaml("proves: [task-added, offline-added]\nowner: {team: core, n: 2}\n")).toEqual({
      proves: ["task-added", "offline-added"],
      owner: { team: "core", n: 2 },
    });
  });

  it("removes comments, but not inside quotes", () => {
    expect(parseYaml('a: value # comment\nb: "value # no comment"\n')).toEqual({
      a: "value",
      b: "value # no comment",
    });
  });

  it("skips document markers and blank lines", () => {
    expect(parseYaml("---\n\nid: a\n\n...\n")).toEqual({ id: "a" });
  });

  it("returns null for empty text", () => {
    expect(parseYaml("\n\n")).toBeNull();
  });

  it("throws on tabs as indentation — with a line number", () => {
    expect(() => parseYaml("a:\n\tb: 1\n")).toThrow(YamlError);
  });

  it("throws on a line without a colon", () => {
    const error = thrown(() => parseYaml("id: a\nloose line\n"));

    expect(error).toBeInstanceOf(YamlError);
    expect((error as YamlError).line).toBe(1);
  });

  it("throws on an unclosed flow sequence", () => {
    expect(() => parseYaml("a: [1, 2\n")).toThrow(YamlError);
  });

  it("requires text as input", () => {
    expect(() => parseYaml(undefined as unknown as string)).toThrow(YamlError);
  });

  it("names the line number in plain text, counting from 1", () => {
    expect(new YamlError("broken", 41).message).toBe("broken (line 42)");
  });

  it("renders its own messages in the language of the surface", () => {
    const error = thrown(() => parseYaml("a:\n\tb: 1\n")) as YamlError;
    expect(error.message).toBe("Tabs are not allowed as indentation (line 2)");
    expect(yamlErrorText(error)).toBe("Tabs are not allowed as indentation (line 2)");
    expect(yamlErrorText(error, createText("de"))).toBe(
      germanText.t("core.yaml.atLine", { message: germanText.t("core.yaml.tabIndent"), line: "2" }),
    );
    // An error without a key keeps its message.
    expect(yamlErrorText(new YamlError("broken"), createText("de"))).toBe("broken");
  });
});

describe("Multi-line flow collections", () => {
  // This is how Prettier formats a long list. The reader rejected it while
  // the linter accepted it — a record that exists in only one of the two.
  it("reads a sequence whose bracket stands alone on its line", () => {
    const doc = parseYaml(
      [
        "verification:",
        "  integration_tests:",
        "    - id: host",
        "      proves:",
        "        [",
        "          below-minimum-no-start,",
        "          all-ready-starts-countdown,",
        "        ]",
        "    - id: gast",
        "      proves: [guest-starts-only-on-start-signal]",
        "",
      ].join("\n"),
    ) as { verification: { integration_tests: { id: string; proves: string[] }[] } };

    expect(doc.verification.integration_tests[0].proves).toEqual([
      "below-minimum-no-start",
      "all-ready-starts-countdown",
    ]);
    // The short form next to it must not be dragged along.
    expect(doc.verification.integration_tests[1].proves).toEqual([
      "guest-starts-only-on-start-signal",
    ]);
  });

  it("reads a sequence that starts on the key line and ends below", () => {
    const doc = parseYaml(["proves: [eins,", "  zwei,", "  drei]", ""].join("\n"));
    expect(doc).toEqual({ proves: ["eins", "zwei", "drei"] });
  });

  it("reads a multi-line flow map", () => {
    const doc = parseYaml(
      ["owner:", "  {", "    team: mp,", "    contact: nina,", "  }", ""].join("\n"),
    );
    expect(doc).toEqual({ owner: { team: "mp", contact: "nina" } });
  });

  it("reads a flow map as a plain list entry, not as a compact map", () => {
    // `keyLine` knows no bracket depth: without the order below it would grab
    // the first colon — the one inside the flow map — and pass "{ method" on
    // to `scalar()` as a broken key.
    const doc = parseYaml(["gate_calls:", '  - { method: "secret.get" }', ""].join("\n"));
    expect(doc).toEqual({ gate_calls: [{ method: "secret.get" }] });
  });

  it("reads a multi-line flow sequence as an entry of a block sequence", () => {
    const doc = parseYaml(["- [a,", "  b]", "- kurz", ""].join("\n"));
    expect(doc).toEqual([["a", "b"], "kurz"]);
  });

  it("does not mistake a bracket in text for a collection", () => {
    const doc = parseYaml(['proves: ["a, b",', '  "c]d"]', ""].join("\n"));
    expect(doc).toEqual({ proves: ["a, b", "c]d"] });
  });

  it("names the line when the bracket is never closed", () => {
    const error = thrown(() => parseYaml(["proves:", "  [", "    eins,", ""].join("\n")));
    expect(error).toBeInstanceOf(YamlError);
    expect((error as YamlError).message).toContain("Unclosed flow collection");
    expect((error as YamlError).line).toBe(1);
  });
});

describe("Multi-line unquoted scalars", () => {
  // Long running text without quotes — such as `knowledge.*.answer` — is
  // valid YAML and as common in the reported failure as the quoted
  // `intent.summary`. A scalar has no child line, so every deeper-indented
  // following line is a continuation, not a new node.
  it("folds a single line break into a space", () => {
    const doc = parseYaml(
      ["answer: Operators must set a map of account_id-to-URL", "  pairs.", ""].join("\n"),
    );
    expect(doc).toEqual({ answer: "Operators must set a map of account_id-to-URL pairs." });
  });

  it("folds a blank line between two lines into a real line break", () => {
    const doc = parseYaml(["answer: firstr Satz.", "", "  secondr Satz.", ""].join("\n"));
    expect(doc).toEqual({ answer: "firstr Satz.\nsecondr Satz." });
  });

  it("reads a multi-line answer next to a second knowledge question", () => {
    const doc = parseYaml(
      [
        "knowledge:",
        "  prerequisite_knowledge:",
        "    answer: Operators must set EXAMPLE_STORAGE_ROOT before importing files",
        "      into a writable directory (relative paths use the project root).",
        "  not_for:",
        "    answer: Not for read-only storage.",
        "",
      ].join("\n"),
    ) as { knowledge: Record<string, { answer: string }> };

    expect(doc.knowledge.prerequisite_knowledge.answer).toBe(
      "Operators must set EXAMPLE_STORAGE_ROOT before importing files " +
        "into a writable directory (relative paths use the project root).",
    );
    expect(doc.knowledge.not_for.answer).toBe("Not for read-only storage.");
  });

  it("leaves a complete scalar untouched when nothing follows", () => {
    expect(parseYaml("a: 42\nb: kurzer Text\n")).toEqual({ a: 42, b: "kurzer Text" });
  });
});

describe("Multi-line quoted scalars", () => {
  // This is exactly how Prettier wraps a long `summary:` line: single
  // quotes, one clause per line, a blank line between the lines. Valid
  // YAML — a reader that cannot handle it rejects records the linter
  // accepts.
  it("folds a single line break into a space", () => {
    const doc = parseYaml(["summary: 'one line", "  goes on here'", ""].join("\n")) as {
      summary: string;
    };
    expect(doc.summary).toBe("one line goes on here");
  });

  it("folds a blank line between two lines into a real line break", () => {
    const doc = parseYaml(["summary: 'firstr Satz.", "", "  secondr Satz.'", ""].join("\n")) as {
      summary: string;
    };
    expect(doc.summary).toBe("firstr Satz.\nsecondr Satz.");
  });

  it("removes doubled quotes across lines (escaped ')", () => {
    const doc = parseYaml(
      ["summary: 'Store''s library entry", "  point follows the storage contract.'", ""].join("\n"),
    ) as { summary: string };
    expect(doc.summary).toBe("Store's library entry point follows the storage contract.");
  });

  it("reads a multi-line double-quoted scalar", () => {
    const doc = parseYaml(['summary: "first line', '  second line"', ""].join("\n")) as {
      summary: string;
    };
    expect(doc.summary).toBe("first line second line");
  });

  it("reads a multi-line scalar as a plain list entry", () => {
    const doc = parseYaml(["- 'one line", "  goes on'", ""].join("\n"));
    expect(doc).toEqual(["one line goes on"]);
  });

  it("names the line when the string never closes", () => {
    const error = thrown(() =>
      parseYaml(["summary: 'never closed", "  stays open", ""].join("\n")),
    );
    expect(error).toBeInstanceOf(YamlError);
    expect((error as YamlError).line).toBe(0);
  });

  it("reads a sequence whose entries stand level with the key", () => {
    // Prettier's default format for YAML: the dash is not indented under its
    // key but stays level with it.
    const doc = parseYaml(
      ["decision_records:", "- docs/contracts/storage.md", "- docs/contracts/retries.md", ""].join(
        "\n",
      ),
    );
    expect(doc).toEqual({
      decision_records: ["docs/contracts/storage.md", "docs/contracts/retries.md"],
    });
  });

  it("also reads such a sequence when another key follows", () => {
    const doc = parseYaml(
      ["intent:", "  decision_records:", "  - a.md", "  - b.md", "  team: core", ""].join("\n"),
    );
    expect(doc).toEqual({ intent: { decision_records: ["a.md", "b.md"], team: "core" } });
  });

  it("reads a multi-line quoted summary with a namespace and an apostrophe", () => {
    const doc = parseYaml(
      [
        "intent:",
        "  summary: 'Batch uploads keep a label #example,",
        "",
        "    call Store''s `example_store::session::open` library entry",
        "",
        "    and follow the storage contract.'",
        "  decision_records:",
        "  - docs/contracts/storage.md",
        "  - docs/contracts/retries.md",
        "",
      ].join("\n"),
    ) as { intent: { summary: string; decision_records: string[] } };

    expect(doc.intent.summary).toBe(
      "Batch uploads keep a label #example,\n" +
        "call Store's `example_store::session::open` library entry\n" +
        "and follow the storage contract.",
    );
    expect(doc.intent.decision_records).toEqual([
      "docs/contracts/storage.md",
      "docs/contracts/retries.md",
    ]);
  });

  // `stripComment` only knows the one line it is looking at — it does not
  // know that a quote has been open since an earlier line. A "#" in a
  // continuation line therefore looked like the start of a comment and
  // swallowed the rest of the line, although it was literal content inside
  // the quote.
  it("does not treat a '#' in a continuation line as a comment", () => {
    const doc = parseYaml(['s: "first', "  second # third", '  fourth"', ""].join("\n")) as {
      s: string;
    };
    expect(doc.s).toBe("first second # third fourth");
  });

  it("does not treat a '#' on the closing line as a comment either", () => {
    const doc = parseYaml(
      ["summary: 'first line", "  second (label #example).'", ""].join("\n"),
    ) as { summary: string };
    expect(doc.summary).toBe("first line second (label #example).");
  });

  it("removes a real comment after the closing quote on the closing line", () => {
    const doc = parseYaml(["s: 'first", "  second' # a real comment", ""].join("\n")) as {
      s: string;
    };
    expect(doc.s).toBe("first second");
  });

  it("throws when real text follows the closing quote on the closing line", () => {
    const error = thrown(() => parseYaml(["s: 'first", "  second' junk", ""].join("\n")));
    expect(error).toBeInstanceOf(YamlError);
  });
});

describe("Multi-line scalars and indented continuations", () => {
  it("does not drag the key along with '-   key: value' (more than one space)", () => {
    // `childIndent` was fixed at `row.indent + 2` — with more than one space
    // after the dash the actual key sat further right than this fixed column
    // assumed, and the new multi-line folding dragged it along as the
    // continuation of the previous scalar value.
    const doc = parseYaml(["scenarios:", "  -   id: x", "      statement: y", ""].join("\n"));
    expect(doc).toEqual({ scenarios: [{ id: "x", statement: "y" }] });
  });

  it('resolves \\\\, \\" and \\n in this order, not chained one after another', () => {
    // Three `.replace()` calls run one after another got in each other's
    // way: an escaped backslash followed by a literal "n" became a real line
    // break, because the `\\n` step ran first.
    const doc = parseYaml('s: "a\\\\nb"\n') as { s: string };
    expect(doc.s).toBe("a\\nb");
  });

  it("keeps a deeper-indented continuation that itself looks like 'key: value'", () => {
    // Not a finding from the review, but exactly the spot it named as risky:
    // a real child line (not running text) must not be swallowed by the new
    // continuation heuristic for unquoted scalars, as long as the
    // indentation is computed correctly.
    const doc = parseYaml(["- id: x", "  statement: y", "  team: core", ""].join("\n"));
    expect(doc).toEqual([{ id: "x", statement: "y", team: "core" }]);
  });

  // Escaped line breaks and spaces decode without literal escape artifacts.
  it("escapes a line break in a double-quoted scalar (no separator)", () => {
    const doc = parseYaml(['s: "abc\\', '  def"', ""].join("\n")) as { s: string };
    expect(doc.s).toBe("abcdef");
  });

  it("resolves '\\ ' (backslash-space) as one space", () => {
    // This is how a formatter puts exactly one space deliberately at the
    // spot where a `\` line break suppressed automatic folding.
    const doc = parseYaml(['s: "abc\\', '  \\ def"', ""].join("\n")) as { s: string };
    expect(doc.s).toBe("abc def");
  });

  it("reads the real registry case: line-break escape + escaped spaces", () => {
    const doc = parseYaml(
      [
        'summary: "first part of the sentence\\',
        "  \\ continues right here without a natural break\\",
        '  \\ (closes issue).\\n\\nSecond paragraph after a real newline escape."',
        "",
      ].join("\n"),
    ) as { summary: string };
    expect(doc.summary).toBe(
      "first part of the sentence continues right here without a natural break " +
        "(closes issue).\n\nSecond paragraph after a real newline escape.",
    );
  });
});
