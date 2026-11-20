import type { CSSProperties } from "react";

export type ProofCell = {
  key: string;

  count: number;
  style: CSSProperties;
  title: string;
};

export type ProofRow = {
  key: string;

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

  caption: string;
  "data-testid"?: string;
};

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
