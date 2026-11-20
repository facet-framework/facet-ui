import type { CSSProperties } from "react";

export type BarProps = {
  trackStyle: CSSProperties;

  fillStyle: CSSProperties;

  label: string;

  percent: number;
  "data-testid"?: string;
};

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
