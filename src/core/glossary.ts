/**
 * The project glossary (FACET §4.5) — `docs/facets/glossary.yaml`.
 *
 * Records are written in the language of their product, and a domain term
 * appears in many of them and is explained in none. Every record that needs it
 * either silently assumes it or explains it anew — and two explanations are
 * free to drift apart.
 *
 * No record refers to the glossary. There is no reference field and no markup:
 * the reader builds an index over the declared terms and treats every exact,
 * case-sensitive occurrence at a word boundary as a reference to the
 * definition. Matching by content instead of by a reference id — the same rule
 * just because the glossary has grown.
 *
 * If the file is missing, it is missing. `parseGlossary` then returns `null`
 * and not an empty glossary: a project without the file has not failed to
 * define something, and a view that confuses the two claims something nobody
 * said.
 */

import { parseYaml, YamlError } from "./yaml";
import type { YamlValue } from "./yaml";

export type GlossaryTerm = {
  /** The term, spelled exactly as in the records. */
  term: string;
  /** What the word means in this product. */
  definition: string;
  /**
   * Translations per locale, reserved by the 1.4 proposal for the docs
   * pipeline. The reader shows them and does not otherwise evaluate them —
   * empty here means "none declared", not "none needed".
   */
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

/**
 * Reads the glossary text. Empty text — that is, no file — yields `null`.
 *
 * So does broken YAML: the linter is the place that makes a faulty glossary
 * loud, not this one. The same decision as for the taxonomy, for the same
 * reason.
 */
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
    // An entry without a term has no text to link, one without a definition
    // nothing to show. Both are skipped instead of discarding all the rest —
    // the linter reports the entry, the reader shows the others.
    if (!term || !definition) return;
    terms.push({ term, definition, renderings: asRenderings(item.renderings) });
  });

  // In file order: it is the project's order, and re-sorting here would be an
  // opinion about which term matters more.
  return terms.length > 0 ? { schemaVersion: asText(doc.schema_version), terms } : null;
}

/**
 * Longest first, alphabetical at equal length — so that "Order Line" wins where
 * a project has also declared "Order", and so that reading twice yields the
 * same result twice.
 */
function byLengthDescending(terms: string[]): string[] {
  return [...terms].sort((a, b) =>
    a.length !== b.length ? b.length - a.length : a.localeCompare(b),
  );
}

/** The declared terms, in the order in which they are searched for. */
export function glossaryTermList(glossary: Glossary | null): string[] {
  if (!glossary) return [];
  return byLengthDescending(glossary.terms.map((entry) => entry.term));
}

/** Looks a term up exactly. Letter case is part of the identity. */
export function lookupTerm(glossary: Glossary | null, term: string): GlossaryTerm | null {
  if (!glossary) return null;
  return glossary.terms.find((entry) => entry.term === term) ?? null;
}

/** A piece of rendered prose: either text or a linked term. */
export type ProseSegment =
  { kind: "text"; text: string } | { kind: "term"; text: string; term: string };

/**
 * Whether a character belongs to a word. Letters, numerals, underscore —
 * everything else is a word boundary, hyphens and apostrophes included.
 *
 * `\p{L}` instead of `A-Za-z`, so that an umlaut in a term is the letter it is,
 * and not a boundary in the middle of the word.
 */
const WORD_CHAR = /[\p{L}\p{N}_]/u;

function isWordChar(text: string, index: number): boolean {
  if (index < 0 || index >= text.length) return false;
  return WORD_CHAR.test(text[index]);
}

/**
 * Splits prose into text and linked terms.
 *
 * The rule exists twice in the project — here and in `FindTerms` of the Go
 * engine (`internal/facet/glossary.go`) — and is the same both times, because
 * the linter must judge the same spot the reader links: exact, case-sensitive,
 * starting and ending at a word boundary. A term is found whole or not at all;
 * "Order" in "Reordering" is not the term.
 *
 * Where two terms start at the same position, the longer one wins. Sorting
 * happens here and not at the caller: a function whose result depends on the
 * order of its input list is a trap, and the Go side sorts inside `FindTerms`
 * itself for the same reason. Nothing can overlap: after a hit the search
 * continues behind it.
 */
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
    // A hit can only start where a word starts.
    if (!isWordChar(text, i) || isWordChar(text, i - 1)) {
      plain += text[i];
      i++;
      continue;
    }

    const hit = candidates.find(
      (term) =>
        text.startsWith(term, i) &&
        // The end must be a word boundary as well, otherwise "Consigneeliste"
        // would be a hit on "Consignee".
        !isWordChar(text, i + term.length),
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
