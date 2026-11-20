/**
 * Gherkin — parser and token highlighting. `*` counts as `And`; `And`/`But`
 * inherit an existing parent `Given`/`When`/`Then`. Text lines without a
 * keyword continue the previous step.
 */

import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import { gherkinLabel } from "./labels";
import type { GherkinKeyword, ScenarioStep } from "./types";

/** English role labels; `gherkinLabel` from `./labels` follows the active language. */
export const GHERKIN_LABEL: Record<GherkinKeyword, string> = {
  GIVEN: "GIVEN",
  WHEN: "WHEN",
  THEN: "THEN",
  AND: "AND",
  BUT: "BUT",
};

const KEYWORD_RE = /^(Given|When|Then|And|But|\*)\s+(.*)$/i;

/** Splits a `statement` into steps. Empty input yields an empty list. */
export function parseGherkin(statement: string | null | undefined): ScenarioStep[] {
  const steps: ScenarioStep[] = [];
  let lastKind: GherkinKeyword | "" = "";

  String(statement ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      const m = line.match(KEYWORD_RE);
      if (m) {
        const kw = (m[1] === "*" ? "AND" : m[1].toUpperCase()) as GherkinKeyword;
        if (kw !== "AND" && kw !== "BUT") lastKind = kw;
        steps.push({
          keyword: kw,
          parent: kw === "AND" || kw === "BUT" ? lastKind || kw : kw,
          text: m[2],
        });
        return;
      }
      if (steps.length) {
        steps[steps.length - 1].text += ` ${line}`;
        return;
      }
      steps.push({ keyword: "", parent: "", text: line });
    });

  return steps;
}

export type GherkinTokenKind =
  "quoted" | "placeholder" | "literal" | "identifier" | "number" | "prose";

export type GherkinToken = {
  kind: GherkinTokenKind;
  text: string;
};

// Units in English and in German: statements are record content, written in the project's language.
const TOKEN_RE =
  /("[^"]*"|'[^']*'|<[^>]+>|\b\d+(?:[.,]\d+)?\s*(?:%|px|ms|s|min|h|d|days?|months?|seconds?|minutes?|hours?|characters?|Tage?|Monate?|Sekunden?|Minuten?|Stunden?|Zeichen)?\b|\b[a-z_]+(?:_[a-z]+)+\b|\btrue\b|\bfalse\b|\bnull\b)/g;

function oneLine(text: string): string {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits a step text into tokens for highlighting:
 * quoted values, `<placeholders>`, `snake_case`, literals, numbers with a unit, prose.
 */
export function tokenizeGherkin(text: string | null | undefined): GherkinToken[] {
  const src = oneLine(text ?? "");
  const out: GherkinToken[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(src))) {
    if (match.index > last) {
      out.push({ kind: "prose", text: src.slice(last, match.index) });
    }
    const token = match[0];
    let kind: GherkinTokenKind = "number";
    if (/^["']/.test(token)) kind = "quoted";
    else if (/^</.test(token)) kind = "placeholder";
    else if (/^(true|false|null)$/.test(token)) kind = "literal";
    else if (/^[a-z_]+(_[a-z]+)+$/.test(token)) kind = "identifier";
    out.push({ kind, text: token });
    last = match.index + token.length;
  }

  if (last < src.length) out.push({ kind: "prose", text: src.slice(last) });
  return out;
}

/**
 * A readable preview line for lists: the OUTCOME with its role in front.
 * If there is no `Then`, the last step is used under the label "PROMISE"
 * (`core.gherkin.promise`).
 */
export function scenarioPreview(
  steps: ScenarioStep[],
  text: FacetText = ENGLISH_TEXT,
): { label: string; text: string } | null {
  if (!steps.length) return null;
  const then = steps.find((s) => s.keyword === "THEN" || s.parent === "THEN");
  if (then) return { label: gherkinLabel("THEN", text), text: oneLine(then.text) };
  const last = steps[steps.length - 1];
  return { label: text.t("core.gherkin.promise"), text: oneLine(last.text) };
}
