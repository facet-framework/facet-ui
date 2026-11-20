import type { CSSProperties } from "react";

export type EvidenceView = {
  key: string;
  date: string;
  /** Kind of evidence, e.g. "measurement" or "survey". */
  kind: string;
  note: string;
  /** Oldest evidence in the stack — it determines how old the assumption is. */
  oldest: boolean;
  rowStyle: CSSProperties;
  dateStyle: CSSProperties;
  kindStyle: CSSProperties;
  noteStyle: CSSProperties;
};

export type EvidenceLedgerProps = {
  containerStyle: CSSProperties;
  captionStyle: CSSProperties;
  entries: EvidenceView[];
  caption: string;
  "data-testid"?: string;
};

/**
 * Evidence for an assumption, newest first. Without evidence an assumption is
 * a claim — the answer line says so.
 */
export function EvidenceLedger({
  containerStyle,
  captionStyle,
  entries,
  caption,
  ...rest
}: EvidenceLedgerProps) {
  return (
    <div style={containerStyle} {...rest}>
      <p style={captionStyle}>{caption}</p>
      {entries.map((entry) => (
        <div key={entry.key} style={entry.rowStyle} data-evidence={entry.key}>
          <span style={entry.dateStyle}>{entry.date}</span>
          <span style={entry.kindStyle}>{entry.kind}</span>
          <span style={entry.noteStyle}>{entry.note}</span>
        </div>
      ))}
    </div>
  );
}

export default EvidenceLedger;
