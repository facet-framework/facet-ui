import type { CSSProperties } from "react";

/** A time section of the axis — a month or a year. */
export type TimelineBucket = {
  key: string;
  /** Plain text for screen readers and the pointer tooltip: "Juli 2026 · 4 Records". */
  label: string;
  /** Height of the block in pixels. `0` means: nothing happened. */
  height: number;
  /** Label below the axis. `null` means: this section carries none. */
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
  /** What the axis shows and what it runs over. */
  caption: string;
  emptyText: string;
  "data-testid"?: string;
};

/**
 * Timeline over counted events — created records, evidence, whatever is dated.
 *
 * The axis runs without gaps: a month without an event gets an empty column,
 * not an omitted one. Whoever skips gaps draws an even progression that never
 * happened.
 *
 * Labels are selective — turns of the year and the last section — not every
 * column. A section's number is part of its name, so that it also arrives
 * where nobody points with the mouse.
 */
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
