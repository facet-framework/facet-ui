import type { CSSProperties } from "react";

export type BarProps = {
  /** Style of the track (background). */
  trackStyle: CSSProperties;
  /** Style of the filled share. */
  fillStyle: CSSProperties;
  /** Plain text for screen readers, e.g. "31 of 38 promises with a mapped test". */
  label: string;
  /** Share in percent, rounded — for `aria-valuenow`. */
  percent: number;
  "data-testid"?: string;
};

/**
 * Share bar. The value always also stands beside it as a number — the bar is
 * the shape, not the statement.
 */
export function Bar({ trackStyle, fillStyle, label, percent, ...rest }: BarProps) {
  return (
    <div
      style={trackStyle}
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      {...rest}
    >
      <div style={fillStyle} />
    </div>
  );
}

export default Bar;
