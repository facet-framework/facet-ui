import { localized } from "../../../i18n/legacy/components/ui/ScenarioLedger/ScenarioLedger";
import type { CSSProperties, ReactNode } from "react";

export type LedgerEntry = {
  key: string;

  id: string;
  proven: boolean;

  status: string;

  state: string;

  tests: string[];

  backingGap: string;

  implementedBy: string[];

  implementedByLabel: string;

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

  caption: string;
  "data-testid"?: string;
};

export function ScenarioLedger({
  containerStyle,
  captionStyle,
  entries,
  caption,
  ...rest
}: ScenarioLedgerProps) {
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
            {entry.tests.length ? entry.tests.join("\n") : localized.text1}
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
