import type { CSSProperties } from "react";

export type ProofCell = {
  key: string;
  /** Number of tests that back this promise at this level. */
  count: number;
  style: CSSProperties;
  title: string;
};

export type ProofRow = {
  key: string;
  /** Id of the promise from `contract.scenarios[].id`. */
  scenario: string;
  proven: boolean;
  cells: ProofCell[];
  rowStyle: CSSProperties;
  labelStyle: CSSProperties;
};

export type ProofMatrixProps = {
  containerStyle: CSSProperties;
  headerStyle: CSSProperties;
  headCellStyle: CSSProperties;
  captionStyle: CSSProperties;
  columns: string[];
  rows: ProofRow[];
  /** Answer line above the matrix, e.g. "31 of 38 promises have a mapped test". */
  caption: string;
  "data-testid"?: string;
};

/**
 * Promise × test kind. Every cell counts the tests from `verification.*_tests[].proves`
 * that back exactly this promise. Empty cells are the statement.
 */
export function ProofMatrix({
  containerStyle,
  headerStyle,
  headCellStyle,
  captionStyle,
  columns,
  rows,
  caption,
  ...rest
}: ProofMatrixProps) {
  return (
    <div style={containerStyle} {...rest}>
      <p style={captionStyle}>{caption}</p>
      <div style={headerStyle}>
        <span />
        {columns.map((column) => (
          <span key={column} style={headCellStyle}>
            {column}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.key} style={row.rowStyle} data-scenario={row.scenario}>
          <span style={row.labelStyle}>{row.scenario}</span>
          {row.cells.map((cell) => (
            <span key={cell.key} data-cell={cell.key} title={cell.title} style={cell.style}>
              {cell.count > 0 ? cell.count : ""}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default ProofMatrix;
