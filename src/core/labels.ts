/**
 * Plain-word labels for schema values, in the language of `text`.
 *
 * An unknown value is returned as it is: a record may carry a kind or a test
 * level that FACET has no word for, and the raw value says more than a blank.
 */
import { en, type TextKey } from "../facet/i18n/en";
import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import type { GherkinKeyword } from "./types";

function labelOf(prefix: string, value: string, text: FacetText): string {
  const key = `${prefix}.${value}`;
  return Object.prototype.hasOwnProperty.call(en, key) ? text.t(key as TextKey) : value;
}

/** The Gherkin role in capitals, e.g. `GIVEN` (key `core.gherkin.given`). */
export function gherkinLabel(keyword: GherkinKeyword, text: FacetText = ENGLISH_TEXT): string {
  return labelOf("core.gherkin", keyword.toLowerCase(), text);
}

/** One of the seven FACET sections, e.g. `contract` → "Promise". */
export function facetLabel(facet: string, text: FacetText = ENGLISH_TEXT): string {
  return labelOf("core.label.facet", facet, text);
}

/** A test level from `verification.*_tests`, e.g. `e2e` → "End-to-end". */
export function testKindLabel(kind: string, text: FacetText = ENGLISH_TEXT): string {
  return labelOf("core.label.testKind", kind, text);
}

/** A record kind, e.g. `policy` → "Policy". */
export function recordKindLabel(kind: string, text: FacetText = ENGLISH_TEXT): string {
  return labelOf("core.label.kind", kind, text);
}

/** A lifecycle state, e.g. `planned` → "planned". */
export function lifecycleLabel(lifecycle: string, text: FacetText = ENGLISH_TEXT): string {
  return labelOf("core.label.lifecycle", lifecycle, text);
}
