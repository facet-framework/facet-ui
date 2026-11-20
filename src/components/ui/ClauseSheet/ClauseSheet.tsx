import type { CSSProperties } from "react";

export type ClauseView = {
  key: string;

  id: string;

  obligation: string;
  requirement: string;

  measure: string;
  binding: boolean;
  rowStyle: CSSProperties;
  idStyle: CSSProperties;
  obligationStyle: CSSProperties;
  requirementStyle: CSSProperties;
  measureStyle: CSSProperties;
};

export type ClauseSheetProps = {
  containerStyle: CSSProperties;
  captionStyle: CSSProperties;
  clauses: ClauseView[];
  caption: string;
  "data-testid"?: string;
};

export function ClauseSheet({
  containerStyle,
  captionStyle,
  clauses,
  caption,
  ...rest
}: ClauseSheetProps) {
  return (
    <div style={containerStyle} {...rest}>
      <p style={captionStyle}>{caption}</p>
      {clauses.map((clause) => (
        <div key={clause.key} style={clause.rowStyle} data-clause={clause.id}>
          <span style={clause.idStyle}>{clause.id}</span>
          <span style={clause.obligationStyle}>{clause.obligation}</span>
          <span style={clause.requirementStyle}>{clause.requirement}</span>
          <span style={clause.measureStyle}>{clause.measure}</span>
        </div>
      ))}
    </div>
  );
}

export default ClauseSheet;
