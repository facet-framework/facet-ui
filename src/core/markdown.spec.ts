import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { localized } from "../i18n/legacy/core/markdown.spec.text";
import { isSafeHref, parseInline, parseMarkdown } from "./markdown";

describe("Unit tests for parseMarkdown", () => {
  it("returns no blocks for empty text", () => {
    expect(parseMarkdown("")).toEqual([]);
    expect(parseMarkdown("\n\n  \n")).toEqual([]);
  });

  it("combines adjacent lines into a paragraph", () => {
    const blocks = parseMarkdown(remainingText.text54);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      kind: "paragraph",
      inline: [{ kind: "text", text: remainingText.text55 }],
    });
  });

  it("reads headings with their levels", () => {
    const blocks = parseMarkdown(localized.text4);
    expect(blocks[0]).toEqual({
      kind: "heading",
      level: 3,
      inline: [{ kind: "text", text: localized.text5 }],
    });
  });

  it("reads a list as one block of items", () => {
    const blocks = parseMarkdown(labelText.text368);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: "list", ordered: false });
    expect((blocks[0] as { items: unknown[] }).items).toHaveLength(3);
  });

  it("distinguishes ordered and unordered lists", () => {
    expect(parseMarkdown(labelText.text369)[0]).toMatchObject({ ordered: true });
    expect(parseMarkdown(labelText.text370)[0]).toMatchObject({ ordered: false });
  });

  it("appends continuation lines to the preceding item", () => {
    const blocks = parseMarkdown(localized.text9);
    const items = (blocks[0] as { items: { text: string }[][] }).items;
    expect(items).toHaveLength(2);
    expect(items[0][0].text).toBe(localized.text10);
  });

  it("preserves code blocks and their language", () => {
    const blocks = parseMarkdown(labelText.text371);
    expect(blocks[0]).toEqual({ kind: "code", language: "go", text: labelText.text372 });
  });

  it("leaves Markdown inside code blocks untouched", () => {
    const blocks = parseMarkdown(localized.text13);
    expect((blocks[0] as { text: string }).text).toBe(localized.text14);
  });

  it("closes an open fence at the end of the text", () => {
    const blocks = parseMarkdown(labelText.text373);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: "code", text: labelText.text374 });
  });

  it("reads multiline quotes", () => {
    const blocks = parseMarkdown(remainingText.text56);
    expect(blocks[0]).toEqual({
      kind: "quote",
      inline: [{ kind: "text", text: remainingText.text57 }],
    });
  });

  it("recognizes horizontal rules", () => {
    expect(parseMarkdown("---")[0]).toEqual({ kind: "rule" });
  });

  it("starts a block at each block boundary", () => {
    const blocks = parseMarkdown(localized.text19);
    expect(blocks.map((block) => block.kind)).toEqual(["paragraph", "list"]);
  });
});

describe("Unit tests for parseInline", () => {
  it("reads bold, italic and inline code", () => {
    expect(parseInline(localized.text21)).toEqual([
      { kind: "strong", text: labelText.extra2 },
      { kind: "text", text: localized.text22 },
      { kind: "em", text: labelText.text375 },
      { kind: "text", text: localized.text23 },
      { kind: "code", text: "code" },
    ]);
  });

  it("reads bold before italic", () => {
    expect(parseInline("**x**")).toEqual([{ kind: "strong", text: "x" }]);
  });

  it("preserves asterisks inside code", () => {
    expect(parseInline(localized.text26)).toEqual([{ kind: "code", text: localized.text27 }]);
  });

  it("preserves underscores in identifiers", () => {
    expect(parseInline(localized.text29)).toEqual([{ kind: "text", text: localized.text30 }]);
  });

  it("reads link text and destinations", () => {
    expect(parseInline(localized.text32)).toEqual([
      { kind: "text", text: labelText.text376 },
      { kind: "link", text: localized.text33, href: "https://example.org/spec" },
    ]);
  });

  it("returns an empty text piece for empty input", () => {
    expect(parseInline("")).toEqual([{ kind: "text", text: "" }]);
  });
});

describe("Unit tests for isSafeHref", () => {
  it("allows HTTP and HTTPS", () => {
    expect(isSafeHref("https://example.org")).toBe(true);
    expect(isSafeHref("http://example.org")).toBe(true);
  });

  it("withholds other protocols", () => {
    [
      "javascript:alert(1)",
      "data:text/html,x",
      "file:///etc/passwd",
      labelText.text377,
      "",
    ].forEach((href) => expect(isSafeHref(href)).toBe(false));
  });
});
