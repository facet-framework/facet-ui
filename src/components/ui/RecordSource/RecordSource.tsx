import type { CSSProperties } from "react";

export type SourceToken = { kind: "key" | "value" | "punct" | "comment" | "marker"; text: string };

export type SourceLine = {
  key: string;
  /** Line number, right-aligned. */
  number: string;
  tokens: SourceToken[];
  /** Highlighted line — e.g. the one an error points to. */
  marked: boolean;
  rowStyle: CSSProperties;
  numberStyle: CSSProperties;
};

export type RecordSourceProps = {
  containerStyle: CSSProperties;
  captionStyle: CSSProperties;
  tokenStyle: Record<SourceToken["kind"], CSSProperties>;
  lines: SourceLine[];
  /** Origin of the file, e.g. the path in the repository. */
  caption: string;
  "data-testid"?: string;
};

/**
 * Raw source — the third level of the depth ladder. Not a reconstruction of
 * the record, but the file itself, with line numbers and light highlighting.
 */
export function RecordSource({
  containerStyle,
  captionStyle,
  tokenStyle,
  lines,
  caption,
  ...rest
}: RecordSourceProps) {
  return (
    <div style={containerStyle} {...rest}>
      <p style={captionStyle}>{caption}</p>
      {lines.map((line) => (
        <div key={line.key} style={line.rowStyle} data-line={line.number.trim()}>
          <span style={line.numberStyle}>{line.number}</span>
          <code>
            {line.tokens.map((token, index) => (
              <span key={`${line.key}-${index}`} style={tokenStyle[token.kind]}>
                {token.text}
              </span>
            ))}
          </code>
        </div>
      ))}
    </div>
  );
}

export default RecordSource;
