import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { localized } from "../i18n/legacy/core/gherkin";

import type { GherkinKeyword, ScenarioStep } from "./types";

export const GHERKIN_LABEL: Record<GherkinKeyword, string> = {
  GIVEN: "AUSGANGSLAGE",
  WHEN: "AKTION",
  THEN: labelText.text331,
  AND: localized.text1,
  BUT: localized.text2,
};

const KEYWORD_RE = /^(Given|When|Then|And|But|\*)\s+(.*)$/i;

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

const TOKEN_RE = localized.tokenPattern;

function oneLine(text: string): string {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

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

export function scenarioPreview(steps: ScenarioStep[]): { label: string; text: string } | null {
  if (!steps.length) return null;
  const then = steps.find((s) => s.keyword === "THEN" || s.parent === "THEN");
  if (then) return { label: GHERKIN_LABEL.THEN, text: oneLine(then.text) };
  const last = steps[steps.length - 1];
  return { label: remainingText.text52, text: oneLine(last.text) };
}
