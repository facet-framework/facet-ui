import { isSafeHref, parseInline, parseMarkdown } from "./markdown";

describe("Unit tests for parseMarkdown", () => {
  it("emits no blocks for empty text", () => {
    expect(parseMarkdown("")).toEqual([]);
    expect(parseMarkdown("\n\n  \n")).toEqual([]);
  });

  it("joins consecutive lines into one paragraph", () => {
    const blocks = parseMarkdown("First line\nsecond line\n\nsecond paragraph");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      kind: "paragraph",
      inline: [{ kind: "text", text: "First line second line" }],
    });
  });

  it("reads headings with their level", () => {
    const blocks = parseMarkdown("### What is open");
    expect(blocks[0]).toEqual({
      kind: "heading",
      level: 3,
      inline: [{ kind: "text", text: "What is open" }],
    });
  });

  it("reads a bullet list as one block with items", () => {
    const blocks = parseMarkdown("- one\n- two\n- three");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: "list", ordered: false });
    expect((blocks[0] as { items: unknown[] }).items).toHaveLength(3);
  });

  it("tells numbered from unnumbered", () => {
    expect(parseMarkdown("1. one\n2. two")[0]).toMatchObject({ ordered: true });
    expect(parseMarkdown("* one")[0]).toMatchObject({ ordered: false });
  });

  it("pulls a continuation line into the item before it", () => {
    const blocks = parseMarkdown("- an item that\n  continues\n- the next");
    const items = (blocks[0] as { items: { text: string }[][] }).items;
    expect(items).toHaveLength(2);
    expect(items[0][0].text).toBe("an item that continues");
  });

  it("keeps a code block unchanged, with its language", () => {
    const blocks = parseMarkdown("```go\nfunc main() {}\n\ttwo\n```");
    expect(blocks[0]).toEqual({ kind: "code", language: "go", text: "func main() {}\n\ttwo" });
  });

  it("leaves Markdown inside a code block alone", () => {
    const blocks = parseMarkdown("```\n**not bold** and `no code`\n```");
    expect((blocks[0] as { text: string }).text).toBe("**not bold** and `no code`");
  });

  it("closes an open fence at the end of the text instead of showing the rest as prose", () => {
    const blocks = parseMarkdown("```\nline one\nline two");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: "code", text: "line one\nline two" });
  });

  it("reads a quote across several lines", () => {
    const blocks = parseMarkdown("> first\n> second");
    expect(blocks[0]).toEqual({ kind: "quote", inline: [{ kind: "text", text: "first second" }] });
  });

  it("recognises the horizontal rule", () => {
    expect(parseMarkdown("---")[0]).toEqual({ kind: "rule" });
  });

  it("starts a new block where one begins", () => {
    const blocks = parseMarkdown("A paragraph\n- and a list right below it");
    expect(blocks.map((block) => block.kind)).toEqual(["paragraph", "list"]);
  });
});

describe("Unit tests for parseInline", () => {
  it("reads bold, italic and code", () => {
    expect(parseInline("**bold** and *italic* and `code`")).toEqual([
      { kind: "strong", text: "bold" },
      { kind: "text", text: " and " },
      { kind: "em", text: "italic" },
      { kind: "text", text: " and " },
      { kind: "code", text: "code" },
    ]);
  });

  it("reads bold before italic", () => {
    // Otherwise `**x**` would end up as two italic asterisks.
    expect(parseInline("**x**")).toEqual([{ kind: "strong", text: "x" }]);
  });

  it("keeps asterisks inside code", () => {
    expect(parseInline("`**no bold**`")).toEqual([{ kind: "code", text: "**no bold**" }]);
  });

  it("leaves underscores in identifiers alone", () => {
    // `schema_version` is a field name, not italics.
    expect(parseInline("schema_version is a field")).toEqual([
      { kind: "text", text: "schema_version is a field" },
    ]);
  });

  it("reads a link with text and target", () => {
    expect(parseInline("see [the spec](https://example.org/spec)")).toEqual([
      { kind: "text", text: "see " },
      { kind: "link", text: "the spec", href: "https://example.org/spec" },
    ]);
  });

  it("emits an empty piece for empty text, never nothing", () => {
    expect(parseInline("")).toEqual([{ kind: "text", text: "" }]);
  });
});

describe("Unit tests for isSafeHref", () => {
  it("lets http and https through", () => {
    expect(isSafeHref("https://example.org")).toBe(true);
    expect(isSafeHref("http://example.org")).toBe(true);
  });

  it("holds back everything else", () => {
    // The text comes from a model. It must not be able to conjure up an address
    // that a click visits.
    ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "/lokal", ""].forEach(
      (href) => expect(isSafeHref(href)).toBe(false),
    );
  });
});
