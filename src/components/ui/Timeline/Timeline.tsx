import type { CSSProperties } from "react";

export type TimelineBucket = {
  key: string;

  label: string;

  height: number;

  tick: string | null;
  columnStyle: CSSProperties;
  blockStyle: CSSProperties;
  tickStyle: CSSProperties;
};

export type TimelineProps = {
  containerStyle: CSSProperties;
  plotStyle: CSSProperties;
  axisStyle: CSSProperties;
  captionStyle: CSSProperties;
  buckets: TimelineBucket[];

  caption: string;
  emptyText: string;
  "data-testid"?: string;
};

export function Timeline({
  containerStyle,
  plotStyle,
  axisStyle,
  captionStyle,
  buckets,
  caption,
  emptyText,
  ...rest
}: TimelineProps) {
  if (!buckets.length) {
    return (
      <div style={containerStyle} {...rest}>
        <p style={captionStyle}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div style={containerStyle} {...rest}>
      <ol style={plotStyle} aria-label={caption}>
        {buckets.map((bucket) => (
          <li
            key={bucket.key}
            style={bucket.columnStyle}
            title={bucket.label}
            aria-label={bucket.label}
            data-bucket={bucket.key}
          >
            <span style={{ ...bucket.blockStyle, height: bucket.height }} aria-hidden="true" />
          </li>
        ))}
      </ol>

      <div style={axisStyle} aria-hidden="true">
        {buckets.map((bucket) => (
          <span key={bucket.key} style={bucket.tickStyle} data-tick={bucket.key}>
            {bucket.tick ?? ""}
          </span>
        ))}
      </div>

      <p style={captionStyle}>{caption}</p>
    </div>
  );
}

export default Timeline;
