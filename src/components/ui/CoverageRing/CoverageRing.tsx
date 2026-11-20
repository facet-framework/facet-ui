import type { CSSProperties } from "react";

export type CoverageRingProps = {
  size: number;
  /** Circumference of the ring — basis for the dash-pattern share. */
  circumference: number;
  /** Length of the filled arc. */
  dash: number;
  strokeWidth: number;
  trackColor: string;
  fillColor: string;
  /** Share as ready-formatted text, e.g. "82 %". */
  display: string;
  /** Plain words, e.g. "31 of 38 promises with a mapped test". */
  label: string;
  labelStyle: CSSProperties;
  containerStyle: CSSProperties;
  "data-testid"?: string;
};

/**
 * Ring chart for test coverage. The percentage stands in the middle — the
 * shape alone is not a statement.
 */
export function CoverageRing({
  size,
  circumference,
  dash,
  strokeWidth,
  trackColor,
  fillColor,
  display,
  label,
  labelStyle,
  containerStyle,
  ...rest
}: CoverageRingProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  return (
    <div style={containerStyle} role="img" aria-label={label} {...rest}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          style={{ stroke: trackColor, strokeWidth }}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ stroke: fillColor, strokeWidth }}
        />
      </svg>
      <span style={labelStyle}>{display}</span>
    </div>
  );
}

export default CoverageRing;
