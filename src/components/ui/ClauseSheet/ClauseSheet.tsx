import type { CSSProperties } from "react";

export type ClauseView = {
  key: string;
  /** Id of the clause, e.g. "QH-01". */
  id: string;
  /** Obligation as a word: MUST · SHOULD · MAY. */
  obligation: string;
  requirement: string;
  /** What compliance is measured by — or the note that nothing is named. */
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

/**
 * Clauses of a rule set. The obligation stands as a word, not as a colour —
 * MUST and MAY differ in rank and weight.
 */
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
