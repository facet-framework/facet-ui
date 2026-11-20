import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import {
  GHERKIN_LABEL,
  parseGherkin,
  tokenizeGherkin,
  type GherkinKeyword,
  type GherkinToken,
  type ScenarioStep,
} from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { GherkinStatementProps, GherkinStepView } from "./GherkinStatement";

export type WithGherkinStatementProps = Omit<
  GherkinStatementProps,
  "containerStyle" | "textStyle" | "tokenStyle" | "steps"
> & {
  statement?: string;

  steps?: ScenarioStep[];

  compact?: boolean;
  style?: CSSProperties;
};

const KEYWORD_COLOR: Record<GherkinKeyword, string> = {
  GIVEN: color.ok,
  WHEN: color.signal,
  THEN: color.plan,
  AND: color.dim,
  BUT: color.deadline,
};

const KEYWORD_SOURCE: Record<GherkinKeyword, string> = {
  GIVEN: "Given",
  WHEN: "When",
  THEN: "Then",
  AND: "And",
  BUT: "But",
};

export function withGherkinStatementLogic(Component: ComponentType<GherkinStatementProps>) {
  const Wrapped = ({ statement, steps, compact, style, ...rest }: WithGherkinStatementProps) => {
    const parsed = useMemo(() => steps ?? parseGherkin(statement), [statement, steps]);

    const views = useMemo<GherkinStepView[]>(
      () =>
        parsed.map((step, index) => {
          const keyword = (step.keyword || "AND") as GherkinKeyword;

          const inherited = (step.parent || keyword) as GherkinKeyword;
          const tone =
            keyword === "AND" || keyword === "BUT"
              ? (KEYWORD_COLOR[inherited] ?? color.dim)
              : KEYWORD_COLOR[keyword];

          return {
            key: `${index}-${step.keyword}`,
            keyword: step.keyword ? KEYWORD_SOURCE[keyword] : "",
            role: step.keyword ? GHERKIN_LABEL[keyword] : "",
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
      [compact, parsed],
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
        placeholder: { fontFamily: font.mono, fontSize: "0.92em", color: color.deadline },
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
