import { parseYaml, YamlError } from "./yaml";
import type { YamlValue } from "./yaml";

export type GlossaryTerm = {
  term: string;

  definition: string;

  renderings: Record<string, string>;
};

export type Glossary = {
  schemaVersion: string;
  terms: GlossaryTerm[];
};

function asRecord(value: YamlValue): Record<string, YamlValue> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, YamlValue>)
    : {};
}

function asText(value: YamlValue): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRenderings(value: YamlValue): Record<string, string> {
  const doc = asRecord(value);
  const out: Record<string, string> = {};
  Object.keys(doc).forEach((locale) => {
    const rendering = asText(doc[locale]);
    if (rendering) out[locale] = rendering;
  });
  return out;
}

export function parseGlossary(text: string | undefined): Glossary | null {
  if (!text || !text.trim()) return null;

  let doc: Record<string, YamlValue>;
  try {
    doc = asRecord(parseYaml(text));
  } catch (error) {
    if (!(error instanceof YamlError)) throw error;
    return null;
  }

  const raw = Array.isArray(doc.terms) ? doc.terms : [];
  const terms: GlossaryTerm[] = [];
  raw.forEach((entry) => {
    const item = asRecord(entry);
    const term = asText(item.term);
    const definition = asText(item.definition);

    if (!term || !definition) return;
    terms.push({ term, definition, renderings: asRenderings(item.renderings) });
  });

  return terms.length > 0 ? { schemaVersion: asText(doc.schema_version), terms } : null;
}

function byLengthDescending(terms: string[]): string[] {
  return [...terms].sort((a, b) =>
    a.length !== b.length ? b.length - a.length : a.localeCompare(b),
  );
}

export function glossaryTermList(glossary: Glossary | null): string[] {
  if (!glossary) return [];
  return byLengthDescending(glossary.terms.map((entry) => entry.term));
}

export function lookupTerm(glossary: Glossary | null, term: string): GlossaryTerm | null {
  if (!glossary) return null;
  return glossary.terms.find((entry) => entry.term === term) ?? null;
}

export type ProseSegment =
  { kind: "text"; text: string } | { kind: "term"; text: string; term: string };

const WORD_CHAR = /[\p{L}\p{N}_]/u;

function isWordChar(text: string, index: number): boolean {
  if (index < 0 || index >= text.length) return false;
  return WORD_CHAR.test(text[index]);
}

export function linkTerms(text: string, terms: string[]): ProseSegment[] {
  if (!text) return [];
  if (terms.length === 0) return [{ kind: "text", text }];
  const candidates = byLengthDescending(terms);

  const out: ProseSegment[] = [];
  let plain = "";
  let i = 0;

  const flush = () => {
    if (plain) {
      out.push({ kind: "text", text: plain });
      plain = "";
    }
  };

  while (i < text.length) {
    if (!isWordChar(text, i) || isWordChar(text, i - 1)) {
      plain += text[i];
      i++;
      continue;
    }

    const hit = candidates.find(
      (term) => text.startsWith(term, i) && !isWordChar(text, i + term.length),
    );

    if (!hit) {
      plain += text[i];
      i++;
      continue;
    }

    flush();
    out.push({ kind: "term", text: hit, term: hit });
    i += hit.length;
  }

  flush();
  return out;
}
