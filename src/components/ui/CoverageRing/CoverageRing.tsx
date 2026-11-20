import type { CSSProperties } from "react";

export type CoverageRingProps = {
  size: number;

  circumference: number;

  dash: number;
  strokeWidth: number;
  trackColor: string;
  fillColor: string;

  display: string;

  label: string;
  labelStyle: CSSProperties;
  containerStyle: CSSProperties;
  "data-testid"?: string;
};

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
