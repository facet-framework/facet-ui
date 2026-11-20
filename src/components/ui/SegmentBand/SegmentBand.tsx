import type { CSSProperties } from "react";

export type SegmentView = {
  key: string;
  /** Width as a percentage, e.g. `"42%"`. */
  width: string;
  background: string;
  /** Plain text, e.g. "active · 11". */
  title: string;
};

export type SegmentBandProps = {
  /** Fully computed segments — they come from `withSegmentBandLogic`. */
  segments: SegmentView[];
  containerStyle: CSSProperties;
  /** Plain text for screen readers covering the whole band. */
  label: string;
  "data-testid"?: string;
};

/**
 * Multi-part band — shows the distribution of a set (active · planned · deprecated)
 * in a single line.
 */
export function SegmentBand({ segments, containerStyle, label, ...rest }: SegmentBandProps) {
  return (
    <div style={containerStyle} role="img" aria-label={label} {...rest}>
      {segments.map((segment) => (
        <div
          key={segment.key}
          title={segment.title}
          data-segment={segment.key}
          style={{ width: segment.width, background: segment.background, height: "100%" }}
        />
      ))}
    </div>
  );
}

export default SegmentBand;
