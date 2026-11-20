import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { localized } from "../i18n/legacy/core/yaml.spec.text";
import { thrown } from "../../test/thrown";
import { parseYaml, YamlError } from "./yaml";

describe("Unit tests for parseYaml", () => {
  it("reads nested block maps", () => {
    expect(parseYaml(localized.text2)).toEqual({
      intent: { summary: localized.text3 },
    });
  });

  it("reads scalar sequences", () => {
    expect(parseYaml("decision_records:\n  - ADR-007\n  - ADR-019\n")).toEqual({
      decision_records: ["ADR-007", "ADR-019"],
    });
  });

  it("reads compact maps in list items", () => {
    expect(parseYaml("scenarios:\n  - id: task-added\n    proven: true\n")).toEqual({
      scenarios: [{ id: "task-added", proven: true }],
    });
  });

  it("preserves line breaks in literal block scalars", () => {
    expect(parseYaml(localized.text7)).toEqual({
      statement: localized.text8,
    });
  });

  it("trims the trailing newline with strip chomping", () => {
    expect(parseYaml(localized.text10)).toEqual({ text: localized.text11 });
  });

  it("folds folded block scalars", () => {
    expect(parseYaml(localized.text13)).toEqual({ text: localized.text14 });
  });

  it("recognizes numbers, booleans and null", () => {
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

  it("removes comments outside quoted strings", () => {
    expect(parseYaml(localized.text18)).toEqual({
      a: remainingText.text65,
      b: localized.text19,
    });
  });

  it("skips document markers and empty lines", () => {
    expect(parseYaml("---\n\nid: a\n\n...\n")).toEqual({ id: "a" });
  });

  it("returns null for empty text", () => {
    expect(parseYaml("\n\n")).toBeNull();
  });

  it("rejects tab indentation with a line number", () => {
    expect(() => parseYaml("a:\n\tb: 1\n")).toThrow(YamlError);
  });

  it("rejects lines without a colon", () => {
    const error = thrown(() => parseYaml(labelText.text347));

    expect(error).toBeInstanceOf(YamlError);
    expect((error as YamlError).line).toBe(1);
  });

  it("rejects unclosed flow sequences", () => {
    expect(() => parseYaml("a: [1, 2\n")).toThrow(YamlError);
  });

  it("requires text input", () => {
    expect(() => parseYaml(undefined as unknown as string)).toThrow(YamlError);
  });

  it("reports one-based line numbers", () => {
    expect(new YamlError(labelText.text348, 41).message).toContain(labelText.text349);
  });
});

describe("Multiline flow collections", () => {
  it("reads a sequence with its bracket on a separate line", () => {
    const doc = parseYaml(
      [
        "verification:",
        "  integration_tests:",
        "    - id: host",
        "      proves:",
        "        [",
        localized.text27,
        remainingText.text66,
        "        ]",
        "    - id: gast",
        localized.text28,
        "",
      ].join("\n"),
    ) as { verification: { integration_tests: { id: string; proves: string[] }[] } };

    expect(doc.verification.integration_tests[0].proves).toEqual([
      localized.text29,
      remainingText.text67,
    ]);

    expect(doc.verification.integration_tests[1].proves).toEqual([localized.text30]);
  });

  it("reads a sequence beginning on the key's line", () => {
    const doc = parseYaml([labelText.text350, labelText.text351, labelText.extra5, ""].join("\n"));
    expect(doc).toEqual({ proves: [labelText.text352, labelText.text152, labelText.extra6] });
  });

  it("reads multiline flow maps", () => {
    const doc = parseYaml(
      ["owner:", "  {", "    team: mp,", "    contact: nina,", "  }", ""].join("\n"),
    );
    expect(doc).toEqual({ owner: { team: "mp", contact: "nina" } });
  });

  it("reads flow maps as standalone list items", () => {
    const doc = parseYaml(["gate_calls:", '  - { method: "secret.get" }', ""].join("\n"));
    expect(doc).toEqual({ gate_calls: [{ method: "secret.get" }] });
  });

  it("reads multiline flow sequences inside block sequences", () => {
    const doc = parseYaml(["- [a,", "  b]", labelText.text353, ""].join("\n"));
    expect(doc).toEqual([["a", "b"], labelText.text191]);
  });

  it("distinguishes brackets in text from collections", () => {
    const doc = parseYaml(['proves: ["a, b",', '  "c]d"]', ""].join("\n"));
    expect(doc).toEqual({ proves: ["a, b", "c]d"] });
  });

  it("reports the line of an unclosed bracket", () => {
    const error = thrown(() => parseYaml(["proves:", "  [", labelText.text354, ""].join("\n")));
    expect(error).toBeInstanceOf(YamlError);
    expect((error as YamlError).message).toContain(localized.text37);
    expect((error as YamlError).line).toBe(1);
  });
});

describe("multiline unquoted scalars", () => {
  it("folds a single line break into a space", () => {
    const doc = parseYaml(
      ["answer: Operators must set a map of account_id-to-URL", "  pairs.", ""].join("\n"),
    );
    expect(doc).toEqual({ answer: "Operators must set a map of account_id-to-URL pairs." });
  });

  it("folds a blank line into a newline", () => {
    const doc = parseYaml([remainingText.text68, "", remainingText.text69, ""].join("\n"));
    expect(doc).toEqual({ answer: remainingText.text70 });
  });

  it("reads multiline answers beside another knowledge question", () => {
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

  it("preserves completed scalars without following content", () => {
    expect(parseYaml("a: 42\nb: kurzer Text\n")).toEqual({ a: 42, b: "kurzer Text" });
  });
});

describe("multiline quoted scalars", () => {
  it("folds a single line break into a space", () => {
    const doc = parseYaml([localized.text45, remainingText.text71, ""].join("\n")) as {
      summary: string;
    };
    expect(doc.summary).toBe(localized.text46);
  });

  it("folds a blank line into a newline", () => {
    const doc = parseYaml([remainingText.text72, "", remainingText.text73, ""].join("\n")) as {
      summary: string;
    };
    expect(doc.summary).toBe(remainingText.text70);
  });

  it("unescapes doubled single quotes across lines", () => {
    const doc = parseYaml(
      ["summary: 'Store''s library entry", "  point follows the storage contract.'", ""].join("\n"),
    ) as { summary: string };
    expect(doc.summary).toBe("Store's library entry point follows the storage contract.");
  });

  it("reads multiline double-quoted scalars", () => {
    const doc = parseYaml([remainingText.text74, labelText.text355, ""].join("\n")) as {
      summary: string;
    };
    expect(doc.summary).toBe(remainingText.text75);
  });

  it("reads multiline scalars as standalone list items", () => {
    const doc = parseYaml([localized.text51, remainingText.text76, ""].join("\n"));
    expect(doc).toEqual([localized.text52]);
  });

  it("reports the line of an unclosed string", () => {
    const error = thrown(() => parseYaml([remainingText.text77, localized.text54, ""].join("\n")));
    expect(error).toBeInstanceOf(YamlError);
    expect((error as YamlError).line).toBe(0);
  });

  it("reads sequences aligned with their key", () => {
    const doc = parseYaml(
      ["decision_records:", "- docs/contracts/storage.md", "- docs/contracts/retries.md", ""].join(
        "\n",
      ),
    );
    expect(doc).toEqual({
      decision_records: ["docs/contracts/storage.md", "docs/contracts/retries.md"],
    });
  });

  it("reads aligned sequences followed by another key", () => {
    const doc = parseYaml(
      ["intent:", "  decision_records:", "  - a.md", "  - b.md", "  team: core", ""].join("\n"),
    );
    expect(doc).toEqual({ intent: { decision_records: ["a.md", "b.md"], team: "core" } });
  });

  it("reads multiline quoted summaries with namespaces and apostrophes", () => {
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

  it("preserves hash characters in continuation lines", () => {
    const doc = parseYaml(
      [remainingText.text78, "  zweite # dritte", '  vierte"', ""].join("\n"),
    ) as {
      s: string;
    };
    expect(doc.s).toBe(remainingText.text79);
  });

  it("preserves hash characters on the closing line", () => {
    const doc = parseYaml([remainingText.text80, "  zweite (label #example).'", ""].join("\n")) as {
      summary: string;
    };
    expect(doc.summary).toBe(remainingText.text81);
  });

  it("removes comments after the closing quote", () => {
    const doc = parseYaml([remainingText.text82, localized.text61, ""].join("\n")) as {
      s: string;
    };
    expect(doc.s).toBe(remainingText.text57);
  });

  it("rejects trailing text after the closing quote", () => {
    const error = thrown(() => parseYaml([remainingText.text82, localized.text63, ""].join("\n")));
    expect(error).toBeInstanceOf(YamlError);
  });
});

describe("multiline scalars and indented continuations", () => {
  it("preserves keys after list markers with extra spaces", () => {
    const doc = parseYaml(["scenarios:", "  -   id: x", "      statement: y", ""].join("\n"));
    expect(doc).toEqual({ scenarios: [{ id: "x", statement: "y" }] });
  });

  it("resolves backslash, quote and newline escapes in order", () => {
    const doc = parseYaml('s: "a\\\\nb"\n') as { s: string };
    expect(doc.s).toBe("a\\nb");
  });

  it("preserves further-indented continuations that resemble map entries", () => {
    const doc = parseYaml(["- id: x", "  statement: y", "  team: core", ""].join("\n"));
    expect(doc).toEqual([{ id: "x", statement: "y", team: "core" }]);
  });

  it("joins escaped line breaks in double-quoted scalars", () => {
    const doc = parseYaml(['s: "abc\\', '  def"', ""].join("\n")) as { s: string };
    expect(doc.s).toBe("abcdef");
  });

  it("resolves escaped spaces as spaces", () => {
    const doc = parseYaml(['s: "abc\\', '  \\ def"', ""].join("\n")) as { s: string };
    expect(doc.s).toBe("abc def");
  });

  it("reads the registry case with escaped line breaks and spaces", () => {
    const doc = parseYaml(
      [
        'summary: "first part of the sentence\\',
        "  \\ continues right here without a natural break\\",
        '  \\ (closes #793).\\n\\nSecond paragraph after a real newline escape."',
        "",
      ].join("\n"),
    ) as { summary: string };
    expect(doc.summary).toBe(
      "first part of the sentence continues right here without a natural break " +
        "(closes #793).\n\nSecond paragraph after a real newline escape.",
    );
  });
});
