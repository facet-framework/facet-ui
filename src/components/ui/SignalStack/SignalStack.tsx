import type { CSSProperties } from "react";

export type SignalEntry = {
  key: string;

  kind: "slo" | "alert";
  name: string;

  detail: string;

  meta: string;

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
