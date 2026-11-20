import type { CSSProperties } from "react";

export type AnchorEntryView = {
  key: string;
  path: string;
  line: string;
  role: string;
  excerpt?: string;
  drifted: boolean;
  rowStyle: CSSProperties;
  pathStyle: CSSProperties;
  lineStyle: CSSProperties;
  roleStyle: CSSProperties;
  excerptStyle: CSSProperties;
  href?: string;
  onOpen?: () => void;
};

export type AnchorMapProps = {
  containerStyle: CSSProperties;
  captionStyle: CSSProperties;
  entries: AnchorEntryView[];
  /** Answer line, e.g. "2 entry points in 2 files". */
  caption: string;
  "data-testid"?: string;
};

/**
 * Entry points in the code. Path, line and role come from the repo scan, not
 * from the record — hence their own marking. Moved anchors (drift) come
 * first.
 */
export function AnchorMap({
  containerStyle,
  captionStyle,
  entries,
  caption,
  ...rest
}: AnchorMapProps) {
  return (
    <div style={containerStyle} {...rest}>
      <p style={captionStyle}>{caption}</p>
      {entries.map((entry) => (
        <div key={entry.key} style={entry.rowStyle} data-anchor={entry.key}>
          {entry.href ? (
            <a href={entry.href} style={entry.pathStyle} onClick={entry.onOpen}>
              {entry.path}
            </a>
          ) : (
            <span style={entry.pathStyle}>{entry.path}</span>
          )}
          <span style={entry.lineStyle}>{entry.line}</span>
          <span style={entry.roleStyle}>{entry.role}</span>
          {entry.excerpt ? <code style={entry.excerptStyle}>{entry.excerpt}</code> : null}
        </div>
      ))}
    </div>
  );
}

export default AnchorMap;
