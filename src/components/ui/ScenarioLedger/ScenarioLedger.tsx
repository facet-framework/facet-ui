import type { CSSProperties, ReactNode } from "react";
import { useText } from "../../../facet/i18n";

export type LedgerEntry = {
  key: string;
  /** Id from `contract.scenarios[].id`. */
  id: string;
  proven: boolean;
  /** "with a mapped test" or "without a test". */
  status: string;
  /** State change as plain text, e.g. "before: count 0 · after: count 1". */
  state: string;
  /** Proving tests, already formatted. */
  tests: string[];
  /**
   * Cause and fix when the data this scenario reads is missing
   * (`backing: unbacked`) — empty when the data is there. No separate field
   * for the expected result: the cause describes what is missing, not what
   * should be true instead.
   */
  backingGap: string;
  /** Fulfilling anchors, already formatted as `path:line [· excerpt]`. */
  implementedBy: string[];
  /** Text for the empty cell when `implementedBy` is empty. */
  implementedByLabel: string;
  /**
   * `implemented` — at least one anchor claims the promise.
   * `gap` — tests are assigned to the promise, but no anchor claims it: a finding.
   * `unclaimed` — no anchor, but no test either — simply open.
   * `not-explained` — no anchor in the whole scan carries `proves`; the registry
   * has not introduced `@facet-proves:` yet. Must look different from `gap`.
   */
  implementedByState: "implemented" | "gap" | "unclaimed" | "not-explained";
  statement: ReactNode;
  rowStyle: CSSProperties;
  idStyle: CSSProperties;
  statusStyle: CSSProperties;
  stateStyle: CSSProperties;
  testStyle: CSSProperties;
  backingStyle: CSSProperties;
  implementedStyle: CSSProperties;
};

export type ScenarioLedgerProps = {
  containerStyle: CSSProperties;
  captionStyle: CSSProperties;
  entries: LedgerEntry[];
  /** Answer line above the register. */
  caption: string;
  "data-testid"?: string;
};

/**
 * Promise register: per promise the steps, the state change and the tests
 * that prove it. Whatever has no test says so — it is not left out.
 */
export function ScenarioLedger({
  containerStyle,
  captionStyle,
  entries,
  caption,
  ...rest
}: ScenarioLedgerProps) {
  const { t } = useText();
  return (
    <div style={containerStyle} {...rest}>
      <p style={captionStyle}>{caption}</p>
      {entries.map((entry) => (
        <div key={entry.key} style={entry.rowStyle} data-scenario={entry.id}>
          <span style={entry.idStyle}>{entry.id}</span>
          <span style={entry.statusStyle}>{entry.status}</span>
          {entry.statement}
          <span style={entry.stateStyle}>{entry.state}</span>
          <span style={entry.testStyle}>
            {entry.tests.length ? entry.tests.join("\n") : t("elements.scenarioLedger.noTestNamed")}
          </span>
          <span style={entry.implementedStyle} data-implemented-by={entry.implementedByState}>
            {entry.implementedBy.length ? entry.implementedBy.join("\n") : entry.implementedByLabel}
          </span>
          {entry.backingGap ? (
            <span style={entry.backingStyle} data-backing-gap>
              {entry.backingGap}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default ScenarioLedger;
