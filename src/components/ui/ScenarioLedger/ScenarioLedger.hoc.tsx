import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { testKindLabel, type Scenario } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText, type FacetText } from "../../../facet/i18n";
import GherkinStatement from "../GherkinStatement";
import type { LedgerEntry, ScenarioLedgerProps } from "./ScenarioLedger";

export type WithScenarioLedgerProps = Omit<
  ScenarioLedgerProps,
  "containerStyle" | "captionStyle" | "entries" | "caption"
> & {
  scenarios: Scenario[];
  /** Only promises without evidence. */
  onlyGaps?: boolean;
  /** Promises in compact form, without the Gherkin steps. */
  compact?: boolean;
  style?: CSSProperties;
};

/** Phrases state transitions and the test list as plain text. */
function stateLine(scenario: Scenario, { t }: FacetText): string {
  const describe = (value: unknown, word: string) => {
    if (!value || typeof value !== "object") return "";
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return "";
    return `${word}: ${entries.map(([key, val]) => `${key} ${val}`).join(", ")}`;
  };
  const parts = [
    describe(scenario.pre, t("elements.scenarioLedger.before")),
    describe(scenario.post, t("elements.scenarioLedger.after")),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : t("elements.scenarioLedger.noStateChange");
}

/**
 * Reason and resolution as one sentence, only when the data is actually
 * missing. An `unblocked_by` without a reason or vice versa remains possible
 * (only `reason` is required by the schema) — both are shown when present,
 * neither is invented.
 */
function backingGapOf(scenario: Scenario, { t }: FacetText): string {
  if (scenario.backing.state !== "unbacked") return "";
  const reason = scenario.backing.reason || t("elements.scenarioLedger.noReason");
  return scenario.backing.unblockedBy
    ? t("elements.scenarioLedger.unbackedUnblockedBy", {
        reason,
        by: scenario.backing.unblockedBy,
      })
    : t("elements.scenarioLedger.unbacked", { reason });
}

type ImplementedLine = {
  refs: string[];
  label: string;
  state: "implemented" | "gap" | "unclaimed" | "not-explained";
};

/**
 * The implementation, mirrored to the proof: which anchors fulfil this
 * promise, with path, line and — when the scan supplies it — the signature,
 * without looking anything up. An empty cell is one of three statements,
 * never missing data:
 *
 * - `not-explained` — no anchor in the whole scan carries `proves`. The
 *   registry has not adopted `@facet-proves:` yet; the absence says nothing
 *   about this promise.
 * - `gap` — at least one test is mapped to the promise, but no anchor claims
 *   it. The finding this field brings.
 * - `unclaimed` — neither test nor anchor. Already said by the first column,
 *   only repeated neutrally here instead of being marked as a finding.
 */
function implementedLineOf(scenario: Scenario, { t }: FacetText): ImplementedLine {
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
      label: t("elements.scenarioLedger.notExplained"),
      state: "not-explained",
    };
  }
  if (scenario.proven) {
    return {
      refs: [],
      label: t("elements.scenarioLedger.gap"),
      state: "gap",
    };
  }
  return {
    refs: [],
    label: t("elements.scenarioLedger.unclaimed"),
    state: "unclaimed",
  };
}

/** Builds the register rows and counts the evidence. */
export function withScenarioLedgerLogic(Component: ComponentType<ScenarioLedgerProps>) {
  const Wrapped = ({ scenarios, onlyGaps, compact, style, ...rest }: WithScenarioLedgerProps) => {
    const text = useText();
    const { t, plural } = text;
    const visible = useMemo(
      () => (onlyGaps ? scenarios.filter((scenario) => !scenario.proven) : scenarios),
      [onlyGaps, scenarios],
    );

    const entries = useMemo<LedgerEntry[]>(
      () =>
        visible.map((scenario) => {
          const implemented = implementedLineOf(scenario, text);
          return {
            key: scenario.id,
            id: scenario.id,
            proven: scenario.proven,
            status: scenario.proven
              ? t("elements.scenarioLedger.mapped")
              : t("elements.scenarioLedger.noTest"),
            state: stateLine(scenario, text),
            tests: scenario.tests.map((test) => `${testKindLabel(test.kind, text)} · ${test.id}`),
            backingGap: backingGapOf(scenario, text),
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
      [compact, text, t, visible],
    );

    const caption = useMemo(() => {
      if (!scenarios.length) return t("elements.scenarioLedger.empty");
      const proven = scenarios.filter((scenario) => scenario.proven).length;
      const tests = scenarios.reduce((sum, scenario) => sum + scenario.tests.length, 0);
      return t("elements.scenarioLedger.caption", {
        total: scenarios.length,
        proven,
        tests: plural("elements.scenarioLedger.tests", tests),
      });
    }, [plural, scenarios, t]);

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
