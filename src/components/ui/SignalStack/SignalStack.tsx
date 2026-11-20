import type { CSSProperties } from "react";

export type SignalEntry = {
  key: string;
  /** Kind of signal: SLO or alert. */
  kind: "slo" | "alert";
  name: string;
  /** Target or condition as plain text. */
  detail: string;
  /** Time window or severity. */
  meta: string;
  /** Runbook for when the alert fires — or the note that none is named. */
  runbook: string;
  open: boolean;
  rowStyle: CSSProperties;
  nameStyle: CSSProperties;
  detailStyle: CSSProperties;
  metaStyle: CSSProperties;
  runbookStyle: CSSProperties;
};

export type SignalStackProps = {
  containerStyle: CSSProperties;
  captionStyle: CSSProperties;
  entries: SignalEntry[];
  caption: string;
  "data-testid"?: string;
};

/**
 * Operations: SLOs (`observation.slos`) and alerts (`observation.alerts`) in
 * one stack. An alert without a runbook is an open point — when it actually
 * fires, there is no described way to respond.
 */
export function SignalStack({
  containerStyle,
  captionStyle,
  entries,
  caption,
  ...rest
}: SignalStackProps) {
  return (
    <div style={containerStyle} {...rest}>
      <p style={captionStyle}>{caption}</p>
      {entries.map((entry) => (
        <div key={entry.key} style={entry.rowStyle} data-signal={entry.key} data-kind={entry.kind}>
          <span style={entry.nameStyle}>{entry.name}</span>
          <span style={entry.metaStyle}>{entry.meta}</span>
          <span style={entry.detailStyle}>{entry.detail}</span>
          <span style={entry.runbookStyle}>{entry.runbook}</span>
        </div>
      ))}
    </div>
  );
}

export default SignalStack;
