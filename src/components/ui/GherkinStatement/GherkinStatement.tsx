import type { CSSProperties } from "react";
import type { GherkinToken } from "../../../core";

export type GherkinStepView = {
  key: string;
  /** Keyword in the original, e.g. `Given`. */
  keyword: string;
  /** Role in capitals, e.g. `GIVEN`; localized by the active text language. */
  role: string;
  tokens: GherkinToken[];
  keywordStyle: CSSProperties;
  roleStyle: CSSProperties;
  railStyle: CSSProperties;
  rowStyle: CSSProperties;
};

export type GherkinStatementProps = {
  containerStyle: CSSProperties;
  textStyle: CSSProperties;
  tokenStyle: Record<GherkinToken["kind"], CSSProperties>;
  steps: GherkinStepView[];
  "data-testid"?: string;
};

/**
 * Gherkin as Gherkin: Given · When · Then · And · But with a localized role label,
 * coloured rail and token highlighting (quotes, `<placeholders>`,
 * `snake_case`, literals, numbers with a unit).
 */
export function GherkinStatement({
  containerStyle,
  textStyle,
  tokenStyle,
  steps,
  ...rest
}: GherkinStatementProps) {
  return (
    <div style={containerStyle} {...rest}>
      {steps.map((step) => (
        <div key={step.key} style={step.rowStyle} data-step={step.keyword}>
          <span style={step.railStyle} aria-hidden="true" />
          <span style={step.keywordStyle}>{step.keyword}</span>
          <span style={step.roleStyle}>{step.role}</span>
          <span style={textStyle}>
            {step.tokens.map((token, index) => (
              <span key={`${step.key}-${index}`} style={tokenStyle[token.kind]}>
                {token.text}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

export default GherkinStatement;
