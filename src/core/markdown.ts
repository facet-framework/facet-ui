/**
 * A small Markdown reader for the companion's answers.
 *
 * It handles what a model writes into an answer about a repository:
 * paragraphs, headings, lists, quotes, rules, code blocks as well as bold,
 * italic, code and links in running text.
 *
 * It deliberately does **not** handle: tables, nested lists, images,
 * footnotes, reference links, embedded HTML. What it does not know stays as
 * text — a reader that silently swallows the unknown is worse than one that
 * shows it unchanged. This limit lives here instead of in a dependency
 * because the library has none, and a complete Markdown implementation would
 * weigh more than everything else together.
 */

export type MdInline =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "em"; text: string }
  | { kind: "code"; text: string }
  | { kind: "link"; text: string; href: string };

export type MdBlock =
  | { kind: "paragraph"; inline: MdInline[] }
  | { kind: "heading"; level: number; inline: MdInline[] }
  | { kind: "list"; ordered: boolean; items: MdInline[][] }
  | { kind: "code"; language: string; text: string }
  | { kind: "quote"; inline: MdInline[] }
  | { kind: "rule" };

const FENCE = /^\s*(`{3,}|~{3,})\s*([A-Za-z0-9+#.-]*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s{0,3}[-*+]\s+(.*)$/;
const ORDERED = /^\s{0,3}\d+[.)]\s+(.*)$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;
const RULE = /^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/;

/** Splits Markdown into blocks. Empty text yields no blocks. */
export function parseMarkdown(text: string): MdBlock[] {
  const lines = String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const blocks: MdBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const marker = fence[1][0];
      const body: string[] = [];
      i++;
      // A fence nobody closed ends at the end of the text. The alternative
      // would be to show the rest of the answer as prose although it is code.
      while (i < lines.length && !isClosing(lines[i], marker)) {
        body.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ kind: "code", language: fence[2] ?? "", text: body.join("\n") });
      continue;
    }

    if (RULE.test(line)) {
      blocks.push({ kind: "rule" });
      i++;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        inline: parseInline(heading[2].trim()),
      });
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        body.push(QUOTE.exec(lines[i])![1]);
        i++;
      }
      blocks.push({ kind: "quote", inline: parseInline(body.join(" ").trim()) });
      continue;
    }

    if (BULLET.test(line) || ORDERED.test(line)) {
      const ordered = !BULLET.test(line);
      const items: MdInline[][] = [];
      while (i < lines.length) {
        const item = ordered ? ORDERED.exec(lines[i]) : BULLET.exec(lines[i]);
        if (!item) break;
        // Continuation lines belong to the item before, not to a new one.
        const parts = [item[1]];
        i++;
        while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
          parts.push(lines[i].trim());
          i++;
        }
        items.push(parseInline(parts.join(" ")));
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      paragraph.push(lines[i].trim());
      i++;
    }
    if (paragraph.length)
      blocks.push({ kind: "paragraph", inline: parseInline(paragraph.join(" ")) });
    else i++;
  }

  return blocks;
}

function isClosing(line: string, marker: string): boolean {
  const fence = FENCE.exec(line);
  return Boolean(fence) && fence![1][0] === marker;
}

function isBlockStart(line: string): boolean {
  return (
    FENCE.test(line) ||
    HEADING.test(line) ||
    BULLET.test(line) ||
    ORDERED.test(line) ||
    QUOTE.test(line) ||
    RULE.test(line)
  );
}

/**
 * Splits a line into text pieces.
 *
 * Code first, because inside a code piece `**` is not bold but two stars.
 * Then links, then bold before italic — `**x**` must not end up as two
 * italic stars.
 */
export function parseInline(text: string): MdInline[] {
  const out: MdInline[] = [];
  let rest = String(text ?? "");

  const pattern =
    /(`+)([^`]*?)\1|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|(?<![A-Za-z0-9])_([^_]+)_(?![A-Za-z0-9])/;

  for (;;) {
    const match = pattern.exec(rest);
    if (!match) break;
    if (match.index > 0) out.push({ kind: "text", text: rest.slice(0, match.index) });

    if (match[1] !== undefined) out.push({ kind: "code", text: match[2] });
    else if (match[3] !== undefined) out.push({ kind: "link", text: match[3], href: match[4] });
    else if (match[5] !== undefined) out.push({ kind: "strong", text: match[5] });
    else if (match[6] !== undefined) out.push({ kind: "strong", text: match[6] });
    else if (match[7] !== undefined) out.push({ kind: "em", text: match[7] });
    else if (match[8] !== undefined) out.push({ kind: "em", text: match[8] });

    rest = rest.slice(match.index + match[0].length);
  }

  if (rest) out.push({ kind: "text", text: rest });
  return out.length ? out : [{ kind: "text", text: "" }];
}

/**
 * Whether a link may be clickable.
 *
 * The text comes from a model, and a model must not conjure up an address
 * the reader visits with one click. `http` and `https` become links,
 * everything else — `javascript:`, `data:`, `file:` — stays readable text.
 */
export function isSafeHref(href: string): boolean {
  return /^https?:\/\//i.test(String(href ?? "").trim());
}
