import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/ScenarioLedger/ScenarioLedger.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { Scenario } from "../../../core";
import { color, font, fontSize, TEST_KIND_LABEL } from "../../../design-system/tokens";
import GherkinStatement from "../GherkinStatement";
import type { LedgerEntry, ScenarioLedgerProps } from "./ScenarioLedger";

export type WithScenarioLedgerProps = Omit<
  ScenarioLedgerProps,
  "containerStyle" | "captionStyle" | "entries" | "caption"
> & {
  scenarios: Scenario[];

  onlyGaps?: boolean;

  compact?: boolean;
  style?: CSSProperties;
};

function stateLine(scenario: Scenario): string {
  const describe = (value: unknown, word: string) => {
    if (!value || typeof value !== "object") return "";
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return "";
    return `${word}: ${entries.map(([key, val]) => `${key} ${val}`).join(", ")}`;
  };
  const parts = [
    describe(scenario.pre, labelText.text279),
    describe(scenario.post, labelText.text280),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : localized.text1;
}

function backingGapOf(scenario: Scenario): string {
  if (scenario.backing.state !== "unbacked") return "";
  const reason = scenario.backing.reason || localized.text2;
  return scenario.backing.unblockedBy
    ? `${localized.text3}${reason}${localized.text4}${scenario.backing.unblockedBy}`
    : `${localized.text5}${reason}`;
}

type ImplementedLine = {
  refs: string[];
  label: string;
  state: "implemented" | "gap" | "unclaimed" | "not-explained";
};

function implementedLineOf(scenario: Scenario): ImplementedLine {
  if (scenario.implementedBy.length) {
    return {
      refs: scenario.implementedBy.map(
        (anchor) => `${anchor.path}:${anchor.line}${anchor.excerpt ? ` · ${anchor.excerpt}` : ""}`,
      ),
      label: "",
      state: "implemented",
    };
  }
  if (!scenario.anchorsAdopted) {
    return {
      refs: [],
      label: localized.text6,
      state: "not-explained",
    };
  }
  if (scenario.proven) {
    return {
      refs: [],
      label: localized.text7,
      state: "gap",
    };
  }
  return {
    refs: [],
    label: localized.text8,
    state: "unclaimed",
  };
}

export function withScenarioLedgerLogic(Component: ComponentType<ScenarioLedgerProps>) {
  const Wrapped = ({ scenarios, onlyGaps, compact, style, ...rest }: WithScenarioLedgerProps) => {
    const visible = useMemo(
      () => (onlyGaps ? scenarios.filter((scenario) => !scenario.proven) : scenarios),
      [onlyGaps, scenarios],
    );

    const entries = useMemo<LedgerEntry[]>(
      () =>
        visible.map((scenario) => {
          const implemented = implementedLineOf(scenario);
          return {
            key: scenario.id,
            id: scenario.id,
            proven: scenario.proven,
            status: scenario.proven ? "Test zugeordnet" : localized.text9,
            state: stateLine(scenario),
            tests: scenario.tests.map(
              (test) => `${TEST_KIND_LABEL[test.kind] ?? test.kind} · ${test.id}`,
            ),
            backingGap: backingGapOf(scenario),
            implementedBy: implemented.refs,
            implementedByLabel: implemented.label,
            implementedByState: implemented.state,
            statement: compact ? null : (
              <GherkinStatement steps={scenario.steps} compact style={{ gridColumn: "1 / -1" }} />
            ),
            rowStyle: {
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: 6,
              padding: "10px 0",
              borderTopStyle: "solid",
              borderTopWidth: 1,
              borderTopColor: color.line,
              minWidth: 0,
            },
            idStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.meta,
              color: color.ink,
              fontWeight: scenario.proven ? 400 : 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
            statusStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: scenario.proven ? color.ok : color.signal,
              whiteSpace: "nowrap",
            },
            stateStyle: {
              gridColumn: "1 / -1",
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              color: color.dim,
            },
            testStyle: {
              gridColumn: "1 / -1",
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              color: scenario.tests.length ? color.soft : color.faint,
              whiteSpace: "pre-line",
            },
            backingStyle: {
              gridColumn: "1 / -1",
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              color: color.signal,
            },
            implementedStyle: {
              gridColumn: "1 / -1",
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              color:
                implemented.state === "implemented"
                  ? color.soft
                  : implemented.state === "gap"
                    ? color.signal
                    : color.faint,
              whiteSpace: implemented.refs.length ? "pre-line" : "normal",
            },
          };
        }),
      [compact, visible],
    );

    const caption = useMemo(() => {
      if (!scenarios.length) return localized.text10;
      const proven = scenarios.filter((scenario) => scenario.proven).length;
      const tests = scenarios.reduce((sum, scenario) => sum + scenario.tests.length, 0);
      return `${scenarios.length}${localized.text11}${proven}${localized.text12}${tests} ${
        tests === 1 ? "Test" : "Tests"
      }.`;
    }, [scenarios]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 2, minWidth: 0, ...style }),
      [style],
    );

    const captionStyle = useMemo<CSSProperties>(
      () => ({
        margin: "0 0 4px",
        fontFamily: font.sans,
        fontSize: fontSize.base,
        color: color.ink,
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        captionStyle={captionStyle}
        entries={entries}
        caption={caption}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withScenarioLedgerLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
