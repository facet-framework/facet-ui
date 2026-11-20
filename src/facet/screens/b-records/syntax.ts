import { labelText } from "../../../i18n/legacy/labels";
export type TokenKind = "plain" | "kw" | "str" | "com" | "num" | "tag" | "key";
export type Token = { kind: TokenKind; text: string };

type Family = "c" | "hash" | "json" | "yaml" | "css" | "sql" | "markup" | "plain";

export type SourceLanguage = { id: string; name: string; family: Family; keywords: Set<string> };

const words = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

const KW = {
  go: words(
    "break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var nil true false iota",
  ),
  ts: words(
    "abstract as async await break case catch class const continue debugger default delete do else enum export extends false finally for from function if implements import in instanceof interface let new null of private protected public readonly return static super switch this throw true try type typeof undefined var void while with yield satisfies keyof",
  ),
  py: words(
    "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield",
  ),
  sh: words(
    "if then else elif fi for while until do done case esac in function return local export readonly set unset exit shift trap",
  ),
  rs: words(
    "as async await break const continue crate else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while",
  ),
  java: words(
    "abstract boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new null package private protected public return short static super switch synchronized this throw throws true false try void volatile while val var fun when object override namespace using",
  ),
  sql: words(
    "select from where insert into values update set delete create table alter drop index join left right inner outer on and or not null as group by order having limit primary key references",
  ),
  none: words(""),
};

const LANGS: Record<string, SourceLanguage> = {
  go: { id: "go", name: "Go", family: "c", keywords: KW.go },
  ts: { id: "ts", name: "TypeScript", family: "c", keywords: KW.ts },
  js: { id: "js", name: "JavaScript", family: "c", keywords: KW.ts },
  py: { id: "py", name: "Python", family: "hash", keywords: KW.py },
  sh: { id: "sh", name: "Shell", family: "hash", keywords: KW.sh },
  rb: { id: "rb", name: "Ruby", family: "hash", keywords: KW.none },
  rs: { id: "rs", name: "Rust", family: "c", keywords: KW.rs },
  java: { id: "java", name: "Java", family: "c", keywords: KW.java },
  kt: { id: "kt", name: "Kotlin", family: "c", keywords: KW.java },
  cs: { id: "cs", name: "C#", family: "c", keywords: KW.java },
  c: { id: "c", name: "C", family: "c", keywords: KW.java },
  json: { id: "json", name: "JSON", family: "json", keywords: words("true false null") },
  yaml: { id: "yaml", name: "YAML", family: "yaml", keywords: words("true false null yes no") },
  toml: { id: "toml", name: "TOML", family: "hash", keywords: words("true false") },
  css: { id: "css", name: "CSS", family: "css", keywords: KW.none },
  sql: { id: "sql", name: "SQL", family: "sql", keywords: KW.sql },
  html: { id: "html", name: "HTML", family: "markup", keywords: KW.none },
  text: { id: "text", name: "Text", family: "plain", keywords: KW.none },
};

const BY_EXT: Record<string, string> = {
  go: "go",
  ts: "ts",
  tsx: "ts",
  mts: "ts",
  cts: "ts",
  js: "js",
  jsx: "js",
  mjs: "js",
  cjs: "js",
  py: "py",
  sh: "sh",
  bash: "sh",
  zsh: "sh",
  rb: "rb",
  rs: "rs",
  java: "java",
  kt: "kt",
  kts: "kt",
  scala: "java",
  swift: "java",
  dart: "java",
  cs: "cs",
  c: "c",
  h: "c",
  cc: "c",
  cpp: "c",
  hpp: "c",
  php: "c",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  css: "css",
  scss: "css",
  sql: "sql",
  html: "html",
  xml: "html",
  svg: "html",
  vue: "html",
  bpmn: "html",
};

const BY_NAME: Record<string, string> = {
  dockerfile: "sh",
  makefile: "sh",
  ".gitignore": "sh",
  ".facetignore": "sh",
};

export function languageOf(path: string): SourceLanguage {
  const name = path.slice(path.lastIndexOf("/") + 1).toLowerCase();
  if (BY_NAME[name]) return LANGS[BY_NAME[name]];
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1) : "";
  return LANGS[BY_EXT[ext] ?? "text"];
}

const TAG_RE = /@facet(?:-role|-proves)?:/g;

function comment(text: string, out: Token[]) {
  let at = 0;
  for (const m of text.matchAll(TAG_RE)) {
    if (m.index > at) out.push({ kind: "com", text: text.slice(at, m.index) });
    out.push({ kind: "tag", text: m[0] });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ kind: "com", text: text.slice(at) });
}

export function isTagLine(tokens: Token[]): boolean {
  return tokens.some((t) => t.kind === "tag");
}

type State = { block: null | "comment" | "template" | "markup-comment" };

const IDENT = /[A-Za-z_$][\w$]*/y;
const NUMBER = /(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)/y;

export function tokenize(text: string, lang: SourceLanguage): Token[][] {
  const state: State = { block: null };
  return text.split("\n").map((line) => tokenizeLine(line.replace(/\r$/, ""), lang, state));
}

function tokenizeLine(line: string, lang: SourceLanguage, state: State): Token[] {
  const out: Token[] = [];
  const fam = lang.family;
  let plain = "";
  const flush = () => {
    if (plain) out.push({ kind: "plain", text: plain });
    plain = "";
  };
  let i = 0;

  if (fam === "plain") {
    comment(line, out);
    return out.map((t) => (t.kind === "com" ? { kind: "plain", text: t.text } : t));
  }

  while (i < line.length) {
    if (state.block === "comment" || state.block === "markup-comment") {
      const close = state.block === "comment" ? "*/" : "-->";
      const end = line.indexOf(close, i);
      const stop = end < 0 ? line.length : end + close.length;
      flush();
      comment(line.slice(i, stop), out);
      i = stop;
      if (end >= 0) state.block = null;
      continue;
    }
    if (state.block === "template") {
      const end = findClose(line, i, "`");
      const stop = end < 0 ? line.length : end + 1;
      flush();
      out.push({ kind: "str", text: line.slice(i, stop) });
      i = stop;
      if (end >= 0) state.block = null;
      continue;
    }
    const rest = line.slice(i);
    const ch = line[i];

    const lineComment =
      (fam === "c" && rest.startsWith("//")) ||
      ((fam === "hash" || fam === "yaml") && ch === "#" && (i === 0 || /\s/.test(line[i - 1]))) ||
      (fam === "sql" && rest.startsWith("--"));
    if (lineComment) {
      flush();
      comment(rest, out);
      return out;
    }
    if ((fam === "c" || fam === "css") && rest.startsWith("/*")) {
      state.block = "comment";
      flush();
      const end = line.indexOf("*/", i + 2);
      const stop = end < 0 ? line.length : end + 2;
      comment(line.slice(i, stop), out);
      i = stop;
      if (end >= 0) state.block = null;
      continue;
    }
    if (fam === "markup" && rest.startsWith("<!--")) {
      state.block = "markup-comment";
      flush();
      const end = line.indexOf("-->", i + 4);
      const stop = end < 0 ? line.length : end + 3;
      comment(line.slice(i, stop), out);
      i = stop;
      if (end >= 0) state.block = null;
      continue;
    }

    if (ch === '"' || ch === "'" || (ch === "`" && fam === "c")) {
      if (ch === "'" && fam === "markup") {
        plain += ch;
        i++;
        continue;
      }
      const end = findClose(line, i + 1, ch);
      flush();
      if (end < 0) {
        out.push({ kind: "str", text: line.slice(i) });
        if (ch === "`") state.block = "template";
        return out;
      }
      const text = line.slice(i, end + 1);

      const isKey = (fam === "json" || fam === "yaml") && /^\s*:/.test(line.slice(end + 1));
      out.push({ kind: isKey ? "key" : labelText.text261, text });
      i = end + 1;
      continue;
    }

    if (fam === "yaml" && /^[\s-]*$/.test(line.slice(0, i))) {
      const m = /^[A-Za-z_][\w.-]*(?=\s*:(\s|$))/.exec(rest);
      if (m) {
        flush();
        out.push({ kind: "key", text: m[0] });
        i += m[0].length;
        continue;
      }
    }

    if (/\d/.test(ch) && !/[\w$]/.test(line[i - 1] ?? "")) {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(line);
      if (m) {
        flush();
        out.push({ kind: "num", text: m[0] });
        i += m[0].length;
        continue;
      }
    }

    if (/[A-Za-z_$]/.test(ch)) {
      IDENT.lastIndex = i;
      const m = IDENT.exec(line);
      if (m) {
        const word = m[0];
        const kw = fam === "sql" ? lang.keywords.has(word.toLowerCase()) : lang.keywords.has(word);
        if (kw) {
          flush();
          out.push({ kind: "kw", text: word });
        } else {
          plain += word;
        }
        i += word.length;
        continue;
      }
    }

    plain += ch;
    i++;
  }
  flush();
  return out;
}

function findClose(line: string, from: number, quote: string): number {
  for (let i = from; i < line.length; i++) {
    if (line[i] === "\\") {
      i++;
      continue;
    }
    if (line[i] === quote) return i;
  }
  return -1;
}
