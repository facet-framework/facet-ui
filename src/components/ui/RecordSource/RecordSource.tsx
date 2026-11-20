import type { CSSProperties } from "react";

export type SourceToken = { kind: "key" | "value" | "punct" | "comment" | "marker"; text: string };

export type SourceLine = {
  key: string;

  number: string;
  tokens: SourceToken[];

  marked: boolean;
  rowStyle: CSSProperties;
  numberStyle: CSSProperties;
};

export type RecordSourceProps = {
  containerStyle: CSSProperties;
  captionStyle: CSSProperties;
  tokenStyle: Record<SourceToken["kind"], CSSProperties>;
  lines: SourceLine[];

  caption: string;
  "data-testid"?: string;
};

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
