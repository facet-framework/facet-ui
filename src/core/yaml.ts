import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { localized } from "../i18n/legacy/core/yaml";

export class YamlError extends Error {
  readonly line?: number;

  constructor(message: string, line?: number) {
    super(line != null ? `${message}${labelText.text385}${line + 1})` : message);
    this.name = "YamlError";
    this.line = line;
  }
}

export type YamlValue =
  string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

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

function opensFlow(s: string): boolean {
  return s[0] === "[" || s[0] === "{";
}

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

function trailingBackslashCount(s: string): number {
  let n = 0;
  for (let i = s.length - 1; i >= 0 && s[i] === "\\"; i--) n++;
  return n;
}

function flow(s: string, line?: number): YamlValue {
  const t = s.trim();
  if (t[0] === "[") {
    if (!t.endsWith("]")) throw new YamlError(localized.text1, line);
    return splitFlow(t.slice(1, -1), line).map((v) => scalar(v, line));
  }
  if (!t.endsWith("}")) throw new YamlError(localized.text2, line);
  const obj: Record<string, YamlValue> = {};
  splitFlow(t.slice(1, -1), line).forEach((pair) => {
    const idx = pair.indexOf(":");
    if (idx < 0) throw new YamlError(localized.text3, line);
    obj[String(scalar(pair.slice(0, idx), line))] = scalar(pair.slice(idx + 1), line);
  });
  return obj;
}

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
        throw new YamlError(localized.text4, n);
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

  function readFlow(head: string, line: number): YamlValue {
    let text = head;
    while (flowDepth(text) > 0) {
      if (i >= rows.length) {
        throw new YamlError(localized.text5, line);
      }

      text += " " + rows[i].text;
      i++;
    }
    return flow(text, line);
  }

  function multilineScalar(rest: string, quote: '"' | "'", indent: number, line: number): string {
    type Segment = { text: string; sep: "space" | "newline" | "none" };
    const segments: Segment[] = [];

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
        throw new YamlError(localized.text6, line);
      }
      const row = rows[i];
      const sep: Segment["sep"] = row.n - prevN > 1 ? "newline" : "space";

      const endIdx = findQuoteEnd(row.raw, quote, 0);
      if (endIdx === -1) {
        pushSegment(row.raw, sep);
        prevN = row.n;
        i++;
      } else {
        const remainder = stripComment(row.raw.slice(endIdx + 1)).trim();
        if (remainder !== "") {
          throw new YamlError(`${remainingText.text28}${remainder}"`, row.n);
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

      if (next && next.indent > indent && opensFlow(next.text)) {
        const at = next.n;
        i++;
        return readFlow(next.text, at);
      }

      if (next && next.indent === indent && (next.text.startsWith("- ") || next.text === "-")) {
        return parseBlock(indent);
      }
      return i < rows.length && rows[i].indent > indent ? parseBlock(rows[i].indent) : null;
    }
    if (/^[|>][-+]?\d*$/.test(rest)) return blockScalar(rest, indent);

    if (opensFlow(rest) && flowDepth(rest) > 0) return readFlow(rest, line);
    if (rest[0] === '"' || rest[0] === "'") {
      if (findQuoteEnd(rest, rest[0], 1) === -1)
        return multilineScalar(rest, rest[0], indent, line);
      return scalar(rest, line);
    }

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

        const kv = opensFlow(inner) ? null : keyLine(inner);
        if (opensFlow(inner)) {
          arr.push(flowDepth(inner) > 0 ? readFlow(inner, row.n) : flow(inner, row.n));
        } else if (kv) {
          const map: Record<string, YamlValue> = {};

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
    throw new YamlError(`${localized.text7}${rows[i].text}"`, rows[i].n);
  }
  return doc;
}
