import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import {
  gherkinLabel,
  parseGherkin,
  tokenizeGherkin,
  type GherkinKeyword,
  type GherkinToken,
  type ScenarioStep,
} from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { GherkinStatementProps, GherkinStepView } from "./GherkinStatement";

export type WithGherkinStatementProps = Omit<
  GherkinStatementProps,
  "containerStyle" | "textStyle" | "tokenStyle" | "steps"
> & {
  /** Raw `statement` text from the record. */
  statement?: string;
  /** Steps already parsed — takes precedence over `statement`. */
  steps?: ScenarioStep[];
  /** Compact form for lists: smaller type, tighter lines. */
  compact?: boolean;
  style?: CSSProperties;
};

/** Colour per keyword: the outcome carries weight, And/But inherit their role. */
const KEYWORD_COLOR: Record<GherkinKeyword, string> = {
  GIVEN: color.ok,
  WHEN: color.signal,
  THEN: color.plan,
  AND: color.dim,
  BUT: color.due,
};

const KEYWORD_SOURCE: Record<GherkinKeyword, string> = {
  GIVEN: "Given",
  WHEN: "When",
  THEN: "Then",
  AND: "And",
  BUT: "But",
};

/** Parses the statement, assigns colours and prepares the tokens. */
export function withGherkinStatementLogic(Component: ComponentType<GherkinStatementProps>) {
  const Wrapped = ({ statement, steps, compact, style, ...rest }: WithGherkinStatementProps) => {
    const text = useText();
    const parsed = useMemo(() => steps ?? parseGherkin(statement), [statement, steps]);

    const views = useMemo<GherkinStepView[]>(
      () =>
        parsed.map((step, index) => {
          const keyword = (step.keyword || "AND") as GherkinKeyword;
          // And/But inherit the colour of the parent step.
          const inherited = (step.parent || keyword) as GherkinKeyword;
          const tone =
            keyword === "AND" || keyword === "BUT"
              ? (KEYWORD_COLOR[inherited] ?? color.dim)
              : KEYWORD_COLOR[keyword];

          return {
            key: `${index}-${step.keyword}`,
            keyword: step.keyword ? KEYWORD_SOURCE[keyword] : "",
            role: step.keyword ? gherkinLabel(keyword, text) : "",
            tokens: tokenizeGherkin(step.text),
            rowStyle: {
              display: "grid",
              gridTemplateColumns: "3px 52px minmax(0, 1fr)",
              gridTemplateAreas: '"rail keyword text" "rail role text"',
              columnGap: 10,
              alignItems: "baseline",
              padding: compact ? "3px 0" : "6px 0",
              minWidth: 0,
            },
            railStyle: {
              gridArea: "rail",
              alignSelf: "stretch",
              background: tone,
              opacity: keyword === "AND" ? 0.4 : 1,
            },
            keywordStyle: {
              gridArea: "keyword",
              fontFamily: font.mono,
              fontSize: compact ? fontSize.caption : fontSize.meta,
              fontWeight: keyword === "THEN" ? 500 : 400,
              color: tone,
              whiteSpace: "nowrap",
            },
            roleStyle: {
              gridArea: "role",
              fontFamily: font.mono,
              fontSize: fontSize.micro,
              letterSpacing: "0.1em",
              color: color.faint,
              whiteSpace: "nowrap",
            },
          };
        }),
      [compact, parsed, text],
    );

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: compact ? 2 : 4, minWidth: 0, ...style }),
      [compact, style],
    );

    const textStyle = useMemo<CSSProperties>(
      () => ({
        gridArea: "text",
        fontFamily: font.sans,
        fontSize: compact ? fontSize.meta : fontSize.body,
        lineHeight: 1.55,
        color: color.soft,
        overflowWrap: "anywhere",
      }),
      [compact],
    );

    const tokenStyle = useMemo<Record<GherkinToken["kind"], CSSProperties>>(
      () => ({
        quoted: { fontFamily: font.mono, fontSize: "0.92em", color: color.signal },
        placeholder: { fontFamily: font.mono, fontSize: "0.92em", color: color.due },
        identifier: { fontFamily: font.mono, fontSize: "0.92em", color: color.dim },
        literal: { fontFamily: font.mono, fontSize: "0.92em", color: color.dim },
        number: { fontFamily: font.mono, fontVariantNumeric: "tabular-nums", color: color.ink },
        prose: {},
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        textStyle={textStyle}
        tokenStyle={tokenStyle}
        steps={views}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withGherkinStatementLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
