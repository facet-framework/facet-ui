/**
 * Minimal YAML reader for FACET records — without dependencies.
 *
 * Supports exactly the subset FACET schemas use: nested block maps and
 * sequences, `- key: value`, block scalars (`|`, `|-`, `>`, …), flow
 * collections, quotes, numbers, booleans, `null`, comments and document
 * markers.
 *
 * Also supports multi-line scalars — quoted and unquoted — whose
 * continuation stands further indented below, with the same folding as a
 * `>` block scalar: a single line break becomes a space, a blank line in
 * between becomes a real `\n`.
 *
 * Deliberately not supported: anchors/aliases, tags, multiple documents,
 * complex keys. If any of these shows up, the parser throws a `YamlError`
 * with a line number so the UI can display it.
 */

import type { TextKey } from "../facet/i18n/en";
import { ENGLISH_TEXT, type FacetText, type TextParams } from "../facet/i18n/text";

export class YamlError extends Error {
  readonly line?: number;
  /** The catalog key of the message, so a surface can show it in its own language. */
  readonly key?: TextKey;
  readonly params?: TextParams;

  /**
   * `message` is English and ends up in logs; the surface renders `key` with
   * `params` through `yamlErrorText` instead.
   */
  constructor(message: string, line?: number, key?: TextKey, params?: TextParams) {
    super(line != null ? `${message} (line ${line + 1})` : message);
    this.name = "YamlError";
    this.line = line;
    this.key = key;
    this.params = params;
  }
}

function yamlError(key: TextKey, params: TextParams, line?: number): YamlError {
  return new YamlError(ENGLISH_TEXT.t(key, params), line, key, params);
}

/**
 * The message of a `YamlError` in the language of `text`, with its line. An
 * error without a key (thrown elsewhere) keeps its own message.
 */
export function yamlErrorText(error: YamlError, text: FacetText = ENGLISH_TEXT): string {
  if (!error.key) return error.message;
  const message = text.t(error.key, error.params);
  return error.line != null
    ? text.t("core.yaml.atLine", { message, line: error.line + 1 })
    : message;
}

export type YamlValue =
  string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

/**
 * `text` has already been through `stripComment` — right for everything that
 * is a line of its own. `raw` is the same line without that step:
 * `stripComment` only knows the one line it is looking at, not that a quote
 * was left open two lines earlier — otherwise a `#` in the continuation of a
 * multi-line quoted scalar would look like a comment and swallow the rest of
 * the line. That is why `multilineScalar` reads `raw`.
 */
type Row = { indent: number; text: string; raw: string; n: number };

function stripComment(s: string): string {
  let quote: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote && s[i - 1] !== "\\") quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === "#" && (i === 0 || /\s/.test(s[i - 1]))) {
      return s.slice(0, i);
    }
  }
  return s;
}

function splitFlow(body: string, line?: number): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = "";
  for (const c of body) {
    if (quote) {
      cur += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      cur += c;
      continue;
    }
    if (c === "[" || c === "{") depth++;
    if (c === "]" || c === "}") depth--;
    if (c === "," && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim() !== "") out.push(cur);
  if (depth !== 0) throw new YamlError("Unausgeglichene Flow-Collection", line);
  return out;
}

/**
 * How many flow brackets are still open at the end of this text.
 * Quoted content does not count — `[","]` is one bracket, not a comma.
 */
function flowDepth(s: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote && s[i - 1] !== "\\") quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") depth--;
  }
  return depth;
}

/** Does this text start a flow collection? */
function opensFlow(s: string): boolean {
  return s[0] === "[" || s[0] === "{";
}

/**
 * Index of the closing quote in `s`, searched from `start`, or `-1` if the
 * line ends without the string closing — the signal for a multi-line scalar.
 * `''` (single) and `\"` (double) do not count as the end, exactly as in
 * `scalar()`.
 */
function findQuoteEnd(s: string, quote: string, start: number): number {
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (quote === "'") {
      if (c === "'") {
        if (s[i + 1] === "'") {
          i++;
          continue;
        }
        return i;
      }
    } else {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === '"') return i;
    }
  }
  return -1;
}

/**
 * How many `\` follow each other directly at the end of `s`. An even number
 * is nothing but `\\` (escaped backslashes, complete in themselves); an odd
 * number means the last backslash stands alone — in a double-quoted scalar it
 * escapes the line break that follows it.
 */
function trailingBackslashCount(s: string): number {
  let n = 0;
  for (let i = s.length - 1; i >= 0 && s[i] === "\\"; i--) n++;
  return n;
}

function flow(s: string, line?: number): YamlValue {
  const t = s.trim();
  if (t[0] === "[") {
    if (!t.endsWith("]")) throw new YamlError("Nicht geschlossene Flow-Sequenz", line);
    return splitFlow(t.slice(1, -1), line).map((v) => scalar(v, line));
  }
  if (!t.endsWith("}")) throw new YamlError("Nicht geschlossene Flow-Map", line);
  const obj: Record<string, YamlValue> = {};
  splitFlow(t.slice(1, -1), line).forEach((pair) => {
    const idx = pair.indexOf(":");
    if (idx < 0) throw yamlError("core.yaml.flowMapColon", {}, line);
    obj[String(scalar(pair.slice(0, idx), line))] = scalar(pair.slice(idx + 1), line);
  });
  return obj;
}

/**
 * Resolves `\\`, `\"`, `\n` and `\ ` (escaped space) in a double-quoted
 * scalar — in a single pass, not as `.replace()` calls run one after another.
 * Run in sequence they got in each other's way: `"a\\nb"` is an escaped
 * backslash followed by a literal "n" (result `a\nb` as four characters), but
 * an earlier `\\n`→line-break step already grabbed the "n" that actually
 * belonged to the preceding `\\`.
 *
 * `\ ` only matters here because `multilineScalar` removes a `\` at the end
 * of a line instead of folding it into a space like a normal line break
 * (YAML's own escape for the break itself) — a formatter that wants exactly
 * one space at the break, without relying on folding, writes it explicitly
 * as `\ ` at the start of the following line.
 */
function unescapeDouble(body: string): string {
  let out = "";
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c !== "\\") {
      out += c;
      continue;
    }
    const next = body[i + 1];
    if (next === "n") out += "\n";
    else if (next === '"') out += '"';
    else if (next === "\\") out += "\\";
    // `\ ` (backslash-space) escapes a space — YAML uses it to put exactly
    // one space back at the break after a break-suppressing `\<end of line>`,
    // instead of leaving it to automatic folding.
    else if (next === " ") out += " ";
    else {
      out += c;
      continue;
    }
    i++;
  }
  return out;
}

function scalar(raw: string, line?: number): YamlValue {
  const s = String(raw).trim();
  if (s === "" || s === "~" || s === "null" || s === "Null" || s === "NULL") return null;
  if (s === "true" || s === "True" || s === "TRUE") return true;
  if (s === "false" || s === "False" || s === "FALSE") return false;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d*\.\d+$/.test(s)) return parseFloat(s);
  if ((s[0] === '"' && s.endsWith('"')) || (s[0] === "'" && s.endsWith("'"))) {
    const body = s.slice(1, -1);
    return s[0] === '"' ? unescapeDouble(body) : body.replace(/''/g, "'");
  }
  if (s[0] === "[" || s[0] === "{") return flow(s, line);
  return s;
}

/** Returns `[key, rest]` for `key: rest`, respecting quotes. */
function keyLine(s: string): [string, string] | null {
  let quote: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === ":" && (i + 1 === s.length || /\s/.test(s[i + 1]))) {
      return [String(scalar(s.slice(0, i))), s.slice(i + 1).trim()];
    }
  }
  return null;
}

export function parseYaml(text: string): YamlValue {
  if (typeof text !== "string") throw new YamlError("YAML-Text erwartet");

  const rows: Row[] = [];
  text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .forEach((raw, n) => {
      if (/^\s*(---|\.\.\.)\s*$/.test(raw)) return;
      const leading = /^[ \t]*/.exec(raw)?.[0] ?? "";
      const body = stripComment(raw).replace(/\s+$/, "");
      if (!body.trim()) return;
      if (leading.includes("\t")) {
        throw yamlError("core.yaml.tabIndent", {}, n);
      }
      const indent = leading.length;
      rows.push({ indent, text: body.trim(), raw: raw.trim(), n });
    });

  let i = 0;

  function blockScalar(header: string, indent: number): string {
    const fold = header[0] === ">";
    const chomp = header.includes("-") ? "strip" : header.includes("+") ? "keep" : "clip";
    const lines: string[] = [];
    let base: number | null = null;
    while (i < rows.length && rows[i].indent > indent) {
      if (base == null) base = rows[i].indent;
      lines.push(" ".repeat(Math.max(0, rows[i].indent - base)) + rows[i].text);
      i++;
    }
    if (!lines.length) return "";
    let out = fold
      ? lines.reduce(
          (acc, l, idx) =>
            idx === 0
              ? l
              : l.startsWith(" ") || acc.endsWith("\n")
                ? `${acc}\n${l}`
                : `${acc} ${l}`,
          "",
        )
      : lines.join("\n");
    if (chomp === "strip") out = out.replace(/\n+$/, "");
    else if (chomp === "clip") out = `${out.replace(/\n+$/, "")}\n`;
    else out += "\n";
    return out;
  }

  /**
   * Reads a flow collection that spans several lines.
   *
   * This is exactly how Prettier formats a long list — the bracket alone on
   * its line, one entry per line, with a trailing comma. It is valid YAML,
   * and a reader that cannot handle it rejects records the linter accepts.
   */
  function readFlow(head: string, line: number): YamlValue {
    let text = head;
    while (flowDepth(text) > 0) {
      if (i >= rows.length) {
        throw new YamlError("Nicht geschlossene Flow-Collection", line);
      }
      // Line break as a space: in a flow collection it separates nothing the
      // comma has not already separated.
      text += " " + rows[i].text;
      i++;
    }
    return flow(text, line);
  }

  /**
   * Reads a quoted scalar whose quote does not close on the key line. Every
   * line was already trimmed to its content when read in (`rows.push`), so
   * all that is left is folding: a single line break into a space, a skipped
   * blank line — recognisable by the jump in `row.n`, since blank lines never
   * become a Row — into a real `\n`. Quoted scalars thereby follow the same
   * rule as `>` block scalars, just without their indentation special case.
   */
  function multilineScalar(rest: string, quote: '"' | "'", indent: number, line: number): string {
    type Segment = { text: string; sep: "space" | "newline" | "none" };
    const segments: Segment[] = [];
    // A double-quoted scalar knows a third kind of continuation besides
    // folding: a single backslash right before the line break escapes the
    // break itself — it vanishes without replacement, no space, no `\n`. A
    // single-quoted scalar does not know this escape.
    let forceJoin = false;
    function pushSegment(raw: string, sep: Segment["sep"]) {
      let text = raw;
      const effectiveSep: Segment["sep"] = forceJoin ? "none" : sep;
      forceJoin = false;
      if (quote === '"' && trailingBackslashCount(text) % 2 === 1) {
        text = text.slice(0, -1);
        forceJoin = true;
      }
      segments.push({ text, sep: effectiveSep });
    }

    pushSegment(rest.slice(1), "none");
    let prevN = line;
    let closed = false;
    while (!closed) {
      if (i >= rows.length || rows[i].indent <= indent) {
        throw new YamlError("Nicht geschlossene Zeichenkette", line);
      }
      const row = rows[i];
      const sep: Segment["sep"] = row.n - prevN > 1 ? "newline" : "space";
      // `raw`, not `text`: `stripComment` only knows this one line, not that a
      // quote has been open since an earlier line — a "#" here would otherwise
      // be misread as the start of a comment and the rest swallowed, although
      // it is literal content inside the quote.
      const endIdx = findQuoteEnd(row.raw, quote, 0);
      if (endIdx === -1) {
        pushSegment(row.raw, sep);
        prevN = row.n;
        i++;
      } else {
        // After the closing quote at most a comment may follow — anything
        // else is a broken line, not a remainder to be dropped silently.
        const remainder = stripComment(row.raw.slice(endIdx + 1)).trim();
        if (remainder !== "") {
          throw yamlError("core.yaml.afterQuote", { text: remainder }, row.n);
        }
        pushSegment(row.raw.slice(0, endIdx), sep);
        i++;
        closed = true;
      }
    }
    const folded = segments.reduce((acc, seg, idx) => {
      if (idx === 0) return seg.text;
      if (seg.sep === "none") return `${acc}${seg.text}`;
      return seg.sep === "newline" ? `${acc}\n${seg.text}` : `${acc} ${seg.text}`;
    }, "");
    return quote === "'" ? folded.replace(/''/g, "'") : unescapeDouble(folded);
  }

  /**
   * The same folding as `multilineScalar`, for a scalar without any quotes.
   * Without a closing quote there is no stop criterion except indentation —
   * so the continuation ends as soon as a line is no longer indented further
   * than the key that introduces it.
   */
  function multilinePlain(rest: string, indent: number, line: number): string {
    const segments: { text: string; gap: boolean }[] = [{ text: rest, gap: false }];
    let prevN = line;
    while (i < rows.length && rows[i].indent > indent) {
      const row = rows[i];
      segments.push({ text: row.text, gap: row.n - prevN > 1 });
      prevN = row.n;
      i++;
    }
    return segments.reduce(
      (acc, seg, idx) =>
        idx === 0 ? seg.text : seg.gap ? `${acc}\n${seg.text}` : `${acc} ${seg.text}`,
      "",
    );
  }

  function value(rest: string, indent: number, line: number): YamlValue {
    if (rest === "") {
      const next = rows[i];
      // 'proves:' with the bracket only on the next line.
      if (next && next.indent > indent && opensFlow(next.text)) {
        const at = next.n;
        i++;
        return readFlow(next.text, at);
      }
      // Prettier's default YAML format: a sequence is not indented under its
      // key, the dash stays level with it. `parseBlock` already recognises
      // this by exactly this condition (its own sequence loop runs at
      // `indent === indent`) — without this branch the line would count as
      // "no value", and the object loop would stop at the next dash at once
      // instead of reading the sequence.
      if (next && next.indent === indent && (next.text.startsWith("- ") || next.text === "-")) {
        return parseBlock(indent);
      }
      return i < rows.length && rows[i].indent > indent ? parseBlock(rows[i].indent) : null;
    }
    if (/^[|>][-+]?\d*$/.test(rest)) return blockScalar(rest, indent);
    // 'proves: [a,' with the rest below.
    if (opensFlow(rest) && flowDepth(rest) > 0) return readFlow(rest, line);
    if (rest[0] === '"' || rest[0] === "'") {
      if (findQuoteEnd(rest, rest[0], 1) === -1)
        return multilineScalar(rest, rest[0], indent, line);
      return scalar(rest, line);
    }
    // An unquoted scalar followed by a deeper-indented line is the
    // continuation of a long running text (such as `knowledge.*.answer`), not
    // the start of a new node — a scalar cannot have a child line.
    if (i < rows.length && rows[i].indent > indent) {
      return scalar(multilinePlain(rest, indent, line), line);
    }
    return scalar(rest, line);
  }

  function parseBlock(indent: number): YamlValue {
    const first = rows[i];
    if (!first) return null;

    if (first.text.startsWith("- ") || first.text === "-") {
      const arr: YamlValue[] = [];
      while (
        i < rows.length &&
        rows[i].indent === indent &&
        (rows[i].text.startsWith("- ") || rows[i].text === "-")
      ) {
        const row = rows[i];
        const inner = row.text === "-" ? "" : row.text.slice(2).trim();
        i++;
        if (inner === "") {
          arr.push(i < rows.length && rows[i].indent > indent ? parseBlock(rows[i].indent) : null);
          continue;
        }
        // `- { method: "x" }` is a flow map as a list entry, not a compact
        // `- key: value`. `keyLine` knows no bracket depth — it finds the
        // first colon wherever it is, i.e. the one inside the flow map, and so
        // tore out `{ method` as the "key". The check must first decide
        // whether it is a flow collection at all before `keyLine` searches
        // the line.
        const kv = opensFlow(inner) ? null : keyLine(inner);
        if (opensFlow(inner)) {
          arr.push(flowDepth(inner) > 0 ? readFlow(inner, row.n) : flow(inner, row.n));
        } else if (kv) {
          const map: Record<string, YamlValue> = {};
          // Not a flat +2: `- key: value` usually has exactly one space after
          // the dash, but YAML allows more — `-   key: value` — and then the
          // actual key sits further right. A fixed column otherwise dragged
          // it along as the continuation of the previous scalar value.
          const afterDash = row.text.slice(1);
          const childIndent = row.indent + 1 + (afterDash.length - afterDash.trimStart().length);
          map[kv[0]] = value(kv[1], childIndent, row.n);
          while (
            i < rows.length &&
            rows[i].indent >= childIndent &&
            !rows[i].text.startsWith("- ")
          ) {
            const kv2 = keyLine(rows[i].text);
            if (!kv2) {
              throw new YamlError(`"key: value" erwartet, gefunden "${rows[i].text}"`, rows[i].n);
            }
            const own = rows[i].indent;
            const at = rows[i].n;
            i++;
            map[kv2[0]] = value(kv2[1], own, at);
          }
          arr.push(map);
        } else {
          if (/^[|>][-+]?\d*$/.test(inner)) {
            arr.push(blockScalar(inner, row.indent));
          } else if (
            (inner[0] === '"' || inner[0] === "'") &&
            findQuoteEnd(inner, inner[0], 1) === -1
          ) {
            arr.push(multilineScalar(inner, inner[0], row.indent, row.n));
          } else if (
            inner[0] !== '"' &&
            inner[0] !== "'" &&
            i < rows.length &&
            rows[i].indent > row.indent
          ) {
            arr.push(scalar(multilinePlain(inner, row.indent, row.n), row.n));
          } else {
            arr.push(scalar(inner, row.n));
          }
        }
      }
      return arr;
    }

    const obj: Record<string, YamlValue> = {};
    while (i < rows.length && rows[i].indent === indent) {
      const row = rows[i];
      if (row.text.startsWith("- ")) break;
      const kv = keyLine(row.text);
      if (!kv) throw new YamlError(`"key: value" erwartet, gefunden "${row.text}"`, row.n);
      i++;
      obj[kv[0]] = value(kv[1], indent, row.n);
    }
    return obj;
  }

  if (!rows.length) return null;
  const doc = parseBlock(rows[0].indent);
  if (i < rows.length) {
    throw yamlError("core.yaml.indent", { text: rows[i].text }, rows[i].n);
  }
  return doc;
}
